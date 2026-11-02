# Prayer

A quiet place to meet with God. A mobile-first prayer companion built with React, TypeScript, Vite, and IndexedDB.

**Live app: https://selvabenz.github.io/prayer/**

## Develop and verify

Node.js 24 is recommended (22.12+ supported).

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

Host `dist/` on a static HTTPS host. Relative URLs support repository subpaths such as `/prayer/`. Service workers are enabled only for production builds on HTTPS or localhost.

## Personal prayer

- Record, edit, categorize, prioritize, and search personal prayer requests.
- Track dated updates, ongoing/partially answered/answered/closed status, and an answered-prayer date stamp.
- Save a praise point, share praise independently of the original request, and turn it into a private testimony.
- Pray through six guided moments, timed or untimed, with pause/resume and quiet mode.
- Keep a searchable, editable journal. Tamil text is preserved.
- Revisit answered prayers in the gratitude garden and six curated English KJV passages.

## Reminders

Create hourly reminders within a selected daytime window, daily times, selected weekdays, or a one-off date. Schedules follow the device’s local time zone. Pause, edit, delete, or snooze an in-app prompt for ten minutes.

In-app scheduling runs only while Prayer is open and active. Optional browser notifications are requested only from an explicit user action and contain generic wording, never private prayer text.

**For closed-app reminders, use “Export to calendar.”** The generated iCalendar file contains recurring rules and an alarm. The user must import it into a calendar and enable that calendar’s alerts. Delivery depends on the chosen calendar and device. Names and prayer details are omitted from the calendar file. Editing, pausing, or deleting a reminder in Prayer does not update an event already imported into another calendar.

GitHub Pages cannot run a background scheduler. Server-scheduled Web Push is not connected and is not claimed by this release.

## City prayer

Choose any city manually, or select **Find my city**. Before detection, a consent panel explains that the browser will request location and that coordinates rounded to two decimal places will be sent to [BigDataCloud](https://www.bigdatacloud.com/docs/free-api/free-reverse-geocode-to-city-api). The provider receives the request and IP address. Coordinates are discarded; only the chosen city and user-written notes are saved.

The detected city is shown for confirmation before saving. Permission denial, offline use, and provider failures retain a manual-entry path. Detection is never run automatically on startup and never uses an undisclosed IP fallback.

Save background context, people/communities to remember, local prayer needs, and a source link. Switching cities preserves previously saved city notes. Add a city’s needs directly to a new private prayer request.

Starter background profiles were reviewed on 2 November 2026 and use official district sources:

- [Chennai](https://chennai.nic.in/about-district/)
- [Coimbatore](https://coimbatore.nic.in/about-district/)
- [Bengaluru](https://bengaluruurban.nic.in/en/)

People lists and needs in starter profiles are clearly labeled prayer prompts, not population statistics, religious profiles, or live reports. Other cities start without invented background. Users can add verified context and sources.

## Sharing and testimonies

Requests remain private by default. Selecting **Allow sharing a copy** enables a review flow; it does not publish anything. The user edits the exact title/message and confirms permission to share before using the native share sheet or copying a link. Praise and testimony sharing use the same review flow.

Shared text is encoded in a URL fragment, not uploaded to a database. The fragment contains a **readable snapshot**, not encrypted or authenticated content. Anyone with the link can read and forward it. Copies cannot be revoked or updated. Selected messaging services, clipboard tools, browser history/sync, and recipients may retain links. Journal entries, prayer history, location, and private book/group notes are not added to sharing payloads.

Recipients see a read-only card and an author-verification notice. A received prayer or testimony is saved privately only after an explicit action. There is no public feed, moderation service, authenticated group membership, or live commenting.

The Testimonies page stores private stories and praise points. It supports creation, editing, search, deletion, and sharing selected copies to encourage others.

## Prayer books and reading groups

Keep a bookshelf with external reading links, chapter progress, and private notes. Curated links include Andrew Murray’s [The Ministry of Intercession](https://www.gutenberg.org/ebooks/29296), E. M. Bounds’s [Power Through Prayer](https://www.gutenberg.org/ebooks/65115), and Andrew Murray’s [With Christ in the School of Prayer](https://www.ccel.org/ccel/murray/prayer).

Books are hosted by external providers and need internet access. Availability and reuse rights vary by country; the app does not redistribute their full text.

Create a reading-group plan with a book, reading assignment, meeting time, discussion prompt, and private preparation notes. Share the plan as a reviewed read-only invitation. Private preparation notes and book notes are excluded. Plans are stored on this device; membership, chat, joint progress, and changes are not synchronized between recipients. Family/church prayer circles remain clearly labeled as future work.

## Privacy, backup, and offline use

Records are stored in this browser’s IndexedDB. **They are not encrypted.** Someone with access to the browser profile may be able to read them. Export backups regularly before clearing storage or changing devices. Backups contain readable JSON and should be kept privately.

Backup export/restore includes prayers, journals, sessions, reminders, testimonies, active and saved cities, books, and reading plans. Original v0.1 backups migrate without losing their records. New fields are validated before restore, and restore asks before replacing local data. A failed initial storage read blocks writes; failed-save retries do not duplicate new prayers or journal entries.

The production build generates a content-versioned offline shell containing all local assets, including fonts. The service worker caches built assets only, not personal records or external location responses. A new version waits until old tabs close. If an update remains pending, close all Prayer tabs and reopen. Offline use requires one successful online production visit.

English/Tamil navigation and core prayer controls, dark mode, larger text, keyboard access, and reduced-motion preferences are supported. New feature prose and some controls remain English. An authorized Tamil Bible is not included.

## Deployment and remaining work

GitHub CI runs tests and the production build. The manual **Deploy Prayer to Pages** workflow publishes from the chosen ref; GitHub Pages must use GitHub Actions as its build source.

Tests cover storage and migrations, backup validation, reminders and calendar recurrence, city context preservation, private sharing defaults, Tamil share links, received-card import, praise-to-testimony flow, reading progress/plans, and exclusion of private notes from shared plans. The build also verifies offline asset paths, repository subpaths, fonts, cache isolation, and icon sizes.

Real iOS/Android installation, calendar import/alerts, location-provider interoperability, native sharing, and screen-reader behavior require device testing. Full cloud synchronization, authenticated collaborative groups, a public moderated testimony feed, and closed-app Web Push require backend services.
