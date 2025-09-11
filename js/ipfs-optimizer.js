/**
 * Urbanivore IPFS Optimizer
 * Script pour optimiser l'application Urbanivore pour IPFS et l'API uSPOT
 */

class UrbanivoreIPFSOptimizer {
    constructor() {
        this.isIPFS = false;
        this.isUSPOT = false;
        this.currentCID = null;
        this.gateway = null;
        this.init();
    }

    /**
     * Initialisation de l'optimiseur
     */
    init() {
        this.detectEnvironment();
        this.setupOptimizations();
        this.logEnvironment();
    }

    /**
     * Détecter l'environnement d'exécution
     */
    detectEnvironment() {
        // Détecter IPFS
        this.isIPFS = this.detectIPFS();
        
        // Détecter uSPOT
        this.isUSPOT = this.detectUSPOT();
        
        // Extraire le CID si disponible
        this.currentCID = this.extractCID();
        
        // Déterminer la gateway
        this.gateway = this.determineGateway();
    }

    /**
     * Détecter si l'application tourne sur IPFS
     */
    detectIPFS() {
        return window.location.protocol === 'ipfs:' || 
               window.location.hostname.includes('ipfs') ||
               window.location.pathname.includes('/ipfs/') ||
               window.location.href.includes('/ipfs/');
    }

    /**
     * Détecter si l'API uSPOT est disponible
     */
    detectUSPOT() {
        // Vérifier si l'API uSPOT est accessible
        return typeof window.uSPOT !== 'undefined' || 
               this.checkUSPOTEndpoint();
    }

    /**
     * Vérifier l'endpoint uSPOT
     */
    async checkUSPOTEndpoint() {
        try {
            // Transformer l'URL pour uSPOT (ipfs. -> u. et :8080 -> :54321)
            const currentURL = new URL(window.location.href);
            const protocol = currentURL.protocol;
            const hostname = currentURL.hostname;
            let port = currentURL.port;
            
            // Transformation uSPOT
            const uHost = hostname.replace("ipfs.", "u.");
            if (port === "8080") {
                port = "54321";
            } else if (port) {
                // garder le port
            } else {
                port = "";
            }
            
            const uSPOTBase = protocol + "//" + uHost + (port ? (":" + port) : "");
            const uSPOTStatusURL = uSPOTBase + '/api/uspot/status';
            
            console.log('🌐 Vérification uSPOT:', uSPOTStatusURL);
            
            const response = await fetch(uSPOTStatusURL, { 
                method: 'GET',
                timeout: 3000 
            });
            return response.ok;
        } catch (error) {
            console.log('uSPOT API non disponible:', error.message);
            return false;
        }
    }

    /**
     * Extraire le CID de l'URL IPFS
     */
    extractCID() {
        if (!this.isIPFS) return null;
        
        const path = window.location.pathname;
        const ipfsMatch = path.match(/\/ipfs\/([a-zA-Z0-9]+)/);
        return ipfsMatch ? ipfsMatch[1] : null;
    }

    /**
     * Déterminer la gateway IPFS à utiliser
     */
    determineGateway() {
        if (this.isIPFS) {
            // Si on est déjà sur IPFS, utiliser la gateway actuelle
            return window.location.origin;
        } else {
            // Gateway par défaut
            return 'https://ipfs.io';
        }
    }

    /**
     * Configurer les optimisations
     */
    setupOptimizations() {
        if (this.isIPFS) {
            this.optimizeForIPFS();
        }
        
        if (this.isUSPOT) {
            this.optimizeForUSPOT();
        }
        
        // Optimisations générales
        this.setupGeneralOptimizations();
    }

    /**
     * Optimisations spécifiques à IPFS
     */
    optimizeForIPFS() {
        console.log('🌐 Optimisations IPFS appliquées');
        
        // Corriger les liens relatifs
        this.fixRelativeLinks();
        
        // Optimiser le chargement des ressources
        this.optimizeResourceLoading();
        
        // Ajouter des métadonnées IPFS
        this.addIPFSMetadata();
        
        // Gérer les erreurs 404
        this.handleIPFSErrors();
    }

    /**
     * Optimisations spécifiques à uSPOT
     */
    optimizeForUSPOT() {
        console.log('🔧 Optimisations uSPOT appliquées');
        
        // Intégrer l'API uSPOT
        this.integrateUSPOTAPI();
        
        // Optimiser les requêtes de données
        this.optimizeDataQueries();
    }

