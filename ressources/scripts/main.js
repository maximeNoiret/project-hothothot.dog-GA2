/**
 * Main.js - Point d'entrée refactorisé mais fonctionnel
 * Version modulaire et maintenable
 */

// ============================================
// DATABASE SERVICE
// ============================================
class TemperatureDatabase {
    constructor() {
        this.dbName = 'HotHotHot';
        this.storeName = 'temperatures';
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('date', 'date', { unique: false });
                }
            };
        });
    }

    async addTemperature(temp1, temp2) {
        const now = new Date();
        const data = {
            temp1,
            temp2,
            timestamp: now.getTime(),
            date: now.toLocaleDateString('fr-FR')
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(data);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(data);
        });
    }

    async getTodayTemperatures() {
        const today = new Date().toLocaleDateString('fr-FR');
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('date');
            const request = index.getAll(today);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async getLastTemperatures(limit = 100) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const all = request.result;
                resolve(all.slice(-limit));
            };
        });
    }
}

// ====================================
// Observable Pattern
// ====================================
class RapportMeteoObservable {
    constructor() {
        this.temperatures = [];
        this.observateurs = [];
    }

    ajouterObservateur(observateur) {
        this.observateurs.push(observateur);
    }

    supprimerObservateur(observateur) {
        this.observateurs = this.observateurs.filter(obs => obs !== observateur);
    }

    notifierObservateurs() {
        this.observateurs.forEach(observateur => {
            observateur.update(this.temperatures);
        });
    }

    ajouterTemperature(temp1, temp2) {
        this.temperatures.push({ temp1, temp2, timestamp: Date.now() });
        this.notifierObservateurs();
    }
}

// ====================================
// Observateurs
// ====================================

class TemperatureTempsReel {
    constructor(element1, element2) {
        this.element1 = element1;
        this.element2 = element2;
    }

    update(temperatures) {
        if (temperatures.length > 0) {
            const last = temperatures[temperatures.length - 1];
            this.element1.textContent = last.temp1 + '°C';
            this.element2.textContent = last.temp2 + '°C';
        }
    }
}

class MinMaxTracker {
    constructor(minElement, maxElement) {
        this.minElement = minElement;
        this.maxElement = maxElement;
        this.minValue = null;
        this.maxValue = null;
    }

    update(temperatures) {
        if (temperatures.length === 0) return;

        // Réinitialiser si c'est la première mise à jour du jour
        if (this.minValue === null) {
            const last = temperatures[temperatures.length - 1];
            this.minValue = Math.min(last.temp1, last.temp2);
            this.maxValue = Math.max(last.temp1, last.temp2);
        } else {
            const last = temperatures[temperatures.length - 1];
            this.minValue = Math.min(this.minValue, last.temp1, last.temp2);
            this.maxValue = Math.max(this.maxValue, last.temp1, last.temp2);
        }

        this.minElement.textContent = this.minValue + '°C';
        this.maxElement.textContent = this.maxValue + '°C';
    }

    reset() {
        this.minValue = null;
        this.maxValue = null;
        this.minElement.textContent = '--°C';
        this.maxElement.textContent = '--°C';
    }
}

class HistoriqueGraphique {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.chart = null;
        this.labels = [];
        this.data1 = [];
        this.data2 = [];
        this.initChart();
    }

    initChart() {
        const ctx = this.canvas.getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.labels,
                datasets: [
                    {
                        label: 'Capteur 1 (Intérieur)',
                        data: this.data1,
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                    },
                    {
                        label: 'Capteur 2 (Extérieur)',
                        data: this.data2,
                        borderColor: '#4ecdc4',
                        backgroundColor: 'rgba(78, 205, 196, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Historique des Températures'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: -15,
                        max: 50,
                        ticks: {
                            callback: function(value) {
                                return value + '°C';
                            }
                        }
                    }
                }
            }
        });
    }

    update(temperatures) {
        if (temperatures.length === 0) return;

        // Garder seulement les 50 dernières mesures
        const maxPoints = 50;
        const startIndex = Math.max(0, temperatures.length - maxPoints);
        const recentTemps = temperatures.slice(startIndex);

        this.labels = recentTemps.map((t, i) => {
            const date = new Date(t.timestamp);
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        });

        this.data1 = recentTemps.map(t => t.temp1);
        this.data2 = recentTemps.map(t => t.temp2);

        this.chart.data.labels = this.labels;
        this.chart.data.datasets[0].data = this.data1;
        this.chart.data.datasets[1].data = this.data2;
        this.chart.update('none'); // Sans animation
    }
}

