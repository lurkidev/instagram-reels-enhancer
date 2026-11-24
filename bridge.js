(() => {
  'use strict';

  const MIRROR_KEY = 'igx-reels-enhancer:settings';
  let current = { ...IGX_DEFAULTS };
  let loaded = false;

  function deliver() {
    if (!loaded) return;
    try { localStorage.setItem(MIRROR_KEY, JSON.stringify(current)); } catch (_) { }
    document.dispatchEvent(new CustomEvent('igx:settings', { detail: JSON.stringify(current) }));
  }

  function safe(fn) {
    try { return fn(); } catch (_) { return undefined; }
  }

  safe(() => chrome.storage.sync.get('settings', ({ settings }) => {
    current = { ...IGX_DEFAULTS, ...(settings || {}) };
    loaded = true;
    deliver();
  }));

  safe(() => chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !changes.settings) return;
    current = { ...IGX_DEFAULTS, ...(changes.settings.newValue || {}) };
    loaded = true;
    deliver();
  }));

  document.addEventListener('igx:hello', deliver);

  document.addEventListener('igx:set', e => {
    let partial;
    try { partial = JSON.parse(e.detail); } catch (_) { return; }
    current = { ...current, ...partial };
    safe(() => chrome.storage.sync.set({ settings: current }));
  });

  document.addEventListener('igx:stat', () => {
    safe(() => chrome.runtime.sendMessage({ type: 'ad-blocked' }).catch(() => {}));
  });
})();