    /**
     * Optimisations générales
     */
    setupGeneralOptimizations() {
        // Améliorer les performances
        this.optimizePerformance();
        
        // Gérer les erreurs de réseau
        this.handleNetworkErrors();
        
        // Ajouter des métadonnées
        this.addMetadata();
    }

    /**
     * Corriger les liens relatifs pour IPFS
     */
    fixRelativeLinks() {
        const links = document.querySelectorAll('a[href^="./"], a[href^="/"]');
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http')) {
                // Corriger les liens relatifs
                const correctedHref = this.correctRelativePath(href);
                link.setAttribute('href', correctedHref);
            }
        });
    }

    /**
     * Corriger un chemin relatif
     */
    correctRelativePath(path) {
        if (path.startsWith('/')) {
            // Chemin absolu
            return path;
        } else if (path.startsWith('./')) {
            // Chemin relatif
            return path.substring(2);
        } else {
            return path;
        }
    }

    /**
     * Optimiser le chargement des ressources
     */
    optimizeResourceLoading() {
        // Précharger les ressources importantes
        this.preloadResources();
        
        // Optimiser les images
        this.optimizeImages();
        
        // Lazy loading pour les iframes
        this.setupLazyLoading();
    }

    /**
     * Précharger les ressources importantes
     */
    preloadResources() {
        const resources = [
            'img/logo.png',
            'img/urbanivore.webp',
            'js/script.js',
            'js/recettes.js'
        ];
        
        resources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.endsWith('.js') ? 'script' : 'image';
            document.head.appendChild(link);
        });
    }

    /**
     * Optimiser les images
     */
    optimizeImages() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Ajouter loading="lazy" si pas déjà présent
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
            
            // Ajouter des attributs pour IPFS
            if (this.isIPFS) {
                img.setAttribute('data-ipfs', 'true');
            }
        });
    }

    /**
     * Configurer le lazy loading pour les iframes
     */
    setupLazyLoading() {
        const iframes = document.querySelectorAll('iframe[data-src]');
        
        iframes.forEach(iframe => {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const src = iframe.getAttribute('data-src');
                        if (src && !iframe.src) {
                            iframe.src = src;
                            iframe.classList.add('loaded');
                        }
                        observer.unobserve(iframe);
                    }
                });
            }, { threshold: 0.1 });
            
            observer.observe(iframe);
        });
    }

    /**
     * Ajouter des métadonnées IPFS
     */
    addIPFSMetadata() {
        // Ajouter des métadonnées dans le head
        const meta = document.createElement('meta');
        meta.name = 'ipfs-cid';
        meta.content = this.currentCID || 'unknown';
        document.head.appendChild(meta);
        
        // Ajouter des données à window
        window.urbanivoreIPFS = {
            cid: this.currentCID,
            gateway: this.gateway,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Gérer les erreurs IPFS
     */
    handleIPFSErrors() {
        // Intercepter les erreurs 404
        window.addEventListener('error', (event) => {
            if (event.target.tagName === 'IMG' || event.target.tagName === 'SCRIPT') {
                console.warn('Ressource non trouvée:', event.target.src);
                this.handleMissingResource(event.target);
            }
        });
    }

    /**
     * Gérer une ressource manquante
     */
    handleMissingResource(element) {
        if (element.tagName === 'IMG') {
            // Remplacer par une image par défaut
            element.src = 'img/placeholder.png';
            element.alt = 'Image non disponible';
        }
    }

    /**
     * Intégrer l'API uSPOT
     */
    integrateUSPOTAPI() {
        // Créer un wrapper pour l'API uSPOT
        window.urbanivoreUSPOT = {
            api: null,
            isAvailable: this.isUSPOT,
            baseURL: null,
            
            // Obtenir l'URL de base uSPOT
            getUSPOTBaseURL() {
                if (this.baseURL) return this.baseURL;
                
                const currentURL = new URL(window.location.href);
                const protocol = currentURL.protocol;
                const hostname = currentURL.hostname;
                let port = currentURL.port;
                
                // Transformation uSPOT
                const uHost = hostname.replace("ipfs.", "u.");
                if (port === "8080") {
                    port = "54321";
                } else if (port) {
                    // garder le port
                } else {
                    port = "";
                }
                
                this.baseURL = protocol + "//" + uHost + (port ? (":" + port) : "");
                return this.baseURL;
            },
            
            // Initialiser l'API
            async init() {
                try {
                    const baseURL = this.getUSPOTBaseURL();
                    const response = await fetch(`${baseURL}/health`);
                    if (response.ok) {
                        this.api = await response.json();
                        return true;
                    }
                } catch (error) {
                    console.warn('uSPOT API non accessible:', error);
                }
                return false;
            },
            
            // Tester l'authentification NOSTR
            async testNostrAuth(npub) {
                if (!this.isAvailable) return null;
                
                try {
                    const baseURL = this.getUSPOTBaseURL();
                    const formData = new FormData();
                    formData.append('npub', npub);
                    
                    const response = await fetch(`${baseURL}/api/test-nostr`, {
                        method: 'POST',
                        body: formData
                    });
                    return response.ok ? await response.json() : null;
                } catch (error) {
                    console.warn('Erreur test NOSTR:', error);
                    return null;
                }
            },
            
            // Vérifier le solde G1
            async checkG1Balance(g1pub) {
                if (!this.isAvailable) return null;
                
                try {
                    const baseURL = this.getUSPOTBaseURL();
                    const response = await fetch(`${baseURL}/check_balance?g1pub=${g1pub}`);
                    return response.ok ? await response.json() : null;
                } catch (error) {
                    console.warn('Erreur vérification solde G1:', error);
                    return null;
                }
            },
            
            // Upload de fichier avec authentification NOSTR
            async uploadFile(file, npub) {
                if (!this.isAvailable) return null;
                
                try {
                    const baseURL = this.getUSPOTBaseURL();
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('npub', npub);
                    
                    const response = await fetch(`${baseURL}/api/upload`, {
                        method: 'POST',
                        body: formData
                    });
                    return response.ok ? await response.json() : null;
                } catch (error) {
                    console.warn('Erreur upload fichier:', error);
                    return null;
                }
            },
            
            // Créer une ressource Urbanivore
            async createUrbanivoreResource(resourceData, npub) {
                if (!this.isAvailable) return null;
                
                try {
                    const baseURL = this.getUSPOTBaseURL();
                    const response = await fetch(`${baseURL}/api/urbanivore/resource`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ...resourceData,
                            npub: npub
                        })
                    });
                    return response.ok ? await response.json() : null;
                } catch (error) {
                    console.warn('Erreur création ressource Urbanivore:', error);
                    return null;
                }
            },
            
            // Lister les ressources Urbanivore
            async listUrbanivoreResources(npub, limit = 50) {
                if (!this.isAvailable) return null;
                
                try {
                    const baseURL = this.getUSPOTBaseURL();
                    const response = await fetch(`${baseURL}/api/urbanivore/resources?npub=${npub}&limit=${limit}`);
                    return response.ok ? await response.json() : null;
                } catch (error) {
                    console.warn('Erreur liste ressources Urbanivore:', error);
                    return null;
                }
            },
            
            // Obtenir les données UPlanet
            async getUPlanetData() {
                if (!this.isAvailable) return null;
                
                try {
                    const baseURL = this.getUSPOTBaseURL();
                    const response = await fetch(`${baseURL}/`);
                    return response.ok ? await response.json() : null;
                } catch (error) {
                    console.warn('Erreur uSPOT UPlanet data:', error);
                    return null;
                }
            }
        };
    }

    /**
     * Optimiser les requêtes de données
     */
    optimizeDataQueries() {
        // Mettre en cache les données GeoJSON
        this.setupDataCache();
        
        // Optimiser les requêtes de carte
        this.optimizeMapQueries();
    }

    /**
     * Configurer le cache de données
     */
    setupDataCache() {
        window.urbanivoreCache = {
            data: new Map(),
            maxAge: 5 * 60 * 1000, // 5 minutes
            
            set(key, value) {
                this.data.set(key, {
                    value: value,
                    timestamp: Date.now()
                });
            },
            
            get(key) {
                const item = this.data.get(key);
                if (!item) return null;
                
                if (Date.now() - item.timestamp > this.maxAge) {
                    this.data.delete(key);
                    return null;
                }
                
                return item.value;
            },
            
            clear() {
                this.data.clear();
            }
        };
    }

    /**
     * Optimiser les requêtes de carte
     */
    optimizeMapQueries() {
        // Intercepter les requêtes de données GeoJSON
        const originalFetch = window.fetch;
        window.fetch = async function(url, options) {
            if (url.includes('.geojson')) {
                // Vérifier le cache
                const cached = window.urbanivoreCache.get(url);
                if (cached) {
                    return new Response(JSON.stringify(cached), {
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                
                // Faire la requête et mettre en cache
                const response = await originalFetch(url, options);
                if (response.ok) {
                    const data = await response.json();
                    window.urbanivoreCache.set(url, data);
                }
                return response;
            }
            
            return originalFetch(url, options);
        };
    }

    /**
     * Optimiser les performances
     */
    optimizePerformance() {
        // Réduire les reflows
        this.optimizeDOM();
        
        // Optimiser les animations
        this.optimizeAnimations();
        
        // Gérer la mémoire
        this.manageMemory();
    }

    /**
     * Optimiser le DOM
     */
    optimizeDOM() {
        // Utiliser requestAnimationFrame pour les animations
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = function(callback, delay) {
            if (delay < 16) { // Moins d'une frame
                return requestAnimationFrame(callback);
            }
            return originalSetTimeout(callback, delay);
        };
    }

    /**
     * Optimiser les animations
     */
    optimizeAnimations() {
        // Utiliser transform au lieu de top/left
        const style = document.createElement('style');
        style.textContent = `
            .optimized-animation {
                will-change: transform;
                transform: translateZ(0);
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Gérer la mémoire
     */
    manageMemory() {
        // Nettoyer les listeners d'événements
        window.addEventListener('beforeunload', () => {
            // Nettoyer les caches
            if (window.urbanivoreCache) {
                window.urbanivoreCache.clear();
            }
        });
    }

    /**
     * Gérer les erreurs de réseau
     */
    handleNetworkErrors() {
        window.addEventListener('offline', () => {
            this.showOfflineMessage();
        });
        
        window.addEventListener('online', () => {
            this.hideOfflineMessage();
        });
    }

    /**
     * Afficher un message hors ligne
     */
    showOfflineMessage() {
        const message = document.createElement('div');
        message.id = 'offline-message';
        message.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff6b6b;
            color: white;
            text-align: center;
            padding: 10px;
            z-index: 10000;
        `;
        message.textContent = '🌐 Mode hors ligne - Certaines fonctionnalités peuvent être limitées';
        document.body.appendChild(message);
    }

    /**
     * Masquer le message hors ligne
     */
    hideOfflineMessage() {
        const message = document.getElementById('offline-message');
        if (message) {
            message.remove();
        }
    }

    /**
     * Ajouter des métadonnées générales
     */
    addMetadata() {
        // Métadonnées pour Urbanivore
        const meta = document.createElement('meta');
        meta.name = 'urbanivore-version';
        meta.content = '1.0.0';
        document.head.appendChild(meta);
        
        // Métadonnées pour IPFS
        if (this.isIPFS) {
            const ipfsMeta = document.createElement('meta');
            ipfsMeta.name = 'urbanivore-ipfs';
            ipfsMeta.content = 'true';
            document.head.appendChild(ipfsMeta);
        }
        
        // Métadonnées pour uSPOT
        if (this.isUSPOT) {
            const uspotMeta = document.createElement('meta');
            uspotMeta.name = 'urbanivore-uspot';
            uspotMeta.content = 'true';
            document.head.appendChild(uspotMeta);
        }
    }

    /**
     * Logger les informations d'environnement
     */
    logEnvironment() {
        console.log('🌳 Urbanivore IPFS Optimizer initialisé');
        console.log('📊 Environnement:', {
            isIPFS: this.isIPFS,
            isUSPOT: this.isUSPOT,
            cid: this.currentCID,
            gateway: this.gateway,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Obtenir les informations d'environnement
     */
    getEnvironmentInfo() {
        return {
            isIPFS: this.isIPFS,
            isUSPOT: this.isUSPOT,
            cid: this.currentCID,
            gateway: this.gateway,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
    }
}

// Initialiser l'optimiseur
const urbanivoreOptimizer = new UrbanivoreIPFSOptimizer();

// Exposer globalement
window.urbanivoreOptimizer = urbanivoreOptimizer;

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UrbanivoreIPFSOptimizer;
}
