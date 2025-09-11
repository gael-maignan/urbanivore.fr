/**
 * Urbanivore NOSTR Harvester
 * Système de récolte et d'analyse des données NOSTR pour Urbanivore
 * 
 * Ce script permet de :
 * - Collecter les événements NOSTR liés à Urbanivore
 * - Analyser les données d'arbres et de recettes
 * - Exporter les données au format GeoJSON
 * - Générer des statistiques
 */

class UrbanivoreNostrHarvester {
    constructor() {
        this.pool = null;
        this.relays = [
            'wss://relay.copylaradio.com',  // UPlanet ORIGIN relay
            'ws://127.0.0.1:7777',          // Local relay (Astroport.ONE)
            'wss://relay.damus.io',         // Public relay
            'wss://nos.lol',                // Public relay
            'wss://relay.snort.social',     // Public relay
            'wss://relay.nostr.band'        // Public relay
        ];
        
        // Relais prioritaires (locaux et UPlanet)
        this.priorityRelays = [
            'ws://127.0.0.1:7777',          // Local relay
            'wss://relay.copylaradio.com'   // UPlanet relay
        ];
        
        this.collectedEvents = [];
        this.trees = [];
        this.recipes = [];
        this.statistics = {
            totalEvents: 0,
            trees: 0,
            recipes: 0,
            users: 0,
            cities: 0,
            species: new Set(),
            seasons: new Set(),
            difficulties: new Set()
        };
        
        this.lastHarvestTime = null;
        this.harvestInterval = null;
    }

    /**
     * Initialiser le harvester
     */
    async initialize() {
        try {
            console.log('🌳 Initialisation Urbanivore NOSTR Harvester...');
            
            if (typeof NostrTools === 'undefined') {
                throw new Error('NostrTools non disponible');
            }

            this.pool = new NostrTools.SimplePool();
            console.log('✅ Pool NOSTR initialisé');
            
            return true;
        } catch (error) {
            console.error('❌ Erreur initialisation:', error);
            return false;
        }
    }

    /**
     * Démarrer la récolte automatique
     * @param {number} intervalMinutes - Intervalle en minutes (défaut: 30)
     */
    startAutoHarvest(intervalMinutes = 30) {
        if (this.harvestInterval) {
            this.stopAutoHarvest();
        }
        
        console.log(`🔄 Démarrage récolte automatique (${intervalMinutes} min)`);
        
        // Première récolte immédiate
        this.harvestCycle();
        
        // Récolte périodique
        this.harvestInterval = setInterval(() => {
            this.harvestCycle();
        }, intervalMinutes * 60 * 1000);
    }

    /**
     * Arrêter la récolte automatique
     */
    stopAutoHarvest() {
        if (this.harvestInterval) {
            clearInterval(this.harvestInterval);
            this.harvestInterval = null;
            console.log('⏹️ Récolte automatique arrêtée');
        }
    }

    /**
     * Cycle de récolte principal
     */
    async harvestCycle() {
        try {
            console.log('🌾 Début cycle de récolte...');
            this.lastHarvestTime = new Date();
            
            // Récupérer les événements récents
            const events = await this.fetchUrbanivoreEvents();
            console.log(`📊 ${events.length} événements récupérés`);
            
            // Analyser les événements
            this.analyzeEvents(events);
            
            // Mettre à jour les statistiques
            this.updateStatistics();
            
            console.log('✅ Cycle de récolte terminé');
            console.log('📈 Statistiques:', this.statistics);
            
            // Déclencher un événement personnalisé
            this.dispatchHarvestEvent();
            
        } catch (error) {
            console.error('❌ Erreur cycle de récolte:', error);
        }
    }

    /**
     * Tester la connectivité des relais
     */
    async testRelayConnectivity() {
        const results = {};
        
        for (const relay of this.relays) {
            try {
                const startTime = Date.now();
                const response = await fetch(relay.replace('ws', 'http').replace('wss', 'https') + '/health', {
                    method: 'GET',
                    timeout: 5000
                });
                const endTime = Date.now();
                
                results[relay] = {
                    connected: response.ok,
                    latency: endTime - startTime,
                    status: response.status
                };
            } catch (error) {
                results[relay] = {
                    connected: false,
                    error: error.message
                };
            }
        }
        
        return results;
    }

