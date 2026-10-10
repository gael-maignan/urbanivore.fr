document.addEventListener('DOMContentLoaded', function () {

  const villes = {
    lyon: {
      nom: "Lyon",
      region: "auvergne-rhône-alpes",
      coord: [45.75, 4.85],
      src: ["Data Grand Lyon", "https://data.grandlyon.com/portail/fr/jeux-de-donnees/arbres-alignement-metropole-lyon/info"]
    },
    paris: {
      nom: "Paris",
      region: "paris",
      coord: [48.8566, 2.3522],
      src: ["Paris Data", "https://opendata.paris.fr/explore/dataset/les-arbres/information/"]
    },
    toulouse: {
      nom: "Toulouse",
      region: "occitanie",
      coord: [43.6045, 1.444],
      src: ["Open Data Toulouse Métropole", "https://data.toulouse-metropole.fr/explore/dataset/arbres-urbains/information/"]
    },
    bordeaux: {
      nom: "Bordeaux",
      region: "nouvelle aquitaine",
      coord: [44.8378, -0.5792],
      src: ["DataHub Bordeaux", "https://datahub.bordeaux-metropole.fr/explore/dataset/ec_arbre_p/information/?disjunctive.insee"]
    },
    grenoble: {
      nom: "Grenoble",
      region: "auvergne-rhône-alpes",
      coord: [45.1885, 5.7245],
      src: ["Data gouv", "https://www.data.gouv.fr/datasets/arbres-grenoble/"]
    },
    strasbourg: {
      nom: "Strasbourg",
      region: "grand-est",
      coord: [48.5734, 7.7521],
      src: ["Open Data Strasbourg", "https://data.strasbourg.eu/explore/dataset/patrimoine_arbore/table/?disjunctive.genre&sort=genre"]
    },
    rennes: {
      nom: "Rennes",
      region: "bretagne",
      coord: [48.1147, -1.6794],
      src: ["Open Data Rennes", "https://data.rennesmetropole.fr/explore/dataset/arbre/information/"]
    }
  };

  // ---------- Ville ----------
  const params = new URLSearchParams(window.location.search);
  let ville = (params.get("ville") || "").toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(villes, ville)) ville = "paris";
  const villeInfo = villes[ville];

  document.getElementById('ville_src').textContent = villeInfo.nom;
  const dataSrc = document.getElementById('data_src');
  dataSrc.textContent = villeInfo.src[0];
  dataSrc.href = villeInfo.src[1];

  const inIframe = window !== window.parent;
  if (inIframe) {
    document.querySelector('header').style.display = 'none';
    document.querySelector('#search-container').style.top = '10px';
    document.querySelector('main').style.height = '100vh';
  }

  // ---------- Utilitaires ----------
  const colorCache = new Map();
  function getColorFromString(str) {
    let c = colorCache.get(str);
    if (c) return c;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    c = `hsl(${Math.abs(hash) % 360}, 65%, 50%)`;
    colorCache.set(str, c);
    return c;
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function debounce(func, wait = 150) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Tirage de recettes sans répétition immédiate (par espèce)
  const recettesRestantes = {};
  const derniereRecette = {};
  function getRecette(espece) {
    const pool = recettes[espece];
    if (!pool || pool.length === 0) return null;
    if (!recettesRestantes[espece] || recettesRestantes[espece].length === 0) {
      const derniere = derniereRecette[espece];
      recettesRestantes[espece] = pool.length > 1 ? pool.filter(r => r !== derniere) : [...pool];
    }
    const i = Math.floor(Math.random() * recettesRestantes[espece].length);
    const r = recettesRestantes[espece].splice(i, 1)[0];
    derniereRecette[espece] = r;
    return r;
  }

  function recetteHTML(recette, espece, layerId) {
    const multi = recettes[espece] && recettes[espece].length > 1;
    return `
      <h3 class="recette-title">${escapeHtml(recette.titre)}</h3>
      ${recette.image ? `<img src="${escapeHtml(recette.image)}" alt="${escapeHtml(recette.titre)}" loading="lazy" decoding="async">` : ""}
      <a class="recette-link" href="${escapeHtml(recette.lien)}" target="_blank" rel="noopener">🍽️ Voir la recette complète</a>
      ${multi ? `<button class="recette-refresh" data-layer="${layerId}" data-espece="${escapeHtml(espece)}">🔄 Une autre recette</button>` : ""}
    `;
  }

  // ---------- Carte ----------
  const map = L.map("map", {
    zoomControl: false,
    preferCanvas: true // rendu canvas : bien plus rapide pour des milliers de points
  }).setView(villeInfo.coord, 13);

  if (window.innerWidth >= 768) {
    L.control.zoom({ position: 'topright' }).addTo(map);
  }

  // Fond de carte OpenStreetMap (gratuit), désaturé en CSS (.osm-light) pour retrouver le style clair "Positron"
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    maxZoom: 19,
    className: "osm-light",
    crossOrigin: true
  }).addTo(map);

  const renderer = L.canvas({ padding: 0.5 });

  const markers = L.markerClusterGroup({
    disableClusteringAtZoom: 15,
    maxClusterRadius: 100,
    spiderfyOnMaxZoom: false,
    showCoverageOnHover: false,
    chunkedLoading: true,          // ajout progressif sans bloquer le navigateur
    removeOutsideVisibleBounds: true
  });
  map.addLayer(markers);

  const interactions = ["dragging", "touchZoom", "doubleClickZoom", "scrollWheelZoom", "boxZoom", "keyboard", "tap"];
  function setInteractions(enabled) {
    interactions.forEach(k => map[k] && map[k][enabled ? "enable" : "disable"]());
  }
  if (inIframe) setInteractions(false);

  // Couches regroupées par espèce (créées une seule fois)
  const layersParEspece = new Map();

  // Popup construit uniquement à l'ouverture
  function buildPopup(layer) {
    const props = layer.feature.properties;
    const espece = props.libellefrancais;
    const recette = getRecette(espece);
    const id = L.stamp(layer);
    let html = `<div class="popup-details">
        <h3>${escapeHtml(espece)}</h3>
        <h4>${escapeHtml(props.genre || "")} ${escapeHtml(props.espece || "")}</h4>
      </div>`;
    if (recette) {
      html += `<div class="recette-popup" id="recette-${id}">${recetteHTML(recette, espece, id)}</div>`;
    }
    return html;
  }

  // Tooltip unique partagé (desktop)
  const showTooltip = window.innerWidth >= 768;

  fetch("https://urbanivore.fr/data/" + ville + ".geojson")
    .then(r => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(data => {
      const counts = {};

      L.geoJSON(data, {
        filter: f => !!(f.properties && f.properties.libellefrancais),
        pointToLayer: (feature, latlng) => {
          const espece = feature.properties.libellefrancais;
          counts[espece] = (counts[espece] || 0) + 1;
          const layer = L.circleMarker(latlng, {
            renderer,
            radius: 10,
            fillColor: getColorFromString(espece),
            color: "#FFFFFF",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
          });
          layer.feature = feature;
          layer.bindPopup(buildPopup);
          if (showTooltip) {
            layer.bindTooltip(espece, { direction: 'top', offset: [0, -10], opacity: 0.9, className: 'custom-tooltip' });
          }
          let arr = layersParEspece.get(espece);
          if (!arr) layersParEspece.set(espece, arr = []);
          arr.push(layer);
          return layer;
        }
      });

      // Filtres d'espèces (un seul fragment DOM)
      const filterEsp = document.getElementById("espece-filters");
      const frag = document.createDocumentFragment();
      Object.keys(counts).sort((a, b) => a.localeCompare(b, "fr")).forEach(esp => {
        const label = document.createElement("label");
        label.className = "arr-filter";
        label.innerHTML = `
          <span class="color-indicator" style="background-color:${getColorFromString(esp)}"></span>
          <input type="checkbox" checked> ${escapeHtml(esp)} (${counts[esp]})`;
        label.querySelector("input").dataset.esp = esp;
        frag.appendChild(label);
      });
      filterEsp.appendChild(frag);

      const selectAll = document.getElementById("select-all");
      const checkboxes = () => filterEsp.querySelectorAll("input[type='checkbox']");

      selectAll.addEventListener("change", function () {
        checkboxes().forEach(cb => cb.checked = this.checked);
        updateMap();
      });

      // Délégation : un seul listener pour toutes les cases
      filterEsp.addEventListener("change", e => {
        if (e.target.matches("input[type='checkbox']")) {
          selectAll.checked = Array.from(checkboxes()).every(cb => cb.checked);
          updateMap();
        }
      });

      function renderMarkers() {
        const selected = [];
        checkboxes().forEach(cb => {
          if (cb.checked) {
            const arr = layersParEspece.get(cb.dataset.esp);
            if (arr) selected.push(...arr);
          }
        });
        markers.clearLayers();
        markers.addLayers(selected); // ajout en masse (beaucoup plus rapide que addLayer en boucle)
      }

      const updateMap = debounce(renderMarkers, 150);

      renderMarkers();

      // Masque l'écran de chargement
      requestAnimationFrame(() => {
        const loadingScreen = document.getElementById("loading-screen");
        loadingScreen.classList.add("hidden");
        setTimeout(() => {
          loadingScreen.remove();
          if (inIframe) setInteractions(true);
        }, 550);
      });
    })
    .catch(error => {
      console.error("Erreur lors du chargement du GeoJSON :", error);
      const p = document.querySelector("#loading-screen p");
      if (p) p.textContent = "Impossible de charger les données. Réessayez plus tard.";
    });

  // ---------- UI ----------
  document.getElementById("toggleSidebar").addEventListener("click", function () {
    const sidebar = document.getElementById("sidebar");
    const open = sidebar.classList.toggle("open");
    this.classList.toggle("open", open);
    this.textContent = open ? "✕" : "☰ Filtres";
    this.style.top = open ? "20px" : "100px";
  });

  // Rafraîchir la recette d'un popup
  document.addEventListener("click", function (e) {
    const btn = e.target.closest && e.target.closest(".recette-refresh");
    if (!btn) return;
    const { layer: layerId, espece } = btn.dataset;
    const recette = getRecette(espece);
    const container = document.getElementById(`recette-${layerId}`);
    if (recette && container) container.innerHTML = recetteHTML(recette, espece, layerId);
  });

  // Aide
  const helpPopup = document.getElementById("helpPopup");
  document.getElementById("helpBtn").addEventListener("click", () => {
    helpPopup.style.display = helpPopup.style.display === "block" ? "none" : "block";
  });
  document.getElementById("closeHelp").addEventListener("click", () => {
    helpPopup.style.display = "none";
  });

  // Plein écran
  const fsIcon = document.getElementById('fullscreen-icon');
  const ICON_ENTER = '<path d="M7 14H5v5h5v-2H7v-3zm0-4h2V7h3V5H7v5zm10 4h-2v3h-3v2h5v-5zm-2-4h2V5h-5v2h3v3z"/>';
  const ICON_EXIT = '<path d="M6 16h2v2h2v2H6v-4zm0-8h4v2H8v2H6V8zm12 8v4h-4v-2h2v-2h2zm0-8v4h-2V10h-2V8h4z"/>';
  document.getElementById('fullscreenBtn').addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  });
  document.addEventListener('fullscreenchange', () => {
    fsIcon.innerHTML = document.fullscreenElement ? ICON_EXIT : ICON_ENTER;
  });

  // Géolocalisation
  document.getElementById("geolocate-btn").addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => map.setView([pos.coords.latitude, pos.coords.longitude], 16),
      err => {
        console.error("Erreur de géolocalisation :", err);
        alert("Impossible de vous localiser. Veuillez vérifier les autorisations.");
      }
    );
  });

  // Recherche d'adresse (Nominatim)
  const addressInput = document.getElementById("address-input");
  function goToAddress() {
    const address = addressInput.value.trim();
    if (!address) return;
    const q = encodeURIComponent(`${address} ${villeInfo.region}, France`);
    fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr&q=${q}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length) map.setView([+data[0].lat, +data[0].lon], 17);
        else alert("Adresse non trouvée. Essayez avec une adresse plus précise !");
      })
      .catch(err => {
        console.error("Erreur lors de la géolocalisation :", err);
        alert("Erreur lors de la recherche d’adresse.");
      });
  }
  document.getElementById("search-btn").addEventListener("click", goToAddress);
  addressInput.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); goToAddress(); }
  });

  // Hauteur de la zone carte
  function ajusterHauteurMain() {
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    const h = (header && header.offsetParent !== null) ? header.offsetHeight : 0;
    main.style.height = (window.innerHeight - h) + 'px';
    map.invalidateSize();
  }
  ajusterHauteurMain();
  window.addEventListener('resize', debounce(ajusterHauteurMain, 150));
});