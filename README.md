# NiceOutfit

NiceOutfit is a mobile-first Next.js + Tailwind PWA for a personal digital wardrobe and rule-based outfit recommendations. It runs without paid APIs, login, backend, or database. Wardrobe items, generated saves, and backups are stored locally in `localStorage`.

## Features

- Guided add-item flow with photo upload or camera capture.
- Uniform catalog-style item cards with ivory background, padding, rounded corners, subtle shadow, and contain-fit images.
- Images are compressed to approximately 800px and stored in IndexedDB, while wardrobe metadata stays lightweight in localStorage.
- Wardrobe categories for clothing, shoes, bags, scarves, ties, belts, jewelry, and accessories.
- Wardrobe items can be edited, including replacing the stored image.
- Multi-season items, multi-select texture/finish and vibe, chip-based fit/shape and formality, and editable custom style tags.
- Local rule-based recommendation engine with quick presets and custom text parsing.
- Outfit scoring for color, season, material, texture, fit, vibe, formality, style, and completeness.
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

Metadata is stored in the browser under the `niceoutfit:data:v1` localStorage key. Wardrobe images are stored separately in IndexedDB under `niceoutfit-images`. Export a backup from the app before clearing browser storage. Old backups, earlier base64 image records, single-season wardrobe items, and older singular texture/vibe fields are migrated locally when imported or loaded.
