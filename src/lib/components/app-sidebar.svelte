<script lang="ts">
	import InnerShadowTopIcon from '@tabler/icons-svelte/icons/inner-shadow-top';
	import NavUser from './nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import type { ComponentProps } from 'svelte';
	import { meetings } from '$lib/meetings/state.svelte';
	const fmtMin = (n: number) => `${Math.floor(n)}m`;
	import favicon from '$lib/assets/favicon.ico';
	import { useSidebar } from '$lib/components/ui/sidebar/context.svelte.js';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import NavSecondary from './nav-secondary.svelte';
	import CookieIcon from '@tabler/icons-svelte/icons/cookie';

	const sidebar = useSidebar();

	const data = {
		user: {
			name: 'VideoMe',
			email: 'videome.video',
			avatar: favicon
		},
		navSecondary: [
			{
				title: $_('privacy.privacy-and-cookies'),
				url: '/terms-and-conditions',
				icon: CookieIcon
			}
		]
	};

	function handleMeetingClick(event: Event, meetingId: string) {
		event.preventDefault();
		sidebar.setOpenMobile(false); // Close the sidebar
		setTimeout(() => goto(`/meeting/${meetingId}`), 150); // Navigate after a short delay
	}

	let { ...restProps }: ComponentProps<typeof Sidebar.Root> = $props();
</script>

<Sidebar.Root class="bg-background" collapsible="offcanvas" {...restProps}>
	<Sidebar.Header class="bg-background">
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton class=" data-[slot=sidebar-menu-button]:!p-1.5">
					{#snippet child({ props })}
						<a href="/" {...props}>
							<InnerShadowTopIcon class="!size-5" />
							<span class="text-base font-semibold">Video Me!</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content class="bg-background">
		<Sidebar.Group>
			<!-- Quick View: Live meetings -->
			<section class=" bg-gray-50 p-2 dark:bg-gray-900">
				<div
					class="m-1 border-2 border-dashed border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-800"
				>
					<h1 class="m-2 font-semibold">{$_('main.liveMeetings')}</h1>
					<Sidebar.GroupContent>
						{#if meetings?.length === 0}
							<div class="px-2 py-2 text-xs text-muted-foreground">{$_('main.noMeetingsYet')}</div>
						{:else}
							<Sidebar.Menu>
								{#each meetings as m (m.id)}
									{#if m.status !== 'ENDED'}
										<Sidebar.MenuItem>
											<Sidebar.MenuButton isActive>
												{#snippet child({ props })}
													<div
														class="group relative overflow-hidden rounded border bg-card p-2 text-card-foreground shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md"
													>
														<a
															href={`/meeting/${m.id}`}
															class="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
															aria-label={`Join meeting: ${m.title}`}
															onclick={(e) => handleMeetingClick(e, m.id)}
															data-testid="meeting-card-link-{m.id}"
														>
															<div class="flex items-start justify-between">
																<div class="min-w-0 flex-1 pr-2">
																	<div class="flex items-center space-x-2">
																		<div class="relative h-10 w-10 flex-shrink-0">
																			<!-- <div
																			class="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-600"
																		></div> -->
																			<div
																				class="absolute inset-1 flex items-center justify-center rounded bg-white dark:bg-gray-800"
																			>
																				<img
																					src={m.details?.group?.iconURL ||
																						'/default-group-icon.png'}
																					alt={m.title}
																					class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
																					loading="lazy"
																				/>
																			</div>
																		</div>
																		<div class="min-w-0 flex-1">
																			<h3
																				class="truncate text-sm font-semibold group-hover:text-emerald-600"
																				title={m.title}
																			>
																				{m.title}
																			</h3>
																			<p class="truncate text-xs text-muted-foreground">
																				{m.status}
																			</p>
																		</div>
																	</div>
																</div>
																<div class="flex flex-col items-end text-right">
																	<div class="flex items-center space-x-1">
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			class="h-4 w-4 text-emerald-500"
																			viewBox="0 0 20 20"
																			fill="currentColor"
																		>
																			<path
																				d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"
																			/>
																		</svg>
																		<span class="text-xs font-medium">{m.liveParticipants}</span>
																	</div>
																	<div class="text-[11px] text-muted-foreground">
																		{fmtMin(m.runtimeMinutes)}
																	</div>
																</div>
															</div>
															<div class="mt-2 h-1 w-full rounded bg-gray-200 dark:bg-gray-700">
																<div
																	class="h-1 rounded bg-emerald-500"
																	style="width: {Math.min((m.runtimeMinutes / 60) * 100, 100)}%;"
																></div>
															</div>
														</a>
													</div>
												{/snippet}
											</Sidebar.MenuButton>
										</Sidebar.MenuItem>
									{/if}
								{/each}
							</Sidebar.Menu>
						{/if}
					</Sidebar.GroupContent>
				</div>
			</section>
		</Sidebar.Group>
		<NavSecondary items={data.navSecondary} class="mt-auto" />
	</Sidebar.Content>
	<Sidebar.Footer>
		<NavUser user={data.user} />
	</Sidebar.Footer>
</Sidebar.Root>
