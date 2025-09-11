/**
 * Test uSPOT Integration
 * Script pour tester l'intégration uSPOT d'Urbanivore
 */

class UrbanivoreUSPOTTest {
    constructor() {
        this.testResults = [];
        this.isRunning = false;
    }

    /**
     * Lancer tous les tests
     */
    async runAllTests() {
        if (this.isRunning) {
            console.warn('Tests déjà en cours...');
            return;
        }

        this.isRunning = true;
        this.testResults = [];
        
        console.log('🧪 Démarrage des tests uSPOT...');
        
        try {
            // Test 1: Détection d'environnement
            await this.testEnvironmentDetection();
            
            // Test 2: Transformation d'URL
            await this.testURLTransformation();
            
            // Test 3: Connexion uSPOT
            await this.testUSPOTConnection();
            
            // Test 4: API uSPOT
            await this.testUSPOTAPI();
            
            // Test 5: Données UPlanet
            await this.testUPlanetData();
            
        } catch (error) {
            console.error('❌ Erreur lors des tests:', error);
            this.addTestResult('GLOBAL', 'ERROR', error.message);
        }
        
        this.isRunning = false;
        this.displayResults();
    }

    /**
     * Test de détection d'environnement
     */
    async testEnvironmentDetection() {
        console.log('🔍 Test 1: Détection d\'environnement...');
        
        const currentURL = new URL(window.location.href);
        const isIPFS = currentURL.hostname.includes('ipfs') || 
                      currentURL.pathname.includes('/ipfs/');
        
        this.addTestResult('ENVIRONMENT', 'IPFS_DETECTION', 
            isIPFS ? 'IPFS détecté' : 'IPFS non détecté', isIPFS);
        
        const hasOptimizer = typeof window.urbanivoreOptimizer !== 'undefined';
        this.addTestResult('ENVIRONMENT', 'OPTIMIZER_LOADED', 
            hasOptimizer ? 'Optimiseur chargé' : 'Optimiseur non chargé', hasOptimizer);
        
        return true;
    }

    /**
     * Test de transformation d'URL
     */
    async testURLTransformation() {
        console.log('🔄 Test 2: Transformation d\'URL...');
        
        const currentURL = new URL(window.location.href);
        const protocol = currentURL.protocol;
        const hostname = currentURL.hostname;
        let port = currentURL.port;
        
        // Transformation uSPOT
        const uHost = hostname.replace("ipfs.", "u.");
        if (port === "8080") {
            port = "54321";
        }
        
        const uSPOTBase = protocol + "//" + uHost + (port ? (":" + port) : "");
        
        this.addTestResult('URL_TRANSFORM', 'IPFS_TO_USPOT', 
            `${currentURL.hostname}:${port} → ${uHost}:${port}`, true);
        
        // Test avec l'optimiseur si disponible
        if (window.urbanivoreUSPOT) {
            const baseURL = window.urbanivoreUSPOT.getUSPOTBaseURL();
            this.addTestResult('URL_TRANSFORM', 'USPOT_BASE_URL', 
                `URL de base: ${baseURL}`, baseURL.includes('u.'));
        }
        
        return true;
    }

    /**
     * Test de connexion uSPOT
     */
    async testUSPOTConnection() {
        console.log('🔗 Test 3: Connexion uSPOT...');
        
        if (!window.urbanivoreUSPOT) {
            this.addTestResult('USPOT_CONNECTION', 'USPOT_AVAILABLE', 
                'uSPOT non disponible', false);
            return false;
        }
        
        const isAvailable = window.urbanivoreUSPOT.isAvailable;
        this.addTestResult('USPOT_CONNECTION', 'USPOT_AVAILABLE', 
            isAvailable ? 'uSPOT disponible' : 'uSPOT non disponible', isAvailable);
        
        if (isAvailable) {
            try {
                const initialized = await window.urbanivoreUSPOT.init();
                this.addTestResult('USPOT_CONNECTION', 'USPOT_INIT', 
                    initialized ? 'uSPOT initialisé' : 'uSPOT non initialisé', initialized);
            } catch (error) {
                this.addTestResult('USPOT_CONNECTION', 'USPOT_INIT', 
                    `Erreur d'initialisation: ${error.message}`, false);
            }
        }
        
        return isAvailable;
    }

    /**
     * Test de l'API uSPOT
     */
    async testUSPOTAPI() {
        console.log('🔧 Test 4: API uSPOT...');
        
        if (!window.urbanivoreUSPOT || !window.urbanivoreUSPOT.isAvailable) {
            this.addTestResult('USPOT_API', 'API_AVAILABLE', 
                'API uSPOT non disponible', false);
            return false;
        }
        
        try {
            // Test de l'endpoint de statut
            const baseURL = window.urbanivoreUSPOT.getUSPOTBaseURL();
            const statusResponse = await fetch(`${baseURL}/api/uspot/status`);
            const statusOK = statusResponse.ok;
            
            this.addTestResult('USPOT_API', 'STATUS_ENDPOINT', 
                statusOK ? 'Endpoint /api/uspot/status OK' : 'Endpoint /api/uspot/status KO', statusOK);
            
            if (statusOK) {
                const statusData = await statusResponse.json();
                this.addTestResult('USPOT_API', 'STATUS_DATA', 
                    `Données de statut: ${JSON.stringify(statusData).substring(0, 50)}...`, true);
            }
            
        } catch (error) {
            this.addTestResult('USPOT_API', 'STATUS_ENDPOINT', 
                `Erreur API: ${error.message}`, false);
        }
        
        return true;
    }

