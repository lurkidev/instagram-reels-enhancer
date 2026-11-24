<div align="center">
  <img src="icons/icon128.png" alt="Reels Enhancer icon" width="112" height="112">
  <h1>Reels Enhancer for Instagram</h1>
  <p><strong>Makes watching Instagram Reels on a computer nicer: simple player controls, keyboard shortcuts, and fewer ads.</strong></p>
  <p>
    <img src="https://img.shields.io/badge/BUILD-4.2.0-2ea44f?style=for-the-badge" alt="Build 4.2.0">
    <img src="https://img.shields.io/badge/MANIFEST-V3-blue?style=for-the-badge" alt="Manifest V3">
    <img src="https://img.shields.io/badge/CHROME-111%2B-orange?style=for-the-badge" alt="Chrome 111 or later">
    <a href="LICENSE"><img src="https://img.shields.io/badge/LICENSE-MIT-green?style=for-the-badge" alt="MIT License"></a>
  </p>
</div>

Reels Enhancer is an independent browser extension that improves the Instagram Reels viewing experience on desktop. It adds convenient playback controls, configurable keyboard shortcuts, reel navigation helpers, playback preferences, and automatic skipping of detected sponsored Reels and posts.

> **Unofficial project:** Reels Enhancer is not affiliated with, endorsed by, or sponsored by Instagram or Meta.

## Features

### Playback controls

- On-reel seek bar and volume control.
- Press and hold on a Reel to temporarily speed up playback. Choose **1.5×, 2×, 2.5×, or 3×**.
- Remember mute state and volume when moving between Reels.
- Remember the playback speed you selected.
- Optional auto-advance to the next Reel when the current one ends (disabled by default).

### Navigation

- Previous and next navigation arrows displayed on the Reel.
- Smart mouse-wheel navigation: move one Reel per scroll gesture.
- Configurable keyboard seeking intervals: **3, 5, 10, or 15 seconds**.

### Sponsored-content handling

- Automatically skips detected sponsored Reels and posts when the feature is enabled.
- Optional skipped-ad counter on the extension icon.
- Counts skipped ads for the current tab, today, and all time.

This is an in-page sponsored-content skipping feature, not a network-level tracker blocker or a guarantee that every advertisement will be detected. Instagram changes may affect detection.

### Additional options

- Optional H.264 video codec preference. Changing this setting requires reloading Instagram.
- Loading notices for Reels that remain in a loading state.
- On-screen messages for actions such as changing volume, playback speed, or skipping an ad.
- English and Spanish interface languages, with automatic language selection by default.
- Global shortcut to enable or disable the extension.

## Keyboard shortcuts

Shortcuts work on Instagram Reels when keyboard controls are enabled. The seek interval is configurable in the extension popup.

| Key | Action |
| --- | --- |
| `Space` or `K` | Play / pause |
| `←` / `→` | Seek backward / forward by the selected interval |
| `J` / `L` | Seek backward / forward by twice the selected interval |
| `↑` / `↓` | Previous / next Reel |
| `M` | Mute / unmute |
| `+` / `-` | Increase / decrease volume |
| `<` / `>` | Decrease / increase playback speed |
| `0`–`9` | Jump to 0%–90% of the Reel |
| `A` | Toggle auto-advance |
| `B` | Toggle sponsored-content skipping |
| `W` | Toggle smart mouse-wheel navigation |
| `H` | Toggle the H.264 preference (reload required) |
| `?` | Show the on-Reel keyboard help |
| `Esc` | Close the keyboard help |

The default global shortcut is **Alt + Shift + R**. You can change it from your browser's extension-shortcuts settings.

## Installation

This project can be loaded as an unpacked extension:

1. Download the repository using **Code → Download ZIP**, then extract it to a folder that you will keep.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Select **Load unpacked**.
5. Choose the extracted project folder — the one containing `manifest.json`.
6. Open or reload Instagram Reels.

### Updating

Download the latest source ZIP, extract it, replace the files in the extension folder, return to the browser's extensions page, click the extension's **Reload** button, and reload Instagram.

If you previously used the companion Tampermonkey script for this project, disable that script to avoid overlapping controls or behavior.

## Settings

Open the extension icon in your browser toolbar to configure the available options. Settings are grouped into playback, navigation, and ads/performance. The popup also displays skipped-ad counts and provides shortcuts to open or reload Instagram Reels, reset settings, and change the global keyboard shortcut.

## Permissions and data storage

The supplied Manifest V3 configuration declares:

- `storage` permission for extension settings and counters.
- Host access to `https://www.instagram.com/*` and `https://instagram.com/*` so the extension can operate on Instagram.

In the supplied 4.2.0 source:

- Extension settings are stored with `chrome.storage.sync`.
- Skipped-ad totals are stored with `chrome.storage.local`.
- Per-tab skipped-ad counts use `chrome.storage.session`.
- Playback preferences such as volume and speed are stored in Instagram-origin `localStorage`.

The included source files do not show a third-party analytics service or an external account system. This is a description of the supplied source package, not an independent security certification. Review permissions and source changes whenever you update the extension.

## Compatibility and limitations

- Designed for Instagram's desktop website and Reels pages.
- Requires Chrome 111 or later according to `manifest.json`.
- Instagram may change its page structure or playback behavior; some features may need updates as a result.
- Changing the H.264 preference requires an Instagram page reload.
- Sponsored-content detection is based on page content and may not identify every sponsored item.

## License

This project is licensed under the **MIT License**. You may use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software, subject to the conditions in the [LICENSE](LICENSE) file.

## Feedback and bug reports

When reporting an issue, include:

- Browser name and version.
- The extension version (**4.2.0** for this package).
- The steps needed to reproduce the problem.
- What you expected to happen and what happened instead.

Please remove personal information, session details, and account data from screenshots or logs before sharing them.

---

<div align="center">
  <sub>Built to make watching Reels on desktop more comfortable.</sub>
</div>
