<script lang="ts">
	import SvelteMarkdown from 'svelte-markdown';

	let source = $state('');

	async function loadTerms() {
		try {
			const response = await fetch('/terms-and-conditions.md');
			if (!response.ok) throw new Error('Failed to load terms');
			source = await response.text();
		} catch (error) {
			console.error('Error loading terms:', error);
			source = 'Failed to load terms and conditions.';
		}
	}

	$effect(() => {
		loadTerms();
	});
</script>

<div class="preview">
	<SvelteMarkdown {source} />
</div>

<style>
	.preview {
		box-sizing: border-box;
		/* display: block; */
		width: 100%;
	}

	.preview {
		/* height: 75%; */
		padding: 2rem;
	}

	.preview :global(p) {
		display: block;
		margin-block-start: 1em;
		margin-block-end: 1em;
		margin-inline-start: 0px;
		margin-inline-end: 0px;
		unicode-bidi: isolate;
	}

	.preview :global(h1) {
		font-size: 1.5rem; /* 24px */
		line-height: 2rem; /* 32px */
		display: block;
		/* font-size: 2em; */
		margin-block-start: 0.67em;
		margin-block-end: 0.67em;
		margin-inline-start: 0px;
		margin-inline-end: 0px;
		font-weight: bold;
		unicode-bidi: isolate;
	}

	.preview :global(h2) {
		font-size: 1.25rem; /* 20px */
		line-height: 1.75rem; /* 28px */

		display: block;
		/* font-size: 1.5em; */
		margin-block-start: 0.83em;
		margin-block-end: 0.83em;
		margin-inline-start: 0px;
		margin-inline-end: 0px;
		font-weight: bold;
		unicode-bidi: isolate;
	}
	.preview :global(h3) {
		font-size: 1.125rem; /* 18px */
		line-height: 1.75rem; /* 28px */

		display: block;
		/* font-size: 1.17em; */
		margin-block-start: 1em;
		margin-block-end: 1em;
		margin-inline-start: 0px;
		margin-inline-end: 0px;
		font-weight: bold;
		unicode-bidi: isolate;
	}

	.preview :global(ul) {
		display: block;
		list-style-type: disc;
		margin-block-start: 1em;
		margin-block-end: 1em;
		padding-inline-start: 40px;
		unicode-bidi: isolate;
	}

	.preview :global(li) {
		display: list-item;
		text-align: -webkit-match-parent;
		unicode-bidi: isolate;
	}
</style>
