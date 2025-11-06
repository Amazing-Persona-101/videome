<script lang="ts">
	import { onMount, tick } from 'svelte';
	import AvatarSelector from '$lib/components/AvatarSelector.svelte';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import RealtimeKitClient from '@cloudflare/realtimekit';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import ShareLink from '$lib/components/shareLink.svelte';
	import { useLanguage, defaultLanguage } from '@dytesdk/ui-kit';
	import { createLanguagePack } from '$lib/languagePack';

	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { meetings } from '$lib/meetings/state.svelte';
	import { Avatar, AvatarImage, AvatarFallback } from '$lib/components/ui/avatar';
	import { randomSeed } from '$lib/identity/guest';
	import { toast } from 'svelte-sonner';
	import {
		clearStorage,
		loadIdentity,
		loadToken,
		type Identity,
		type UserToken
	} from '$lib/identity/storage.js';
	import { _ } from 'svelte-i18n';

	const { data } = $props();
	// ---- state (Svelte 5 runes) ----
	let authToken = $state<string | null>(null);
	let joining = $state(false);

	// Meeting/meta display (fallbacks are safe strings, never undefined)
	let meetingId = $state<string>(data?.meetingId ?? '');
	let meetingTitle = $state<string>(data?.title ?? 'Meeting');
	let meetingHost = $state<string>(data?.host.name ?? 'Host');
	let meetingHostImage = $state<string>(data?.host.image ?? '');
	let hostPreset = $state<string>(data?.host?.preset_name ?? '');
	let meetingType = $derived<string>(
		hostPreset === 'group_call_host' ? $_('utils.conference') : $_('utils.webinar')
	);
	let meeting: RealtimeKitClient | null = null;
	let meetingEl: HTMLElement | null = $state<null>(null);
	let joinEl: HTMLElement | null = $state<null>(null);
	let session = meetings.find((m) => m.id === meetingId);

	// Guest identity
	let guestName = $state<string>('');
	let guestUID = $state<string>('');
	let guestAvatar = $state<string>('');

	let needsAvatarSelect = $state(false);
	let previewSeeds = $state<string[]>([]); // used to demo each style

	function fmtMin(n: number) {
		return `${Math.floor(n)}m`;
	}

	async function initMeeting(authToken: string) {
		meeting = await RealtimeKitClient.init({
			// Add your own auth token here
			authToken,
			defaults: {
				audio: false,
				video: false
			}
		});

		await tick();
		meetingEl = document.getElementById('video-meeting');
		joinEl = document.getElementById('join-form');
		if (joinEl) {
			joinEl.style.display = 'none';
		}

		if (meetingEl) {
			meeting?.self.on('roomLeft', () => {
				//console.log('User has left the room', meeting?.self.roomJoined);
				goto('/', { replaceState: true, invalidateAll: true });
			});
		} else {
			const errorMessage = 'Meeting element not found';
			toast.error(errorMessage);
			console.error(errorMessage);
			throw new Error(errorMessage);
		}
	}

	const myLanguagePack = useLanguage(createLanguagePack(_));

	$effect(() => {
		if (meetingEl && meeting) {
			meetingEl.style.visibility = 'visible';
			(meetingEl as any).showSetupScreen = false;
			(meetingEl as any).meeting = meeting;
			(meetingEl as any).t = myLanguagePack;
		}

		if (joinEl) {
			joinEl.style.display = 'none';
		}
	});

	onMount(() => {
		const adjustHeight = () => {
			const videoFrame = document.querySelector('.video-frame') as HTMLElement | null;
			if (videoFrame) {
				const vh = window.innerHeight;
				const headerHeight = 56;
				videoFrame.style.height = `${vh - headerHeight}px`;
			}
		};

		window.addEventListener('resize', adjustHeight);
		window.addEventListener('orientationchange', adjustHeight);

		adjustHeight(); // Initial adjustment

		return () => {
			window.removeEventListener('resize', adjustHeight);
			window.removeEventListener('orientationchange', adjustHeight);
		};
	});

	onMount(async () => {
		if (typeof window === 'undefined') return;

		// 1) Check for host token
		const userToken = loadToken() as UserToken | null;
		if (userToken) {
			authToken = userToken;
			await initMeeting(authToken);
			return;
		}

		try {
			// 2) Prepare guest identity (persist across refreshes)
			const storedIdentity = loadIdentity() as Identity | null;
			if (storedIdentity && 'userId' in storedIdentity) {
				try {
					({ avatar: guestAvatar, name: guestName, userId: guestUID } = storedIdentity);
					needsAvatarSelect = false;
					return;
				} catch {
					previewSeeds.splice(0, previewSeeds.length, randomSeed(), randomSeed(), randomSeed());
					needsAvatarSelect = true;
					return;
				}
			} else {
				previewSeeds.splice(0, previewSeeds.length, randomSeed(), randomSeed(), randomSeed());
				needsAvatarSelect = true;
				return;
			}
		} catch (error) {
			const errorMessage = 'Failed to fetch or set guest identity';
			console.error(errorMessage, error);
			toast.error(errorMessage);
			goto('/', { replaceState: true, invalidateAll: true });
		}
	});

	$effect(() => {
		//console.log('Component mounted!');

		// This will be called when the component is destroyed
		return () => {
			clearStorage('userToken');
		};
	});

	async function joinAsGuest() {
		joining = true;
		try {
			const response = await fetch('/api/meeting', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					image: guestAvatar,
					meetingId: meetingId,
					preset_name:
						hostPreset === 'group_call_host' ? 'group_call_participant' : 'webinar_viewer',
					userId: guestUID,
					username: guestName
				})
			});
			if (!response.ok) {
				throw new Error('Failed to add user to meeting');
			}

			const dataResponse = await response.json();
			if (dataResponse && dataResponse.user) {
				const authToken = dataResponse.user.token;
				try {
					await initMeeting(authToken);
				} catch (error) {
					console.error('Failed to initialize meeting:', error);
					throw new Error('Failed to initialize meeting');
				}
			} else {
				console.error('No user found in response');
				throw new Error('Failed to add user to meeting');
			}
		} catch (e) {
			toast.error($_('utils.sorryCantJoin'));
			goto('/', { replaceState: true, invalidateAll: true });
		} finally {
			joining = false;
		}
	}

	function handleAvatarSelected(event: { avatar: string; name: string; userId: string }) {
		const { avatar, name, userId } = event;
		guestName = name;
		guestUID = userId;
		guestAvatar = avatar;
		needsAvatarSelect = false;
	}
