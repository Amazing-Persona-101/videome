<script lang="ts">
	import {
		Email,
		Facebook,
		HackerNews,
		LinkedIn,
		Pinterest,
		Reddit,
		Telegram,
		Tumblr,
		Vk,
		WhatsApp,
		X,
		Xing
	} from 'svelte-share-buttons-component';

	export let shareContent;

	console.log('shareContent', shareContent);

	const { acct, desc, note, title, url } = shareContent;
</script>

<p class="text-sm font-normal text-gray-500 dark:text-gray-200">
	{url}
</p>

{#if note}
	<p class="text-sm font-normal text-gray-500 dark:text-gray-300">
		{note || ''}
	</p>
{/if}
<p class="text-sm font-normal text-gray-500 dark:text-gray-200">
	{desc}
</p>
<div class="grid grid-flow-col grid-cols-4 grid-rows-3 gap-4">
	<div data-testid="share-by-email"><Email subject={title} body="{desc || note} on {url}" /></div>
	<div data-testid="share-by-hacker"><HackerNews class="share-button" {title} {url} /></div>
	<div data-testid="share-by-reddit"><Reddit class="share-button" {title} {url} /></div>
	<div data-testid="share-by-linkedin"><LinkedIn class="share-button" {url} /></div>
	<div data-testid="share-by-tumbler">
		<Tumblr class="share-button" {title} {url} caption={title} />
	</div>
	<div>
		<Pinterest
			class="share-button"
			{url}
			media="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Svelte_Logo.svg/200px-Svelte_Logo.svg.png"
			description={title}
		/>
	</div>
	<div><Telegram class="share-button" text={title} {url} /></div>
	<div><Vk class="share-button" {title} {url} /></div>
	<div><WhatsApp class="share-button" text="{title} {url}" /></div>
	<div><Xing class="share-button" {title} {url} /></div>
	<div><Facebook class="share-button" quote={title} {url} /></div>
	<div>
		<X
			class="share-button"
			text={title}
			{url}
			hashtags="worldstream,mastodon,bluesky"
			via={acct}
			related="other,users"
		/>
	</div>
</div>