class AlerteTemperature {
    constructor(messageElement, temp1Element, temp2Element, db) {
        this.messageElement = messageElement;
        this.temp1Element = temp1Element;
        this.temp2Element = temp2Element;
        this.db = db;
        this.alertes = [];
        this.loadAlertes();
    }

    update(temperatures) {
        if (temperatures.length === 0) return;

        const last = temperatures[temperatures.length - 1];
        this.checkAlerte(last.temp1, this.temp1Element, 'Capteur 1');
        this.checkAlerte(last.temp2, this.temp2Element, 'Capteur 2');
    }

    checkAlerte(temp, element, sensorName) {
        element.removeAttribute('class');

        let alerte = null;
        let message = '';

        if (temp <= 0) {
            element.setAttribute('class', 'bleu');
            message = `🥶 ${sensorName}: Brrr, un peu froid! ${temp}°C`;
            alerte = { type: 'cold', level: 'medium', message, temp, sensorName, timestamp: new Date() };
        } else if (temp <= 20) {
            element.setAttribute('class', 'vert');
        } else if (temp <= 30) {
            element.setAttribute('class', 'orange');
            message = `🌡️ ${sensorName}: Température modérée ${temp}°C`;
        } else {
            element.setAttribute('class', 'rouge');
            message = `🔥 ${sensorName}: Caliente! Vamos a la playa! ${temp}°C`;
            alerte = { type: 'hot', level: 'high', message, temp, sensorName, timestamp: new Date() };
        }

        if (alerte) {
            this.messageElement.textContent = message;
            this.ajouterAlerte(alerte);
            this.envoyerNotification(message, alerte.level);
        }
    }

    ajouterAlerte(alerte) {
        // Éviter les doublons
        const derniere = this.alertes[this.alertes.length - 1];
        if (derniere && 
            derniere.sensorName === alerte.sensorName && 
            derniere.type === alerte.type &&
            Date.now() - derniere.timestamp.getTime() < 5000) {
            return;
        }

        this.alertes.push(alerte);
        if (this.alertes.length > 100) {
            this.alertes.shift(); // Garder seulement les 100 dernières
        }

        this.mettreAJourDialogueAlertes();
    }

    mettreAJourDialogueAlertes() {
        const alertesList = document.getElementById('alertsList');
        if (!alertesList) return;

        if (this.alertes.length === 0) {
            alertesList.innerHTML = '<p>Aucune alerte pour le moment</p>';
            return;
        }

        alertesList.innerHTML = this.alertes.slice().reverse().map((alerte, index) => `
            <div class="alert-item ${alerte.level === 'high' ? 'high' : ''}">
                <strong>${alerte.message}</strong><br>
                <small>${alerte.timestamp.toLocaleString('fr-FR')}</small>
            </div>
        `).join('');
    }

    envoyerNotification(message, level) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            const icon = level === 'high' ? '🔥' : '❄️';
            new Notification('HOTHOTHOT DOG', {
                body: message,
                icon: '/ressources/images/favicon.png',
                badge: '/ressources/images/favicon.webp',
                tag: 'temperature-alert',
                requireInteraction: level === 'high'
            });
        }
    }

    loadAlertes() {
        // Charger les alertes depuis le stockage local
        try {
            const saved = localStorage.getItem('hothothot-alertes');
            if (saved) {
                this.alertes = JSON.parse(saved).map(a => ({
                    ...a,
                    timestamp: new Date(a.timestamp)
                }));
            }
        } catch (e) {
            console.error('Erreur lors du chargement des alertes:', e);
        }
    }

    sauvegarderAlertes() {
        try {
            localStorage.setItem('hothothot-alertes', JSON.stringify(this.alertes));
        } catch (e) {
            console.error('Erreur lors de la sauvegarde des alertes:', e);
        }
    }
}

// ====================================
// Gestion de la Navigation
// ====================================
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = link.dataset.page;

            // Mettre à jour les classes
            navLinks.forEach(l => l.classList.remove('active'));
            pages.forEach(p => {
                p.classList.remove('active');
                p.style.display = 'none';
            });

            link.classList.add('active');
            const targetPage = document.getElementById(pageName);
            targetPage.classList.add('active');
            targetPage.style.display = 'block';
        });
    });
}

