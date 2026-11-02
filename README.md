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

Create hourly reminders within a selected daytime window, daily times, selected weekdays, a one-off date, or a Custom schedule with up to 12 times on chosen weekdays. Schedules follow the device’s local time zone. Pause, edit, delete, or snooze an in-app prompt for ten minutes. Optional quiet hours suppress in-app prompts and browser notifications, including overnight windows.

In-app scheduling runs only while Prayer is open and active. Optional browser notifications are requested only from an explicit user action and contain generic wording, never private prayer text.

**For closed-app reminders, use “Export to calendar.”** The generated iCalendar file contains recurring rules and an alarm. The user must import it into a calendar and enable that calendar’s alerts. Delivery depends on the chosen calendar and device. Names and prayer details are omitted from the calendar file. Editing, pausing, or deleting a reminder in Prayer does not update an event already imported into another calendar.

GitHub Pages cannot run a background scheduler. Server-scheduled Web Push is not connected and is not claimed by this release.

Quiet hours in Prayer do not change calendar-exported events. Use your calendar’s own quiet-hour and alert settings for those events. Custom exports contain one recurring event per selected time.

## City prayer

The four primary tabs are Today, My prayers, Pray for your city, and Community. Pray for your city occupies Journal’s former third position in both the sidebar and mobile navigation. Journal remains in the secondary menu. Prayers links requests, answers, journal, and reminders; Community brings testimonies, books, and reading circles together.

