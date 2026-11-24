(() => {
  'use strict';

  if (window.__igxReelsEnhancer) return;
  window.__igxReelsEnhancer = true;

  const CFG = Object.freeze({
    seekSmall: 5,
    seekBig: 10,
    holdDelay: 280,
    holdRate: 2,
    speeds: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3],
    volumeStep: 0.05,
    guardMs: 1600,
    scanMs: 700,
    storageKey: 'igx-reels-enhancer:v3',
  });

  const ROUTE = /^\/reels?(?:\/|$)/i;
  const AUDIO_LABEL = /\baudio\b|\bmute|unmute|sonido|silenci/i;
  const NAV_NEXT = /\bnext\b|siguiente|pr[oó]xim|navigate down|abajo/i;
  const NAV_PREV = /\bprev(?:ious)?\b|anterior|navigate up|arriba/i;
  const AD_LABEL = /^(?:ad|ads|anuncio|publicidad|patrocinad[oa]|sponsored|promocionad[oa])$/i;

  const now = () => performance.now();
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const isReels = () => ROUTE.test(location.pathname);

  function fmt(value) {
    if (!Number.isFinite(value) || value < 0) return '0:00';
    const t = Math.floor(value);
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = String(t % 60).padStart(2, '0');
    return h ? `${h}:${String(m).padStart(2, '0')}:${s}` : `${m}:${s}`;
  }

  function labelOf(el) {
    const parts = [el.getAttribute('aria-label'), el.getAttribute('title')];
    el.querySelectorAll('svg[aria-label], svg title').forEach(n => {
      parts.push(n.getAttribute('aria-label') || n.textContent);
    });
    return parts.filter(Boolean).join(' ');
  }

  const area = el => {
    const r = el.getBoundingClientRect();
    return r.width * r.height;
  };

  const SETTINGS_KEY = 'igx-reels-enhancer:settings';
  const DEFAULTS = Object.freeze({
    enabled: true,
    controls: true,
    navArrows: true,
    holdSpeed: true,
    holdRate: 2,
    keyboard: true,
    seekStep: 5,
    smoothWheel: true,
    autoAdvance: false,
    backgroundPlayback: true,
    adBlock: true,
    forceH264: true,
    loadingNotices: true,
    toasts: true,
    rememberAudio: true,
    rememberSpeed: true,
    badge: true,
    lang: 'auto',
  });
  const SET = { ...DEFAULTS };
  let started = false;

  function sanitizeSettings(raw) {
    const out = {};
    if (!raw || typeof raw !== 'object') return out;
    for (const key of Object.keys(DEFAULTS)) {
      if (typeof raw[key] === typeof DEFAULTS[key]) out[key] = raw[key];
    }
    return out;
  }

  try { Object.assign(SET, sanitizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null'))); } catch (_) { }

  function pushSetting(partial) {
    Object.assign(SET, partial);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(SET)); } catch (_) { }
    document.dispatchEvent(new CustomEvent('igx:set', { detail: JSON.stringify(partial) }));
    onSettingsChanged();
  }

  document.addEventListener('igx:settings', e => {
    let next;
    try { next = sanitizeSettings(JSON.parse(e.detail)); } catch (_) { return; }
    Object.assign(SET, next);
    onSettingsChanged();
  });

  const STRINGS = {
    en: {
      volume: 'Volume',
      resetSpeed: 'Back to normal speed',
      navGroup: 'Reel navigation',
      prevReel: 'Previous reel',
      nextReel: 'Next reel',
      prevReelKey: 'Previous reel (↑)',
      nextReelKey: 'Next reel (↓)',
      loadingNext: 'Loading the next one…',
      progress: 'Reel progress',
      shortcuts: 'Keyboard shortcuts',
      space: 'Space',
      hPlay: 'Play / pause',
      hSeek: '−{n} s / +{n} s',
      hNav: 'Previous / next reel',
      hMute: 'Mute / unmute',
      hVol: 'Volume up / down',
      hSpeed: 'Slower / faster',
      hJump: 'Jump to 0–90%',
      hAuto: 'Auto-advance',
      hAds: 'Block ads',
      hH264: 'Force H.264 video (after reload)',
      hWheel: 'Wheel: one reel per scroll',
      hHelp: 'Show / hide this help',
      hHold: 'Press and hold on a reel to watch it at {n}×.',
      soundOn: 'Sound on',
      soundOff: 'Sound off',
      volumeToast: 'Volume {n}%',
      speedNormal: 'Normal speed',
      speedToast: 'Speed {n}×',
      loadingReel: 'Loading reel…',
      slowReel: 'Instagram is taking a while · you can skip ahead',
      adSkipped: 'Ad skipped',
      timeOf: '{a} of {b}',
      mute: 'Mute',
      unmute: 'Unmute',
      autoOn: 'Auto-advance on',
      autoOff: 'Auto-advance off',
      adsOn: 'Ad blocking on',
      adsOff: 'Ad blocking off',
      wheelOn: 'Smart wheel on',
      wheelOff: 'Smart wheel off',
      h264On: 'H.264 on: reload the page',
      h264Off: 'H.264 off: reload the page',
    },
    es: {
      volume: 'Volumen',
      resetSpeed: 'Volver a velocidad normal',
      navGroup: 'Navegación entre Reels',
      prevReel: 'Reel anterior',
      nextReel: 'Siguiente Reel',
      prevReelKey: 'Reel anterior (↑)',
      nextReelKey: 'Siguiente Reel (↓)',
      loadingNext: 'Cargando el siguiente…',
      progress: 'Progreso del reel',
      shortcuts: 'Atajos de teclado',
      space: 'Espacio',
      hPlay: 'Reproducir / pausar',
      hSeek: '−{n} s / +{n} s',
      hNav: 'Reel anterior / siguiente',
      hMute: 'Silenciar / activar sonido',
      hVol: 'Subir / bajar volumen',
      hSpeed: 'Bajar / subir velocidad',
      hJump: 'Saltar al 0–90 %',
      hAuto: 'Avance automático',
      hAds: 'Bloquear anuncios',
      hH264: 'Forzar video H.264 (al recargar)',
      hWheel: 'Rueda: un Reel por gesto',
      hHelp: 'Mostrar / ocultar esta ayuda',
      hHold: 'Mantené presionado el clic sobre el Reel para verlo a {n}×.',
      soundOn: 'Sonido activado',
      soundOff: 'Sonido desactivado',
      volumeToast: 'Volumen {n} %',
      speedNormal: 'Velocidad normal',
      speedToast: 'Velocidad {n}×',
      loadingReel: 'Cargando reel…',
      slowReel: 'Instagram está tardando · podés pasar al siguiente',
      adSkipped: 'Anuncio omitido',
      timeOf: '{a} de {b}',
      mute: 'Silenciar',
      unmute: 'Activar sonido',
      autoOn: 'Avance automático activado',
      autoOff: 'Avance automático desactivado',
      adsOn: 'Bloqueo de anuncios activado',
      adsOff: 'Bloqueo de anuncios desactivado',
      wheelOn: 'Rueda inteligente activada',
      wheelOff: 'Rueda inteligente desactivada',
      h264On: 'H.264 activado: recargá la página',
      h264Off: 'H.264 desactivado: recargá la página',
    },
  };

  function lang() {
    if (SET.lang === 'en' || SET.lang === 'es') return SET.lang;
    return (navigator.language || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
  }

  function tr(key, vars = {}) {
    const text = STRINGS[lang()][key] ?? STRINGS.en[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
  }

  function applyI18n(scope) {
    scope.querySelectorAll('[data-t]').forEach(n => { n.textContent = tr(n.dataset.t); });
    scope.querySelectorAll('[data-t-aria]').forEach(n => n.setAttribute('aria-label', tr(n.dataset.tAria)));
    scope.querySelectorAll('[data-t-title]').forEach(n => { n.title = tr(n.dataset.tTitle); });
  }

  const reportedAds = new WeakSet();
  function reportAd(el) {
    if (!el || reportedAds.has(el)) return;
    reportedAds.add(el);
    document.dispatchEvent(new CustomEvent('igx:stat', { detail: JSON.stringify({ ad: 1 }) }));
  }

  const prefs = { muted: null, volume: 1, rate: 1, hwCodecs: null };

  (function loadPrefs() {
    try {
      const raw = JSON.parse(localStorage.getItem(CFG.storageKey) || 'null');
      if (raw) {
        if (typeof raw.muted === 'boolean') prefs.muted = raw.muted;
        if (Number.isFinite(raw.volume)) prefs.volume = clamp(raw.volume, 0, 1);
        if (CFG.speeds.includes(raw.rate)) prefs.rate = raw.rate;
        if (raw.hwCodecs && typeof raw.hwCodecs === 'object') prefs.hwCodecs = raw.hwCodecs;
        return;
      }
      const oldMuted = localStorage.getItem('igpc_v2_audio_muted');
      const oldVolume = Number(localStorage.getItem('igpc_v2_volume'));
      if (oldMuted !== null) prefs.muted = oldMuted === 'true';
      if (Number.isFinite(oldVolume) && oldVolume >= 0 && oldVolume <= 1) prefs.volume = oldVolume;
    } catch (_) { }
  })();

  function savePrefs() {
    try { localStorage.setItem(CFG.storageKey, JSON.stringify(prefs)); } catch (_) { }
  }

  const CODECS = { av1: /av01/i, vp9: /vp0?9/i, vp8: /vp0?8/i };

  function isBlockedCodec(type) {
    if (!SET.enabled || !SET.forceH264 || typeof type !== 'string') return false;
    const hw = prefs.hwCodecs || {};
    return Object.entries(CODECS).some(([name, re]) => re.test(type) && !hw[name]);
  }

  (function installCodecFilter() {
    try {
      const MS = window.MediaSource;
      if (MS && typeof MS.isTypeSupported === 'function') {
        const original = MS.isTypeSupported.bind(MS);
        MS.isTypeSupported = type => (isBlockedCodec(type) ? false : original(type));
      }

      const proto = HTMLMediaElement.prototype;
      const originalCanPlay = proto.canPlayType;
      proto.canPlayType = function (type) {
        return isBlockedCodec(type) ? '' : originalCanPlay.call(this, type);
      };

      const mc = navigator.mediaCapabilities;
      if (mc && typeof mc.decodingInfo === 'function') {
        const originalInfo = mc.decodingInfo.bind(mc);
        mc.decodingInfo = config => (isBlockedCodec(config?.video?.contentType)
          ? Promise.resolve({ supported: false, smooth: false, powerEfficient: false })
          : originalInfo(config));

        if (!prefs.hwCodecs && SET.forceH264) {
          const probe = contentType => originalInfo({
            type: 'media-source',
            video: { contentType, width: 1080, height: 1920, bitrate: 2500000, framerate: 30 },
          }).then(r => !!(r.supported && r.powerEfficient)).catch(() => false);

          Promise.all([
            probe('video/mp4; codecs="av01.0.08M.08"'),
            probe('video/mp4; codecs="vp09.00.40.08"'),
          ]).then(([av1, vp9]) => {
            prefs.hwCodecs = { av1, vp9, vp8: false };
            savePrefs();
          });
        }
      }
    } catch (_) { }
  })();

  const S = {
    video: null,
    host: null,
    root: null,
    el: {},
    activatedAt: 0,
    lastTime: 0,
    lastP: -1,
    lastB: -1,
    lastBufAt: 0,
    lastSec: -1,
    scrub: null,
    vdrag: null,
    press: null,
    hold: null,
    suppressClickUntil: 0,
    nativeAudioUntil: 0,
    selfClick: false,
    navLockUntil: 0,
    nextLoadingSince: 0,
    list: null,
    item: null,
    scroller: null,
    wheel: { sum: 0, last: 0, fired: false },
    lastScrollAt: 0,
    lastDir: 1,
    toastTimer: 0,
    raf: 0,
    scanTimer: 0,
  };

  // Keep the currently playing Reel alive while the document is backgrounded.
  // This only prevents page-initiated pause() calls for the active Reel that was
  // already playing when the tab became hidden. It does not start new playback.
  const backgroundPlaybackState = {
    hidden: false,
    protectedVideos: new Set(),
    hiddenDescriptor: Object.getOwnPropertyDescriptor(Document.prototype, 'hidden'),
    visibilityDescriptor: Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState'),
    nativePause: HTMLMediaElement.prototype.pause,
    nativePlay: HTMLMediaElement.prototype.play,
  };

  function actualDocumentIsHidden() {
    try {
      if (backgroundPlaybackState.visibilityDescriptor?.get) {
        return backgroundPlaybackState.visibilityDescriptor.get.call(document) === 'hidden';
      }
      if (backgroundPlaybackState.hiddenDescriptor?.get) {
        return !!backgroundPlaybackState.hiddenDescriptor.get.call(document);
      }
    } catch (_) { }
    return false;
  }

  function backgroundPlaybackEnabled() {
    return SET.enabled && SET.backgroundPlayback && isReels();
  }

  function protectCurrentReelPlayback() {
    if (!backgroundPlaybackEnabled()) return;
    let video = S.video?.isConnected ? S.video : null;
    if (!video || video.paused || video.ended) {
      try { video = chooseActive(); } catch (_) { video = null; }
    }
    if (video && video.isConnected && !video.paused && !video.ended && !isAdItem(video)) {
      backgroundPlaybackState.protectedVideos.add(video);
    }
  }

  function releaseBackgroundPlayback({ pause = false, resume = false } = {}) {
    const videos = [...backgroundPlaybackState.protectedVideos];
    backgroundPlaybackState.protectedVideos.clear();

    if (pause) {
      for (const video of videos) {
        try { backgroundPlaybackState.nativePause.call(video); } catch (_) { }
      }
      return;
    }

    if (resume && backgroundPlaybackEnabled()) {
      for (const video of videos) {
        if (!video.isConnected || video.ended || !video.paused) continue;
        try {
          const result = backgroundPlaybackState.nativePlay.call(video);
          result?.catch?.(() => {});
        } catch (_) { }
      }
    }
  }

  function installBackgroundPlaybackGuard() {
    // Run at document_start so Instagram's own visibility handlers see the
    // compatibility values before they decide to pause the Reel.
    try {
      const hiddenDescriptor = backgroundPlaybackState.hiddenDescriptor;
      if (hiddenDescriptor?.configurable && hiddenDescriptor.get) {
        Object.defineProperty(Document.prototype, 'hidden', {
          configurable: true,
          enumerable: hiddenDescriptor.enumerable,
          get() {
            return backgroundPlaybackEnabled() && backgroundPlaybackState.hidden
              ? false
              : hiddenDescriptor.get.call(this);
          },
        });
      }
    } catch (_) { }

    try {
      const visibilityDescriptor = backgroundPlaybackState.visibilityDescriptor;
      if (visibilityDescriptor?.configurable && visibilityDescriptor.get) {
        Object.defineProperty(Document.prototype, 'visibilityState', {
          configurable: true,
          enumerable: visibilityDescriptor.enumerable,
          get() {
            return backgroundPlaybackEnabled() && backgroundPlaybackState.hidden
              ? 'visible'
              : visibilityDescriptor.get.call(this);
          },
        });
      }
    } catch (_) { }

    try {
      const nativePause = backgroundPlaybackState.nativePause;
      HTMLMediaElement.prototype.pause = function (...args) {
        if (this instanceof HTMLVideoElement
          && backgroundPlaybackEnabled()
          && backgroundPlaybackState.hidden
          && backgroundPlaybackState.protectedVideos.has(this)) {
          return;
        }
        return nativePause.apply(this, args);
      };
    } catch (_) { }

    document.addEventListener('visibilitychange', () => {
      backgroundPlaybackState.hidden = actualDocumentIsHidden();
      if (backgroundPlaybackState.hidden) {
        protectCurrentReelPlayback();
      } else {
        releaseBackgroundPlayback({ resume: true });
      }
    }, true);

    backgroundPlaybackState.hidden = actualDocumentIsHidden();
    if (backgroundPlaybackState.hidden) queueMicrotask(protectCurrentReelPlayback);
  }

  function syncBackgroundPlaybackSetting() {
    if (!backgroundPlaybackEnabled()) {
      releaseBackgroundPlayback({ pause: backgroundPlaybackState.hidden });
      return;
    }
    backgroundPlaybackState.hidden = actualDocumentIsHidden();
    if (backgroundPlaybackState.hidden) protectCurrentReelPlayback();
  }

  installBackgroundPlaybackGuard();

  const hooked = new WeakSet();
  const ownWrite = new WeakMap();
  const forcedMuted = new WeakSet();
  const madeRelative = new WeakSet();

  const SPEAKER = '<path d="M3 9.5v5h4l5 4.5v-14L7 9.5z" fill="currentColor"/>';
  const ICON = {
    volOn: `<svg viewBox="0 0 24 24" aria-hidden="true">${SPEAKER}<path d="M15.5 8.8a4.5 4.5 0 0 1 0 6.4M18.3 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    volOff: `<svg viewBox="0 0 24 24" aria-hidden="true">${SPEAKER}<path d="m16 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
    ff: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5v11l8-5.5zM12.5 6.5v11l8-5.5z" fill="currentColor"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 15 12 8.5 18.5 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 9 12 15.5 18.5 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  };

  function injectStyles() {
    if (document.getElementById('igx-style')) return;
    const style = document.createElement('style');
    style.id = 'igx-style';
    style.textContent = `
      .igx-host { --igx-surface: rgba(38, 38, 38, .86); }
      .igx-root {
        position: absolute; inset: 0; z-index: 10; pointer-events: none;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #fff; -webkit-font-smoothing: antialiased;
        user-select: none; -webkit-user-select: none;
      }
      .igx-root *, .igx-root *::before, .igx-root *::after { box-sizing: border-box; }
      .igx-root svg { display: block; width: 100%; height: 100%; }

      .igx-top {
        position: absolute; top: 12px; left: 12px; display: flex; align-items: center; gap: 8px;
        opacity: 0; transform: translateY(-4px); pointer-events: none;
        transition: opacity .2s ease, transform .2s ease;
      }
      .igx-host:hover .igx-top, .igx-host[data-igx-paused] .igx-top,
      .igx-root.igx-busy .igx-top, .igx-top:focus-within {
        opacity: 1; transform: none; pointer-events: auto;
      }
      .igx-vol {
        display: flex; align-items: center; height: 32px; border-radius: 16px;
        background: var(--igx-surface);
      }
      .igx-btn {
        all: unset; display: grid; place-items: center; width: 32px; height: 32px;
        border-radius: 50%; cursor: pointer; color: #fff; flex: none;
      }
      .igx-btn svg { width: 16px; height: 16px; }
      .igx-vslider {
        width: 0; height: 32px; display: flex; align-items: center; overflow: hidden; cursor: pointer;
        touch-action: none; outline: none; transition: width .2s ease, padding .2s ease;
      }
      .igx-vol:hover .igx-vslider, .igx-vol:focus-within .igx-vslider, .igx-root.igx-vdrag .igx-vslider {
        width: 86px; padding: 0 14px 0 4px;
      }
      .igx-vtrack { position: relative; flex: 1; height: 3px; border-radius: 2px; background: rgba(255,255,255,.35); }
      .igx-vfill { position: absolute; inset: 0 auto 0 0; width: calc(var(--v, 1) * 100%); border-radius: inherit; background: #fff; }
      .igx-vthumb {
        position: absolute; top: 50%; left: calc(var(--v, 1) * 100%); width: 12px; height: 12px;
        margin: -6px 0 0 -6px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.3);
      }
      .igx-chip {
        all: unset; display: flex; align-items: center; height: 28px; padding: 0 10px; border-radius: 14px;
        background: var(--igx-surface);
        font-size: 12px; font-weight: 600; cursor: pointer; color: #fff;
      }
      .igx-chip[hidden] { display: none; }
      .igx-btn:focus-visible, .igx-chip:focus-visible, .igx-seek:focus-visible, .igx-vol:has(.igx-vslider:focus-visible) {
        outline: 2px solid rgba(255,255,255,.9); outline-offset: 2px;
      }

      .igx-ad-hidden { display: none !important; }
      .igx-root[data-no-controls] .igx-top, .igx-root[data-no-controls] .igx-seek,
      .igx-root[data-no-controls] .igx-scrublabel, .igx-root[data-no-nav] .igx-nav { display: none !important; }
      .igx-ad-skip { opacity: 0 !important; }
      .igx-native-hidden { visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; }
      .igx-nav {
        position: absolute; top: 50%; right: 12px; display: flex; flex-direction: column; gap: 10px;
        opacity: 0; transform: translate(6px, -50%); pointer-events: none;
        transition: opacity .2s ease, transform .2s ease;
      }
      .igx-host:hover .igx-nav, .igx-nav:focus-within {
        opacity: 1; transform: translate(0, -50%); pointer-events: auto;
      }
      .igx-navbtn {
        all: unset; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%;
        background: var(--igx-surface);
        color: #fff; cursor: pointer; box-shadow: 0 1px 6px rgba(0,0,0,.2);
        transition: background .15s ease, transform .15s ease;
      }
      .igx-navbtn svg { width: 20px; height: 20px; }
      .igx-navbtn:hover { background: rgba(60, 60, 60, .9); }
      .igx-navbtn:active { transform: scale(.92); }
      .igx-navbtn:focus-visible { outline: 2px solid rgba(255,255,255,.9); outline-offset: 2px; }
      .igx-loadnext {
        position: absolute; top: 12px; right: 12px; display: flex; align-items: center; gap: 8px;
        height: 30px; padding: 0 12px 0 9px; border-radius: 15px; background: var(--igx-surface);
        font-size: 12px; font-weight: 600; white-space: nowrap;
        opacity: 0; transform: translateY(-4px); transition: opacity .2s ease, transform .2s ease;
      }
      .igx-root.igx-next-loading .igx-loadnext { opacity: 1; transform: none; }
      .igx-ring {
        width: 14px; height: 14px; border-radius: 50%; flex: none;
        border: 2px solid rgba(255,255,255,.25); border-top-color: #fff;
        animation: igx-spin .8s linear infinite;
      }
      .igx-root:not(.igx-next-loading) .igx-ring { animation: none; }
      .igx-skel-note {
        position: absolute; top: 12px; right: 12px; z-index: 10; display: flex; align-items: center; gap: 8px;
        max-width: calc(100% - 24px); height: 30px; padding: 0 12px 0 9px; border-radius: 15px;
        background: rgba(38, 38, 38, .92); color: #fff; pointer-events: none;
        font: 600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        animation: igx-fade .25s ease both;
      }
      .igx-skel-note, .igx-skel-note * { box-sizing: border-box; }
      .igx-skel-note .igx-skel-text { overflow: hidden; text-overflow: ellipsis; }
      @keyframes igx-fade { from { opacity: 0; transform: translateY(-4px); } }
      @keyframes igx-spin { to { transform: rotate(360deg); } }

      .igx-seek {
        position: absolute; left: 0; right: 0; bottom: 0; height: 18px; outline: none;
        pointer-events: auto; cursor: pointer; touch-action: none; --p: 0; --b: 0;
      }
      .igx-seek::before {
        content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 64px; pointer-events: none;
        background: linear-gradient(transparent, rgba(0,0,0,.35)); opacity: 0; transition: opacity .2s ease;
      }
      .igx-seek:hover::before, .igx-root.igx-scrubbing .igx-seek::before { opacity: 1; }
      .igx-track {
        position: absolute; left: 0; right: 0; bottom: 0; height: 2px;
        background: rgba(255,255,255,.3); opacity: .8; transition: height .15s ease, opacity .2s ease;
      }
      .igx-host:hover .igx-track { opacity: 1; }
      .igx-seek:hover .igx-track, .igx-root.igx-scrubbing .igx-track { height: 4px; }
      .igx-buf { position: absolute; inset: 0 auto 0 0; width: calc(var(--b) * 100%); background: rgba(255,255,255,.25); }
      .igx-fill { position: absolute; inset: 0 auto 0 0; width: calc(var(--p) * 100%); background: #fff; }
      .igx-thumb {
        position: absolute; top: 50%; left: calc(var(--p) * 100%); width: 12px; height: 12px;
        margin: -6px 0 0 -6px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.35);
        transform: scale(0); transition: transform .15s ease;
      }
      .igx-seek:hover .igx-thumb, .igx-root.igx-scrubbing .igx-thumb { transform: scale(1); }
      .igx-tip {
        position: absolute; bottom: 14px; left: 0; transform: translateX(-50%); padding: 4px 8px; border-radius: 6px;
        background: var(--igx-surface); font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums;
        white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity .12s ease;
      }
      .igx-seek:hover .igx-tip { opacity: 1; }
      .igx-root.igx-scrubbing .igx-tip { opacity: 0; }
      .igx-scrublabel {
        position: absolute; left: 50%; bottom: 44px; transform: translateX(-50%); white-space: nowrap;
        font-size: 17px; font-weight: 600; font-variant-numeric: tabular-nums;
        text-shadow: 0 1px 4px rgba(0,0,0,.6); opacity: 0; transition: opacity .15s ease;
      }
      .igx-scrublabel .igx-dim { opacity: .7; }
      .igx-root.igx-scrubbing .igx-scrublabel { opacity: 1; }

      .igx-badge {
        position: absolute; top: 14px; left: 50%; transform: translate(-50%, -6px);
        display: flex; align-items: center; gap: 4px; height: 28px; padding: 0 12px; border-radius: 14px;
        background: rgba(0,0,0,.6);
        font-size: 13px; font-weight: 600; opacity: 0; transition: opacity .15s ease, transform .15s ease;
      }
      .igx-badge svg { width: 14px; height: 14px; }
      .igx-root.igx-holding .igx-badge { opacity: 1; transform: translate(-50%, 0); }

      .igx-toast {
        position: absolute; top: 22%; left: 50%; transform: translate(-50%, 4px); max-width: 80%;
        padding: 10px 16px; border-radius: 8px; background: rgba(38,38,38,.92);
        font-size: 14px; font-weight: 600; line-height: 18px; text-align: center; white-space: nowrap;
        opacity: 0; transition: opacity .15s ease, transform .15s ease;
      }
      .igx-toast.igx-show { opacity: 1; transform: translate(-50%, 0); }

      .igx-help {
        position: absolute; inset: 0; display: grid; place-items: center;
        background: rgba(0,0,0,.55); pointer-events: auto; cursor: default;
      }
      .igx-help[hidden] { display: none; }
      .igx-help-card {
        width: min(310px, 88%); max-height: 88%; overflow: auto; padding: 18px 20px; border-radius: 12px;
        background: rgb(38,38,38); color: #f5f5f5; box-shadow: 0 8px 30px rgba(0,0,0,.4);
      }
      .igx-help h2 { margin: 0 0 12px; font-size: 16px; font-weight: 700; text-align: center; }
      .igx-help dl { display: grid; grid-template-columns: auto 1fr; gap: 8px 14px; margin: 0; font-size: 13px; }
      .igx-help dt { margin: 0; white-space: nowrap; }
      .igx-help dd { margin: 0; color: #a8a8a8; }
      .igx-help kbd {
        font: inherit; font-weight: 600; padding: 1px 6px; border-radius: 4px; background: rgba(255,255,255,.12);
      }
      .igx-help p { margin: 14px 0 0; font-size: 12px; color: #a8a8a8; text-align: center; }

      @media (prefers-reduced-motion: reduce) {
        .igx-root, .igx-root * { transition: none !important; }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function buildRoot() {
    if (S.root) return S.root;
    injectStyles();

    const root = document.createElement('div');
    root.className = 'igx-root';
    root.innerHTML = `
      <div class="igx-top">
        <div class="igx-vol">
          <button class="igx-btn igx-mute" type="button"></button>
          <div class="igx-vslider" role="slider" tabindex="0" data-t-aria="volume" aria-valuemin="0" aria-valuemax="100">
            <div class="igx-vtrack"><div class="igx-vfill"></div><div class="igx-vthumb"></div></div>
          </div>
        </div>
        <button class="igx-chip igx-rate" type="button" data-t-title="resetSpeed" hidden></button>
      </div>
      <div class="igx-nav" role="group" data-t-aria="navGroup">
        <button class="igx-navbtn igx-prev" type="button" data-t-aria="prevReel" data-t-title="prevReelKey">${ICON.up}</button>
        <button class="igx-navbtn igx-next" type="button" data-t-aria="nextReel" data-t-title="nextReelKey">${ICON.down}</button>
      </div>
      <div class="igx-loadnext" role="status"><span class="igx-ring"></span><span data-t="loadingNext"></span></div>
      <div class="igx-badge" aria-hidden="true">2× ${ICON.ff}</div>
      <div class="igx-toast" role="status" aria-live="polite"></div>
      <div class="igx-scrublabel"><span class="igx-cur">0:00</span> <span class="igx-dim">/ <span class="igx-dur">0:00</span></span></div>
      <div class="igx-seek" role="slider" tabindex="0" data-t-aria="progress" aria-valuemin="0">
        <div class="igx-tip">0:00</div>
        <div class="igx-track"><div class="igx-buf"></div><div class="igx-fill"></div><div class="igx-thumb"></div></div>
      </div>
      <div class="igx-help" hidden>
        <div class="igx-help-card" role="dialog" data-t-aria="shortcuts">
          <h2 data-t="shortcuts"></h2>
          <dl>
            <dt><kbd data-t="space"></kbd> <kbd>K</kbd></dt><dd data-t="hPlay"></dd>
            <dt><kbd>←</kbd> <kbd>→</kbd></dt><dd class="igx-h-seek"></dd>
            <dt><kbd>J</kbd> <kbd>L</kbd></dt><dd class="igx-h-seekbig"></dd>
            <dt><kbd>↑</kbd> <kbd>↓</kbd></dt><dd data-t="hNav"></dd>
            <dt><kbd>M</kbd></dt><dd data-t="hMute"></dd>
            <dt><kbd>+</kbd> <kbd>−</kbd></dt><dd data-t="hVol"></dd>
            <dt><kbd>&lt;</kbd> <kbd>&gt;</kbd></dt><dd data-t="hSpeed"></dd>
            <dt><kbd>0</kbd>–<kbd>9</kbd></dt><dd data-t="hJump"></dd>
            <dt><kbd>A</kbd></dt><dd data-t="hAuto"></dd>
            <dt><kbd>B</kbd></dt><dd data-t="hAds"></dd>
            <dt><kbd>H</kbd></dt><dd data-t="hH264"></dd>
            <dt><kbd>W</kbd></dt><dd data-t="hWheel"></dd>
            <dt><kbd>?</kbd></dt><dd data-t="hHelp"></dd>
          </dl>
          <p class="igx-h-hold"></p>
        </div>
      </div>
    `;

    const q = sel => root.querySelector(sel);
    S.el = {
      top: q('.igx-top'),
      mute: q('.igx-mute'),
      vslider: q('.igx-vslider'),
      vol: q('.igx-vol'),
      rate: q('.igx-rate'),
      toast: q('.igx-toast'),
      seek: q('.igx-seek'),
      tip: q('.igx-tip'),
      cur: q('.igx-cur'),
      dur: q('.igx-dur'),
      help: q('.igx-help'),
    };

    for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'click', 'dblclick', 'touchstart', 'touchend', 'contextmenu']) {
      root.addEventListener(type, e => e.stopPropagation());
    }

    S.el.mute.addEventListener('click', () => setMuted(!(S.video?.muted)));
    S.el.rate.addEventListener('click', () => setRate(1, true));
    q('.igx-prev').addEventListener('click', () => navigate(-1));
    q('.igx-next').addEventListener('click', () => navigate(1));
    S.el.help.addEventListener('click', e => {
      if (e.target === S.el.help) toggleHelp(false);
    });

    wireSeek();
    wireVolume();

    S.root = root;
    renderSettings();
    return root;
  }

  function ratioFrom(e, el) {
    const r = el.getBoundingClientRect();
    return clamp((e.clientX - r.left) / Math.max(1, r.width), 0, 1);
  }

  function setTime(video, t) {
    if (!video) return;
    const d = Number.isFinite(video.duration) ? video.duration : Infinity;
    const target = clamp(t, 0, Math.max(0, d - 0.05));
    S.lastTime = target;
    try { video.currentTime = target; } catch (_) { }
  }

  function wireSeek() {
    const { seek, tip } = S.el;

    const scrubMove = e => {
      const v = S.video;
      if (!v || !S.scrub) return;
      const t = ratioFrom(e, seek) * v.duration;
      S.scrub.time = t;
      S.el.cur.textContent = fmt(t);
      S.el.dur.textContent = fmt(v.duration);
      if (!S.scrub.pending) {
        S.scrub.pending = true;
        requestAnimationFrame(() => {
          if (!S.scrub) return;
          S.scrub.pending = false;
          setTime(v, S.scrub.time);
        });
      }
    };

    seek.addEventListener('pointerdown', e => {
      const v = S.video;
      if (e.button !== 0 || !v || !(v.duration > 0)) return;
      e.preventDefault();
      try { seek.setPointerCapture(e.pointerId); } catch (_) { }
      S.scrub = { id: e.pointerId, time: v.currentTime, pending: false };
      S.root.classList.add('igx-scrubbing', 'igx-busy');
      scrubMove(e);
    });

    seek.addEventListener('pointermove', e => {
      const v = S.video;
      if (!v) return;
      if (S.scrub && e.pointerId === S.scrub.id) {
        scrubMove(e);
        return;
      }
      if (v.duration > 0) {
        const w = seek.clientWidth;
        const ratio = ratioFrom(e, seek);
        tip.textContent = fmt(ratio * v.duration);
        tip.style.left = `${clamp(ratio * w, 24, Math.max(24, w - 24))}px`;
      }
    });

    const end = e => endScrub(e);
    seek.addEventListener('pointerup', end);
    seek.addEventListener('pointercancel', end);
    seek.addEventListener('lostpointercapture', end);
  }

  function endScrub(e) {
    if (!S.scrub || (e && e.pointerId !== undefined && e.pointerId !== S.scrub.id)) return;
    const { time } = S.scrub;
    S.scrub = null;
    if (S.video) setTime(S.video, time);
    S.root?.classList.remove('igx-scrubbing', 'igx-busy');
  }

  function wireVolume() {
    const { vslider } = S.el;
    const track = vslider.querySelector('.igx-vtrack');

    const move = e => setVolume(ratioFrom(e, track));

    vslider.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      e.preventDefault();
      try { vslider.setPointerCapture(e.pointerId); } catch (_) { }
      S.vdrag = e.pointerId;
      S.root.classList.add('igx-vdrag', 'igx-busy');
      move(e);
    });
    vslider.addEventListener('pointermove', e => {
      if (S.vdrag === e.pointerId) move(e);
    });
    const end = e => {
      if (S.vdrag !== e.pointerId) return;
      S.vdrag = null;
      S.root.classList.remove('igx-vdrag', 'igx-busy');
    };
    vslider.addEventListener('pointerup', end);
    vslider.addEventListener('pointercancel', end);
    vslider.addEventListener('lostpointercapture', end);
  }

  function writeMuted(video, muted) {
    if (!video || video.muted === muted) return;
    ownWrite.set(video, now() + 400);
    video.muted = muted;
  }

  function writeVolume(video, volume) {
    if (!video || !Number.isFinite(volume)) return;
    const safe = clamp(volume, 0, 1);
    if (Math.abs(video.volume - safe) < 0.005) return;
    ownWrite.set(video, now() + 400);
    video.volume = safe;
  }

  function findNativeAudioButton() {
    if (!S.host) return null;
    const videoArea = S.video ? area(S.video) : Infinity;
    for (const btn of S.host.querySelectorAll('button, [role="button"]')) {
      if (S.root?.contains(btn)) continue;
      if (area(btn) === 0 || area(btn) > videoArea * 0.25) continue;
      if (AUDIO_LABEL.test(labelOf(btn))) return btn;
    }
    return null;
  }

  function setMuted(muted, announce = false) {
    const v = S.video;
    if (!v) return;
    prefs.muted = !!muted;
    savePrefs();

    if (v.muted !== prefs.muted) {
      const native = findNativeAudioButton();
      if (native) {
        S.selfClick = true;
        S.nativeAudioUntil = now() + 800;
        try { native.click(); } finally { S.selfClick = false; }
        setTimeout(() => {
          if (v === S.video && v.muted !== prefs.muted) writeMuted(v, prefs.muted);
          renderVolume();
        }, 150);
      } else {
        writeMuted(v, prefs.muted);
      }
    }
    if (!prefs.muted && prefs.volume === 0) setVolume(0.5);
    renderVolume();
    if (announce) toast(tr(prefs.muted ? 'soundOff' : 'soundOn'));
  }

  function setVolume(volume, announce = false) {
    const v = S.video;
    prefs.volume = Math.round(clamp(volume, 0, 1) * 100) / 100;
    savePrefs();
    if (v) {
      writeVolume(v, prefs.volume);
      if (prefs.volume > 0 && v.muted) setMuted(false);
      else if (prefs.volume === 0 && !v.muted) setMuted(true);
    }
    renderVolume();
    if (announce) toast(tr('volumeToast', { n: Math.round(prefs.volume * 100) }));
  }

  function onVolumeChange(v) {
    if (v !== S.video) return;
    const own = (ownWrite.get(v) || 0) > now();
    if (!own && S.nativeAudioUntil < now()) {
      const inGuard = now() - S.activatedAt < CFG.guardMs;
      if (inGuard) {
        if (prefs.muted !== null && v.muted !== prefs.muted) {
          setTimeout(() => { if (v === S.video) writeMuted(v, prefs.muted); }, 30);
        }
        if (Math.abs(v.volume - prefs.volume) > 0.01) {
          setTimeout(() => { if (v === S.video) writeVolume(v, prefs.volume); }, 30);
        }
      } else {
        if (prefs.muted !== v.muted) prefs.muted = v.muted;
        if (Math.abs(v.volume - prefs.volume) > 0.01 && v.volume > 0) prefs.volume = v.volume;
        savePrefs();
      }
    }
    renderVolume();
  }

  function setRate(rate, announce = false) {
    prefs.rate = rate;
    savePrefs();
    const v = S.video;
    if (v && !S.hold) {
      v.defaultPlaybackRate = rate;
      v.playbackRate = rate;
      keepPitch(v);
    }
    renderRate();
    if (announce) toast(rate === 1 ? tr('speedNormal') : tr('speedToast', { n: rate }));
  }

  function stepRate(dir) {
    const list = CFG.speeds;
    let i = list.indexOf(prefs.rate);
    if (i < 0) i = list.indexOf(1);
    setRate(list[clamp(i + dir, 0, list.length - 1)], true);
  }

  function keepPitch(v) {
    if ('preservesPitch' in v) v.preservesPitch = true;
    if ('webkitPreservesPitch' in v) v.webkitPreservesPitch = true;
  }

  function startHold() {
    S.press = null;
    const v = S.video;
    if (!v || S.hold || v.paused) return;
    S.hold = { video: v };
    v.playbackRate = SET.holdRate;
    keepPitch(v);
    S.root?.classList.add('igx-holding');
  }

  function endHold() {
    if (S.press) {
      clearTimeout(S.press.timer);
      S.press = null;
    }
    if (!S.hold) return;
    const { video } = S.hold;
    S.hold = null;
    if (video?.isConnected) video.playbackRate = prefs.rate;
    S.root?.classList.remove('igx-holding');
  }

  function onPointerDown(e) {
    if (!SET.enabled || !SET.holdSpeed) return;
    if (!S.video || !S.host || e.button !== 0) return;
    const t = e.target instanceof Element ? e.target : null;
    if (!t || !S.host.contains(t) || S.root?.contains(t)) return;
    const clickable = t.closest('a, button, [role="button"], input, textarea, [contenteditable="true"]');
    if (clickable && area(clickable) < area(S.video) * 0.5) return;

    endHold();
    S.press = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      timer: setTimeout(startHold, CFG.holdDelay),
    };
  }

  function onPointerMove(e) {
    if (!S.raf && S.host && e.target instanceof Node && S.host.contains(e.target)) startLoop();
    if (!S.press || e.pointerId !== S.press.id) return;
    if (Math.hypot(e.clientX - S.press.x, e.clientY - S.press.y) > 8) {
      clearTimeout(S.press.timer);
      S.press = null;
    }
  }

  function onPointerUp(e) {
    if (S.press && e.pointerId === S.press.id) {
      clearTimeout(S.press.timer);
      S.press = null;
    }
    if (S.hold) {
      endHold();
      S.suppressClickUntil = now() + 400;
    }
  }

  function findNativeNavButton(video, dir) {
    const vr = video.getBoundingClientRect();
    const cy = (vr.top + vr.bottom) / 2;
    const pattern = dir > 0 ? NAV_NEXT : NAV_PREV;
    for (const btn of document.querySelectorAll('button, [role="button"]')) {
      if (btn.disabled || S.root?.contains(btn)) continue;
      const r = btn.getBoundingClientRect();
      if (r.width < 16 || r.height < 16 || r.width > 120 || r.height > 120) continue;
      const beside = r.left >= vr.right - 4 || r.right <= vr.left + 4;
      const aligned = Math.abs((r.top + r.bottom) / 2 - cy) <= vr.height * 0.5;
      if (beside && aligned && pattern.test(labelOf(btn))) return btn;
    }
    return null;
  }

  let lastNativeNavScan = 0;
  function hideNativeNav(video) {
    if (!SET.navArrows) return;
    if (!video || now() - lastNativeNavScan < 2000) return;
    lastNativeNavScan = now();
    const vr = video.getBoundingClientRect();
    const cy = (vr.top + vr.bottom) / 2;
    for (const btn of document.querySelectorAll('button, [role="button"]')) {
      if (S.root?.contains(btn)) continue;
      const label = labelOf(btn);
      if (!NAV_NEXT.test(label) && !NAV_PREV.test(label)) continue;
      const r = btn.getBoundingClientRect();
      if (r.width < 16 || r.height < 16 || r.width > 120 || r.height > 120) continue;
      const beside = r.left >= vr.right - 4 || r.right <= vr.left + 4;
      const aligned = Math.abs((r.top + r.bottom) / 2 - cy) <= vr.height * 0.5;
      btn.classList.toggle('igx-native-hidden', beside && aligned);
    }
  }

  function showNativeNav() {
    document.querySelectorAll('.igx-native-hidden').forEach(el => el.classList.remove('igx-native-hidden'));
  }

  function findScroller(el) {
    for (let node = el?.parentElement; node && node !== document.body; node = node.parentElement) {
      if (node.scrollHeight - node.clientHeight < 24 || node.clientHeight < 200) continue;
      if (/(auto|scroll|overlay)/.test(getComputedStyle(node).overflowY)) return node;
    }
    return document.scrollingElement || document.documentElement;
  }

  function getReelItem(video) {
    const h = window.innerHeight;
    for (let node = video?.parentElement; node && node !== document.body; node = node.parentElement) {
      const parent = node.parentElement;
      if (!parent || isScroller(node)) break;
      const nh = node.getBoundingClientRect().height;
      if (parent.childElementCount < 2 || nh < h * 0.5 || nh > h * 1.6) continue;
      const tall = Array.from(parent.children).filter(c => c.getBoundingClientRect().height >= h * 0.5).length;
      if (tall >= 2) return node;
    }
    return null;
  }

  const isAdItem = el => el.classList.contains('igx-ad-skip') || el.classList.contains('igx-ad-hidden')
    || !!el.querySelector('.igx-ad-skip, .igx-ad-hidden') || findAdLabels(el).length > 0;

  function neighborItem(dir) {
    let sib = S.item && (dir > 0 ? S.item.nextElementSibling : S.item.previousElementSibling);
    let skippedAd = false;
    while (sib && isAdItem(sib)) {
      skippedAd = true;
      sib = dir > 0 ? sib.nextElementSibling : sib.previousElementSibling;
    }
    return { sib, skippedAd };
  }

  function isSkeleton(el) {
    if (el.querySelector('video, img, svg:not(.igx-own)')) return false;
    const note = el.querySelector('.igx-skel-note');
    const text = el.textContent.replace(note ? note.textContent : '', '').trim();
    return !text;
  }

  function skeletonCard(item) {
    const ih = item.getBoundingClientRect().height;
    let card = item;
    for (const el of item.querySelectorAll('div')) {
      if (el.classList.contains('igx-skel-note')) continue;
      const r = el.getBoundingClientRect();
      if (r.height >= ih * 0.8 && r.width >= 150) card = el;
    }
    return card;
  }

  const skeletonSeen = new WeakMap();

  function markSkeletons() {
    const list = S.list;
    if (!SET.enabled || !SET.loadingNotices || !list?.isConnected || !isReels()) {
      document.querySelectorAll('.igx-skel-note').forEach(n => n.remove());
      return;
    }
    const vh = window.innerHeight;
    for (const item of list.children) {
      const r = item.getBoundingClientRect();
      const visible = r.bottom > 0 && r.top < vh && r.height > 100;
      let note = item.querySelector('.igx-skel-note');
      if (!visible || !isSkeleton(item)) {
        note?.remove();
        skeletonSeen.delete(item);
        continue;
      }
      if (!skeletonSeen.has(item)) skeletonSeen.set(item, now());
      if (!note) {
        const card = skeletonCard(item);
        if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
        note = document.createElement('div');
        note.className = 'igx-skel-note';
        note.setAttribute('role', 'status');
        note.innerHTML = '<span class="igx-ring"></span><span class="igx-skel-text"></span>';
        card.appendChild(note);
      }
      const slow = now() - skeletonSeen.get(item) > 5000;
      const text = tr(slow ? 'slowReel' : 'loadingReel');
      const span = note.querySelector('.igx-skel-text');
      if (span.textContent !== text) span.textContent = text;
    }
  }

  function navigate(dir) {
    if (!S.video || now() < S.navLockUntil) return;
    doNavigate(dir);
  }

  function checkNextLoading() {
    if (!S.root) return;
    let show = false;
    if (SET.enabled && SET.loadingNotices && S.video && isReels()) {
      const { sib } = neighborItem(1);
      if (sib && isSkeleton(sib)) {
        if (!S.nextLoadingSince) S.nextLoadingSince = now();
        show = now() - S.nextLoadingSince > 1200;
      } else {
        S.nextLoadingSince = 0;
      }
    }
    S.root.classList.toggle('igx-next-loading', show);
  }

  function doNavigate(dir) {
    const v = S.video;
    if (!v) return;
    S.navLockUntil = now() + 450;
    S.lastDir = dir;

    const { sib, skippedAd } = neighborItem(dir);
    if (sib && skippedAd) {
      for (let x = dir > 0 ? S.item?.nextElementSibling : S.item?.previousElementSibling; x && x !== sib;
        x = dir > 0 ? x.nextElementSibling : x.previousElementSibling) reportAd(x);
      sib.scrollIntoView({ block: 'start', behavior: 'smooth' });
      return;
    }

    const native = findNativeNavButton(v, dir);
    if (native) {
      native.click();
      return;
    }

    if (sib) {
      sib.scrollIntoView({ block: 'start', behavior: 'smooth' });
      return;
    }

    const videos = Array.from(document.querySelectorAll('video'))
      .filter(x => x.isConnected && x.getBoundingClientRect().height > 120)
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    const target = videos[videos.indexOf(v) + dir];
    if (target) {
      (findHost(target) || target).scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }

    (S.scroller || findScroller(v)).scrollBy({ top: v.getBoundingClientRect().height * dir, behavior: 'smooth' });
  }

  function onWheel(e) {
    if (!SET.enabled || !SET.smoothWheel || !S.video || e.ctrlKey || !isReels()) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    const t = e.target instanceof Element ? e.target : null;
    const scroller = S.scroller;
    if (!t || !scroller || !(scroller === document.scrollingElement || scroller.contains(t))) return;
    const dialog = t.closest('[role="dialog"]');
    if (dialog && !dialog.contains(S.video)) return;
    for (let n = t; n && n !== scroller && n !== document.body; n = n.parentElement) {
      if (n.scrollHeight > n.clientHeight + 4 && /(auto|scroll)/.test(getComputedStyle(n).overflowY)) return;
    }

    e.preventDefault();
    e.stopPropagation();

    const w = S.wheel;
    const ts = now();
    if (ts - w.last > 220) {
      w.sum = 0;
      w.fired = false;
    }
    w.last = ts;
    w.sum += e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
    if (!w.fired && Math.abs(w.sum) > 30) {
      w.fired = true;
      navigate(Math.sign(w.sum));
    }
  }

  function visibilityScore(video) {
    const r = video.getBoundingClientRect();
    if (r.width < 120 || r.height < 160) return 0;
    const cs = getComputedStyle(video);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.04) return 0;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const vw = Math.max(0, Math.min(w, r.right) - Math.max(0, r.left));
    const vh = Math.max(0, Math.min(h, r.bottom) - Math.max(0, r.top));
    const visible = vw * vh;
    const ratio = visible / Math.max(1, r.width * r.height);
    if (ratio < 0.08 || visible < 9000) return 0;

    const dx = ((r.left + r.right) / 2 - w / 2) / Math.max(1, w / 2);
    const dy = ((r.top + r.bottom) / 2 - h / 2) / Math.max(1, h / 2);
    const center = 1 / (1 + Math.hypot(dx, dy) * 1.35);
    return ratio * 0.72 + center * 0.28 + (video.paused ? 0 : 0.08);
  }

  function chooseActive() {
    let best = null;
    let bestScore = 0;
    let currentScore = 0;
    for (const v of document.querySelectorAll('video')) {
      const score = visibilityScore(v);
      if (!score) continue;
      if (v === S.video) currentScore = score;
      if (score > bestScore) {
        best = v;
        bestScore = score;
      }
    }
    if (S.video?.isConnected && currentScore > 0 && best !== S.video && bestScore < currentScore * 1.12) {
      return S.video;
    }
    return best;
  }

  function findHost(video) {
    if (!video) return null;
    const vr = video.getBoundingClientRect();

    let node = video.parentElement;
    for (let d = 0; d < 15 && node; d += 1, node = node.parentElement) {
      if (Array.from(node.children).some(c => c.matches?.('div[data-instancekey]'))) return node;
    }

    node = video.parentElement;
    let best = video.parentElement;
    let bestPenalty = Infinity;
    for (let d = 0; d < 12 && node; d += 1, node = node.parentElement) {
      const r = node.getBoundingClientRect();
      if (r.width < 120 || r.height < 160) continue;
      const wr = Math.max(r.width, vr.width) / Math.max(1, Math.min(r.width, vr.width));
      const hr = Math.max(r.height, vr.height) / Math.max(1, Math.min(r.height, vr.height));
      const tooLarge = r.width > window.innerWidth * 0.96 || r.height > window.innerHeight * 1.25 ? 2 : 0;
      const penalty = Math.abs(Math.log(wr)) + Math.abs(Math.log(hr)) + tooLarge + d * 0.025;
      if (penalty < bestPenalty) {
        bestPenalty = penalty;
        best = node;
      }
      if (wr < 1.12 && hr < 1.12) break;
    }
    return best;
  }

  let lastAdScan = 0;
  let adLabels = [];
  const adAnnounced = new WeakSet();

  function isAdLabel(el) {
    if (el.childElementCount > 0) return false;
    const text = el.textContent.trim();
    if (!text || text.length > 14 || !AD_LABEL.test(text)) return false;
    const link = el.closest('a[href]');
    if (link && /^\/[\w.]+\/?$/.test(link.getAttribute('href') || '')) return false;
    return true;
  }

  function findAdLabels(scope = document) {
    return Array.from(scope.querySelectorAll('span, a, div')).filter(isAdLabel);
  }

  function isScroller(el) {
    return el.scrollHeight - el.clientHeight > 24 && /(auto|scroll|overlay)/.test(getComputedStyle(el).overflowY);
  }

  function findReelItem(label) {
    const h = window.innerHeight;
    let node = label.parentElement;
    while (node && node !== document.body && !node.querySelector('video')) node = node.parentElement;
    if (!node || node === document.body || isScroller(node)) return null;
    if (node.querySelectorAll('video').length !== 1 || node.getBoundingClientRect().height > h * 1.6) return null;

    for (let p = node.parentElement; p && p !== document.body; p = p.parentElement) {
      if (isScroller(p) || p.querySelectorAll('video').length > 1 || p.getBoundingClientRect().height > h * 1.6) break;
      node = p;
    }
    return node;
  }

  function labelBelongsToActive(label) {
    if (!S.video || !label.isConnected) return false;
    const vr = S.video.getBoundingClientRect();
    const lr = label.getBoundingClientRect();
    if (!lr.width || !lr.height) return false;
    const cy = (lr.top + lr.bottom) / 2;
    return cy >= vr.top - 40 && cy <= vr.bottom + 40;
  }

  function silence(video) {
    if (!video) return;
    try { video.pause(); } catch (_) { }
    if (!video.muted) {
      writeMuted(video, true);
      forcedMuted.add(video);
    }
  }

  function scanAds(force = false) {
    if (!SET.enabled || !SET.adBlock) return;
    if (!force && now() - lastAdScan < (isReels() ? 400 : 1000)) return;
    lastAdScan = now();

    document.querySelectorAll('.igx-ad-hidden, .igx-ad-skip').forEach(item => {
      if (!findAdLabels(item).length) item.classList.remove('igx-ad-hidden', 'igx-ad-skip');
    });

    if (isReels()) {
      document.querySelectorAll('article.igx-ad-hidden').forEach(a => a.classList.remove('igx-ad-hidden'));
    }
    adLabels = findAdLabels();
    for (const label of adLabels) {
      if (label.closest('.igx-ad-hidden, .igx-ad-skip')) continue;
      const article = !isReels() && label.closest('article');
      if (article) {
        article.querySelectorAll('video').forEach(silence);
        article.classList.add('igx-ad-hidden');
        reportAd(article);
        continue;
      }
      if (!isReels()) continue;
      const item = findReelItem(label);
      if (item) {
        item.classList.add('igx-ad-skip');
        item.querySelectorAll('video').forEach(silence);
      }
    }
  }

  function isActiveAd() {
    const v = S.video;
    if (!v) return false;
    if (v.closest('.igx-ad-skip, .igx-ad-hidden')) return true;
    if (S.item?.isConnected && isAdItem(S.item)) return true;
    return adLabels.some(labelBelongsToActive);
  }

  function skipActiveAd(tries = 0) {
    if (!SET.enabled || !SET.adBlock || !isReels() || !isActiveAd()) return;
    const v = S.video;
    silence(v);
    if (S.item?.isConnected) S.item.classList.add('igx-ad-skip');
    reportAd(S.item || v);
    if (!adAnnounced.has(v)) {
      adAnnounced.add(v);
      setTimeout(() => toast(tr('adSkipped')), 250);
    }
    navigate(S.lastDir || 1);
    if (tries < 6) setTimeout(() => { if (v === S.video) skipActiveAd(tries + 1); }, 500);
  }

  function showAds() {
    document.querySelectorAll('.igx-ad-hidden, .igx-ad-skip').forEach(item => {
      item.classList.remove('igx-ad-hidden', 'igx-ad-skip');
    });
    adLabels = [];
  }

  function hookVideo(v) {
    if (hooked.has(v)) return;
    hooked.add(v);
    v.addEventListener('play', () => { renderPaused(); queueScan(); });
    v.addEventListener('pause', renderPaused);
    v.addEventListener('timeupdate', () => {
      if (v !== S.video || !S.root || S.raf) return;
      renderProgress(v);
      checkAutoAdvance(v);
    });
    v.addEventListener('volumechange', () => onVolumeChange(v));
    v.addEventListener('loadstart', () => {
      if (v !== S.video) return;
      S.activatedAt = now();
      S.lastTime = 0;
    });
    v.addEventListener('loadedmetadata', () => { if (v === S.video) applyPrefs(v); });
    v.addEventListener('ratechange', () => {
      if (v !== S.video || S.hold) return;
      if (Math.abs(v.playbackRate - prefs.rate) > 0.01 && now() - S.activatedAt < CFG.guardMs) {
        v.playbackRate = prefs.rate;
      }
    });
    v.addEventListener('ended', () => {
      if (v === S.video && SET.autoAdvance) navigate(1);
    });
  }

  function applyPrefs(v) {
    if (!v?.isConnected) return;
    if (SET.rememberAudio && prefs.muted !== null) writeMuted(v, prefs.muted);
    else if (forcedMuted.has(v)) writeMuted(v, false);
    forcedMuted.delete(v);
    if (SET.rememberAudio) writeVolume(v, prefs.volume);
    if (SET.rememberSpeed && !S.hold && Math.abs(v.playbackRate - prefs.rate) > 0.01) {
      v.defaultPlaybackRate = prefs.rate;
      v.playbackRate = prefs.rate;
      keepPitch(v);
    }
  }

  function mount() {
    const v = S.video;
    if (!v) return;
    const host = (S.host?.isConnected && S.host.contains(v)) ? S.host : findHost(v);
    if (!host) return;

    if (host !== S.host) {
      releaseHost();
      S.host = host;
      if (getComputedStyle(host).position === 'static') {
        host.style.setProperty('position', 'relative');
        madeRelative.add(host);
      }
      host.classList.add('igx-host');
    }
    const root = buildRoot();
    if (root.parentElement !== host) host.appendChild(root);
  }

  function releaseHost() {
    const host = S.host;
    if (!host) return;
    host.classList.remove('igx-host');
    host.removeAttribute('data-igx-paused');
    if (madeRelative.has(host)) {
      host.style.removeProperty('position');
      madeRelative.delete(host);
    }
    S.host = null;
  }

  function activate(video) {
    if (video === S.video) {
      if (video) mount();
      return;
    }

    endHold();
    endScrub();
    toggleHelp(false);
    if (S.video?.isConnected && video) {
      S.lastDir = S.video.compareDocumentPosition(video) & Node.DOCUMENT_POSITION_FOLLOWING ? 1 : -1;
    }
    S.nextLoadingSince = 0;
    S.root?.classList.remove('igx-next-loading');
    S.video = video || null;
    S.item = null;
    S.scroller = null;
    S.activatedAt = now();
    S.lastTime = 0;
    S.lastP = -1;
    S.lastB = -1;
    S.lastSec = -1;

    if (!S.video) {
      showNativeNav();
      releaseHost();
      S.root?.remove();
      cancelAnimationFrame(S.raf);
      S.raf = 0;
      return;
    }

    hookVideo(S.video);
    S.item = getReelItem(S.video);
    if (S.item?.parentElement) S.list = S.item.parentElement;
    S.scroller = findScroller(S.video);
    lastNativeNavScan = 0;
    for (const other of document.querySelectorAll('video')) {
      if (other !== S.video && !other.paused && !other.muted) {
        writeMuted(other, true);
        forcedMuted.add(other);
      }
    }
    mount();
    applyPrefs(S.video);
    const v = S.video;
    [250, 700].forEach(ms => setTimeout(() => { if (v === S.video) applyPrefs(v); }, ms));
    renderAll();
    startLoop();
  }

  function scan() {
    if (!SET.enabled) {
      if (S.video) activate(null);
      return;
    }
    scanAds();
    if (!isReels()) {
      if (S.video) activate(null);
      return;
    }
    for (const v of document.querySelectorAll('video')) hookVideo(v);
    activate(chooseActive());
    hideNativeNav(S.video);
    skipActiveAd();
  }

  function queueScan() {
    if (S.scanTimer) return;
    S.scanTimer = setTimeout(function tick() {
      if (now() - S.lastScrollAt < 120) {
        S.scanTimer = setTimeout(tick, 120);
        return;
      }
      const run = () => {
        S.scanTimer = 0;
        scan();
      };
      if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 250 });
      else run();
    }, 100);
  }

  function onScroll() {
    S.lastScrollAt = now();
    queueScan();
  }

  function wantsSmooth() {
    return !!(S.scrub || S.vdrag !== null || S.host?.matches(':hover'));
  }

  function startLoop() {
    if (!S.raf && S.video && S.root) S.raf = requestAnimationFrame(loop);
  }

  function loop() {
    S.raf = 0;
    const v = S.video;
    if (!v || !S.root) return;
    renderProgress(v);
    checkAutoAdvance(v);
    if (wantsSmooth()) S.raf = requestAnimationFrame(loop);
  }

  function renderProgress(v) {
    const { seek } = S.el;
    const d = v.duration;
    const ok = Number.isFinite(d) && d > 0;
    const t = S.scrub ? S.scrub.time : v.currentTime;
    const p = ok ? clamp(t / d, 0, 1) : 0;

    if (Math.abs(p - S.lastP) > 0.0004) {
      seek.style.setProperty('--p', p.toFixed(4));
      S.lastP = p;
    }

    const ts = now();
    if (ok && ts - S.lastBufAt > 500) {
      S.lastBufAt = ts;
      let b = 0;
      const buf = v.buffered;
      for (let i = 0; i < buf.length; i += 1) {
        if (buf.start(i) <= v.currentTime + 0.5 && buf.end(i) >= v.currentTime) b = buf.end(i) / d;
      }
      if (Math.abs(b - S.lastB) > 0.002) {
        seek.style.setProperty('--b', clamp(b, 0, 1).toFixed(4));
        S.lastB = b;
      }
    }

    const sec = Math.floor(t);
    if (sec !== S.lastSec) {
      S.lastSec = sec;
      seek.setAttribute('aria-valuemax', String(Math.round(ok ? d : 0)));
      seek.setAttribute('aria-valuenow', String(sec));
      seek.setAttribute('aria-valuetext', tr('timeOf', { a: fmt(t), b: fmt(ok ? d : 0) }));
    }
  }

  function checkAutoAdvance(v) {
    const t = v.currentTime;
    const d = v.duration;
    if (SET.autoAdvance && !S.scrub && !v.paused && d > 2 && S.lastTime > d - 0.75 && t < 0.75) {
      navigate(1);
    }
    S.lastTime = t;
  }

  function renderVolume() {
    if (!S.root) return;
    const v = S.video;
    const muted = v ? v.muted : prefs.muted !== false;
    const level = muted ? 0 : (v ? v.volume : prefs.volume);
    S.el.mute.innerHTML = muted || level === 0 ? ICON.volOff : ICON.volOn;
    S.el.mute.setAttribute('aria-label', tr(muted ? 'unmute' : 'mute'));
    S.el.mute.title = `${tr(muted ? 'unmute' : 'mute')} (M)`;
    S.el.vol.style.setProperty('--v', level.toFixed(3));
    S.el.vslider.setAttribute('aria-valuenow', String(Math.round(level * 100)));
  }

  function renderRate() {
    if (!S.root) return;
    S.el.rate.hidden = prefs.rate === 1;
    S.el.rate.textContent = `${prefs.rate}×`;
  }

  function renderPaused() {
    if (!S.host || !S.video) return;
    S.host.toggleAttribute('data-igx-paused', S.video.paused);
  }

  function renderAll() {
    if (!S.video || !S.root) return;
    renderProgress(S.video);
    renderVolume();
    renderRate();
    renderPaused();
  }

  function toast(text) {
    if (!S.root || !SET.toasts) return;
    const el = S.el.toast;
    el.textContent = text;
    el.classList.add('igx-show');
    clearTimeout(S.toastTimer);
    S.toastTimer = setTimeout(() => el.classList.remove('igx-show'), 900);
  }

  function renderSettings() {
    if (!S.root) return;
    S.root.toggleAttribute('data-no-controls', !SET.controls);
    S.root.toggleAttribute('data-no-nav', !SET.navArrows);
    S.root.querySelector('.igx-badge').innerHTML = `${SET.holdRate}× ${ICON.ff}`;
    applyI18n(S.root);
    S.root.querySelector('.igx-h-seek').textContent = tr('hSeek', { n: SET.seekStep });
    S.root.querySelector('.igx-h-seekbig').textContent = tr('hSeek', { n: SET.seekStep * 2 });
    S.root.querySelector('.igx-h-hold').textContent = tr('hHold', { n: SET.holdRate });
    document.querySelectorAll('.igx-skel-text').forEach(n => { n.textContent = ''; });
    if (S.video) renderVolume();
  }

  function onSettingsChanged() {
    if (!started) return;
    syncBackgroundPlaybackSetting();
    if (!SET.enabled) {
      activate(null);
      showAds();
      showNativeNav();
      document.querySelectorAll('.igx-skel-note').forEach(n => n.remove());
      return;
    }
    if (SET.adBlock) scanAds(true);
    else showAds();
    if (SET.navArrows) lastNativeNavScan = 0;
    else showNativeNav();
    if (!SET.loadingNotices) {
      document.querySelectorAll('.igx-skel-note').forEach(n => n.remove());
      S.root?.classList.remove('igx-next-loading');
    }
    if (!SET.holdSpeed) endHold();
    if (S.video && SET.rememberSpeed && !S.hold) S.video.playbackRate = prefs.rate;
    renderSettings();
    queueScan();
  }

  function toggleHelp(force) {
    if (!S.root) return;
    const show = force ?? S.el.help.hidden;
    S.el.help.hidden = !show;
  }

  function togglePlay() {
    const v = S.video;
    if (!v) return;
    if (v.paused || v.ended) v.play()?.catch?.(() => {});
    else v.pause();
  }

  function seekBy(seconds) {
    const v = S.video;
    if (!v) return;
    setTime(v, (v.currentTime || 0) + seconds);
    toast(`${seconds > 0 ? '+' : '−'}${Math.abs(seconds)} s`);
  }

  function onClickCapture(e) {
    const t = e.target instanceof Element ? e.target : null;

    if (S.suppressClickUntil > now() && t && S.host?.contains(t)) {
      S.suppressClickUntil = 0;
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }

    if (S.selfClick || !S.video || !t) return;
    const btn = t.closest('button, [role="button"]');
    if (!btn || S.root?.contains(btn) || !AUDIO_LABEL.test(labelOf(btn))) return;
    const v = S.video;
    S.nativeAudioUntil = now() + 800;
    setTimeout(() => {
      if (v !== S.video) return;
      prefs.muted = v.muted;
      savePrefs();
      renderVolume();
    }, 180);
  }

  function onKeyDown(e) {
    if (!SET.enabled || !SET.keyboard) return;
    if (!S.video || !isReels() || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target instanceof Element ? e.target : null;
    const inOurUI = !!(t && S.root?.contains(t));

    if (t && !inOurUI) {
      if (t.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [role="textbox"]')) return;
      const dialog = t.closest('[role="dialog"]');
      if (dialog && !dialog.contains(S.video)) return;
    }

    if (inOurUI && t.classList.contains('igx-vslider') && e.key.startsWith('Arrow')) {
      const dir = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? 1 : -1;
      setVolume((S.video.muted ? 0 : prefs.volume) + dir * CFG.volumeStep);
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }

    const key = e.key;
    let handled = true;

    if (!S.el.help?.hidden && key === 'Escape') toggleHelp(false);
    else if (key === ' ' || key === 'k' || key === 'K') { if (!e.repeat) togglePlay(); }
    else if (key === 'ArrowLeft') seekBy(-SET.seekStep);
    else if (key === 'ArrowRight') seekBy(SET.seekStep);
    else if (key === 'j' || key === 'J') seekBy(-SET.seekStep * 2);
    else if (key === 'l' || key === 'L') seekBy(SET.seekStep * 2);
    else if (key === 'ArrowUp') navigate(-1);
    else if (key === 'ArrowDown') navigate(1);
    else if (key === 'm' || key === 'M') { if (!e.repeat) setMuted(!S.video.muted, true); }
    else if (key === '+' || key === '=') setVolume((S.video.muted ? 0 : prefs.volume) + CFG.volumeStep, true);
    else if (key === '-' || key === '_') setVolume((S.video.muted ? 0 : prefs.volume) - CFG.volumeStep, true);
    else if (key === '<' || key === ',') { if (!e.repeat) stepRate(-1); }
    else if (key === '>' || key === '.') { if (!e.repeat) stepRate(1); }
    else if (/^[0-9]$/.test(key) && S.video.duration > 0) setTime(S.video, S.video.duration * Number(key) / 10);
    else if (key === 'a' || key === 'A') {
      if (!e.repeat) {
        pushSetting({ autoAdvance: !SET.autoAdvance });
        toast(tr(SET.autoAdvance ? 'autoOn' : 'autoOff'));
      }
    }
    else if (key === 'b' || key === 'B') {
      if (!e.repeat) {
        pushSetting({ adBlock: !SET.adBlock });
        toast(tr(SET.adBlock ? 'adsOn' : 'adsOff'));
      }
    }
    else if (key === 'w' || key === 'W') {
      if (!e.repeat) {
        pushSetting({ smoothWheel: !SET.smoothWheel });
        toast(tr(SET.smoothWheel ? 'wheelOn' : 'wheelOff'));
      }
    }
    else if (key === 'h' || key === 'H') {
      if (!e.repeat) {
        pushSetting({ forceH264: !SET.forceH264 });
        toast(tr(SET.forceH264 ? 'h264On' : 'h264Off'));
      }
    }
    else if (key === '?') toggleHelp();
    else handled = false;

    if (handled) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }

  function removeLegacy() {
    ['igpc-dock', 'igpc-launcher', 'igpc-v2-inline-controls', 'igpc-v2-scroll-nav', 'igpc-v2-style']
      .forEach(id => document.getElementById(id)?.remove());
    document.querySelectorAll('.igpc-v2-native-nav-hidden, .igpc-v2-host').forEach(el => {
      el.classList.remove('igpc-v2-native-nav-hidden', 'igpc-v2-host');
    });
  }

  function start() {
    started = true;
    removeLegacy();
    injectStyles();

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('pointermove', onPointerMove, true);
    document.addEventListener('pointerup', onPointerUp, true);
    document.addEventListener('pointercancel', onPointerUp, true);
    document.addEventListener('click', onClickCapture, true);
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('blur', endHold);
    document.addEventListener('visibilitychange', () => { if (document.hidden) endHold(); });

    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('wheel', onWheel, { capture: true, passive: false });
    window.addEventListener('resize', queueScan, { passive: true });
    window.addEventListener('popstate', queueScan);
    new MutationObserver(queueScan).observe(document.body || document.documentElement, { childList: true, subtree: true });
    setInterval(queueScan, CFG.scanMs);
    setInterval(() => { checkNextLoading(); markSkeletons(); }, 300);

    document.dispatchEvent(new CustomEvent('igx:hello'));
    scan();
    console.info('[Reels Enhancer 4.3] Ready. Press ? on a reel to see the shortcuts.');
  }

  document.dispatchEvent(new CustomEvent('igx:hello'));

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