// ====================================
// Gestion des Onglets
// ====================================
function setupTabs() {
    const tabs = document.querySelectorAll('[role="tab"]');
    const panels = document.querySelectorAll('[role="tabpanel"]');

    function switchTab(oldTab, newTab) {
        oldTab.setAttribute('aria-selected', 'false');
        oldTab.setAttribute('tabindex', '-1');
        oldTab.classList.remove('active');

        newTab.setAttribute('aria-selected', 'true');
        newTab.setAttribute('tabindex', '0');
        newTab.classList.add('active');
        newTab.focus();

        panels.forEach(panel => {
            if (panel.id === newTab.getAttribute('aria-controls')) {
                panel.classList.remove('hidden');
                panel.removeAttribute('hidden');
            } else {
                panel.classList.add('hidden');
                panel.setAttribute('hidden', '');
            }
        });
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const currentTab = document.querySelector('[role="tab"][aria-selected="true"]');
            if (currentTab !== e.target) {
                switchTab(currentTab, e.target);
            }
        });

        tab.addEventListener('keydown', (e) => {
            const currentIndex = Array.from(tabs).indexOf(e.target);
            let targetTab = null;

            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                targetTab = tabs[currentIndex + 1] || tabs[0];
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                targetTab = tabs[currentIndex - 1] || tabs[tabs.length - 1];
            } else if (e.key === 'Home') {
                e.preventDefault();
                targetTab = tabs[0];
            } else if (e.key === 'End') {
                e.preventDefault();
                targetTab = tabs[tabs.length - 1];
            }

            if (targetTab) {
                switchTab(e.target, targetTab);
            }
        });
    });
}

// ====================================
// Gestion des Alertes Dialog
// ====================================
function setupAlertDialog() {
    const alertDialog = document.getElementById('alertDialog');
    if (!alertDialog) return;

    const closeBtn = alertDialog.querySelector('.close-btn');
    const closeBtnFooter = document.getElementById('closeAlertDialog');

    closeBtn.addEventListener('click', () => alertDialog.close());
    closeBtnFooter.addEventListener('click', () => alertDialog.close());
}

// ====================================
// WebSocket Connection
// ====================================
class WebSocketTemperature {
    constructor(url, rapportMeteo, db) {
        this.url = url;
        this.rapportMeteo = rapportMeteo;
        this.db = db;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.online = navigator.onLine;
        
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    connect() {
        if (!this.online) {
            console.log('Hors-ligne: WebSocket non connecté');
            return;
        }

        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log('WebSocket connecté');
                this.reconnectAttempts = 0;
            };

            this.ws.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const temp1 = parseFloat(data.temp1 || data.Valeur || 20);
                    const temp2 = parseFloat(data.temp2 || data.Valeur || 15);
                    
                    this.rapportMeteo.ajouterTemperature(temp1, temp2);
                    await this.db.addTemperature(temp1, temp2);
                } catch (e) {
                    console.error('Erreur parsing WebSocket:', e);
                }
            };

            this.ws.onerror = (error) => {
                console.error('Erreur WebSocket:', error);
            };

            this.ws.onclose = () => {
                console.log('WebSocket fermé');
                this.reconnect();
            };
        } catch (e) {
            console.error('Erreur connexion WebSocket:', e);
            this.reconnect();
        }
    }

    reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Nombre max de tentatives de reconnexion atteint');
            return;
        }

        this.reconnectAttempts++;
        console.log(`Tentative de reconnexion ${this.reconnectAttempts}...`);
        
        setTimeout(() => {
            if (this.online) {
                this.connect();
            }
        }, this.reconnectDelay);
    }

    handleOnline() {
        this.online = true;
        console.log('Connecté à internet');
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.connect();
        }
    }

    handleOffline() {
        this.online = false;
        console.log('Hors-ligne');
        if (this.ws) {
            this.ws.close();
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}


// ====================================
// Permissions & Notifications
// ====================================
function requestNotificationPermission() {
    if (!('Notification' in window)) {
        console.log('Notifications non supportées');
        return;
    }

    if (Notification.permission === 'granted') {
        return;
    }

    if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('Permission de notification accordée');
            }
        });
    }
}

