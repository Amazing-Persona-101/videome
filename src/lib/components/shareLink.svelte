<script lang="ts">
	import ShareButtons from '$lib/components/shareButtons.svelte';
	import { DOMAIN_NAME } from '$lib/constants';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { showShareModal } from '$lib/stores/modalStore.svelte';
	import { toast } from 'svelte-sonner';

	/**
	 * @type {string}
	 */
	let { meetingHost, meetingId, meetingTitle } = $props();

	let url: string = `${window.location.origin}/meeting/${meetingId}`;

	$effect(() => {
		if (showShareModal.open) {
			navigator.clipboard.writeText(url).then(
				function () {
					toast.info(`Link ${url} copied to clipboard`);
				},
				// null,
				function (err) {
					console.error('Failed to copy link to clip board', err);
				}
			);
		}
	});

	const shareContent = {
		acct: meetingHost || '',
		desc: `I'm in the '${meetingTitle}' right now on ${DOMAIN_NAME}`,
		title: `Join me in a meeting on ${DOMAIN_NAME} from: ${meetingHost}`,
		url: url
	};
</script>

<Dialog.Root open={showShareModal.open}>
	<Dialog.Content
		class="sm:max-w-[600px]"
		onInteractOutside={(e) => {
			e.preventDefault();
			showShareModal.open = false;
		}}
	>
		<ShareButtons {shareContent} />
	</Dialog.Content>
</Dialog.Root>

<style></style>