    /**
     * Récupérer les événements Urbanivore depuis les relais
     */
    async fetchUrbanivoreEvents() {
        if (!this.pool) {
            throw new Error('Pool NOSTR non initialisé');
        }
        
        try {
            // Tester d'abord les relais prioritaires
            const connectivity = await this.testRelayConnectivity();
            const availableRelays = this.relays.filter(relay => 
                connectivity[relay]?.connected
            );
            
            if (availableRelays.length === 0) {
                console.warn('⚠️ Aucun relai NOSTR disponible');
                return [];
            }
            
            console.log(`📡 Relais disponibles: ${availableRelays.length}/${this.relays.length}`);
            
            // Récupérer les événements des dernières 24h
            const since = Math.floor((Date.now() - 24 * 60 * 60 * 1000) / 1000);
            
            const events = await this.pool.list(availableRelays, [
                {
                kinds: [1],
                since: since,
                    limit: 1000
                }
            ]);
            
            // Filtrer les événements Urbanivore
            const urbanivoreEvents = events.filter(event => {
                return event.tags.some(tag => 
                    tag[0] === 'application' && tag[1] === 'Urbanivore'
                );
            });
            
            return urbanivoreEvents;

        } catch (error) {
            console.error('Erreur récupération événements:', error);
            return [];
        }
    }

    /**
     * Analyser les événements récupérés
     */
    analyzeEvents(events) {
        events.forEach(event => {
            this.collectedEvents.push(event);
            
            // Extraire les tags
            const tags = this.extractTags(event);
            
            if (tags.type === 'tree') {
                this.processTreeEvent(event, tags);
            } else if (tags.type === 'recipe') {
                this.processRecipeEvent(event, tags);
            }
        });
    }

    /**
     * Extraire les tags d'un événement
     */
    extractTags(event) {
        const tags = {};
        
        event.tags.forEach(tag => {
            if (tag.length >= 2) {
                tags[tag[0]] = tag[1];
            }
        });
        
        return tags;
    }

    /**
     * Traiter un événement d'arbre
     */
    processTreeEvent(event, tags) {
        const tree = {
                id: event.id,
                pubkey: event.pubkey,
                created_at: event.created_at,
                content: event.content,
            latitude: parseFloat(tags.latitude),
            longitude: parseFloat(tags.longitude),
            species: tags.species,
            season: tags.season,
            accessibility: tags.accessibility,
            images: this.extractImages(event.content)
        };
        
        this.trees.push(tree);
        this.statistics.trees++;
        
        if (tree.species) {
            this.statistics.species.add(tree.species);
        }
        
        if (tree.season) {
            this.statistics.seasons.add(tree.season);
        }
    }

    /**
     * Traiter un événement de recette
     */
    processRecipeEvent(event, tags) {
        const recipe = {
            id: event.id,
            pubkey: event.pubkey,
            created_at: event.created_at,
            content: event.content,
            latitude: parseFloat(tags.latitude),
            longitude: parseFloat(tags.longitude),
            title: tags.title,
            difficulty: tags.difficulty,
            time: tags.time,
            images: this.extractImages(event.content)
        };
        
        this.recipes.push(recipe);
        this.statistics.recipes++;
        
        if (recipe.difficulty) {
            this.statistics.difficulties.add(recipe.difficulty);
        }
    }

    /**
     * Extraire les URLs d'images du contenu
     */
    extractImages(content) {
        const imageRegex = /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/gi;
        const matches = content.match(imageRegex);
        return matches || [];
    }

    /**
     * Mettre à jour les statistiques
     */
    updateStatistics() {
        this.statistics.totalEvents = this.collectedEvents.length;
        this.statistics.users = new Set(this.collectedEvents.map(e => e.pubkey)).size;
        
        // Compter les villes uniques (approximatif)
        const coordinates = this.trees.map(t => `${t.latitude.toFixed(2)},${t.longitude.toFixed(2)}`);
        this.statistics.cities = new Set(coordinates).size;
    }