</script>

<div id="join-form" data-testid="join-form">
	{#if !authToken}
		<!-- Step 0: If there is an authToken, start the video for the host, otherwise they are a guest -->
		{#if !needsAvatarSelect}
			<!-- Step 2: Meeting information -->
			<section class="mx-auto my-8 w-full max-w-lg">
				<Card class="transform overflow-hidden transition-all hover:scale-105">
					<!-- Header with subtle gradient accent -->
					<CardHeader class="relative z-10">
						<div class="flex items-center justify-between">
							<div class="flex min-w-0 flex-1 items-start space-x-4">
								<Avatar class="h-16 w-16 flex-shrink-0 shadow-lg ring-4 ring-gray-300">
									<AvatarImage src={meetingHostImage} alt="Host" />
									<AvatarFallback class="bg-primary text-lg font-bold text-primary-foreground">
										{meetingHost?.slice(0, 2) || 'H'}
									</AvatarFallback>
								</Avatar>
								<div class="min-w-0 flex-1">
									<CardTitle class="truncate text-xl font-bold text-primary"
										>{meetingTitle}</CardTitle
									>
									<CardDescription class="text-gray-300/90">
										{$_('utils.hostedBy')} <span class="font-semibold">{meetingHost}</span>
									</CardDescription>
								</div>
							</div>
							<div class="text-right">
								<span
									class="mr-2 mb-2 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-gray-300"
								>
									{meetingType}
								</span>
							</div>
						</div>
					</CardHeader>

					<CardContent class="relative z-10 space-y-6 p-6">
						<div class="grid grid-cols-2 gap-4 text-gray-300">
							<div
								class="transform rounded-lg bg-black/30 p-4 text-center transition-all hover:scale-105"
							>
								<div class="text-3xl font-bold">{session?.totalParticipants || 0}</div>
								<div class="text-sm uppercase">Viewers</div>
							</div>
							<div
								class="transform rounded-lg bg-black/30 p-4 text-center transition-all hover:scale-105"
							>
								<div class="text-3xl font-bold">{fmtMin(session?.runtimeMinutes || 0)}</div>
								<div class="text-sm uppercase">Duration</div>
							</div>
						</div>

						<div class="flex items-center space-x-4 rounded-lg bg-white/10 p-4">
							<Avatar class="h-12 w-12 flex-shrink-0 ring-2 ring-gray-300">
								<AvatarImage src={guestAvatar} alt={guestName} />
								<AvatarFallback class="bg-secondary text-sm font-bold text-secondary-foreground">
									{guestName?.slice(0, 2) || 'G'}
								</AvatarFallback>
							</Avatar>
							<div class="min-w-0 flex-grow">
								<div class="text-lg font-semibold text-gray-300">Joining as</div>
								<div class="truncate text-xl font-bold text-gray-300" title={guestName}>
									{guestName}
								</div>
							</div>
						</div>
					</CardContent>

					<CardFooter class="relative z-10 flex justify-end space-x-4 p-6">
						<Button
							variant="outline"
							size="lg"
							class="bg-white text-primary hover:bg-gray-100"
							onclick={() => goto('/', { replaceState: true, invalidateAll: true })}
						>
							Cancel
						</Button>
						<Button
							size="lg"
							aria-label="join-meeting"
							class="hover:bg-primary-dark transform rounded px-4 py-2 font-bold text-gray-300 transition-all hover:scale-105 hover:shadow-lg"
							disabled={joining}
							onclick={joinAsGuest}
						>
							{joining ? $_('utils.joining') : `Join ${meetingType}`}
						</Button>
					</CardFooter>
				</Card>
			</section>
		{/if}
	{/if}
</div>

<!-- The realtimekit video frame -->
<div class="video-frame">
	<rtk-meeting
		mode="fill"
		id="video-meeting"
		data-testid="video-meeting"
		style="visibility: hidden;"
	>
	</rtk-meeting>
	<span class="space-right"><ShareLink {meetingHost} {meetingTitle} {meetingId} /></span>
</div>

<Dialog.Root
	open={needsAvatarSelect}
	onOpenChange={() => goto('/', { replaceState: true, invalidateAll: true })}
>
	<Dialog.Portal>
		<Dialog.Content
			onInteractOutside={() => goto('/', { replaceState: true, invalidateAll: true })}
		>
			<Dialog.Header></Dialog.Header>
			<AvatarSelector avatarSelected={handleAvatarSelected} />
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	.video-frame {
		position: relative;
		overflow: hidden;
		width: 100%;
		height: 100vh; /* Use full viewport height */
		height: calc(100vh - var(--header-height, 56px) - env(safe-area-inset-bottom, 0px));
		max-height: calc(100vh - var(--header-height, 56px) - env(safe-area-inset-bottom, 0px));
		padding-bottom: env(safe-area-inset-bottom, 0px); /* Add padding for the safe area */
		max-height: calc(100vh - var(--header-height, 56px) - 2rem);
	}

	rtk-meeting {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	.space-right {
		position: absolute;
		bottom: env(safe-area-inset-bottom, 20px);
		right: 20px;
		z-index: 10;
	}
</style>
