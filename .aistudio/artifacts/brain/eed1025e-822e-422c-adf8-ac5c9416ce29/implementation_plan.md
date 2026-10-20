# Mobile & Windows PWA Installation Suite (Reer Hassan)

This feature enables seamless installation and offline usage of the Spare Parts Price Quiz & Inventory Suite on Android phones and Windows PCs, allowing technicians and shop owners to run it like a native mobile app without relying on a browser address bar.

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed the target platforms are **Android phone and Windows PC**. The application will be equipped with:
> 1. Full Progressive Web App (PWA) manifest and Service Worker with offline caching.
> 2. A 1-click **"Install App / Ku Shub Taleefanka"** button in the header and an interactive modal guide.
> 3. A dynamic **Mobile QR Code modal** so the user on Windows can scan their screen with their Android phone to instantly open and install the app.
> 4. Clear bilingual (Somali & English) step-by-step instructions for Android Chrome / Samsung Internet and Windows Chrome / Edge.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms the web application into an installable standalone application for Android and Windows. It adds an app icon to the phone home screen and Windows desktop, removes browser address bar clutter, and caches the 480+ spare parts catalog and quiz modes for offline training.
- **Target Audience**: Mobile technicians, repair shop staff, and parts store owners who need quick access to price checks and daily memorization quizzes directly from their phone or PC desktop.
- **Key Value**: Instant one-tap access from the home screen, zero latency loading, offline capability when internet connection drops in the shop, and a fast bridge between PC and mobile via QR code scanning.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Android Installation Flow**:
     - User opens the app on Android Chrome/Edge.
     - A prominent yet non-intrusive banner or top bar button reads **"Install App (Ku Shub Taleefanka)"**.
     - Tapping the button invokes the native Android install prompt (`Add to Home screen`), placing the Reer Hassan icon directly among phone apps.
     - Alternatively, an interactive modal illustrates: Menu (⋮) → **"Install App"** / **"Add to Home screen"**.
  2. **Windows PC Installation Flow**:
     - User visits the app on Chrome or Edge on Windows.
     - The browser displays the native install icon in the address bar, while the app header displays a dedicated **"Ku Shub Windows PC"** button.
     - Tapping it installs the app into Windows Start Menu and Taskbar as a standalone window.
  3. **PC-to-Mobile Transfer Flow (QR Code)**:
     - On Windows, clicking **"Open on Mobile"** opens a high-contrast QR code modal.
     - The user points their Android phone camera at the screen to immediately launch the app on their phone.
  4. **Offline Resilience**:
     - When internet drops, an offline status indicator reassures the user that the full 480+ spare parts catalog and quiz practice remain functional offline.

- **Visual Identity & Theme**:
  - Consistent with the dark OLED slate theme (`#0b0f17`), neon cyan/emerald accents, and crisp JetBrains Mono typography.
  - Modal guides feature clean visual device illustrations (Android phone mock and Windows window frame) with highlighted buttons.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: VitePWA Integration vs Manual Service Worker**
  - *Chosen Approach*: `vite-plugin-pwa` with `registerType: 'autoUpdate'` and standard Web App Manifest.
  - *Why*: Provides automated cache invalidation, compliant Android maskable icons, and reliable `beforeinstallprompt` lifecycle management with zero build fragility.
- **Decision 2: In-App Install Prompt + Visual Fallback Guide**
  - *Chosen Approach*: Dual support: programmatic install via `beforeinstallprompt` event + visual step-by-step guide for browsers that restrict programmatic prompts.
  - *Why*: Chromium allows direct button install, while other browsers or specific mobile security profiles require manual "Add to Home Screen" taps.
- **Decision 3: Standalone Display Mode**
  - *Chosen Approach*: `display: 'standalone'` in Web App Manifest.
  - *Why*: Hides browser URL bar and back/forward navigation, giving an authentic native app feeling on both Android and Windows.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      User Browser Client                    │
│   (Android Chrome / Samsung Browser / Windows Edge/Chrome)  │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│   PWA Lifecycle & Hooks      │ │    PWA Install Modal & UI  │
│  - usePWAInstall hook        │ │ - 1-Click Install Button   │
│  - beforeinstallprompt event │ │ - Android Step Guide       │
│  - useOnlineStatus hook      │ │ - Windows Step Guide       │
└──────────────┬───────────────┘ │ - Mobile QR Code Scanner   │
               │                 └────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────────────┐
│             Service Worker & Workbox Pre-cache              │
│  - App Shell (HTML, JS, CSS)                                │
│  - Static Spare Parts Database Snapshot                     │
│  - Google Fonts & Icon Assets Cache                         │
└─────────────────────────────────────────────────────────────┘
```

### Components to Create & Update:
1. `vite.config.ts`: Add `vite-plugin-pwa` configuration with Web App Manifest (name: "Reer Hassan — Spare Parts", short_name: "Reer Hassan", display: "standalone", theme_color: "#0b0f17").
2. `public/manifest.json` & PWA Icons: Provide 192x192, 512x512, and maskable application icons.
3. `src/hooks/usePWAInstall.ts`: Custom hook detecting `beforeinstallprompt`, standalone display mode, and trigger function.
4. `src/components/InstallModal.tsx`: Visual modal with 1-click install action, Android instructions, Windows instructions, and mobile QR code.
5. `src/components/TopNav.tsx`: Add the **"Ku Shub (Install)"** button directly into the top bar.
6. `index.html`: Update meta tags with `mobile-web-app-capable`, `theme-color`, and manifest links.
