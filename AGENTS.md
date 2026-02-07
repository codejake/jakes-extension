# Conversation Facts

## User Goal
- Build a Chrome extension with a button that opens a menu of actions.
- First action requested: `Show all linked images on page`.
- Expanded goal: support additional page analysis/extraction actions from the same popup.

## Clarifications Provided by User
- Image scope: both linked image URLs and visible images on the page.
- Result destination: open a new tab/page.
- Export: support JSON and CSV export.
- Deduplication: ignore duplicate URLs.
- Target pages: normal web pages for now.
- Manifest version: MV3 is acceptable.

## What Was Implemented
- A Manifest V3 extension was created in `/Users/jake/Projects/browser-extensions/jakes-extension/extension`.
- Extension name is now `Jake's Extension`.
- Popup menu now includes multiple actions:
  - `Show all linked images on page`
  - `Extract all links`
  - `Find and copy emails / phone numbers`
  - `SEO snapshot`
  - `Table Export`
  - `Readability mode`
  - `Performance hints`
  - `DOM query runner`
  - `Privacy tracker inspector`
- Image action runs on the active tab and scans:
  - `a[href]` image links
  - visible image sources from `img/src`, `img/srcset`, `source/srcset`
  - CSS `background-image` URL values
- URLs are deduplicated.
- Actions run through a shared `run-action` message path in the background service worker.
- Results open in a single reusable extension results page with action-specific rendering.
- Results page supports:
  - action-specific stats cards
  - action-specific list/table/text rendering
  - JSON export for all actions
  - CSV export when action data supports CSV
- Results list supports optional thumbnails via a `Show thumbnails` toggle (enabled by default).
- Thumbnail rendering uses lazy loading and shows `No preview` when an image cannot be loaded.
- Contacts action supports one-click copy for found emails and phone numbers.
- DOM query runner prompts for a CSS selector before execution.
- Current guardrail: action supports `http/https` pages (normal web pages).
- Popup and results page styling now follows browser light/dark mode (`prefers-color-scheme`).
- Icon behavior is currently the browser fallback icon (manifest does not define custom icon assets).

## Extension Files Created
- `/Users/jake/Projects/browser-extensions/jakes-extension/extension/manifest.json`
- `/Users/jake/Projects/browser-extensions/jakes-extension/extension/background.js`
- `/Users/jake/Projects/browser-extensions/jakes-extension/extension/popup.html`
- `/Users/jake/Projects/browser-extensions/jakes-extension/extension/popup.css`
- `/Users/jake/Projects/browser-extensions/jakes-extension/extension/popup.js`
- `/Users/jake/Projects/browser-extensions/jakes-extension/extension/results.html`
- `/Users/jake/Projects/browser-extensions/jakes-extension/extension/results.css`
- `/Users/jake/Projects/browser-extensions/jakes-extension/extension/results.js`
