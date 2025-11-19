````markdown
# Contributing to Videome

Thanks for your interest in contributing to **Videome** — an open-source, privacy-first, no-account video meeting app built with **Svelte 5**, **SvelteKit**, and **Cloudflare RealtimeKit**.

Whether you’re fixing a bug, improving documentation, suggesting a feature, or polishing the UI — contributions of all sizes are welcome.

---

## ⭐️ Ways to Contribute

- **Report bugs** via GitHub Issues
- **Suggest new features** or improvements
- **Fix issues** labeled `good first issue`
- **Improve documentation** or examples
- **Review pull requests**
- **Share Videome and help others discover it**

---

## 🛠️ Local Development Setup

### 1. Fork & Clone

```bash
git clone https://github.com/amazing-persona-101/videome.git
cd videome
````

### 2. Install Dependencies

Videome uses **pnpm** as the package manager.

```bash
pnpm install
```

### 3. Environment Variables

Videome requires configuration for Cloudflare RealtimeKit and related services.

Copy the example file:

```bash
cp .env.example .env
```

Fill in the required values based on your Cloudflare account and deployment.

> ⚠️ Never commit `.env` files. They are ignored by default.

### 4. Run the Dev Server

```bash
pnpm dev
```

This starts a SvelteKit dev environment with hot module reload.

### 5. Lint, Format & Test

```bash
pnpm lint
pnpm format
pnpm test
```

Contributions should pass lint, formatting, and basic tests before opening a PR.

---

## 📂 Project Structure (Simplified)

```
src/
  lib/
  routes/
  components/
  server/
  realtime/
tests/
docs/
```

* `src/routes` – SvelteKit pages + API endpoints
* `src/lib` – shared utilities
* `src/realtime` – WebSocket + Cloudflare RealtimeKit logic
* `docs` – architecture, deployment, and project documentation

---

## 🔧 Pull Requests

### ✔️ PR Guidelines

* Keep PRs small and focused.
* Include a clear description of *what* and *why*.
* Reference related issues using `Fixes #123`.
* Avoid unrelated formatting changes.
* Ensure the project builds and tests pass.
* Screenshots are appreciated for UI changes.

### ✔️ Branch Naming

Use informative branch names like:

* `feature/add-chat-ui`
* `fix/mobile-orientation-bug`
* `docs/architecture-update`

---

## 🐞 Reporting Bugs

When filing a bug, please include:

* Steps to reproduce
* Browser + OS
* Expected behavior
* Actual behavior
* Screenshots or console logs (if relevant)

This helps maintainers reproduce and fix the issue quickly.

---

## 🌱 Good First Issues

If you're new to the codebase, look for issues labeled:

`good first issue`
`help wanted`

These are intentionally created to be easy starting points.

---

## 💬 Discussions & Questions

For general questions, ideas, or help:

👉 Join the community subreddit: **r/videome**

For anything private or sensitive, email:
**[support@videome.video](mailto:support@videome.video)**

---

## 🧘 Project Philosophy

Videome focuses on:

* **Privacy-first** design (no accounts, trackers, or recordings)
* **Simplicity** in UX and developer experience
* **Openness** — everything from architecture to roadmap
* **Lightweight real-time collaboration** using Cloudflare + Svelte

---

## ❤️ Thank You

Your contributions help make privacy-friendly real-time communication accessible to everyone.
Thank you for helping this project grow!
