<script lang="ts">
	import { Globe, CaretDown, UserCirclePlus, CaretRight } from 'phosphor-svelte';
	import { getLanguageList } from './getLanguage';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import { _, locale } from 'svelte-i18n';
	import type { LanguageGroup } from '$lib/components/Languages/types';

	let languages = $derived(getLanguageList() as LanguageGroup[]);

	const selectedHover = 'dark:bg-green-700';

	let isOpen = $state(false);
	let selectedLanguage = '';

	const handleLocaleChange = (key: string) => {
		$locale = key;
	};
</script>

<div class="flex">
	<DropdownMenu.Root bind:open={isOpen}>
		<DropdownMenu.Trigger>
			<button
				id="flags-button"
				data-testid="flags-button"
				class="z-10 inline-flex shrink-0 items-center px-4 py-2.5 text-center text-sm font-medium text-gray-500 hover:bg-gray-200 focus:ring-4 focus:ring-gray-100 focus:outline-none dark:hover:bg-gray-600 dark:focus:ring-gray-700"
				type="button"
				onclick={() => (isOpen = true)}
				aria-label={$_('util.chooseLanguage')}
				aria-expanded={isOpen}
				aria-haspopup="menu"
			>
				<Globe color="#3CBAA0" weight="fill" size={24} />
				<span class="pl-4">
					<CaretDown color="#3CBAA0" weight="fill" size={24} />
				</span>
			</button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content>
			<DropdownMenu.Label>{$_('util.chooseLanguage')}</DropdownMenu.Label>

			{#each languages as languageGroup}
				<DropdownMenu.Sub>
					<DropdownMenu.SubTrigger
						class="rounded-button flex h-10 items-center py-3 pr-1.5 pl-3 text-sm font-medium ring-0! ring-transparent! select-none focus-visible:outline-none data-highlighted:bg-muted data-[state=open]:bg-muted"
					>
						<div class="flex items-center">
							<UserCirclePlus class="text-foreground-alt mr-2 size-5" />
							{languageGroup.group}
						</div>
						<div class="ml-auto flex items-center gap-px">
							<CaretRight class="text-foreground-alt size-5" />
						</div>
					</DropdownMenu.SubTrigger>
					<DropdownMenu.SubContent
						class="w-[209px] rounded-xl border border-muted bg-background px-1 py-1.5 ring-0! shadow-popover ring-transparent! outline-none"
						sideOffset={10}
					>
						{#each languageGroup.languages as language}
							<DropdownMenu.Item
								onSelect={() => handleLocaleChange(language.value)}
								textValue={language.value}
								class="flex items-center"
							>
								<span class="pl-4 text-white"
									><span class={selectedLanguage === language.text ? selectedHover : ''}>
										{$_(`locale-switch.lang.${language.value}`)}</span
									></span
								>
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.SubContent>
				</DropdownMenu.Sub>
			{/each}
		</DropdownMenu.Content>
	</DropdownMenu.Root>
</div>
