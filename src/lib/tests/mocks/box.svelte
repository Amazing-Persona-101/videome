<script lang="ts">
	export let as: string = 'div';
	export let props: Record<string, any> = {};
</script>

<svelte:element this={as} {...props}>
	<slot />
</svelte:element>