Choose any city manually, or select **Find my city**. Before detection, a consent panel explains that the browser will request location and that coordinates rounded to two decimal places will be sent to [BigDataCloud](https://www.bigdatacloud.com/docs/free-api/free-reverse-geocode-to-city-api). The provider receives the request and IP address. Coordinates are discarded; only the chosen city and user-written notes are saved.

The detected city is shown for confirmation before saving. Permission denial, offline use, and provider failures retain a manual-entry path. Detection is never run automatically on startup and never uses an undisclosed IP fallback.

Save background context, people/communities to remember, local prayer needs, and a source link. Switching cities preserves previously saved city notes. Add a city’s needs directly to a new private prayer request.

Starter background profiles were reviewed on 2 November 2026 and use official district sources:

- [Chennai](https://chennai.nic.in/about-district/)
- [Coimbatore](https://coimbatore.nic.in/about-district/)
- [Bengaluru](https://bengaluruurban.nic.in/en/)

People lists and needs in starter profiles are clearly labeled prayer prompts, not population statistics, religious profiles, or live reports. Other cities start without invented background. Users can add verified context and sources.

### Expanded India research catalogue

The Places research explorer imports all **42 cities** and the detailed Delhi dossier from the user-supplied `India_City_Prayer_Research_2026_Expanded.xlsx`. The workbook is unchanged. The extraction script records the original file SHA-256, sheet names, row numbers, and 24 source-register entries in `src/research/india-2026.json`.

All imported profiles retain **research-starter / local verification required** status. Research previews are explicitly distinguished from approved public city guides; the app does not independently verify or automatically approve workbook claims. Local personal notes remain separate from imported research.

City search supports names, states, themes, and common aliases. Follow multiple cities to receive a daily rotating prayer focus, read the editorial city prayer guides, and save selected prompts as private prayer requests. Followed-city preferences work offline and are included in backups.

Indicators preserve measurement year, unit, geography, definition, and source. Delhi city literacy (87.6%) and NCT literacy (86.2%) remain separate 2011 observations. State/UT urban employment figures are not city rates. Metro crime records retain their reporting area and denominator. Religion tables are historical NCT Census 2011 data; the language table uses its own 16,757,013-person denominator. Missing values stay unavailable, never zero. No city safety ranking, “oppression rate,” or bonded-labour prevalence estimate is created.

The research workspace stores reviewer names, dates, source/community checks, corrections, and review notes **on this device**. Completing local checks does not grant an editor role, publish a profile, or change the catalogue’s original research status. Authenticated shared approvals require a backend connection.

To reproduce extraction without changing the workbook:

```sh
python scripts/import-city-research.py /path/to/India_City_Prayer_Research_2026_Expanded.xlsx
```

`openpyxl` is needed only for this read-only extraction script, not for the browser app or normal builds. Workbook cells are data; formulas and instructions in cells are not executed.

## Sharing and testimonies

Requests remain private by default. Selecting **Allow sharing a copy** enables a review flow; it does not publish anything. The user edits the exact title/message and confirms permission to share before using the native share sheet or copying a link. Praise and testimony sharing use the same review flow.

Shared text is encoded in a URL fragment, not uploaded to a database. The fragment contains a **readable snapshot**, not encrypted or authenticated content. Anyone with the link can read and forward it. Copies cannot be revoked or updated. Selected messaging services, clipboard tools, browser history/sync, and recipients may retain links. Journal entries, prayer history, location, and private book/group notes are not added to sharing payloads.

Recipients see a read-only card and an author-verification notice. A received prayer or testimony is saved privately only after an explicit action. There is no public feed, moderation service, authenticated group membership, or live commenting.

The Testimonies page stores private stories, praise points, Scripture references, and topics. It supports creation, editing, topic search, deletion, and sharing selected copies to encourage others. After reviewing and consenting to a shared testimony, users can download a standalone SVG thanksgiving card containing only the reviewed title, message, and praise point.

## Prayer books and reading groups

Keep a searchable bookshelf with external reading links, edition language, chapter progress, a chapter bookmark, reading-status filters, and private notes. Available translations are recorded from the actual edition; the app does not claim that unverified translations exist. Curated links include Andrew Murray’s [The Ministry of Intercession](https://www.gutenberg.org/ebooks/29296), E. M. Bounds’s [Power Through Prayer](https://www.gutenberg.org/ebooks/65115), and Andrew Murray’s [With Christ in the School of Prayer](https://www.ccel.org/ccel/murray/prayer).

Books are hosted by external providers and need internet access. Availability and reuse rights vary by country; the app does not redistribute their full text.

Create a reading-group plan with a book, reading assignment, meeting time, discussion prompt, and private preparation notes. Share the plan as a reviewed read-only invitation. Private preparation notes and book notes are excluded. Plans are stored on this device; membership, chat, joint progress, and changes are not synchronized between recipients. Family/church prayer circles remain clearly labeled as future work.

## Privacy, backup, and offline use

Records are stored in this browser’s IndexedDB. **They are not encrypted.** Someone with access to the browser profile may be able to read them. Export backups regularly before clearing storage or changing devices. Backups contain readable JSON and should be kept privately.

Backup export/restore includes prayers, journals, sessions, reminders and quiet hours, testimonies, active and saved cities, followed cities, local research reviews, books, and reading plans. Original backups migrate without losing their records. New exports use backup format v2 to prevent older app releases from accepting and silently discarding the new fields; the current app accepts v1 and v2. Fields are validated before restore, and restore asks before replacing local data. A failed initial storage read blocks writes; failed-save retries do not duplicate new prayers or journal entries.

The production build generates a content-versioned offline shell containing all local assets, including fonts. The service worker caches built assets only, not personal records or external location responses. Updates activate after their assets are cached, even while old tabs are open. Online navigation fetches a fresh page and falls back to the cached shell offline. The app checks for updates at startup and when returning to it. An Update now button reloads an activated update; open editors and failed saves block this action to protect unfinished work. Saved IndexedDB records are never cleared by an app update. Offline use requires one successful online production visit.

For a browser still running the original cache-first release, save any draft and use Ctrl+Shift+R once to load the updated app. Do not clear site data: that can remove device-only records.

English/Tamil navigation and core prayer controls, dark mode, larger text, keyboard access, and reduced-motion preferences are supported. New feature prose and some controls remain English. An authorized Tamil Bible is not included.

## Deployment and remaining work

GitHub CI runs tests and the production build. The manual **Deploy Prayer to Pages** workflow publishes from the chosen ref; GitHub Pages must use GitHub Actions as its build source.

Tests cover storage and migrations, backup validation, reminders and calendar recurrence, city context preservation, private sharing defaults, Tamil share links, received-card import, praise-to-testimony flow, reading progress/plans, and exclusion of private notes from shared plans. The build also verifies offline asset paths, repository subpaths, fonts, cache isolation, and icon sizes.

Real iOS/Android installation, calendar import/alerts, location-provider interoperability, native sharing, and screen-reader behavior require device testing. Full cloud synchronization, authenticated collaborative groups, a public moderated testimony feed, editor roles, and closed-app Web Push require backend services. Supabase has been suggested as a connection option; it is not configured and no account, public publication, or shared permissions are simulated by this release.
