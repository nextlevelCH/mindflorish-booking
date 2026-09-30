// Einstellungen: Google-Tag der Hauptseite, Meta-Pixel-ID nachtragen, sobald sie vorliegt
var MF_CONFIG = {
  googleTagId: 'GT-TNP972XG',
  metaPixelId: '27538577482485576',
  privacyUrl: 'https://mindflorish.ch/datenschutzerklaerung/'
};

(function () {
  'use strict';

  var LANG = (document.documentElement.lang || 'de').slice(0, 2) === 'en' ? 'en' : 'de';
  var HAS_META = !!MF_CONFIG.metaPixelId;
  // Neue Kategorien verlangen eine neue Zustimmung
  var CONSENT_VERSION = HAS_META ? 2 : 1;
  var CONSENT_KEY = 'mf_consent';
  var PENDING_KEY = 'mf_pending_booking';
  var TRACKED_KEY = 'mf_booking_tracked';

  var TEXT = {
    de: {
      title: 'Cookies und Statistik',
      body: 'Mit deiner Zustimmung nutze ich Google Analytics für Statistik' + (HAS_META ? ' und den Meta Pixel für Werbung' : '') + '. So sehe ich, wie Eltern diese Seite nutzen. Du entscheidest selbst, was du erlaubst.',
      privacy: 'Datenschutzerklärung',
      accept: 'Alle akzeptieren',
      reject: 'Nur notwendige',
      settings: 'Einstellungen',
      save: 'Auswahl speichern',
      necessary: 'Notwendig',
      necessaryDesc: 'Speichert deine Auswahl. Immer aktiv.',
      stats: 'Statistik',
      statsDesc: 'Google Analytics zählt Besuche und Buchungen.',
      marketing: 'Marketing',
      marketingDesc: 'Der Meta Pixel misst, welche Anzeigen zu Buchungen führen.',
      always: 'Immer aktiv'
    },
    en: {
      title: 'Cookies and statistics',
      body: 'With your consent, I use Google Analytics for statistics' + (HAS_META ? ' and the Meta Pixel for advertising' : '') + '. It shows me how parents use this page. You decide what you allow.',
      privacy: 'Privacy policy',
      accept: 'Accept all',
      reject: 'Necessary only',
      settings: 'Settings',
      save: 'Save selection',
      necessary: 'Necessary',
      necessaryDesc: 'Stores your choice. Always active.',
      stats: 'Statistics',
      statsDesc: 'Google Analytics counts visits and bookings.',
      marketing: 'Marketing',
      marketingDesc: 'The Meta Pixel measures which ads lead to bookings.',
      always: 'Always active'
    }
  }[LANG];

  // Speicherzugriff kann in privaten Fenstern scheitern
  function read(store, key) {
    try { return JSON.parse(store.getItem(key)); } catch (e) { return null; }
  }
  function write(store, key, value) {
    try { store.setItem(key, JSON.stringify(value)); } catch (e) {}
  }
  function remove(store, key) {
    try { store.removeItem(key); } catch (e) {}
  }

  /* ---------- Buchung von Calendly erkennen ---------- */

  var params = new URLSearchParams(location.search);
  var bookingId = params.get('invitee_uuid') || '';
  var fromCalendly = !!bookingId || params.get('src') === 'calendly' || /(^|\.)calendly\.com$/.test(referrerHost());

  // Calendly kann Name und E-Mail anhängen: Parameter sofort entfernen, bevor Tracking lädt
  if (location.search) {
    history.replaceState(null, '', location.pathname + location.hash);
  }

  function referrerHost() {
    try { return document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) { return ''; }
  }

  if (fromCalendly) {
    // Neuladen oder Zurück-Navigation zählt nicht als zweite Buchung
    var last = read(localStorage, TRACKED_KEY);
    var sameBooking = last && bookingId && last.id === bookingId;
    var recent = last && !bookingId && Date.now() - last.ts < 30 * 60 * 1000;
    if (!sameBooking && !recent) {
      write(sessionStorage, PENDING_KEY, { id: bookingId, lang: LANG });
    }
  }

  /* ---------- Tracking laden ---------- */

  var gaLoaded = false;
  var metaLoaded = false;
  var consent = null;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function loadScript(src) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }

  function loadGoogle(marketing) {
    if (gaLoaded) {
      gtag('consent', 'update', googleConsent(true, marketing));
      return;
    }
    gaLoaded = true;
    gtag('consent', 'default', googleConsent(true, marketing));
    gtag('js', new Date());
    var ref = referrerHost();
    gtag('config', MF_CONFIG.googleTagId, {
      page_location: location.origin + location.pathname,
      page_referrer: ref ? 'https://' + ref + '/' : undefined
    });
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(MF_CONFIG.googleTagId));
  }

  function googleConsent(stats, marketing) {
    var ad = marketing ? 'granted' : 'denied';
    return {
      analytics_storage: stats ? 'granted' : 'denied',
      ad_storage: ad,
      ad_user_data: ad,
      ad_personalization: ad
    };
  }

  function loadMeta() {
    if (metaLoaded || !HAS_META) return;
    metaLoaded = true;
    // Offizielles Pixel-Snippet, ohne Inline-Script wegen der Sicherheitsregeln
    var n = window.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', MF_CONFIG.metaPixelId);
    window.fbq('track', 'PageView');
  }

  function applyConsent() {
    if (!consent) return;
    if (consent.stats) loadGoogle(consent.marketing);
    if (consent.marketing) loadMeta();
    flushBooking();
  }

  function flushBooking() {
    var pending = read(sessionStorage, PENDING_KEY);
    if (!pending) return;
    if (consent && (consent.stats || consent.marketing)) {
      if (consent.stats) {
        gtag('event', 'booking_confirmed', { booking_language: pending.lang, booking_source: 'calendly' });
      }
      if (consent.marketing && HAS_META) {
        window.fbq('track', 'Schedule', { content_name: 'Erstgespräch', language: pending.lang }, pending.id ? { eventID: pending.id } : undefined);
      }
      write(localStorage, TRACKED_KEY, { id: pending.id, ts: Date.now() });
    }
    remove(sessionStorage, PENDING_KEY);
  }

  function track(gaName, gaParams, metaName) {
    if (consent && consent.stats) gtag('event', gaName, gaParams || {});
    if (consent && consent.marketing && HAS_META && metaName) window.fbq('trackCustom', metaName, gaParams || {});
  }

  /* ---------- Banner ---------- */

  var banner = null;

  function saveConsent(stats, marketing) {
    consent = { v: CONSENT_VERSION, stats: stats, marketing: HAS_META && marketing, ts: Date.now() };
    write(localStorage, CONSENT_KEY, consent);
    closeBanner();
    // Widerruf greift erst nach dem Neuladen vollständig, weil geladene Skripte im Speicher bleiben
    if ((gaLoaded && !consent.stats) || (metaLoaded && !consent.marketing)) {
      if (gaLoaded) gtag('consent', 'update', googleConsent(consent.stats, consent.marketing));
      location.reload();
      return;
    }
    if (!consent.stats && !consent.marketing) remove(sessionStorage, PENDING_KEY);
    applyConsent();
  }

  function toggleRow(id, label, desc, checked, locked) {
    return '<div class="cc-row">' +
      '<div class="cc-row-text"><span class="cc-row-title" id="' + id + '-l">' + label + '</span>' +
      '<span class="cc-row-desc">' + desc + '</span></div>' +
      (locked
        ? '<span class="cc-always">' + TEXT.always + '</span>'
        : '<label class="cc-switch"><input type="checkbox" id="' + id + '" aria-labelledby="' + id + '-l"' + (checked ? ' checked' : '') + '><span aria-hidden="true"></span></label>') +
      '</div>';
  }

  function openBanner(showSettings) {
    if (banner) closeBanner();
    banner = document.createElement('div');
    banner.className = 'cc';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'cc-title');
    banner.setAttribute('aria-describedby', 'cc-body');
    var current = consent || { stats: false, marketing: false };
    banner.innerHTML =
      '<p class="cc-title" id="cc-title">' + TEXT.title + '</p>' +
      '<p class="cc-body" id="cc-body">' + TEXT.body + ' <a href="' + MF_CONFIG.privacyUrl + '" target="_blank" rel="noopener">' + TEXT.privacy + '</a></p>' +
      '<div class="cc-settings"' + (showSettings ? '' : ' hidden') + '>' +
        toggleRow('cc-nec', TEXT.necessary, TEXT.necessaryDesc, true, true) +
        toggleRow('cc-stats', TEXT.stats, TEXT.statsDesc, current.stats, false) +
        (HAS_META ? toggleRow('cc-mkt', TEXT.marketing, TEXT.marketingDesc, current.marketing, false) : '') +
      '</div>' +
      '<div class="cc-actions">' +
        '<button type="button" class="cc-btn cc-primary" data-cc="accept">' + TEXT.accept + '</button>' +
        '<button type="button" class="cc-btn cc-secondary" data-cc="reject">' + TEXT.reject + '</button>' +
        '<button type="button" class="cc-link" data-cc="' + (showSettings ? 'save' : 'settings') + '">' + (showSettings ? TEXT.save : TEXT.settings) + '</button>' +
      '</div>';
    document.body.appendChild(banner);
    banner.addEventListener('click', onBannerClick);
    requestAnimationFrame(function () { banner.classList.add('is-open'); });
    var first = banner.querySelector('.cc-primary');
    if (first && showSettings !== undefined) first.focus({ preventScroll: true });
  }

  function onBannerClick(e) {
    var action = e.target.getAttribute('data-cc');
    if (!action) return;
    if (action === 'accept') saveConsent(true, true);
    if (action === 'reject') saveConsent(false, false);
    if (action === 'settings') {
      banner.querySelector('.cc-settings').hidden = false;
      e.target.setAttribute('data-cc', 'save');
      e.target.textContent = TEXT.save;
    }
    if (action === 'save') {
      var s = banner.querySelector('#cc-stats');
      var m = banner.querySelector('#cc-mkt');
      saveConsent(!!(s && s.checked), !!(m && m.checked));
    }
  }

  function closeBanner() {
    if (!banner) return;
    banner.remove();
    banner = null;
  }

  // Link im Footer öffnet die Einstellungen erneut
  var reopen = document.querySelector('[data-cc-open]');
  if (reopen) reopen.addEventListener('click', function () { openBanner(true); });

  var stored = read(localStorage, CONSENT_KEY);
  if (stored && stored.v === CONSENT_VERSION) {
    consent = stored;
    applyConsent();
  } else {
    openBanner();
  }

  /* ---------- Video ---------- */

  var box = document.getElementById('video');
  if (box) {
    var video = box.querySelector('video');
    var poster = box.querySelector('.poster');
    var title = LANG === 'en' ? 'Dankesvideo EN' : 'Dankesvideo DE';
    var sent = {};
    // Poster erst ausblenden, wenn das Video wirklich läuft
    poster.addEventListener('click', function () {
      video.play().then(function () { video.focus(); }).catch(function () {});
    });
    video.addEventListener('playing', function () {
      box.classList.add('is-playing');
      if (!sent.start) { sent.start = true; track('video_start', { video_title: title }, 'VideoStart'); }
    });
    video.addEventListener('timeupdate', function () {
      if (!sent.half && video.duration && video.currentTime / video.duration >= 0.5) {
        sent.half = true;
        track('video_progress', { video_title: title, video_percent: 50 }, 'VideoHalf');
      }
    });
    video.addEventListener('ended', function () {
      box.classList.remove('is-playing');
      if (!sent.end) { sent.end = true; track('video_complete', { video_title: title }, 'VideoComplete'); }
    });
  }

  /* ---------- Fragebogen ---------- */

  var download = document.querySelector('.btn[download]');
  if (download) {
    download.addEventListener('click', function () {
      track('questionnaire_download', { file_language: LANG }, 'QuestionnaireDownload');
    });
  }
})();
