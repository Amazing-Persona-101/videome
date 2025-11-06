<script lang="ts">
	import { type Snippet } from 'svelte';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
	import {
		Tooltip,
		TooltipContent,
		TooltipProvider,
		TooltipTrigger
	} from '$lib/components/ui/tooltip';
	import {
		Collapsible,
		CollapsibleContent,
		CollapsibleTrigger
	} from '$lib/components/ui/collapsible';
	import { cn } from '$lib/utils';
	import rawGroups from '$lib/data/group_info.json';
	import VideoIcon from '@tabler/icons-svelte/icons/video';
	import UsersGroupIcon from '@tabler/icons-svelte/icons/users-group';
	import InfoCircleIcon from '@tabler/icons-svelte/icons/info-circle';
	import WandIcon from '@tabler/icons-svelte/icons/wand';
	import ChevronDownIcon from '@tabler/icons-svelte/icons/chevron-down';
	import LivePhotoIcon from '@tabler/icons-svelte/icons/live-photo';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import AvatarSelector from '$lib/components/AvatarSelector.svelte';
	import { loadIdentity, type GroupInfo } from '$lib/identity/storage';
	import GroupSelector from './GroupSelector.svelte';
	import { _ } from 'svelte-i18n';
	import { DOMAIN_URL, RTMP_YOUTUBE_URL } from '$lib/constants';
	import { validateRoomName, validateDescription } from '$lib/utils/validation';

	// Svelte 5 props (with defaults) — no `export let`
	let {
		actions,
		defaultMode = 'conference' as 'webinar' | 'conference',
		defaultRoomName = '',
		valid = $bindable(false)
	} = $props<{
		actions?: Snippet<[]>;
		defaultMode?: 'webinar' | 'conference';
		defaultRoomName?: string;
	}>();

	const formEl = $state<HTMLFormElement | null>(null);

	function updateValidity() {
		valid = formEl?.checkValidity() ?? false;
	}

	// Required acknowledgment
	let tosAgreed = $state(false);

	// keep validity in sync on mount and after any field changes
	// Re-evaluate validity whenever tosAgreed flips
	$effect(() => {
		// reading tosAgreed makes this run on each change
		tosAgreed;
		updateValidity();
	});

	// Local, controlled state (never undefined)
	let roomName = $state<string>(defaultRoomName ?? '');
	let roomNameError = $state<string>('');
	let meetingMode = $state<'webinar' | 'conference'>(defaultMode ?? 'conference');

	let showAdvanced = $state(false);
	let showFlare = $state(false);

	// Advanced: Live stream
	let liveStream = $state(false);
	let rtmpUrl = $state<string>(RTMP_YOUTUBE_URL);

	// Advanced: Watermark
	let watermark = $state(false);

	let watermarkUrl = $state<string>(`https://${DOMAIN_URL}`);
	let watermarkPosition = $state<'left top' | 'right top' | 'left bottom' | 'right bottom'>(
		'left top'
	);

	// Host identity
	let hostName = $state<string>('');
	let hostUID = $state<string>('');
	let hostAvatar = $state<string>('');
	let hostSummary = $state<string>('');
	let hostSummaryError = $state<string>('');
	let hostSelectedGroup = $state<GroupInfo>({ id: '', name: '', iconURL: '' });
	let needsAvatarSelect = $state(true);

	$effect(() => {
		if (typeof window !== 'undefined') {
			try {
				const storedIdentity = loadIdentity();

				if (storedIdentity) {
					//console.log('Loaded identity in line:', storedIdentity);
					({ avatar: hostAvatar, name: hostName, userId: hostUID } = storedIdentity);
					needsAvatarSelect = false;
				} else {
					//console.log('Generating new identity! in line');
					needsAvatarSelect = true;
				}
			} catch (error) {
				const errorMessage = error.message ?? 'Failed to generate identity';
				console.error(errorMessage, error);
				toast.error(errorMessage);
				goto('/', { replaceState: true, invalidateAll: true });
			}
		}
	});

	function validateRoomNameField() {
		if (roomName && roomName.trim()) {
			console.log(`Validating room name: ${roomName}...`);
			const result = validateRoomName(roomName);
			roomNameError = result.type || '';
		}
	}

	function validateSummaryField() {
		const result = validateDescription(hostSummary);
		hostSummaryError = result.error || '';
	}

	function handleAvatarSelected(event: { avatar: string; name: string; userId: string }) {
		const { avatar, name, userId } = event;
		hostAvatar = avatar;
		hostName = name;
		hostUID = userId;
		needsAvatarSelect = false;
	}

	function handleGroupSelected(info: GroupInfo) {
		hostSelectedGroup = info;
	}

	let groups = $derived(
		rawGroups.map((group) => ({
			...group,
			name: $_(`groups.${group.id}`)
		}))
	);
