
(function () {
  // ===== CONFIGURATION (modifiez ici) =====
  const config = {
    newSiteURL: 'collaborate/collaborate', // <- URL de la nouvelle version
    title: "Nouveau : Carte collaborative",
    message: "L'outil permettant à quiconque d'ajouter un arbre avec son smartphone est enfin disponible ! Rien de plus simple, une photo suffit, le site identifie l'arbre avant de l'ajouter automatiquement à la base de données !",
    primaryLabel: "Accéder à la carte",
    secondaryLabel: "Rester ici",
    showOnceDays: 30,            // nombre de jours avant de ré-afficher si l'utilisateur ferme/ignore
    autoRedirect: false,         // true = redirection automatique après autoRedirectDelay secondes
    autoRedirectDelay: 5,        // délai en secondes pour la redirection automatique (si enabled)
    localStorageKey: 'new_site_popup_shown_v1' // clé locale (incrémentez si changement majeur)
  };
  // =========================================

  // Ne rien faire si URL cible vide
  if (!config.newSiteURL) return;

  // Helper: vérifier param ?force_new=1 pour forcer l'affichage
  function urlParamForce() {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('force_new') === '1';
    } catch (e) {
      return false;
    }
  }

  // Vérifier si déjà montré récemment
  function shouldShow() {
    if (urlParamForce()) return true;
    try {
      const raw = localStorage.getItem(config.localStorageKey);
      if (!raw) return true;
      const obj = JSON.parse(raw);
      if (!obj.time) return true;
      const now = Date.now();
      return now > obj.time; // show if expired
    } catch (e) {
      return true;
    }
  }

  // Enregistrer la "cache" jusqu'à X jours plus tard
  function setHideUntil(days) {
    const until = Date.now() + Math.max(0, days) * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem(config.localStorageKey, JSON.stringify({ time: until }));
    } catch (e) {
      // localStorage peut être bloqué ; on ignore silencieusement
    }
  }

  // Inject CSS + HTML au DOM lors du chargement
  function inject() {
    if (document.getElementById('new-site-popup-overlay')) return; // évite double-injection

    // Styles (autonomes)
    const css = `
#new-site-popup-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10,10,10,0.5);
  z-index: 99999;
  backdrop-filter: blur(2px);
}
#new-site-popup {
  max-width: 520px;
  width: calc(100% - 40px);
  background: #fff;
  color: #111;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  padding: 18px;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
}
#new-site-popup h2 { margin: 0 0 8px; font-size: 20px; line-height: 1.1; }
#new-site-popup p { margin: 0 0 16px; color: #333; }
#new-site-popup .actions { display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap; }
#new-site-popup button { padding: 10px 14px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 14px; }
#new-site-popup button.primary { background: #0b6efd; color: white; }
#new-site-popup button.secondary { background: #f1f3f5; color: #111; }
#new-site-popup .close-btn { position:absolute; right:12px; top:10px; background:transparent; border:none; font-size:18px; cursor:pointer; }
@media (prefers-reduced-motion: no-preference) {
  #new-site-popup { transform: translateY(6px); transition: transform .18s ease, opacity .18s ease; }
  #new-site-popup-overlay[aria-hidden="false"] #new-site-popup { transform: translateY(0); }
}
`;

    const style = document.createElement('style');
    style.setAttribute('data-purpose', 'new-site-popup-styles');
    style.textContent = css;
    document.head.appendChild(style);

    // HTML
    const overlay = document.createElement('div');
    overlay.id = 'new-site-popup-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-hidden', 'false');

    overlay.innerHTML = `
      <div id="new-site-popup" role="document" aria-labelledby="new-site-popup-title" aria-describedby="new-site-popup-desc">
        <button class="close-btn" aria-label="Fermer la fenêtre" title="Fermer">&times;</button>
        <h2 id="new-site-popup-title">${escapeHtml(config.title)}</h2>
        <p id="new-site-popup-desc">${escapeHtml(config.message)}</p>
        <div class="actions">
          <button class="secondary" data-action="stay">${escapeHtml(config.secondaryLabel)}</button>
          <button class="primary" data-action="go">${escapeHtml(config.primaryLabel)}</button>
        </div>
        <div style="height:6px"></div>
        <div style="font-size:12px;color:#666;display:flex;justify-content:space-between;align-items:center;">
          <!--<span>Vous pouvez également ajouter <code>?force_new=1</code> à l'URL pour forcer l'affichage.</span>
          --><span id="auto-redirect-timer" aria-hidden="true" style="opacity:.6"></span>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Focus management
    const dialog = document.getElementById('new-site-popup');
    const focusableSelector = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
    let focusable = Array.from(dialog.querySelectorAll(focusableSelector));
    if (focusable.length === 0) {
      // ensure at least the close button is focusable
      const closeBtn = dialog.querySelector('.close-btn');
      if (closeBtn) closeBtn.tabIndex = 0;
      focusable = [closeBtn];
    }
    const firstFocusable = focusable[0];
    const lastFocusable = focusable[focusable.length - 1];

    // Focus trap
    overlay.addEventListener('keydown', function (ev) {
      if (ev.key === 'Tab') {
        focusable = Array.from(dialog.querySelectorAll(focusableSelector));
        if (focusable.length === 0) return;
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (ev.shiftKey && document.activeElement === first) {
          ev.preventDefault(); last.focus();
        } else if (!ev.shiftKey && document.activeElement === last) {
          ev.preventDefault(); first.focus();
        }
      } else if (ev.key === 'Escape' || ev.key === 'Esc') {
        ev.preventDefault();
        closePopup();
      }
    });

    // Click handlers
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) {
        // click sur le fond -> ferme et cache
        closePopup();
      }
    });

    const btnGo = overlay.querySelector('button[data-action="go"]');
    const btnStay = overlay.querySelector('button[data-action="stay"]');
    const btnClose = overlay.querySelector('.close-btn');

    btnGo.addEventListener('click', function () {
      try { localStorage.setItem(config.localStorageKey, JSON.stringify({ time: Date.now() + 365 * 24 * 60 * 60 * 1000 })); } catch (e) {}
      window.location.href = config.newSiteURL;
    });

    btnStay.addEventListener('click', function () {
      setHideUntil(config.showOnceDays);
      closePopup();
    });

    btnClose.addEventListener('click', function () {
      setHideUntil(config.showOnceDays);
      closePopup();
    });

    // Focus first element
    window.setTimeout(() => {
      try {
        (firstFocusable || dialog.querySelector('button'))?.focus();
      } catch(e){}
    }, 10);

    // Auto redirect logic (optional)
    if (config.autoRedirect) {
      let remaining = Math.max(1, Math.floor(config.autoRedirectDelay));
      const timerEl = document.getElementById('auto-redirect-timer');
      const tick = () => {
        if (!timerEl) return;
        timerEl.textContent = `Redirection automatique dans ${remaining}s…`;
        remaining -= 1;
        if (remaining < 0) {
          try { localStorage.setItem(config.localStorageKey, JSON.stringify({ time: Date.now() + 365 * 24 * 60 * 60 * 1000 })); } catch (e) {}
          window.location.href = config.newSiteURL;
        } else {
          setTimeout(tick, 1000);
        }
      };
      tick();
    } else {
      const timerEl = document.getElementById('auto-redirect-timer');
      if (timerEl) timerEl.style.display = 'none';
    }

    // Close function
    function closePopup() {
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.pointerEvents = 'none';
      // fade/slide out
      overlay.style.opacity = '0';
      try {
        // remove from DOM after transition
        setTimeout(() => {
          if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 220);
      } catch (e) {}
    }

    // HTML escape helper for safety
    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  }

  // Wait for DOM ready (in head, body may not exist yet)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (shouldShow()) inject();
    });
  } else {
    if (shouldShow()) inject();
  }
})();
