# Google DAI Integration

SolidJS SPA for Google Dynamic Ad Insertion configuration.

Live demo: [https://sinner.github.io/shaka-google-dai/](https://sinner.github.io/shaka-google-dai/)

## Stack

- **SolidJS** + **Vite** + **TypeScript**
- **Tailwind CSS v4** for styling
- **@solidjs/router** for routing
- **lucide-solid** for icons
- **shaka-player** `4.12.2` (pinned — matches Samsung Smart TV app for DAI debugging)
- **pnpm** as package manager

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). The app redirects `/` to `/manual-asset-key`.

## Routes

| Path | Page |
|------|------|
| `/manual-asset-key` | Manual Asset Key |
| `/channels` | Channels |

On GitHub Pages the same routes live under the repo base path, e.g. `/shaka-google-dai/manual-asset-key`.

## Project structure

```
src/
├── components/
│   ├── layout/          # App shell (nav, layout wrapper)
│   └── ui/              # Reusable UI primitives (Button, Input, etc.)
├── lib/                 # Shared utilities
├── pages/               # Route-level page components
├── routes/              # Router configuration
└── services/            # API and domain service layer
```

## UI components

Available from `@/components/ui`:

- `Button` — primary, secondary, ghost, danger variants
- `Input` — text input with label, hint, and error states
- `TextArea` — multiline input
- `Checkbox` — styled checkbox with label
- `Radio` — styled radio button with label
- `Title` — heading levels h1–h4

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Type-check and production build |
| `pnpm preview` | Preview production build |
| `pnpm pages:deploy` | Build and publish to GitHub Pages |

## Publish to GitHub Pages

This app is a client-side SPA hosted at `https://{user}.github.io/{repo}/`. Two settings must match your repository name:

1. **Vite `base`** — asset URLs are rooted at `/shaka-google-dai/` in production builds (`vite.config.ts`).
2. **Solid Router `base`** — client-side navigation uses `import.meta.env.BASE_URL` so links stay under `/shaka-google-dai/…` instead of the domain root.

If either is missing, navigation can jump to the wrong URL (e.g. `https://sinner.github.io/manual-asset-key` instead of `https://sinner.github.io/shaka-google-dai/manual-asset-key`).

### One-time GitHub setup

1. Push this repo to GitHub (e.g. `sinner/shaka-google-dai`).
2. In the repo go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Choose branch **`gh-pages`** and folder **`/ (root)`**, then save.

### Deploy from your machine

```bash
pnpm install
pnpm pages:deploy
```

`pnpm pages:deploy` runs:

1. `pnpm build` — production build with `base: /shaka-google-dai/`
2. `cp dist/index.html dist/404.html` — GitHub Pages SPA fallback for direct URLs / refresh
3. `gh-pages -d dist` — pushes `dist/` to the `gh-pages` branch

After GitHub finishes processing (usually under a minute), the site is available at:

`https://sinner.github.io/shaka-google-dai/`

### Verify after deploy

- Home: [https://sinner.github.io/shaka-google-dai/](https://sinner.github.io/shaka-google-dai/)
- Manual Asset Key: [https://sinner.github.io/shaka-google-dai/manual-asset-key](https://sinner.github.io/shaka-google-dai/manual-asset-key)
- Channels: [https://sinner.github.io/shaka-google-dai/channels](https://sinner.github.io/shaka-google-dai/channels)

Clicking nav links should keep the `/shaka-google-dai/` prefix in the address bar.

### Renaming the repository

If you fork or rename the repo, update **both**:

- `base` in `vite.config.ts` → `/{new-repo-name}/`
- `homepage` in `package.json` → `https://{user}.github.io/{new-repo-name}/`

Then run `pnpm pages:deploy` again.

### Local preview of the Pages build

```bash
pnpm build
pnpm preview
```

Open the URL Vite prints (paths will include `/shaka-google-dai/`).
