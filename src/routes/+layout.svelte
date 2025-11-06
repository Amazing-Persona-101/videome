<script lang="ts">
	import { isLocaleLoaded } from '$lib/i18n';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import SiteHeader from '$lib/components/site-header.svelte';
	import '../app.css';
	import favicon from '$lib/assets/favicon.ico';
	import { openVideoModal, showShareModal } from '$lib/stores/modalStore.svelte';
	import { onDestroy, onMount, type Snippet } from 'svelte';
	import { toast, Toaster } from 'svelte-sonner';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	import {
		applyMeetingMessage,
		destroyMeetings,
		initMeetings,
		setWsReady
	} from '$lib/meetings/state.svelte';
	import type { Session } from '$lib/meetings/types';
	import { getMeetingDetails } from '$lib/meetings/getDetails';
	import { _ } from 'svelte-i18n';
	import { setupWebSocket } from '$lib/websocket';

	let { children, data }: { children: Snippet<[]>; data: { sessions: Session[] } } = $props();
	let myOpen = $state(true);
	let windowWidth = $state(0);
	const MEDIUM_BREAKPOINT = 1536;

	// --- queue + rAF scheduler ---
	type RawMsg = string | ArrayBuffer | any;
	let msgQueue: RawMsg[] = [];
	let rafId: number | null = null;
	let alive = true;

	const schedule =
		typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
			? (fn: FrameRequestCallback) => window.requestAnimationFrame(fn)
			: (fn: FrameRequestCallback) => setTimeout(() => fn(performance.now?.() ?? Date.now()), 16);

	function scheduleFlush() {
		if (rafId != null) return;
		rafId = schedule(flushQueue) as unknown as number;
	}

	function flushQueue() {
		rafId = null;

		// Coalesce to latest-by-id for this frame
		const latestById = new Map<string, any>();
		for (const raw of msgQueue.splice(0)) {
			try {
				const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
				const msg = obj && typeof obj === 'object' && 'data' in obj ? obj.data : obj;
				if (!msg || !msg.meeting || !msg.event) continue;
				msg.organizedBy = undefined; // your sanitize step
				const id = msg.meeting.id ?? msg.id;
				if (id) latestById.set(id, msg);
			} catch (e) {
				console.warn('Ignoring bad WS payload', e);
			}
		}

		// ⬇️ async enrichment happens BEFORE we touch state
		void processBatchAsync(latestById);

		// If more arrived while we were here, schedule next frame
		if (msgQueue.length) scheduleFlush();
	}

	// --- details fetch: cache + dedupe + concurrency limit ---
	const DETAILS_TTL_MS = 30_000;
	const detailsCache = new Map<string, { ts: number; data: any }>();
	const inFlight = new Map<string, Promise<any>>();
	const MAX_CONCURRENT = 4;

	function shouldRefresh(id: string) {
		const c = detailsCache.get(id);
		return !c || Date.now() - c.ts > DETAILS_TTL_MS;
	}

	function ensureDetails(id: string) {
		if (!shouldRefresh(id)) return Promise.resolve(detailsCache.get(id)!.data);
		if (inFlight.has(id)) return inFlight.get(id)!;

		const p = (async () => {
			const data = await getMeetingDetails(id);
			//console.log(`fetched details for ${id}:`, data);
			// sanitize your data here as needed
			// e.g., remove sensitive fields, transform data, etc.
			detailsCache.set(id, { ts: Date.now(), data });
			return data;
		})().finally(() => inFlight.delete(id));

		inFlight.set(id, p);
		return p;
	}

	async function processBatchAsync(latestById: Map<string, any>) {
		if (latestById.size === 0 || !alive) return;

		// simple concurrency limiter
		const entries = [...latestById.entries()];
		const enriched = new Map<string, any>();
		let i = 0;

		const worker = async () => {
			while (i < entries.length && alive) {
				const idx = i++;
				const [id, msg] = entries[idx];
				//console.log(`enriching ${id}...`, msg);
				try {
					const details = await ensureDetails(id); // ⬅️ fetch details first
					//console.log('fetched details for', id, details);
					//console.log(`enriched before: ${JSON.stringify(enriched.get(id))}`);
					enriched.set(id, { ...msg, ...details }); // merge/compose as you need
					//console.log(`enriched after: ${JSON.stringify(enriched.get(id))}`);
				} catch (e) {
					console.warn('details failed', id, e);
					enriched.set(id, msg); // fail-safe: apply raw msg
				}
			}
		};

		const pool = Array(Math.min(MAX_CONCURRENT, entries.length)).fill(0).map(worker);
		await Promise.all(pool);

		if (!alive) return;

		// finally, mutate state with enriched messages
		for (const [, msg] of enriched) {
			applyMeetingMessage(msg);
		}
	}

	function handleResize() {
		windowWidth = window.innerWidth;
	}

	// --- Empty-state debounce (prevents brief flashes) ---
	let emptyTimer: ReturnType<typeof setTimeout> | null = null;

	onMount(() => {
		if (!browser) return;
		windowWidth = window.innerWidth; // Initial set
		window.addEventListener('resize', handleResize);

		initMeetings(data.sessions);
		const socket = setupWebSocket();

		socket.addEventListener('message', (ev) => {
			msgQueue.push(ev.data);
			const message = JSON.parse(ev.data);
			//console.log('received WS message message:', message.data);
			//console.log('received WS message participant:', message.data.participant);
			if (message.data?.event === 'meeting.participantLeft') {
				//console.log('received WS message:', message.data.participant?.userDisplayName);
				// Show toast to notify user of participant left
				toast(`${message.data.participant?.userDisplayName} left the meeting!`);
			}
			scheduleFlush(); // rAF-batched; details will be fetched before apply
		});

		socket.addEventListener('error', () => {
			//console.log('❌ WS error');
			setWsReady(false);
		});
		socket.addEventListener('open', () => {
			//console.log('✅ WS connected');
			setWsReady(true); // keep UI state in sync
		});

		socket.addEventListener('close', () => {
			//console.log('❌ WS closed');
			setWsReady(false);
		});

		onDestroy(() => {
			if (emptyTimer) clearTimeout(emptyTimer);
			alive = false;
			socket.close();
			if (rafId != null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(rafId);
			destroyMeetings();
		});
	});

	onDestroy(() => {
		window.removeEventListener('resize', handleResize);
	});

	// Just read `page` inside a rune. No subscribe().
	const isMeetingRoute = $derived(
		() => page.route?.id === '/meeting/[id]' || page.url?.pathname.startsWith('/meeting/')
	);

	async function shareCurrent() {
		showShareModal.open = true;
	}

	let mediaQuery: MediaQueryList;

	$effect(() => {
		// Guard for SSR / non-browser
		if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
			return; // no-op cleanup
		}
		mediaQuery = window.matchMedia(`(max-width: ${MEDIUM_BREAKPOINT}px)`); // Adjust breakpoint for 'medium'
		const handleMediaQueryChange = (event: { matches: any }) => {
			if (event.matches || windowWidth <= MEDIUM_BREAKPOINT) {
				myOpen = false; // Close sidebar on medium and below
			} else {
				myOpen = true; // Open sidebar on large and above
			}
		};

		if (mediaQuery) {
			mediaQuery.addEventListener('change', handleMediaQueryChange);
		}
		// Initial check
		if (mediaQuery.matches || windowWidth <= MEDIUM_BREAKPOINT) {
			myOpen = false;
		} else {
			myOpen = true;
		}

		return () => {
			mediaQuery.removeEventListener('change', handleMediaQueryChange);
		};
	});
