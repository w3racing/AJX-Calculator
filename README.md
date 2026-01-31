# AJX FDP Calculator

Mobile-first Flight Duty Period (FDP) calculator for AJX operations. Built with React, Vite, and Tailwind CSS. Installable as a Progressive Web App (PWA) on your phone.

## Features

- **Report time** – FDP start time (24h) at crew-acclimated location
- **Number of sectors** – 1–10 scheduled flights
- **Crew compliment** – Standard (2-pilot), 3-Crew, or 4-Crew
- **Limits** – Max flight duty period (FDP) and max flight duty time (block) per AJX Operations Manual 8-5

Logic is based on **AJX Operations Manual 8-5 Duty Time and Rest of Crew Member** (REV No.40, EFF 2025.6.5).

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown (e.g. `http://localhost:5173`) in your browser or on your phone (same network).

## Build & PWA install

```bash
npm run build
npm run preview
```

To install on your phone:

1. Open the app URL in Safari (iOS) or Chrome (Android).
2. **iOS**: Share → “Add to Home Screen”.
3. **Android**: Menu → “Install app” or “Add to Home Screen”.

The app works offline after the first load and uses a dark theme by default with a system-based toggle.

## Project layout

- `src/lib/fdpCalculator.ts` – FDP calculation logic (two-pilot table and 3/4-crew limits)
- `src/App.tsx` – UI (report time, sectors, crew, results)
- PWA config in `vite.config.ts` (manifest, service worker)

## Disclaimer

For planning only. Always confirm limits with company scheduling and the current Operations Manual.
# AJX-Calculator
