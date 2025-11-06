<script lang="ts">
	import {
		showVideoModal,
		closeVideoModal,
		openVideoModal
	} from '$lib/stores/modalStore.svelte.js';
	import StartMeetingForm from '$lib/components/start-meeting-form.svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { createMeeting } from '$lib/createMeeting';
	import { onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
	import { meetings, ui } from '$lib/meetings/state.svelte';
	import { toast } from 'svelte-sonner';
	import { goto } from '$app/navigation';
	import MeetingCard from '$lib/components/meetingCard.svelte';
	import { _ } from 'svelte-i18n';
	import { sanitizeInput, validateDescription, validateRoomName } from '$lib/utils/validation';

	// --- Empty-state gate: only show if no meetings for a sustained period *and* WS is ready ---
	const EMPTY_GRACE_MS = 1500;
	const mountedAt = Date.now();

	let isSubmitting = $state(false);

	// Heartbeat so the derived value can re-evaluate time thresholds
	let heartbeat = $state(0);
	let hbTimer: ReturnType<typeof setInterval> | null = null;

	$effect(() => {
		if (hbTimer) clearInterval(hbTimer);
		hbTimer = setInterval(() => (heartbeat = (heartbeat + 1) | 0), 500);
	});

	onDestroy(() => {
		if (hbTimer) clearInterval(hbTimer);
	});

	// Derived “show empty” condition
	const showEmpty = $derived.by(() => {
		// force reevaluation every heartbeat tick
		void heartbeat;

		// do not show while WS not ready (avoids flashes on connect)
		if (!ui.wsReady && Date.now() - mountedAt < 2500) return false;

		// Check for active meetings (status !== 'ENDED')
		const activeMeetings = meetings.filter((m) => m.status !== 'ENDED');

		// no meetings, and we've been empty long enough since last non-empty
		if (activeMeetings.length === 0) {
			const idle = Date.now() - ui.lastNonEmptyAt;
			return idle >= EMPTY_GRACE_MS;
		}

		return false;
	});

	const handleSubmit = ({}) => {
		return async ({ formData }) => {
			isSubmitting = true;
			try {
				const roomName = sanitizeInput(formData.get('roomName') as string);
				const hostSummary = sanitizeInput(formData.get('summary') as string);

				const roomNameValidation = validateRoomName(roomName);
				const hostSummaryValidation = validateDescription(hostSummary);

				if (!roomNameValidation.isValid || !hostSummaryValidation.isValid) {
					toast.error(
						roomNameValidation.error ||
							hostSummaryValidation.error ||
							'Invalid room name or host summary.'
					);
					return;
				}

				const result = await createMeeting(formData, { roomName, hostSummary });
				if (!result.success) {
					const errorMessage = result.error
						? result.error.message
						: 'An unexpected error occurred while creating the meeting.';
					toast.error(errorMessage);
					console.error(errorMessage);
				} else {
					goto(`/meeting/${result.meeting?.id}`, {
						invalidateAll: true,
						replaceState: true
					});
				}
			} finally {
				isSubmitting = false;
				closeVideoModal();
			}
		};
	};
</script>

<section class=" bg-gray-50 p-2 dark:bg-gray-900">
	<div class="m-1 border-2 border-dashed border-gray-300 dark:border-gray-600 dark:bg-gray-800">
		<main class="min-h-0 flex-1 overflow-auto p-3">
			<div
				class="mb-4 flex items-center justify-between rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 p-4 shadow-sm"
			>
				<h2 class="font-semibold {showEmpty ? 'text-primary' : ''}">
					{showEmpty ? $_('main.startMeeting') : $_('main.liveMeetings')}
				</h2>
				<span class="text-sm text-muted-foreground">{meetings.length} {$_('main.total')}</span>
			</div>

			{#if showEmpty}
				<!-- Show buttons to start video -->
				<div class=" flex flex-col items-center justify-center px-4 text-center md:h-[85vh]">
					<button
						onclick={openVideoModal}
						class="btn btn-primary btn-lg flex flex-col items-center p-4"
						aria-label="Create video"
					>
						<div class="mb-8 animate-bounce">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="120"
								height="120"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="text-primary"
							>
								<path d="M15 10l5 5-5 5"></path>
								<path d="M4 4v7a4 4 0 0 0 4 4h11"></path>
								<line x1="4" y1="11" x2="11" y2="11"></line>
							</svg>
						</div>
					</button>
					<h3 class="mb-2 text-2xl font-bold text-primary">{$_('main.noMeetingsYet')}</h3>
					<p class=" max-w-md text-muted-foreground">{$_('main.mainReadyToConnect')}</p>
					<p class="mb-6 max-w-md text-muted-foreground">
						{$_('main.bringIdeas')}
					</p>
					<div class="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
						<Button
							onclick={openVideoModal}
							variant="default"
							size="lg"
							data-testid="create-meeting"
							class="transform animate-pulse transition-all duration-300 ease-in-out hover:scale-105 hover:animate-none"
							aria-label="Start Video"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="mr-2"
							>
								<polygon points="23 7 16 12 23 17 23 7"></polygon>
								<rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
							</svg>
							{$_('main.createNewVideo')}
						</Button>
						<Button
							variant="outline"
							size="lg"
							class="transform transition-all duration-300 ease-in-out hover:scale-105"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="mr-2"
							>
								<circle cx="12" cy="12" r="10"></circle>
								<line x1="12" y1="16" x2="12" y2="12"></line>
								<line x1="12" y1="8" x2="12.01" y2="8"></line>
							</svg>
							{$_('main.learnMore')}
						</Button>
					</div>
				</div>
			{:else}
				<div class=" h-[85vh] overflow-y-auto px-4">
					<div
						class="grid auto-rows-max grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
					>
						{#each meetings as m (m.id)}
							{#if m.status !== 'ENDED'}
								<div class="min-h-full">
									<MeetingCard meeting={m} />
								</div>
							{/if}
						{/each}
					</div>
				</div>
			{/if}
		</main>
	</div>
</section>

{#snippet submitVibe()}
	<Dialog.Footer
		class="sticky-footer  flex flex-col items-center justify-end gap-2 pt-4 sm:flex-row"
	>
		<!-- Close -->
		<Dialog.Close
			type="button"
			name="closeVideoModal"
			onclick={closeVideoModal}
			aria-label={$_('main.close')}
			class="mb-2 w-full sm:mb-0 sm:w-auto"
		>
			{$_('main.close')}
		</Dialog.Close>
		<!-- Submit -->
		<Button
			type="submit"
			size="sm"
			class="w-full sm:w-auto"
			name="createVideoModal"
			aria-label={isSubmitting ? $_('main.creating') + '...' : $_('main.create')}
		>
			{isSubmitting ? $_('main.creating') + '...' : $_('main.create')}
		</Button>
	</Dialog.Footer>
{/snippet}

<Dialog.Root open={showVideoModal.open} onOpenChange={() => closeVideoModal()}>
	<Dialog.Portal>
		<Dialog.Content
			class="dialog-content"
			onInteractOutside={() => {
				closeVideoModal();
			}}
		>
			<Dialog.Header></Dialog.Header>
			<form
				method="POST"
				aria-label="Create Video"
				action="?/meeting"
				enctype="multipart/form-data"
				aria-labelledby="form-title"
				use:enhance={handleSubmit}
			>
				<StartMeetingForm actions={submitVibe} />
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	:global(.dialog-content) {
		display: flex;
		flex-direction: column;
		max-height: 90vh; /* Adjust as needed */
		overflow-y: auto;
	}

	:global(.sticky-footer) {
		position: sticky;
		bottom: 0;
		background-color: inherit;
		padding-top: 1rem;
		padding-bottom: 1rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
		z-index: 10;
	}
</style>
