# Mémoire Météo

Visualisation d'événements météorologiques historiques en France au XIXe siècle.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Supabase** (PostgreSQL) — stockage des événements
- **Tailwind CSS** — styles
- **Leaflet / react-leaflet** — carte interactive
- **SVG** — frise chronologique

## Fonctionnalités

- **Liste** — tous les événements avec filtres par type et région
- **Carte** — événements géolocalisés avec filtres interactifs
- **Frise** — timeline SVG 1800–1900 avec tooltip et page de détail

## Variables d'environnement

Créer un fichier `.env.local` à la racine :

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...   # uniquement pour les scripts de collecte
```

## Développement

```bash
npm install
npm run dev
```

## Scripts de collecte

```bash
npm run db:collect   # génère des événements depuis la mémoire du modèle
npm run db:scrape    # extrait des événements depuis Wikipedia via Claude
npm run db:geocode   # géocode les événements via Nominatim (OSM)
```

## Déploiement

Connecter le dépôt GitHub à [Vercel](https://vercel.com) et renseigner les variables d'environnement Supabase dans les settings du projet.
