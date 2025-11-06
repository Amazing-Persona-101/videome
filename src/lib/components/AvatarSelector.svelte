<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { buildRoboUrl, getRandomName, randomSeed, type RoboKey } from '$lib/identity/guest';
	import { _ } from 'svelte-i18n';

	let {
		avatarSelected
	}: {
		avatarSelected: (info: { avatar: string; name: string; set: RoboKey; userId: string }) => void;
	} = $props();

	let title = $_('avatar.choose');
	let description = $_('avatar.weWillCreate');
	let previewSeeds = $state<string[]>([randomSeed(), randomSeed(), randomSeed(), randomSeed()]);
	let avatarLoading = $state(false);
	let avatar = $state<string>('');
	let name = $state<string>('');
	let userId = $state<string>('');
	let seed = $state<string>('');

	async function chooseAvatarSet(setKey: RoboKey) {
		avatarLoading = true;

		try {
			seed = randomSeed();
			avatar = buildRoboUrl(setKey, seed, 128);
			name = await getRandomName(seed);
			userId = Math.random().toString(36).substr(2, 9);

			const response = {
				avatar,
				name,
				set: setKey,
				userId
			};
			avatarSelected(response);
		} finally {
			avatarLoading = false;
		}
	}
</script>

<!--
    This component displays a card with a title, description, and avatar style chooser.
    The avatar style chooser generates a random name and image for each selection,
    and updates the state with the selected style.

 -->
<section class="mx-auto my-2 w-full max-w-3xl">
	<Card class="flex max-h-[80vh] flex-col overflow-hidden">
		<CardHeader
			data-testid="avatar-selector"
			class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
		>
			<div>
				<CardTitle class="text-base">{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</div>
		</CardHeader>

		<CardContent class="max-h-96 overflow-y-auto md:max-h-3/4">
			<div class="flex flex-col gap-4 pb-4 sm:flex-row sm:flex-wrap">
				<!-- Avatar style chooser -->
				{#each ['robot', 'monster', 'head', 'cat'] as key}
					<div class="w-full rounded border p-4" data-testid="vibe-chooser">
						<div class="mb-3 text-sm font-medium capitalize">{$_(`avatar.${key}`)}</div>
						<div class="mb-4 flex justify-center gap-3 sm:justify-start">
							{#each previewSeeds as seed}
								<img
									alt={`${key} preview`}
									class="h-10 rounded ring-2 ring-primary/15 sm:w-10 md:h-20 md:w-20"
									src={buildRoboUrl(key as RoboKey, seed, 96)}
									loading="lazy"
									decoding="async"
								/>
							{/each}
						</div>

						<Button
							type="button"
							size="sm"
							class="w-full"
							disabled={avatarLoading}
							onclick={() => chooseAvatarSet(key as RoboKey)}
						>
							{avatarLoading ? $_('avatar.loading') : $_('avatar.chooseThisStyle')}
						</Button>
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>
</section>