    /**
     * Test des données UPlanet
     */
    async testUPlanetData() {
        console.log('🌍 Test 5: Données UPlanet...');
        
        if (!window.urbanivoreUSPOT || !window.urbanivoreUSPOT.isAvailable) {
            this.addTestResult('UPLANET_DATA', 'DATA_AVAILABLE', 
                'Données UPlanet non disponibles', false);
            return false;
        }
        
        try {
            const uPlanetData = await window.urbanivoreUSPOT.getUPlanetData();
            
            if (uPlanetData) {
                this.addTestResult('UPLANET_DATA', 'DATA_LOADED', 
                    'Données UPlanet chargées', true);
                
                // Analyser les données
                const hasPlayers = uPlanetData.PLAYERs && uPlanetData.PLAYERs.length > 0;
                const hasUMAPs = uPlanetData.UMAPs && uPlanetData.UMAPs.length > 0;
                const hasNostr = uPlanetData.NOSTR && uPlanetData.NOSTR.length > 0;
                
                this.addTestResult('UPLANET_DATA', 'PLAYERS_COUNT', 
                    `${uPlanetData.PLAYERs?.length || 0} joueurs`, hasPlayers);
                this.addTestResult('UPLANET_DATA', 'UMAPS_COUNT', 
                    `${uPlanetData.UMAPs?.length || 0} UMAPs`, hasUMAPs);
                this.addTestResult('UPLANET_DATA', 'NOSTR_COUNT', 
                    `${uPlanetData.NOSTR?.length || 0} entrées NOSTR`, hasNostr);
                
                // Extraire les clés NOSTR
                const nostrKeys = this.extractNostrKeys(uPlanetData);
                this.addTestResult('UPLANET_DATA', 'NOSTR_KEYS', 
                    `${nostrKeys.length} clés NOSTR extraites`, nostrKeys.length > 0);
                
            } else {
                this.addTestResult('UPLANET_DATA', 'DATA_LOADED', 
                    'Aucune donnée UPlanet trouvée', false);
            }
            
        } catch (error) {
            this.addTestResult('UPLANET_DATA', 'DATA_LOADED', 
                `Erreur chargement: ${error.message}`, false);
        }
        
        return true;
    }

    /**
     * Extraire les clés NOSTR des données UPlanet
     */
    extractNostrKeys(data) {
        const keys = new Set();
        
        if (data.PLAYERs) {
            data.PLAYERs.forEach(player => {
                if (player.HEX && player.HEX !== "null") {
                    keys.add(player.HEX);
                }
            });
        }
        
        if (data.UMAPs) {
            data.UMAPs.forEach(umap => {
                if (umap.UMAPHEX) {
                    keys.add(umap.UMAPHEX);
                }
            });
        }
        
        if (data.NOSTR) {
            data.NOSTR.forEach(item => {
                if (item.HEX && item.HEX !== "null") {
                    keys.add(item.HEX);
                }
            });
        }
        
        return Array.from(keys);
    }

    /**
     * Ajouter un résultat de test
     */
    addTestResult(category, test, message, success) {
        this.testResults.push({
            category,
            test,
            message,
            success,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Afficher les résultats
     */
    displayResults() {
        console.log('\n📊 RÉSULTATS DES TESTS uSPOT:');
        console.log('=' .repeat(50));
        
        const categories = [...new Set(this.testResults.map(r => r.category))];
        
        categories.forEach(category => {
            console.log(`\n${category}:`);
            const categoryTests = this.testResults.filter(r => r.category === category);
            
            categoryTests.forEach(test => {
                const status = test.success ? '✅' : '❌';
                console.log(`  ${status} ${test.test}: ${test.message}`);
            });
        });
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const successRate = ((passedTests / totalTests) * 100).toFixed(1);
        
        console.log('\n' + '=' .repeat(50));
        console.log(`📈 RÉSUMÉ: ${passedTests}/${totalTests} tests réussis (${successRate}%)`);
        
        if (successRate >= 80) {
            console.log('🎉 Tests uSPOT réussis !');
        } else if (successRate >= 50) {
            console.log('⚠️ Tests uSPOT partiellement réussis');
        } else {
            console.log('❌ Tests uSPOT échoués');
        }
        
        // Exposer les résultats globalement
        window.urbanivoreTestResults = {
            results: this.testResults,
            summary: {
                total: totalTests,
                passed: passedTests,
                successRate: successRate
            }
        };
    }

    /**
     * Obtenir les résultats au format JSON
     */
    getResultsJSON() {
        return JSON.stringify(window.urbanivoreTestResults, null, 2);
    }

    /**
     * Télécharger les résultats
     */
    downloadResults() {
        const json = this.getResultsJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `urbanivore-uspot-test-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

// Créer l'instance de test
const urbanivoreUSPOTTest = new UrbanivoreUSPOTTest();

// Exposer globalement
window.urbanivoreUSPOTTest = urbanivoreUSPOTTest;

// Fonction de test rapide
window.testUSPOT = () => {
    urbanivoreUSPOTTest.runAllTests();
};

// Fonction pour télécharger les résultats
window.downloadUSPOTResults = () => {
    urbanivoreUSPOTTest.downloadResults();
};

console.log('🧪 Test uSPOT Urbanivore chargé. Utilisez testUSPOT() pour lancer les tests.');
