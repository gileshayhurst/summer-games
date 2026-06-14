# PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Summer Games installable as a full-screen PWA on Android and iOS home screens, using the existing `public/icon.svg` as the app icon.

**Architecture:** Three changes — a Next.js manifest route (`app/manifest.ts`), three PNG icon files generated once from the SVG and committed (`public/icons/`), and four PWA meta fields added to the root layout metadata export (`app/layout.tsx`). No runtime dependencies added; `sharp` is installed, used, then removed.

**Tech Stack:** Next.js 14 App Router (MetadataRoute.Manifest, Metadata), Node.js ESM script, sharp (devDependency, removed after use)

---

## File Map

| Action | File | Purpose |
|---|---|---|
| Create | `scripts/generate-icons.mjs` | One-time script — generates PNGs from SVG, then deleted |
| Create | `public/icons/icon-192.png` | Android manifest icon (standard) |
| Create | `public/icons/icon-512.png` | Android manifest icon (high-res / splash) |
| Create | `public/icons/apple-touch-icon.png` | iOS "Add to Home Screen" icon |
| Create | `app/manifest.ts` | Web app manifest served at /manifest.webmanifest |
| Modify | `app/layout.tsx` | Add theme-color, apple-touch-icon, iOS fullscreen meta |

---

### Task 1: Generate PNG icons from the SVG

**Files:**
- Create: `scripts/generate-icons.mjs` (deleted after running)
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Create: `public/icons/apple-touch-icon.png`

- [ ] **Step 1: Install sharp as a devDependency**

```bash
npm install --save-dev sharp
```

Expected output includes `added 1 package` (sharp has prebuilt Windows x64 binaries — no compilation).

- [ ] **Step 2: Create the icon generation script**

Create `scripts/generate-icons.mjs` with the following content:

```js
import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const svg = readFileSync(join(root, 'public', 'icon.svg'))
const outDir = join(root, 'public', 'icons')

mkdirSync(outDir, { recursive: true })

const icons = [
  { size: 512, name: 'icon-512.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 180, name: 'apple-touch-icon.png' },
]

for (const { size, name } of icons) {
  await sharp(svg).resize(size, size).png().toFile(join(outDir, name))
  console.log(`Generated ${name} (${size}x${size})`)
}
```

- [ ] **Step 3: Run the script**

```bash
node scripts/generate-icons.mjs
```

Expected output:
```
Generated icon-512.png (512x512)
Generated icon-192.png (192x192)
Generated apple-touch-icon.png (180x180)
```

- [ ] **Step 4: Verify the files exist**

```bash
ls public/icons/
```

Expected: three files — `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`.

- [ ] **Step 5: Remove the script and uninstall sharp**

```bash
rm scripts/generate-icons.mjs
npm uninstall sharp
```

- [ ] **Step 6: Commit the icons**

```bash
git add public/icons/
git commit -m "feat: add PWA icon PNGs"
```

---

### Task 2: Create the web app manifest

**Files:**
- Create: `app/manifest.ts`

- [ ] **Step 1: Create `app/manifest.ts`**

```ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Summer Games',
    short_name: 'Summer Games',
    start_url: '/',
    display: 'standalone',
    theme_color: '#1A4731',
    background_color: '#1A4731',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
```

- [ ] **Step 2: Verify the manifest is served correctly**

Start the dev server:
```bash
npm run dev
```

Visit `http://localhost:3000/manifest.webmanifest` in a browser. You should see JSON matching the object above. Next.js serves this automatically from `app/manifest.ts` — no route configuration needed.

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add app/manifest.ts
git commit -m "feat: add PWA web app manifest"
```

---

### Task 3: Add PWA meta tags to the root layout

**Files:**
- Modify: `app/layout.tsx`

The current file exports:
```ts
export const metadata: Metadata = {
  title: 'Summer Games',
  description: "Track your friend group's game results",
}
```

- [ ] **Step 1: Update the metadata export in `app/layout.tsx`**

Replace the existing `metadata` export with:

```ts
export const metadata: Metadata = {
  title: 'Summer Games',
  description: "Track your friend group's game results",
  themeColor: '#1A4731',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
  icons: {
    apple: '/icons/apple-touch-icon.png',
  },
}
```

No other changes to the file.

- [ ] **Step 2: Verify the meta tags appear in the HTML**

Start the dev server:
```bash
npm run dev
```

Open `http://localhost:3000` and view page source (Ctrl+U). Confirm these four tags are present in `<head>`:

```html
<meta name="theme-color" content="#1A4731"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png"/>
```

Also confirm `<link rel="manifest" href="/manifest.webmanifest"/>` is present — Next.js injects this automatically when `app/manifest.ts` exists.

Stop the dev server.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add PWA meta tags to root layout"
```