    /**
     * Exporter les données au format GeoJSON
     */
    exportToGeoJSON() {
        const features = [];
        
        // Ajouter les arbres
        this.trees.forEach(tree => {
            features.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [tree.longitude, tree.latitude]
                },
                properties: {
                    type: 'tree',
                    id: tree.id,
                    species: tree.species,
                    season: tree.season,
                    accessibility: tree.accessibility,
                    created_at: tree.created_at,
                    pubkey: tree.pubkey,
                    content: tree.content,
                    images: tree.images
                }
            });
        });
        
        // Ajouter les recettes
        this.recipes.forEach(recipe => {
            features.push({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [recipe.longitude, recipe.latitude]
                },
                properties: {
                    type: 'recipe',
                    id: recipe.id,
                    title: recipe.title,
                    difficulty: recipe.difficulty,
                    time: recipe.time,
                    created_at: recipe.created_at,
                    pubkey: recipe.pubkey,
                    content: recipe.content,
                    images: recipe.images
                }
            });
        });
        
        return {
            type: 'FeatureCollection',
            features: features,
            properties: {
                name: 'Urbanivore NOSTR Data',
                description: 'Données collectées via le protocole NOSTR',
                last_harvest: this.lastHarvestTime?.toISOString(),
                statistics: {
                    total_events: this.statistics.totalEvents,
                    trees: this.statistics.trees,
                    recipes: this.statistics.recipes,
                    users: this.statistics.users,
                    cities: this.statistics.cities
                }
            }
        };
    }

    /**
     * Exporter les recettes au format JSON
     */
    exportRecipes() {
        return {
            recipes: this.recipes,
            metadata: {
                total: this.recipes.length,
                last_harvest: this.lastHarvestTime?.toISOString(),
                difficulties: Array.from(this.statistics.difficulties)
            }
        };
    }

    /**
     * Exporter les arbres au format JSON
     */
    exportTrees() {
        return {
            trees: this.trees,
            metadata: {
                total: this.trees.length,
                last_harvest: this.lastHarvestTime?.toISOString(),
                species: Array.from(this.statistics.species),
                seasons: Array.from(this.statistics.seasons)
            }
        };
    }

    /**
     * Obtenir les statistiques
     */
    getStatistics() {
        return {
            ...this.statistics,
            species: Array.from(this.statistics.species),
            seasons: Array.from(this.statistics.seasons),
            difficulties: Array.from(this.statistics.difficulties),
            last_harvest: this.lastHarvestTime?.toISOString()
        };
    }

    /**
     * Rechercher des arbres par espèce
     */
    searchTreesBySpecies(species) {
        return this.trees.filter(tree => 
            tree.species && tree.species.toLowerCase().includes(species.toLowerCase())
        );
    }

    /**
     * Rechercher des recettes par titre
     */
    searchRecipesByTitle(title) {
        return this.recipes.filter(recipe => 
            recipe.title && recipe.title.toLowerCase().includes(title.toLowerCase())
        );
    }

    /**
     * Rechercher par localisation
     */
    searchByLocation(lat, lon, radiusKm = 10) {
        const results = [];
        
        [...this.trees, ...this.recipes].forEach(item => {
            const distance = this.calculateDistance(lat, lon, item.latitude, item.longitude);
            if (distance <= radiusKm) {
                results.push({
                    ...item,
                    distance: distance
                });
            }
        });
        
        return results.sort((a, b) => a.distance - b.distance);
    }

    /**
     * Calculer la distance entre deux points (formule de Haversine)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Rayon de la Terre en km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    /**
     * Déclencher un événement personnalisé pour notifier les changements
     */
    dispatchHarvestEvent() {
        const event = new CustomEvent('urbanivoreHarvest', {
            detail: {
                statistics: this.getStatistics(),
                timestamp: new Date().toISOString(),
                trees: this.trees.length,
                recipes: this.recipes.length
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Nettoyer les données anciennes
     * @param {number} daysToKeep - Nombre de jours à conserver (défaut: 30)
     */
    cleanupOldData(daysToKeep = 30) {
        const cutoffTime = Math.floor((Date.now() - daysToKeep * 24 * 60 * 60 * 1000) / 1000);
        
        this.collectedEvents = this.collectedEvents.filter(e => e.created_at >= cutoffTime);
        this.trees = this.trees.filter(t => t.created_at >= cutoffTime);
        this.recipes = this.recipes.filter(r => r.created_at >= cutoffTime);
        
        console.log(`🧹 Nettoyage: données conservées pour les ${daysToKeep} derniers jours`);
    }

    /**
     * Exporter toutes les données
     */
    exportAllData() {
        return {
            geojson: this.exportToGeoJSON(),
            recipes: this.exportRecipes(),
            trees: this.exportTrees(),
            statistics: this.getStatistics(),
            metadata: {
                export_date: new Date().toISOString(),
                version: '1.0.0',
                source: 'Urbanivore NOSTR Harvester'
            }
        };
    }
}

// Interface d'administration pour le harvester
class UrbanivoreNostrAdmin {
    constructor() {
        this.harvester = new UrbanivoreNostrHarvester();
        this.isInitialized = false;
    }

    /**
     * Initialiser l'interface d'administration
     */
    async initialize() {
        try {
            this.isInitialized = await this.harvester.initialize();
            
            if (this.isInitialized) {
                this.setupEventListeners();
                this.updateUI();
                console.log('✅ Interface d\'administration initialisée');
            }
            
            return this.isInitialized;
        } catch (error) {
            console.error('❌ Erreur initialisation admin:', error);
            return false;
        }
    }

    /**
     * Configurer les écouteurs d'événements
     */
    setupEventListeners() {
        // Écouter les événements de récolte
        document.addEventListener('urbanivoreHarvest', (event) => {
            this.updateStatistics(event.detail);
        });
    }

    /**
     * Mettre à jour l'interface utilisateur
     */
    updateUI() {
        const stats = this.harvester.getStatistics();
        
        // Mettre à jour les statistiques affichées
        this.updateElement('total-events', stats.totalEvents);
        this.updateElement('total-trees', stats.trees);
        this.updateElement('total-recipes', stats.recipes);
        this.updateElement('total-users', stats.users);
        this.updateElement('total-cities', stats.cities);
        
        // Mettre à jour les listes
        this.updateSpeciesList(stats.species);
        this.updateSeasonsList(stats.seasons);
        this.updateDifficultiesList(stats.difficulties);
        
        // Mettre à jour le timestamp
        if (stats.last_harvest) {
            this.updateElement('last-harvest', new Date(stats.last_harvest).toLocaleString());
        }
    }

    /**
     * Mettre à jour un élément de l'interface
     */
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    /**
     * Mettre à jour la liste des espèces
     */
    updateSpeciesList(species) {
        const container = document.getElementById('species-list');
        if (container) {
            container.innerHTML = species.map(s => `<li>${s}</li>`).join('');
        }
    }

    /**
     * Mettre à jour la liste des saisons
     */
    updateSeasonsList(seasons) {
        const container = document.getElementById('seasons-list');
        if (container) {
            container.innerHTML = seasons.map(s => `<li>${s}</li>`).join('');
        }
    }

    /**
     * Mettre à jour la liste des difficultés
     */
    updateDifficultiesList(difficulties) {
        const container = document.getElementById('difficulties-list');
        if (container) {
            container.innerHTML = difficulties.map(d => `<li>${d}</li>`).join('');
        }
    }

    /**
     * Mettre à jour les statistiques
     */
    updateStatistics(detail) {
        console.log('📊 Statistiques mises à jour:', detail);
        this.updateUI();
    }

    /**
     * Démarrer la récolte automatique
     */
    startAutoHarvest() {
        if (this.isInitialized) {
            this.harvester.startAutoHarvest();
            this.updateElement('harvest-status', '🔄 Récolte automatique active');
        }
    }

    /**
     * Arrêter la récolte automatique
     */
    stopAutoHarvest() {
        if (this.isInitialized) {
            this.harvester.stopAutoHarvest();
            this.updateElement('harvest-status', '⏹️ Récolte automatique arrêtée');
        }
    }

    /**
     * Déclencher une récolte manuelle
     */
    async manualHarvest() {
        if (this.isInitialized) {
            this.updateElement('harvest-status', '🌾 Récolte en cours...');
            await this.harvester.harvestCycle();
            this.updateElement('harvest-status', '✅ Récolte terminée');
        }
    }

    /**
     * Exporter les données
     */
    exportData() {
        if (this.isInitialized) {
            const data = this.harvester.exportAllData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `urbanivore-nostr-data-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
        }
    }

    /**
     * Exporter au format GeoJSON
     */
    exportGeoJSON() {
        if (this.isInitialized) {
            const geojson = this.harvester.exportToGeoJSON();
            const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `urbanivore-trees-${new Date().toISOString().split('T')[0]}.geojson`;
            a.click();
            
            URL.revokeObjectURL(url);
        }
    }
}

// Export pour utilisation dans d'autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UrbanivoreNostrHarvester, UrbanivoreNostrAdmin };
} else {
    // Exposer globalement pour utilisation dans le navigateur
    window.UrbanivoreNostrHarvester = UrbanivoreNostrHarvester;
    window.UrbanivoreNostrAdmin = UrbanivoreNostrAdmin;
}
