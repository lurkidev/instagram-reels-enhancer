importScripts('defaults.js');

const BADGE_COLOR = '#d62976';

async function getSettings() {
  const { settings } = await chrome.storage.sync.get('settings');
  return { ...IGX_DEFAULTS, ...(settings || {}) };
}

function today() {
  return new Date().toLocaleDateString('en-CA');
}

async function refreshGlobalBadge() {
  const s = await getSettings();
  await chrome.action.setBadgeBackgroundColor({ color: s.enabled ? BADGE_COLOR : '#737373' });
  await chrome.action.setBadgeText({ text: s.enabled ? '' : 'OFF' });
  const es = s.lang === 'es' || (s.lang !== 'en' && (navigator.language || '').toLowerCase().startsWith('es'));
  const offLabel = es ? 'desactivada' : 'off';
  await chrome.action.setTitle({ title: s.enabled ? 'Reels Enhancer' : `Reels Enhancer (${offLabel})` });
  if (!s.enabled || !s.badge) {
    const { tabCounts = {} } = await chrome.storage.session.get('tabCounts');
    await Promise.all(Object.keys(tabCounts).map(id =>
      chrome.action.setBadgeText({ tabId: Number(id), text: '' }).catch(() => {})));
  }
}

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  const { settings } = await chrome.storage.sync.get('settings');
  await chrome.storage.sync.set({ settings: { ...IGX_DEFAULTS, ...(settings || {}) } });
  if (reason === 'install') {
    await chrome.storage.local.set({ stats: { total: 0, today: 0, day: today() } });
  }
  await chrome.action.setBadgeTextColor?.({ color: '#ffffff' });
  await refreshGlobalBadge();
});

chrome.runtime.onStartup.addListener(refreshGlobalBadge);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.settings) refreshGlobalBadge();
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg?.type !== 'ad-blocked') return;
  (async () => {
    const { stats = { total: 0, today: 0, day: today() } } = await chrome.storage.local.get('stats');
    if (stats.day !== today()) {
      stats.day = today();
      stats.today = 0;
    }
    stats.total += 1;
    stats.today += 1;
    await chrome.storage.local.set({ stats });

    const tabId = sender.tab?.id;
    if (tabId === undefined) return;
    const { tabCounts = {} } = await chrome.storage.session.get('tabCounts');
    tabCounts[tabId] = (tabCounts[tabId] || 0) + 1;
    await chrome.storage.session.set({ tabCounts });

    const s = await getSettings();
    if (s.enabled && s.badge) {
      await chrome.action.setBadgeText({ tabId, text: String(Math.min(tabCounts[tabId], 999)) });
    }
  })();
});

chrome.tabs.onUpdated.addListener(async (tabId, info) => {
  if (info.status !== 'loading' || !info.url) return;
  const { tabCounts = {} } = await chrome.storage.session.get('tabCounts');
  if (!(tabId in tabCounts)) return;
  delete tabCounts[tabId];
  await chrome.storage.session.set({ tabCounts });
  chrome.action.setBadgeText({ tabId, text: '' }).catch(() => {});
});

chrome.tabs.onRemoved.addListener(async tabId => {
  const { tabCounts = {} } = await chrome.storage.session.get('tabCounts');
  if (!(tabId in tabCounts)) return;
  delete tabCounts[tabId];
  await chrome.storage.session.set({ tabCounts });
});

chrome.commands.onCommand.addListener(async command => {
  if (command !== 'toggle-enabled') return;
  const s = await getSettings();
  await chrome.storage.sync.set({ settings: { ...s, enabled: !s.enabled } });
});
