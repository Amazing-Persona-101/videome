# Videome — Real-time Meeting Lobby (SvelteKit + Svelte 5)

A modern, responsive lobby that shows **live meeting cards** with **participant counts** and **runtime**, updated in real time from **WebSocket** events. Built with **SvelteKit (Svelte 5 runes)**, **TypeScript**, **TailwindCSS**, and **shadcn/ui**.

---

## ✨ Features

- **Live updates** from socket events:
  - `meeting.started` · `meeting.ended`
  - `meeting.participantJoined` · `meeting.participantLeft`
- **Responsive cards + sidebar** (mobile → desktop) with shadcn/ui & Tailwind
- **Accurate runtime** ticker for LIVE meetings
- **Session filtering** (dedupe by `associated_id` choosing the latest row)
- **Guest identities**:
  - RoboHash avatars (`robot | monster | head | cat`)
  - RandomUser username fetch with deterministic local fallback
- **Host & Guest flows**:
  - Host: can start a meeting immediately (auth present)
  - Guest: preview + consent form before joining
- **Robust form UX**:
  - Required TOS checkbox (native HTML validation)
  - Parent `Submit` button linking to child `<form>` via `form="…"`, Svelte 5 runes

---

## 🧱 Tech Stack

- **SvelteKit** (Svelte 5 runes: `$state`, `$derived`, `$effect`, `$props`, `$bindable`)
- **TypeScript**
- **TailwindCSS** + **shadcn/ui**
- **Vitest** + **@testing-library/svelte**
- (Optional) **Cloudflare Worker** for webhook verification (RSA-SHA256)

---

## 📂 Project Structure (key parts)

```
src/
  lib/
    meetings/
      filterSessions.ts      # dedupe sessions (choose latest by associated_id)
      merge.ts               # message → MeetingView merge logic; tick()
      state.svelte.ts        # minimal global state using Svelte 5 runes
      types.ts               # Session, MeetingView, IncomingMessage, unions
    identity/
      guest.ts               # randomSeed(), buildRoboUrl(), getRandomName()
  routes/
    +page.svelte             # main lobby (cards + sidebar + WS)
    start-meeting-form.svelte# host create form (TOS lives here)
  components/
    site-header.svelte       # header actions, “Create New Video”
    app-sidebar.svelte       # rooms quick list

# (optional) worker/ (if you’re verifying signed webhooks)
#   index.ts
#   wrangler.jsonc
```

---

## 🚀 Getting Started

> Requires **Node 20+**.

```bash
# install deps
pnpm install        # or: npm install / yarn

# dev
pnpm dev

# typecheck / lint / format
pnpm typecheck
pnpm lint
pnpm format

# build & preview
pnpm build
pnpm preview
```

---

## ⚙️ Configuration

### WebSocket

The lobby page opens a WebSocket on mount (skipped in tests). If your endpoint differs, expose it via an env var or compose from `location`:

```ts
const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
```

Broadcast the meeting events listed above, conforming to the shapes in `src/lib/meetings/types.ts`.

### (Optional) Webhook verification (Cloudflare Worker)

If you’re verifying signed webhooks:

- Set `DYTE_PUBLIC_KEY` to your **PEM SPKI public key** (single line or properly escaped).
- Expect header `dyte-signature` containing **base64** of the RSA-SHA256 signature over the **exact raw request body bytes**.
- Validate against raw bytes; **do not** stringify/pretty-print before verifying.

Local dev:

```bash
wrangler dev
export DYTE_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----MIIBI...QAB-----END PUBLIC KEY-----"
```

---

## 🧪 Testing

We use **Vitest** and **@testing-library/svelte**. Tests cover:

- `filterSessions.ts` — latest row per `associated_id`
- `merge.ts` — add/merge messages, participant counts, runtime tick
- `state.svelte.ts` — runes store API (init/merge/cleanup)
- `identity/guest.ts` — robohash URL, random name fetch & fallback
- `+page.svelte` — empty-state CTA renders (via mocks)

Run:

```bash
pnpm test
```

### Test notes

- We mock `$app/environment` with `browser:false` so `onMount` won’t open a real WS.
- We mock `$lib/meetings/state.svelte` to force the **empty-state CTA** visible:

  ```ts
  vi.mock('$lib/meetings/state.svelte', () => ({
    meetings: [],
    ui: { wsReady: true, lastNonEmptyAt: 0 },
    initMeetings: vi.fn(),
    destroyMeetings: vi.fn(),
    applyMeetingMessage: vi.fn(),
    setWsReady: vi.fn()
  }));
  ```

