<script lang="ts">
	import { type GroupInfo } from '$lib/identity/storage';
	import { _ } from 'svelte-i18n';

	let {
		groups,
		groupSelected,
		summary = $bindable()
	}: {
		groupSelected: (info: GroupInfo) => void;
		groups: GroupInfo[];
		summary: string;
	} = $props();

	let summaryMax = 140;

	let joinError = $state<string | null>(null);
	let errors = $state<{ summary?: string; group?: string }>({});
	let selectedGroup = $state<GroupInfo>({ id: '', name: '', iconURL: '' });

	function initialsFor(name: string) {
		const parts = name.trim().split(/\s+/).slice(0, 2);
		return parts.map((p) => p[0]?.toUpperCase() ?? '').join('');
	}

	function selectGroup(g: GroupInfo) {
		selectedGroup = g;
		groupSelected(g);
	}
</script>

<div>
	<!-- Summary -->
	<label class="block">
		<span class=" mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
			>{$_('meeting.addShortDescription')}</span
		>
		<textarea
			bind:value={summary}
			maxlength={summaryMax}
			rows="3"
			placeholder={$_('meeting.sampleSummary')}
			class="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm transition outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-300/40 dark:border-zinc-700 dark:bg-zinc-800"
		></textarea>
		<div class="mt-1 flex items-center justify-between text-xs">
			<span class="text-rose-500">{errors.summary}</span>
			<span class="text-zinc-500 dark:text-zinc-400">{summary?.length}/{summaryMax}</span>
		</div>
	</label>
</div>

<!-- Icon Grid -->
<div class="overflow-x-auto">
	<div class="flex gap-4" style="width: max-content;">
		<!-- Meeting icon grid (from group_info.json) -->
		<div>
			<div class="mt-2">
				<div class="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
					{$_('meeting.selectCoolPicture')}
				</div>
				<div class="grid grid-cols-2 gap-3">
					{#each groups as g (g.name)}
						<button
							type="button"
							class="group relative flex flex-col items-center justify-center gap-2 rounded border p-3 text-center transition hover:shadow
        {selectedGroup?.id === g.id
								? 'border-primary bg-primary/10 ring-2 ring-primary/50'
								: 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'}"
							onclick={() => selectGroup(g)}
							aria-pressed={selectedGroup?.id === g.id}
						>
							{#if g.iconURL}
								<img
									id={g.id}
									src={g.iconURL}
									alt={g.name}
									class="h-10 w-10 shrink-0 rounded-lg object-cover"
									loading="lazy"
								/>
							{:else}
								<!-- Fallback if iconURL missing -->
								<div
									class="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30 text-center leading-10 font-semibold text-indigo-900 dark:text-indigo-200"
									aria-hidden="true"
									title={g.name}
								>
									{initialsFor(g.name)}
								</div>
							{/if}
							<span class="text-sm text-zinc-800 dark:text-zinc-100">{g.name}</span>

							{#if selectedGroup?.id === g.id}
								<div
									class="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
										class="h-3 w-3 text-white"
									>
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										/>
									</svg>
								</div>
							{/if}
						</button>
					{/each}
				</div>

				<p class="mt-1 text-xs text-rose-500">{errors.group}</p>
			</div>
		</div>

		{#if joinError}
			<p class="mt-4 text-sm text-destructive">{joinError}</p>
		{/if}
	</div>
</div>
