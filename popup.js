(() => {
  'use strict';

  const IG_URLS = ['https://www.instagram.com/*', 'https://instagram.com/*'];
  const REELS_URLS = ['https://www.instagram.com/reels/*', 'https://instagram.com/reels/*'];

  const STRINGS = {
    en: {
      language: 'Language',
      masterTitle: 'Turn the extension on or off',
      statusOn: 'On for Instagram',
      statusOff: 'Turned off',
      adsSkipped: 'Ads skipped',
      statTab: 'This tab',
      statToday: 'Today',
      statTotal: 'All time',
      gPlayback: 'Playback',
      gNavigation: 'Navigation',
      gAds: 'Ads and performance',
      controls: 'Player controls',
      controlsDesc: 'Seek bar and volume on the reel',
      holdSpeed: 'Hold to speed up',
      holdSpeedDesc: 'Press and hold on the reel',
      holdRate: 'Speed',
      rememberAudio: 'Remember sound and volume',
      rememberAudioDesc: 'Kept when you move to the next reel',
      rememberSpeed: 'Remember speed',
      rememberSpeedDesc: 'The one you pick with < and >',
      autoAdvance: 'Auto-advance',
      autoAdvanceDesc: 'Goes to the next reel when one ends',
      backgroundPlayback: 'Background playback',
      backgroundPlaybackDesc: 'Keep the current reel playing when you switch tabs or minimize the window',
      navArrows: 'Arrows on the reel',
      navArrowsDesc: "Instead of Instagram's side arrows",
      smoothWheel: 'Smart scroll wheel',
      smoothWheelDesc: 'One reel per scroll',
      keyboard: 'Keyboard shortcuts',
      keyboardDesc: 'Space, arrows, M, J, L…',
      seekStep: 'Skip with ← →',
      adBlock: 'Block ads',
      adBlockDesc: 'Skips sponsored reels and posts',
      badge: 'Counter on the icon',
      badgeDesc: 'Ads skipped in the current tab',
      forceH264: 'Hardware video decoding',
      forceH264Desc: 'Uses H.264 · needs a reload',
      loadingNotices: 'Loading notices',
      loadingNoticesDesc: 'Shown on reels that are still grey',
      toasts: 'On-screen messages',
      toastsDesc: '“Ad skipped”, volume, speed…',
      reloadBanner: 'Reload Instagram to apply the video change.',
      reload: 'Reload',
      shortcuts: 'Keyboard shortcuts',
      space: 'Space',
      scPlay: 'Play / pause',
      scSeek: '−{n} s / +{n} s',
      scNav: 'Previous / next reel',
      scMute: 'Mute',
      scVolume: 'Volume',
      scSpeed: 'Speed',
      scJump: 'Jump to 0–90%',
      scToggles: 'Auto-advance, ads, wheel, H.264',
      scFullscreen: 'Enter / exit fullscreen',
      scHelp: 'Help on the reel',
      scGlobal: 'Turn everything on or off',
      scUnset: 'Not set',
      changeShortcut: 'Change global shortcut',
      openReels: 'Open Reels',
      reloadInstagram: 'Reload Instagram',
      reset: 'Reset',
      resetConfirm: 'Sure?',
      resetDone: 'Done',
      version: 'Version {n}',
    },
    es: {
      language: 'Idioma',
      masterTitle: 'Activar o desactivar la extensión',
      statusOn: 'Activa en Instagram',
      statusOff: 'Desactivada',
      adsSkipped: 'Anuncios omitidos',
      statTab: 'En esta pestaña',
      statToday: 'Hoy',
      statTotal: 'En total',
      gPlayback: 'Reproducción',
      gNavigation: 'Navegación',
      gAds: 'Anuncios y rendimiento',
      controls: 'Controles en el Reel',
      controlsDesc: 'Barra de progreso arrastrable y volumen',
      holdSpeed: 'Mantener para acelerar',
      holdSpeedDesc: 'Mantené el clic sobre el Reel',
      holdRate: 'Velocidad',
      rememberAudio: 'Recordar sonido y volumen',
      rememberAudioDesc: 'Se mantienen al pasar de Reel',
      rememberSpeed: 'Recordar velocidad',
      rememberSpeedDesc: 'La elegida con < y >',
      autoAdvance: 'Avance automático',
      autoAdvanceDesc: 'Pasa al siguiente al terminar',
      backgroundPlayback: 'Reproducción en segundo plano',
      backgroundPlaybackDesc: 'Mantiene el Reel actual al cambiar de pestaña o minimizar la ventana',
      navArrows: 'Flechas dentro del Reel',
      navArrowsDesc: 'Reemplazan las de Instagram',
      smoothWheel: 'Rueda inteligente',
      smoothWheelDesc: 'Un Reel por cada gesto',
      keyboard: 'Atajos de teclado',
      keyboardDesc: 'Espacio, flechas, M, J, L…',
      seekStep: 'Salto con ← →',
      adBlock: 'Bloquear anuncios',
      adBlockDesc: 'Salta los Reels y posts patrocinados',
      badge: 'Contador en el ícono',
      badgeDesc: 'Anuncios omitidos en la pestaña',
      forceH264: 'Video acelerado por hardware',
      forceH264Desc: 'Fuerza H.264 · requiere recargar',
      loadingNotices: 'Avisos de carga',
      loadingNoticesDesc: 'Sobre los Reels que siguen en gris',
      toasts: 'Mensajes en pantalla',
      toastsDesc: '“Anuncio omitido”, volumen, velocidad…',
      reloadBanner: 'Recargá Instagram para aplicar el cambio de video.',
      reload: 'Recargar',
      shortcuts: 'Atajos de teclado',
      space: 'Espacio',
      scPlay: 'Reproducir / pausar',
      scSeek: '−{n} s / +{n} s',
      scNav: 'Reel anterior / siguiente',
      scMute: 'Silenciar',
      scVolume: 'Volumen',
      scSpeed: 'Velocidad',
      scJump: 'Saltar al 0–90 %',
      scToggles: 'Avance, anuncios, rueda, H.264',
      scFullscreen: 'Entrar / salir de pantalla completa',
      scHelp: 'Ayuda dentro del Reel',
      scGlobal: 'Activar / desactivar todo',
      scUnset: 'Sin asignar',
      changeShortcut: 'Cambiar atajo global',
      openReels: 'Abrir Reels',
      reloadInstagram: 'Recargar Instagram',
      reset: 'Restablecer',
      resetConfirm: '¿Seguro?',
      resetDone: 'Listo',
      version: 'Versión {n}',
    },
  };

  const GROUPS = [
    {
      title: 'gPlayback',
      rows: [
        { key: 'controls' },
        { key: 'holdSpeed', sub: { key: 'holdRate', options: [1.5, 2, 2.5, 3], format: v => `${v}×` } },
        { key: 'rememberAudio' },
        { key: 'rememberSpeed' },
        { key: 'autoAdvance' },
        { key: 'backgroundPlayback' },
      ],
    },
    {
      title: 'gNavigation',
      rows: [
        { key: 'navArrows' },
        { key: 'smoothWheel' },
        { key: 'keyboard', sub: { key: 'seekStep', options: [3, 5, 10, 15], format: v => `${v} s` } },
      ],
    },
    {
      title: 'gAds',
      rows: [
        { key: 'adBlock' },
        { key: 'badge' },
        { key: 'forceH264' },
        { key: 'loadingNotices' },
        { key: 'toasts' },
      ],
    },
  ];

  const $ = id => document.getElementById(id);
  let settings = { ...IGX_DEFAULTS };
  let shortcut = null;
  const inputs = new Map();
  const segs = new Map();

  function currentLang() {
    if (settings.lang === 'en' || settings.lang === 'es') return settings.lang;
    return (navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
  }

  function tr(key, vars = {}) {
    const text = STRINGS[currentLang()][key] ?? STRINGS.en[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  }

  function el(tag, props = {}, children = []) {
    const node = Object.assign(document.createElement(tag), props);
    for (const child of children) node.append(child);
    return node;
  }

  function makeSwitch(key) {
    const input = el('input', { type: 'checkbox' });
    input.setAttribute('role', 'switch');
    input.dataset.i18nAria = key;
    input.addEventListener('change', () => save({ [key]: input.checked }, key));
    inputs.set(key, input);
    return el('span', { className: 'switch' }, [input, el('span', { className: 'track' }, [el('span', { className: 'thumb' })])]);
  }

  function makeSeg(sub, parentKey) {
    const wrap = el('div', { className: 'seg', role: 'group' });
    wrap.dataset.i18nAria = sub.key;
    for (const value of sub.options) {
      const b = el('button', { type: 'button', textContent: sub.format(value) });
      b.dataset.value = String(value);
      b.addEventListener('click', () => save({ [sub.key]: value }));
      wrap.append(b);
    }
    const label = el('span');
    label.dataset.i18n = sub.key;
    const row = el('div', { className: 'sub' }, [label, wrap]);
    segs.set(sub.key, { row, wrap, parentKey });
    return row;
  }

  function build() {
    const groups = $('groups');
    for (const group of GROUPS) {
      const card = el('div', { className: 'card' });
      for (const r of group.rows) {
        const title = el('div', { className: 'row-title' });
        title.dataset.i18n = r.key;
        const desc = el('div', { className: 'row-desc' });
        desc.dataset.i18n = `${r.key}Desc`;
        card.append(el('label', { className: 'row' }, [el('div', { className: 'row-text' }, [title, desc]), makeSwitch(r.key)]));
        if (r.sub) card.append(makeSeg(r.sub, r.key));
      }
      const h2 = el('h2');
      h2.dataset.i18n = group.title;
      groups.append(el('section', { className: 'group' }, [h2, card]));
    }

    const master = $('enabled');
    inputs.set('enabled', master);
    master.addEventListener('change', () => save({ enabled: master.checked }));

    for (const b of $('lang').querySelectorAll('button')) {
      b.addEventListener('click', () => save({ lang: b.dataset.lang }));
    }
  }

  function translate() {
    document.documentElement.lang = currentLang();
    document.querySelectorAll('[data-i18n]').forEach(n => { n.textContent = tr(n.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach(n => n.setAttribute('aria-label', tr(n.dataset.i18nAria)));
    document.querySelectorAll('[data-i18n-title]').forEach(n => { n.title = tr(n.dataset.i18nTitle); });
    $('sc-seek').textContent = tr('scSeek', { n: settings.seekStep });
    $('sc-seekbig').textContent = tr('scSeek', { n: settings.seekStep * 2 });
    $('version').textContent = tr('version', { n: chrome.runtime.getManifest().version });
    renderShortcut();
  }

  function render() {
    for (const [key, input] of inputs) input.checked = !!settings[key];
    for (const [key, { row, wrap, parentKey }] of segs) {
      row.classList.toggle('inactive', !settings[parentKey]);
      for (const b of wrap.children) b.setAttribute('aria-pressed', String(Number(b.dataset.value) === settings[key]));
    }
    const lang = currentLang();
    for (const b of $('lang').querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    document.body.classList.toggle('disabled', !settings.enabled);
    $('status').classList.toggle('off', !settings.enabled);
    translate();
    $('status').textContent = tr(settings.enabled ? 'statusOn' : 'statusOff');
  }

  function renderShortcut() {
    const dt = $('sc-global-keys');
    if (shortcut === null) return;
    if (!shortcut) {
      dt.textContent = tr('scUnset');
      return;
    }
    dt.replaceChildren(...shortcut.split('+').flatMap((k, i) => {
      const kbd = el('kbd', { textContent: k });
      return i ? [' ', kbd] : [kbd];
    }));
  }

  function save(partial, changedKey) {
    settings = { ...settings, ...partial };
    render();
    chrome.storage.sync.set({ settings });
    if (changedKey === 'forceH264') $('reload-banner').hidden = false;
  }

  async function renderStats() {
    const [{ stats }, { tabCounts = {} }, [tab]] = await Promise.all([
      chrome.storage.local.get('stats'),
      chrome.storage.session.get('tabCounts'),
      chrome.tabs.query({ active: true, currentWindow: true }),
    ]);
    const s = stats || { total: 0, today: 0, day: '' };
    const isToday = s.day === new Date().toLocaleDateString('en-CA');
    const fmt = n => new Intl.NumberFormat(currentLang() === 'es' ? 'es-AR' : 'en-US').format(n);
    $('stat-tab').textContent = fmt((tab && tabCounts[tab.id]) || 0);
    $('stat-today').textContent = fmt(isToday ? s.today : 0);
    $('stat-total').textContent = fmt(s.total);
  }

  async function reloadInstagram() {
    const tabs = await chrome.tabs.query({ url: IG_URLS });
    await Promise.all(tabs.map(t => chrome.tabs.reload(t.id)));
    $('reload-banner').hidden = true;
  }

  async function openReels() {
    const [existing] = await chrome.tabs.query({ url: REELS_URLS });
    if (existing) {
      await chrome.tabs.update(existing.id, { active: true });
      await chrome.windows.update(existing.windowId, { focused: true });
    } else {
      await chrome.tabs.create({ url: 'https://www.instagram.com/reels/' });
    }
    window.close();
  }

  let resetTimer = 0;
  function reset() {
    const btn = $('reset');
    if (!btn.classList.contains('confirm')) {
      btn.classList.add('confirm');
      btn.textContent = tr('resetConfirm');
      resetTimer = setTimeout(() => {
        btn.classList.remove('confirm');
        btn.textContent = tr('reset');
      }, 2500);
      return;
    }
    clearTimeout(resetTimer);
    btn.classList.remove('confirm');
    const needsReload = settings.forceH264 !== IGX_DEFAULTS.forceH264;
    settings = { ...IGX_DEFAULTS, lang: settings.lang };
    render();
    btn.textContent = tr('resetDone');
    setTimeout(() => { btn.textContent = tr('reset'); }, 1200);
    chrome.storage.sync.set({ settings });
    if (needsReload) $('reload-banner').hidden = false;
  }

  document.addEventListener('click', e => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'reload') reloadInstagram();
    else if (action === 'open') openReels();
    else if (action === 'reset') reset();
    else if (action === 'shortcuts') chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });

  async function init() {
    build();
    const { settings: stored } = await chrome.storage.sync.get('settings');
    settings = { ...IGX_DEFAULTS, ...(stored || {}) };
    render();
    document.body.classList.add('ready');
    renderStats();

    chrome.commands.getAll(cmds => {
      const cmd = cmds.find(c => c.name === 'toggle-enabled');
      if (!cmd) return;
      shortcut = cmd.shortcut || '';
      renderShortcut();
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync' && changes.settings) {
        settings = { ...IGX_DEFAULTS, ...(changes.settings.newValue || {}) };
        render();
        renderStats();
      }
      if (area === 'local' && changes.stats) renderStats();
      if (area === 'session' && changes.tabCounts) renderStats();
    });
  }

  init();
})();
