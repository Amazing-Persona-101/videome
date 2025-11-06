<script lang="ts">
	import { Play } from '@lucide/svelte';
	import { DEFAULT_GROUP_SUMMARY } from '$lib/constants';
	import { _ } from 'svelte-i18n';
	import type { MeetingView } from '$lib/meetings/types';
	import { Clock, Users } from 'phosphor-svelte';
	import { formatDistanceToNow } from 'date-fns';

	let { meeting } = $props<{
		meeting: MeetingView;
	}>();

	const createdAtFormatted = meeting.createdAt
		? formatDistanceToNow(new Date(meeting.createdAt), { addSuffix: true })
		: '';

	//$inspect('MC Meeting :', meeting);

	const { details } = meeting;
	//$inspect('MC Details :', details);
	const { group, summary: meetingSummary } = details || {};

	// fallbacks
	const title = meeting.title?.trim() || 'Untitled Meeting!!';
	const summary =
		meetingSummary?.trim() === `Wow - ${DEFAULT_GROUP_SUMMARY}`
			? $_('meeting.defaultSummary')
			: meetingSummary?.trim();
	const href = meeting.href ?? `/meeting/${meeting.id}`;

	// derive initials for placeholder avatar
	function initials(input: string) {
		return input
			.split(/\s+/)
			.slice(0, 2)
			.map((w) => w[0]?.toUpperCase() ?? '')
			.join('');
	}

	function fmtCount(n?: number) {
		if (!n) return '0';
		if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
		if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
		return String(n);
	}
</script>

<a
	{href}
	class="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
	aria-label="Join meeting: {title}"
	title="Join {title}"
	data-testid="meeting-card-link-{meeting.id}"
>
	<div class="relative w-full overflow-hidden">
		<div
			data-testid="meeting-card-background"
			class="w-full overflow-hidden rounded bg-center bg-no-repeat"
			style="background-image: linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('{group?.iconURL ||
				'Untitled Meeting!!'}');"
		>
			<div class="flex h-full min-h-[300px] w-full flex-col justify-between bg-black/40 p-4">
				<div>
					<div class="mb-4 min-h-[50px]">
						<h3 class="font-manrope mb-6 text-3xl font-semibold text-white">
							<span class="line-clamp-2 text-base leading-snug md:text-lg">{title}</span>
						</h3>
					</div>
					<p class="mb-6 text-base leading-6 font-normal text-white">
						<span class="line-clamp-4 text-base leading-snug md:text-lg">{summary}</span>
					</p>
				</div>

				<div class="flex items-center justify-between">
					<!-- Meeting Participants and time -->
					<div class="flex items-center space-x-4 text-sm text-white">
						{#if typeof meeting.totalParticipants === 'number'}
							<span class="flex items-center">
								<Users size={16} class="mr-1" />
								{fmtCount(meeting.totalParticipants)}
							</span>
						{/if}
						{#if createdAtFormatted}
							<span class="flex items-center">
								<Clock size={16} class="mr-1" />
								{createdAtFormatted}
							</span>
						{/if}
						<Play size={16} class="mr-2" />
					</div>
				</div>
			</div>
		</div>
	</div>
</a>

<style>
	/* If your project doesn't have tailwind line-clamp plugin, this fallback keeps things tidy */
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
