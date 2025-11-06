<script lang="ts">
	import type { Snippet } from 'svelte';
	export let onStartVideoButtonClick: () => void;
	export let actions: Snippet<[]> | undefined;
</script>

<div data-testid="site-header">
	<!-- Minimal control we can click in tests -->
	<button aria-label="start-video" on:click={() => onStartVideoButtonClick?.()}></button>

	<!-- Render actions snippet exactly like your real header would -->
	{@render actions?.()}
</div>
