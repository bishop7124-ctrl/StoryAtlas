# YOW

YOW, short for Your Own World, is a local-first worldbuilding and writing workspace for planning novels.
It includes modules for character management, factions, locations, timeline/history, map building, and manuscript drafting.

## Features

- Multi-novel project manager
- Character database and family tree
- Factions and membership linking
- Locations atlas and map markers/regions
- Timeline and world history entries
- Manuscript editor with acts, chapters, scenes, and autosave
- Theme switching (midnight, aubergine, paper, ocean)

## Tech Stack

- React 19
- Vite 8
- Tailwind CSS
- LocalStorage persistence (no backend required)

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run lint checks:

```bash
npm run lint
```

## Data Storage

Application data is saved in browser localStorage under `nf_*` keys.
Clearing browser storage will remove local project data.
