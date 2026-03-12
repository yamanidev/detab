## About

Archive your open tabs to Markdown and clear your browser in one click.

## Features

- **Tab counter**: see how many tabs you have open, broken down by category
- **Platform grouping** — tabs are automatically organized into: YouTube, Twitter, Facebook, LinkedIn, Reddit, Instagram, Hacker News, Email, Search, AI Chats, Articles, and Other
- **Readable titles** — every link is saved with its actual page title, not a raw URL
- **One-click export** — downloads a `.md` file instantly
- **Optional tab cleanup** — tick a checkbox to close all tabs after exporting

## What You Get

A clean Markdown file with every tab saved as `[Title](URL)`, grouped by platform:

```Markdown
## YouTube

- [Why Rust is taking over systems programming](https://youtube.com/...)

## Reddit

- [Ask HN: How do you manage tab overload?](https://reddit.com/...)

## Articles

- [The Unreasonable Effectiveness of Just Shipping](https://...)
```

The file is named with your browser and a timestamp, e.g. `tabs-chrome-2025-06-01-14-30.md`.

## Installation

### From a Release

1. Download the ZIP for your browser from the [Releases page](https://github.com/yamanidev/detab/releases)
2. Extract the ZIP

### From Source

**Prerequisites:** [Node.js](https://nodejs.org) and [pnpm](https://pnpm.io)

```bash
git clone https://github.com/yamanidev/detab.git
cd detab
pnpm install
pnpm build          # Chromium-based
pnpm build:firefox  # Firefox
```

### Loading the extension

**Chromium-based:**

1. Visit `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load Unpacked** and select the extracted folder (or `dist/chrome/` if built from source)

**Firefox:**

1. Visit `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.json` inside the extracted folder (or `dist/firefox/` if built from source)

## Development

```bash
pnpm watch          # Chrome — rebuilds on file changes
pnpm watch:firefox  # Firefox — rebuilds on file changes
```

## Releasing

Bump the version with pnpm — this automatically syncs `manifest.json` and `manifest.firefox.json`:

```bash
pnpm version patch   # or `minor`/`major`
git push --follow-tags
```

Pushing a version tag triggers the GitHub Actions release workflow, which builds both extensions and publishes a GitHub Release with both ZIPs attached.
