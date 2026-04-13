/**
 * TemperatureApp - Point d'entrée principal de l'application
 */

import { TemperatureDatabase } from './services/database.js';
import { RapportMeteoObservable } from './models/observable.js';
import { TemperatureTempsReel, MinMaxTracker, HistoriqueGraphique, AlerteTemperature } from './observers/observers.js';
import { WebSocketTemperature } from './services/websocket.js';
import { UIController } from './controllers/ui-controller.js';
import { NotificationService, DailyResetService } from './services/app-services.js';

export class TemperatureApp {
    constructor() {
        this.db = null;
        this.rapportMeteo = null;
        this.alerteTemperature = null;
        this.webSocket = null;
    }

    async initialize() {
        console.log('🚀 Initialisation de l\'application HOTHOTHOT DOG...');

        try {
            // 1. Initialiser la base de données
            this.db = new TemperatureDatabase();
            await this.db.init();
            console.log('✓ Base de données initialisée');

            // 2. Créer le modèle Observable
            this.rapportMeteo = new RapportMeteoObservable();

            // 3. Récupérer les éléments DOM
            const temp1Element = document.getElementById('temperature1');
            const temp2Element = document.getElementById('temperature2');
            const minElement = document.getElementById('minTemp');
            const maxElement = document.getElementById('maxTemp');
            const messageElement = document.getElementById('message');

            // 4. Créer les observateurs
            const temperatureTempsReel = new TemperatureTempsReel(temp1Element, temp2Element);
            const minMaxTracker = new MinMaxTracker(minElement, maxElement);
            const historiqueGraphique = new HistoriqueGraphique('tempChart');
            this.alerteTemperature = new AlerteTemperature(messageElement, temp1Element, temp2Element, this.db);

            // 5. Enregistrer les observateurs
            this.rapportMeteo.ajouterObservateur(temperatureTempsReel);
            this.rapportMeteo.ajouterObservateur(minMaxTracker);
            this.rapportMeteo.ajouterObservateur(historiqueGraphique);
            this.rapportMeteo.ajouterObservateur(this.alerteTemperature);

            console.log('✓ Observateurs créés et enregistrés');

            // 6. Charger les données du jour depuis IndexedDB
            await this.loadTodayData();

            // 7. Configurer l'interface utilisateur
            UIController.setupTabs();
            UIController.setupAlertDialog();
            console.log('✓ Interface utilisateur configurée');

            // 8. Demander les permissions de notification
            NotificationService.requestPermission();

            // 9. Configurer la réinitialisation quotidienne
            DailyResetService.checkDailyReset(minMaxTracker);

            // 10. Établir la connexion WebSocket
            await this.setupWebSocket();

            // 11. Configurer le fallback avec données de simulation
            this.setupDataSimulation();

            // 12. Configurer la sauvegarde périodique des alertes
            this.setupAlertSaving();

            console.log('✓ Application initialisée avec succès!');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            throw error;
        }
    }

    async loadTodayData() {
        try {
            const todayData = await this.db.getTodayTemperatures();
            if (todayData.length > 0) {
                console.log(`📊 Chargement de ${todayData.length} mesures du jour`);
                todayData.forEach(data => {
                    this.rapportMeteo.ajouterTemperature(data.temp1, data.temp2);
                });
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
        }
    }

    async setupWebSocket() {
        const wsUrl = 'wss://ws.hothothot.dog:9502';
        this.webSocket = new WebSocketTemperature(wsUrl, this.rapportMeteo, this.db);
        
        if (navigator.onLine) {
            this.webSocket.connect();
        } else {
            console.log('📡 Mode hors-ligne: WebSocket non connecté');
        }
    }

    setupDataSimulation() {
        // Fallback avec génération de données aléatoires pour démonstration
        if (navigator.onLine) {
            setInterval(() => {
                const temp1 = Math.floor(Math.random() * 50) - 10;
                const temp2 = Math.floor(Math.random() * 50) - 10;
                this.rapportMeteo.ajouterTemperature(temp1, temp2);
            }, 2000);
        }
    }

    setupAlertSaving() {
        // Sauvegarder les alertes toutes les 5 secondes
        setInterval(() => {
            if (this.alerteTemperature) {
                this.alerteTemperature.sauvegarderAlertes();
            }
        }, 5000);
    }
}

// Initialiser l'application au chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        const app = new TemperatureApp();
        await app.initialize();
    });
} else {
    const app = new TemperatureApp();
    app.initialize();
}

