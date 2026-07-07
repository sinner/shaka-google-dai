# Google DAI Integration

SolidJS SPA for Google Dynamic Ad Insertion configuration.

## Stack

- **SolidJS** + **Vite** + **TypeScript**
- **Tailwind CSS v4** for styling
- **@solidjs/router** for routing
- **lucide-solid** for icons
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