- `identity/guest.ts` tests mock `fetch` for RandomUser (`?inc=login&results=1&noinfo`).
  When results are empty, we assert the **shape** of the fallback (deterministic local generator) instead of stubbing the internal function.

---

## 🔁 How merging works

### `filterSessions.latestByAssociatedId`

For each `associated_id`, choose the row with the **latest effective timestamp** using:
`updated_at → ended_at → started_at → created_at`.
We normalize spaced ISO strings like `T20: 25: 09.021Z`.

### `merge.fromCurrSessions`

Map `Session[]` → `MeetingView[]`, then sort **LIVE** first, then by `updatedAt` descending.

### `merge.applyMessage`

Apply an `IncomingMessage` to a `MeetingView[]` snapshot:

- Add a **new meeting** if unknown (`id` → `sessionId` → `roomName` lookup).
- Update `title`, `status`, timestamps.
- Adjust `liveParticipants`/`totalParticipants` on join/leave.
- Recompute `runtimeMinutes` for LIVE entries; also exposed via `tick()`.

---

## 👤 Guest Identity

- **`randomSeed()`**: 12-char base-36-ish seed for reproducible name/avatar.
- **`buildRoboUrl(set, seed, size?)`**: RoboHash URL for sets `robot | monster | head | cat`.
- **`getRandomName(seed)`**: attempts RandomUser (`login.username` + `login.password`); on empty results, falls back to a deterministic local name like `silver_orca_ABC`.

Persist `{ name, avatarUrl, set, seed }` to `localStorage` and reuse across sessions.

---

## 🧭 UI Patterns

### Parent button + child form (Svelte 5 runes)

Child (TOS lives here, **native required** checkbox so browser blocks submit):

```svelte
<!-- start-meeting-form.svelte -->
<script lang="ts">
  let { formId = 'start-meeting-form', valid = $bindable(false) } = $props();
  const formEl = $state<HTMLFormElement | null>(null);
  function updateValidity() { valid = formEl?.checkValidity() ?? false; }
</script>

<form id={formId} bind:this={formEl} on:input={updateValidity}>
  <label class="flex items-start gap-2">
    <input type="checkbox" name="tos_agree" required class="mt-1 h-4 w-4 accent-fuchsia-600" />
    <span class="text-sm">
      I agree to the <a class="underline" href="/tos">Terms of Service</a> and confirm I am of legal age.
    </span>
  </label>
</form>
```

Parent (external **Submit** button points at the child form):

```svelte
<!-- +page.svelte -->
<script lang="ts">
  let canSubmit = $state(false);
  let submitting = $state(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    if (!form.checkValidity()) return;
    submitting = true;
    try {
      const data = new FormData(form);
      // submit…
    } finally {
      submitting = false;
    }
  }
</script>

<StartMeetingForm formId="start-meeting-form" bind:valid={canSubmit} on:submit|preventDefault={handleSubmit} />

<Button type="submit" form="start-meeting-form" disabled={!canSubmit || submitting}>
  {submitting ? 'Creating…' : 'Create'}
</Button>
```

### Adaptive video aspect ratio (portrait vs. landscape)

```svelte
<div class="w-full aspect-[16/9] portrait:aspect-[9/16]">
  <video class="absolute inset-0 h-full w-full object-contain" playsinline autoplay muted></video>
</div>
```

---

## 🩺 Troubleshooting

- **Cards/Sidebar truncated**
  Ensure flex containers allow growth: add `min-h-0` to flex children and `overflow-auto` where scrolling is expected. Avoid fixed `height` on card containers.

- **Other browsers don’t update**
  Confirm `applyMessage()` **inserts** unknown meetings (id/sessionId/roomName matching). Make sure state updates are **immutable** (return a new array) so Svelte reacts.

- **TOS checkbox not gating submission**
  Use a **native** `<input type="checkbox" required>` inside the form. If using a custom checkbox, mirror to a hidden native checkbox and disable the button via a bound `valid` prop.

- **Tests fail on page load**
  Mock `$app/environment` with `browser:false` and provide state mocks so the empty-state CTA renders without opening a real WebSocket.

- **Webhook “verify-failed”**
  Ensure you sign/verify the **raw bytes** of the payload; signatures can’t be checked against pretty-printed JSON. Verify your key is an **SPKI public key** in PEM and that your runtime imports it with appropriate usage for `verify`.

---

## 📜 License

MIT © 2025 Videome contributors