</script>

{#if needsAvatarSelect}
	<!-- Step 1: Gender selection -->
	<AvatarSelector avatarSelected={handleAvatarSelected} />
{:else}
	<div class="form-content">
		<div class=" pb-4">
			<!-- Fun, modern header -->
			<div
				class="relative mb-4 rounded-2xl border bg-gradient-to-tr from-indigo-600 via-fuchsia-500 to-rose-400 p-[1px]"
			>
				<div class="rounded-2xl bg-background p-4 sm:p-5">
					<div class="flex items-center gap-3">
						<div class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
							<VideoIcon class="h-5 w-5 text-primary" />
						</div>
						<div class="min-w-0">
							<h2 class="truncate text-lg leading-tight font-semibold">
								{$_('meeting.createNewVideo')}
							</h2>
							<p class="text-xs text-foreground">
								{$_('meeting.pickRoomName')}
							</p>
							<span class="text-xs text-muted-foreground">
								{$_('utils.agreeTOS')}
							</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Form fields (no <form> wrapper) -->
			<div class="space-y-6">
				<!-- Basic fields (stacked) -->
				<div class="space-y-4">
					<div class="space-y-1.5">
						<p>{$_('meeting.userName')}:</p>
						{hostName}
					</div>

					<div class="space-y-1.5">
						<Label for="room_name_input">{$_('meeting.roomName')}:</Label>
						<Input
							id="room_name_input"
							name="room_name_input"
							placeholder={$_('meeting.sampleRoomName')}
							bind:value={roomName}
							onblur={validateRoomNameField}
							required
							class="h-10 w-full"
						/>
						{#if roomNameError}
							<span
								class="error"
								class:text-red-500={roomNameError === 'empty' || roomNameError === 'length'}
								class:text-yellow-500={roomNameError === 'valid'}
							>
								{#if roomNameError === 'empty'}
									{$_('validations.roomNameIsRequired')}
								{:else if roomNameError === 'length'}
									{$_('validations.roomNameLength')}
								{:else if roomNameError === 'valid'}
									{$_('validations.roomNameContent')}
								{:else}
									{roomNameError}
								{/if}
							</span>
						{/if}
					</div>
				</div>

				<!-- Meeting mode (webinar vs conference) -->
				<div class="space-y-2">
					<div class="flex items-center gap-2">
						<Label>{$_('meeting.format')}</Label>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger>
									{#snippet child({ props })}
										<button type="button" class="text-muted-foreground hover:text-foreground">
											<InfoCircleIcon class="h-4 w-4" />
										</button>
									{/snippet}
								</TooltipTrigger>
								<TooltipContent side="right" align="start" class="max-w-[260px] text-xs">
									{$_('tooltip.choose')} <strong>{$_('utils.webinar')}</strong>
									{$_('tooltip.webinarDefinition')}
									{$_('tooltip.choose')} <strong>{$_('utils.conference')}</strong>
									{$_('tooltip.conferenceDefinition')}
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>

					<RadioGroup
						name="meeting_mode_radio"
						class="grid gap-3 sm:grid-cols-2"
						bind:value={meetingMode}
					>
						<!-- Webinar option -->
						<label
							class={cn(
								'group relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition',
								'hover:bg-accent/60'
							)}
							for="mode_webinar"
						>
							<RadioGroupItem id="mode_webinar" value="webinar" />
							<div class="flex items-center gap-2">
								<div
									class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 transition group-hover:scale-105"
								>
									<LivePhotoIcon class="h-4 w-4 text-primary" />
								</div>
								<div>
									<div class="text-sm font-medium">{$_('utils.webinar')}</div>
									<div class="text-xs text-muted-foreground">{$_('tooltip.onlyYou')}</div>
								</div>
							</div>

							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										{#snippet child({ props })}
											<span
												class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
											>
												<InfoCircleIcon class="h-4 w-4" />
											</span>
										{/snippet}
									</TooltipTrigger>
									<TooltipContent side="left" align="center" class="max-w-[220px] text-xs">
										{$_('tooltip.greatForAnnouncements')}
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</label>

						<!-- Conference option -->
						<label
							class={cn(
								'group relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition',
								'hover:bg-accent/60'
							)}
							for="mode_conference"
						>
							<RadioGroupItem id="mode_conference" value="conference" />
							<div class="flex items-center gap-2">
								<div
									class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 transition group-hover:scale-105"
								>
									<UsersGroupIcon class="h-4 w-4 text-primary" />
								</div>
								<div>
									<div class="text-sm font-medium">{$_('utils.conference')}</div>
									<div class="text-xs text-muted-foreground">{$_('tooltip.allParticipants')}</div>
								</div>
							</div>

							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										{#snippet child({ props })}
											<span
												class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
											>
												<InfoCircleIcon class="h-4 w-4" />
											</span>
										{/snippet}
									</TooltipTrigger>
									<TooltipContent side="left" align="center" class="max-w-[220px] text-xs">
										{$_('tooltip.groupChats')}
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</label>
					</RadioGroup>
				</div>

				<!-- Flare section -->
				<Collapsible bind:open={showFlare} class="rounded-xl border">
					<div class="flex items-center justify-between p-3 sm:p-4">
						<div class="flex items-center gap-2">
							<WandIcon class="h-4 w-4 text-muted-foreground" />
							<span class="text-sm font-medium">{$_('meeting.addFlare')}</span>
						</div>

						<!-- Trigger is the button -->
						<CollapsibleTrigger
							type="button"
							aria-label="Toggle flare options"
							class="inline-flex items-center gap-1 rounded-md bg-transparent px-3 py-2 text-sm
             font-medium transition-colors hover:bg-accent
             focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						>
							{showFlare ? $_('meeting.hide') : $_('meeting.show')}
							<ChevronDownIcon
								class={cn('h-4 w-4 transition-transform', showFlare && 'rotate-180')}
							/>
						</CollapsibleTrigger>
					</div>

					<CollapsibleContent class="border-t p-3 sm:p-4">
						<div data-testid="group-selector" class="">
							<GroupSelector
								groupSelected={handleGroupSelected}
								{groups}
								bind:summary={hostSummary}
							/>
						</div>
					</CollapsibleContent>
				</Collapsible>

				<!-- Advanced section -->
				<Collapsible bind:open={showAdvanced} class="rounded-xl border">
					<div class="flex items-center justify-between p-3 sm:p-4">
						<div class="flex items-center gap-2">
							<WandIcon class="h-4 w-4 text-muted-foreground" />
							<span class="text-sm font-medium">{$_('meeting.advancedOptions')}</span>
						</div>

						<!-- Trigger is the button -->
						<CollapsibleTrigger
							type="button"
							aria-label="Toggle advanced options"
							class="inline-flex items-center gap-1 rounded-md bg-transparent px-3 py-2 text-sm
             font-medium transition-colors hover:bg-accent
             focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						>
							{showAdvanced ? $_('meeting.hide') : $_('meeting.show')}
							<ChevronDownIcon
								class={cn('h-4 w-4 transition-transform', showAdvanced && 'rotate-180')}
							/>
						</CollapsibleTrigger>
					</div>

					<CollapsibleContent class="border-t p-3 sm:p-4">
						<div class="space-y-6">
							<!-- Live stream -->
							<div class="space-y-3">
								<label class="flex items-center gap-2">
									<Checkbox id="live_stream" bind:checked={liveStream} />
									<span class="text-sm leading-none">{$_('meeting.liveStream')}</span>
								</label>

								{#if liveStream}
									<div class="space-y-1.5">
										<Label for="rtmp_url_input">RTMP URL</Label>
										<Input
											id="rtmp_url_input"
											name="rtmp_url_input"
											bind:value={rtmpUrl}
											placeholder="rtmp://a.rtmp.youtube.com/live2"
											class="h-10 w-full"
										/>
										<p class="text-xs text-muted-foreground">
											{$_('meeting.defaultsTo')}
											<span class="font-mono">rtmp://a.rtmp.youtube.com/live2</span>
										</p>
									</div>
								{/if}

								<!-- Mirror boolean -->
								<input type="hidden" name="live_stream" value={liveStream ? '1' : '0'} />
							</div>

							<!-- Watermark -->
							<div class="space-y-3">
								<label class="flex items-center gap-2">
									<Checkbox id="watermark_enabled" bind:checked={watermark} />
									<span class="text-sm leading-none">{$_('meeting.addWatermark')}</span>
								</label>

								{#if watermark}
									<div class="space-y-4">
										<div class="space-y-1.5">
											<Label for="watermark_url_input">{$_('meeting.watermarkURL')}</Label>
											<Input
												id="watermark_url_input"
												name="watermark_url_input"
												bind:value={watermarkUrl}
												placeholder={`https://${DOMAIN_URL}`}
												class="h-10 w-full"
											/>
										</div>

										<div class="space-y-1.5">
											<Label for="watermark_position_input">{$_('meeting.position')}</Label>
											<select
												id="watermark_position_input"
												name="watermark_position_input"
												bind:value={watermarkPosition}
												class="h-10 w-full rounded-md border bg-background px-3 text-sm shadow-sm
                     focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
											>
												<option value="left top">{$_('meeting.positionleftTop')}</option>
												<option value="right top">{$_('meeting.positionRightTop')}</option>
												<option value="left bottom">{$_('meeting.positionLeftBottom')}</option>
												<option value="right bottom">{$_('meeting.positionRightBottom')}</option>
											</select>
										</div>
									</div>
								{/if}
							</div>
						</div>
					</CollapsibleContent>
				</Collapsible>
			</div>

			<!-- Hidden fields with current values (so the parent form posts everything) -->
			<input type="hidden" name="watermark_enabled" value={watermark ? '1' : '0'} />
			<input type="hidden" name="tos_agree" value={tosAgreed ? '1' : '0'} />
			<input type="hidden" name="userId" value={hostUID} />
			<input type="hidden" name="image" value={hostAvatar} />
			<input type="hidden" name="userName" value={hostName} />
			<input type="hidden" name="groupId" value={hostSelectedGroup?.id} />
			<input type="hidden" name="groupName" value={hostSelectedGroup?.name} />
			<input type="hidden" name="groupIconURL" value={hostSelectedGroup?.iconURL} />
			<input type="hidden" name="summary" value={hostSummary} />
			<input type="hidden" name="roomName" value={roomName} />
			<input type="hidden" name="meeting_mode" value={meetingMode} />
			{#if liveStream}<input type="hidden" name="rtmp_url" value={rtmpUrl} />{/if}
			{#if watermark}
				<input type="hidden" name="watermark_url" value={watermarkUrl} />
				<input type="hidden" name="watermark_position" value={watermarkPosition} />
			{/if}
			{#if actions}
				{@render actions()}
			{/if}
		</div>
	</div>
{/if}

<style>
	/* tiny flourish for social vibes */
	:global(.dark) .bg-background {
		background-image:
			radial-gradient(1200px 400px at 120% -10%, rgba(236, 72, 153, 0.1), transparent),
			radial-gradient(800px 300px at -20% 0%, rgba(99, 102, 241, 0.08), transparent);
	}

	.form-content {
		overflow-y: auto;
		max-height: calc(90vh - 100px); /* Adjust based on your footer height */
		padding-right: 16px; /* Add some padding to account for the scrollbar */
	}
</style>
