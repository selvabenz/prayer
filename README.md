# Prayer

A quiet place to meet with God. A mobile-first, account-free prayer companion built with React, TypeScript, and Vite.

## Run locally

Requires Node.js 22.12+ (Node 24 recommended).

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

The production build is in `dist/`. Host that folder on any static HTTPS host. The relative asset paths support root domains and repository subpaths such as `/prayer/`. Service workers run in production on HTTPS or localhost; `npm run dev` intentionally does not register one.

## Personal release · v0.1

- Today: a quiet welcome, Scripture, prayer list, and reflection prompts.
- Prayers: create, edit, search, categorize, prioritize, and delete requests; record a prayer rhythm and optional date.
- Prayer journeys: dated updates and ongoing, partially answered, answered, or closed status.
- Pray now: six guided moments, optional 2/5/10/15 minute or untimed sessions, pause/resume, quiet mode, and rotating personal requests.
- Journal: private reflections, optional titles, a heart check-in, editing, deletion, and search. Tamil text is preserved.
- Gratitude garden: revisit prayers you have personally marked answered.
- Scripture library: six curated English KJV passages and personal reflection prompts. Scripture is stored separately from editable notes.
- English/Tamil navigation and core controls, larger text, and dark mode. Guided prose and some secondary controls remain English.
- IndexedDB persistence, JSON backup export and validated restore.
- Installable offline PWA, including local fonts and icons. No remote assets, analytics, advertisements, or account registration.

## Privacy and recovery

All personal records stay in this browser's IndexedDB database. Nothing is uploaded. Records **are not encrypted**: someone with access to the browser profile can potentially read them. This is not a substitute for an encrypted vault.

Use **Settings → Export backup** regularly, especially before clearing browser data or changing devices. Backups are readable JSON and should be stored privately. Restore validates the entire file and asks before replacing the device's existing records. Storage failures are shown visibly and leave the current in-memory data available for export. Concurrent writes are serialized.

The service worker caches only the built application assets, including fonts. It never caches personal records or API responses. Updates wait for existing app tabs to close so an update does not interrupt an unfinished entry. Offline availability requires one successful online production visit.

## Deliberate release boundaries

**Pray together is a clearly labeled preview.** There is no authentication, backend, cloud synchronization, public sharing, invitation delivery, or shared group storage. Private prayers and journals are never shown in this preview.

Daily/weekly rhythms and dates are metadata for personal organization; they do not send notifications. Reliable reminders require a server-side scheduler and Web Push. Voice recording, complete Tamil localization, an authorized Tamil Bible, cloud encryption, and group permissions are future work. Do not describe this release as production ready for sensitive shared church data.

## Structure

```text
src/App.tsx          Screens, editors, prayer session, settings
src/data.ts          Types, IndexedDB storage, backup validation, Scripture
src/style.css        Responsive design, themes, accessibility preferences
src/*.test.*         Storage/recovery and complete component workflows
scripts/build-sw.mjs Content-versioned offline app shell
public/              Manifest and installation icons
```

The data model keeps prayer updates, journal entries, and sessions separate. Future accounts and group permissions should live in explicit, authorized backend models rather than making local records implicitly shared.

## Deployment

The included GitHub Actions workflow runs tests and builds on pushes and pull requests. A separate manual Pages workflow can deploy `dist/` when GitHub Pages is configured to use **GitHub Actions** in the repository settings. No hosting or repository permissions are changed automatically.

## Verification

Tests cover IndexedDB persistence, backup validation and round trips, prayer updates and answered status, journal persistence with Tamil text, separation from the group preview, guided session flow, and language/theme preferences. The production build generates a service worker and validates all referenced offline asset paths.

Native Android/iPhone installation, browser notification permissions, and real device accessibility require device testing before a production launch.