</script>

{#snippet ShareActions()}
	<Button
		variant="ghost"
		size="icon"
		aria-label="Share meeting"
		onclick={shareCurrent}
		class="inline-flex"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-5 w-5"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
			<path d="M12 16V3" />
			<path d="m7 8 5-5 5 5" />
		</svg>
	</Button>
{/snippet}

<Toaster richColors position="bottom-left" theme="dark" />

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if $isLocaleLoaded}
	<div class="app-shell gradient-background">
		<Sidebar.Provider
			bind:open={myOpen}
			style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
		>
			<AppSidebar />
			<Sidebar.Inset>
				<!-- Right column: header + page content -->
				<!-- Content area: this is the scroller for pages -->
				<div class="flex h-screen flex-col overflow-hidden">
					<SiteHeader
						onStartVideoButtonClick={openVideoModal}
						actions={isMeetingRoute() ? ShareActions : undefined}
					/>
					<main class="flex-1 overflow-y-auto" data-testid="site-header">
						<div class="@container/main h-full">
							<div class="flex flex-col gap-4 py-4 md:gap-6 md:py-2">
								{@render children?.()}
							</div>
						</div>
					</main>
				</div></Sidebar.Inset
			>
		</Sidebar.Provider>
	</div>
{:else}
	<div class="loading">
		<div>Loading....</div>
	</div>
{/if}

<style>
	:global(html),
	:global(body) {
		height: 100%;
	}

	.loading {
		display: flex;
		justify-content: center;
		margin: 2rem;
		font-family: sans-serif;
	}

	/* Root app shell: sidebar + content */
	.app-shell {
		display: flex;
		height: 100vh;
		width: 100vw;
		overflow: hidden; /* prevent double scrollbars on the viewport */
	}

	/* Example: if your SiteHeader sets a CSS var for its height, you can keep it here */
	:root {
		--header-height: 56px;
	}
</style>
