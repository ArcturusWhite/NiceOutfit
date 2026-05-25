# NiceOutfit

NiceOutfit is a mobile-first Next.js + Tailwind PWA for a personal digital wardrobe and rule-based outfit recommendations. It runs without paid APIs, login, backend, or database. Wardrobe items, generated saves, and backups are stored locally in `localStorage`.

## Features

- Guided add-item flow with photo upload or camera capture.
- Uniform catalog-style item cards with ivory background, padding, rounded corners, subtle shadow, and contain-fit images.
- Wardrobe categories for clothing, shoes, bags, scarves, ties, belts, jewelry, and accessories.
- Local rule-based recommendation engine with quick presets and custom text parsing.
- Outfit scoring for color, weather, season, formality, style, and completeness.
- Saved outfits with delete and regenerate-similar actions.
- JSON export/import backup and reset with confirmation.
- PWA manifest and service worker for installability.

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
npm run start
```

## Data

All data is stored in the browser under the `niceoutfit:data:v1` localStorage key. Export a backup from the app before clearing browser storage.
