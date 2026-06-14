# PWA Implementation Design

**Date:** 2026-06-13  
**Scope:** Add Progressive Web App (PWA) installability to the Summer Games Next.js 14 app — manifest, icons, and iOS/Android meta tags. No service worker, no offline cache, no new runtime dependencies.

---

## Goal

Allow users to install Summer Games to their phone's home screen and have it launch full-screen (no browser chrome), with the correct icon and a green splash screen colour on both Android and iOS.

---

## Files

### `app/manifest.ts`

Next.js 14 App Router supports a `manifest.ts` file that is automatically served at `/manifest.webmanifest`. Export a `MetadataRoute.Manifest` object with:

| Field | Value |
|---|---|
| `name` | `"Summer Games"` |
| `short_name` | `"Summer Games"` |
| `start_url` | `"/"` |
| `display` | `"standalone"` |
| `theme_color` | `"#1A4731"` |
| `background_color` | `"#1A4731"` |
| `icons` | See below |

Icons array entries:
- `{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }`
- `{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }`

---

### `scripts/generate-icons.mjs`

A one-time Node script — run once, then deleted. Uses `sharp` (devDependency) to convert `public/icon.svg` into three PNGs:

| Output file | Size | Purpose |
|---|---|---|
| `public/icons/icon-192.png` | 192×192 | Android manifest icon (standard) |
| `public/icons/icon-512.png` | 512×512 | Android manifest icon (high-res / splash) |
| `public/icons/apple-touch-icon.png` | 180×180 | iOS "Add to Home Screen" icon |

The script reads `public/icon.svg`, calls `sharp(svg).resize(n).png().toFile(dest)` for each size, and creates `public/icons/` if it does not exist.

After running, the script and the `sharp` devDependency are removed.

---

### `public/icons/`

The three generated PNGs are committed to the repo. No one else needs to run the generation script.

---

### `app/layout.tsx`

Four additions alongside the existing `metadata` export. Next.js 14 supports `themeColor`, `appleWebApp`, and `icons` fields on the `Metadata` object, so no raw `<head>` tags are needed:

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

This renders:
- `<meta name="theme-color" content="#1A4731">` — colours Android browser chrome
- `<meta name="apple-mobile-web-app-capable" content="yes">` — enables full-screen on iOS
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` — iOS status bar
- `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">` — iOS home screen icon

---

## Out of scope

- Service worker / offline cache
- Push notifications
- Install prompt (browser handles this natively)
- Third-party runtime packages
