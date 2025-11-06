<script lang="ts">
	import Layout from '../../../routes/+layout.svelte';
	import Page from '../../../routes/+page.svelte';

	// `+layout.svelte` expects:
	//   let { children, data }: { children: Snippet<[]>; data: { sessions: Session[] } }
	// `+page.svelte` expects:
	//   export let data: { meetings: any[] }

	export let layoutData: { sessions: any[] } = { sessions: [] };
	export let pageData: { meetings: any[] } = { meetings: [] };
</script>

<Layout data={layoutData}>
	{#snippet children()}
		<Page data={pageData} />
	{/snippet}
</Layout>
