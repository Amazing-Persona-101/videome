<script lang="ts">
	import { isLocaleLoaded } from '$lib/i18n';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import Languages from '$lib/components/Languages/Languages.svelte';
	import type { Snippet } from 'svelte';
	import { _ } from 'svelte-i18n';

	// svelte5 runes props
	let {
		onStartVideoButtonClick,
		actions
	}: {
		onStartVideoButtonClick: () => void;
		actions?: Snippet<[]>;
	} = $props();
</script>

{#if $isLocaleLoaded}
	<header
		class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
	>
		<div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
			<Sidebar.Trigger class="-ml-1" />
			<Separator orientation="vertical" class="mx-2 data-[orientation=vertical]:h-4" />
			<h1 class="text-base font-medium">
				<a
					href="/"
					class="focus:ring-primary-500 hover:underline focus:ring-2 focus:outline-none"
					title="Go to Meetings Home"
					aria-label="Meetings Home"
					data-testid="meetings-home-link">{$_('main.liveMeetings')}</a
				>
			</h1>
			<div class="ml-auto flex items-center gap-2">
				<!-- Named slot: parent can override -->
				{#if actions}
					{@render actions()}
				{:else}
					<Button
						onclick={onStartVideoButtonClick}
						variant="ghost"
						size="sm"
						class="flex items-center justify-center dark:text-foreground"
						target="_blank"
						rel="noopener noreferrer"
						name="start-video-button"
						data-testid="header-start-video-button"
						aria-label="Start Video"
					>
						<span class="hidden sm:inline">{$_('main.createNewVideo')}</span>
						<span class="sm:hidden">
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
								class="feather feather-video"
								><polygon points="23 7 16 12 23 17 23 7"></polygon><rect
									x="1"
									y="5"
									width="15"
									height="14"
									rx="2"
									ry="2"
								></rect></svg
							>
						</span>
					</Button>
				{/if}
				<div>
					<Languages />
				</div>
			</div>
		</div>
	</header>
{:else}
	<div class="loading">
		<div>Loading header...</div>
	</div>
{/if}
