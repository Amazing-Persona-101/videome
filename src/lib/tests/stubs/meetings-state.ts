// export const meetings: any[] = []; // only needed if your page imports it
// export const ui = { wsReady: true, lastNonEmptyAt: Date.now() }; // disables empty-state flicker
// export const heartbeat = 0;


// tests/stubs/meetings-state.ts

// Empty list triggers the empty-state branch in +page.svelte
export const meetings: any[] = [];

// Make the "idle" window already elapsed so showEmpty === true immediately.
// (+page.svelte uses const EMPTY_GRACE_MS = 1500)
export const ui = {
  wsReady: true,
  lastNonEmptyAt: Date.now() - 60_000, // 60s ago
};

// If your page references other exports from the real module later,
// add safe no-ops here to satisfy imports.