// ====================================
// Initialisation
// ====================================
async function initializeApp() {
    console.log('Initialisation de l\'application...');

    // Initialiser la base de données
    const db = new TemperatureDatabase();
    await db.init();

    // Créer les observables
    const rapportMeteo = new RapportMeteoObservable();

    // Récupérer les éléments DOM
    const temp1Element = document.getElementById('temperature1');
    const temp2Element = document.getElementById('temperature2');
    const minElement = document.getElementById('minTemp');
    const maxElement = document.getElementById('maxTemp');
    const messageElement = document.getElementById('message');

    // Créer les observateurs
    const temperatureTempsReel = new TemperatureTempsReel(temp1Element, temp2Element);
    const minMaxTracker = new MinMaxTracker(minElement, maxElement);
    const historiqueGraphique = new HistoriqueGraphique('tempChart');
    const alerteTemperature = new AlerteTemperature(messageElement, temp1Element, temp2Element, db);

    // Ajouter les observateurs
    rapportMeteo.ajouterObservateur(temperatureTempsReel);
    rapportMeteo.ajouterObservateur(minMaxTracker);
    rapportMeteo.ajouterObservateur(historiqueGraphique);
    rapportMeteo.ajouterObservateur(alerteTemperature);

    // Charger les données du jour depuis IndexedDB
    const todayData = await db.getTodayTemperatures();
    if (todayData.length > 0) {
        todayData.forEach(data => {
            rapportMeteo.ajouterTemperature(data.temp1, data.temp2);
        });
    }

    // Setup navigation
    setupNavigation();

    // Setup tabs
    setupTabs();

    // Setup alert dialog
    setupAlertDialog();

    // Permissions & Notifications
    requestNotificationPermission();

    // Connexion WebSocket
    const wsUrl = 'wss://ws.hothothot.dog:9502';
    const webSocket = new WebSocketTemperature(wsUrl, rapportMeteo, db);
    webSocket.connect();

    // Mode simulation si WebSocket non disponible
    if (!navigator.onLine) {
        console.log('Mode hors-ligne: utilisation des données locales');
    } else {
        // Fallback avec API Open-Meteo (gratuite et sans authentification)
        const fetchWeatherData = async () => {
            try {
                // Récupérer la position de l'utilisateur (France par défaut: Paris)
                const latitude = 48.8566;
                const longitude = 2.3522;
                
                const response = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m&temperature_unit=celsius&timezone=Europe/Paris`
                );
                
                if (!response.ok) throw new Error('Erreur API météo');
                
                const data = await response.json();
                const currentTemp = data.current.temperature_2m;
                const humidity = data.current.relative_humidity_2m;
                
                // Simuler deux capteurs avec légère variation
                const temp1 = parseFloat(currentTemp.toFixed(1));
                const temp2 = parseFloat((currentTemp + (Math.random() * 2 - 1)).toFixed(1));
                
                console.log(`🌡️ Températures API: temp1=${temp1}°C, temp2=${temp2}°C, humidité=${humidity}%`);
                rapportMeteo.ajouterTemperature(temp1, temp2);
                await db.addTemperature(temp1, temp2);
            } catch (error) {
                console.error('Erreur lors de la récupération de la météo:', error);
            }
        };
        
        // Récupérer les données à l'initialisation et toutes les 30 secondes
        fetchWeatherData();
        setInterval(fetchWeatherData, 30000);
    }

    // Sauvegarder les alertes périodiquement
    setInterval(() => {
        alerteTemperature.sauvegarderAlertes();
    }, 5000);

    // Réinitialiser les min/max chaque jour
    checkDailyReset(minMaxTracker);
}

// ====================================
// Réinitialisation Quotidienne
// ====================================
function checkDailyReset(minMaxTracker) {
    const lastResetDate = localStorage.getItem('hothothot-last-reset-date');
    const today = new Date().toLocaleDateString('fr-FR');

    if (lastResetDate !== today) {
        console.log('Nouveau jour: réinitialisation des min/max');
        minMaxTracker.reset();
        localStorage.setItem('hothothot-last-reset-date', today);
    }

    // Vérifier chaque heure
    setInterval(() => {
        const currentDate = new Date().toLocaleDateString('fr-FR');
        const savedDate = localStorage.getItem('hothothot-last-reset-date');
        
        if (savedDate !== currentDate) {
            minMaxTracker.reset();
            localStorage.setItem('hothothot-last-reset-date', currentDate);
        }
    }, 3600000); // Chaque heure
}

// Attendre que le DOM soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}


