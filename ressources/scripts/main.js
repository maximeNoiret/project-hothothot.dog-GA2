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

    ajouterTemperature(temp1, temp2, timestamp = Date.now()) {
        this.temperatures.push({ temp1, temp2, timestamp });
        this.notifierObservateurs();
    }
}

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
                    legend: { position: 'top' },
                    title: { display: true, text: 'Historique des Températures' }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        min: -15,
                        max: 50,
                        ticks: {
                            callback: function(value) { return value + '°C'; }
                        }
                    }
                }
            }
        });
    }

    update(temperatures) {
        if (temperatures.length === 0) return;

        const maxPoints = 50;
        const startIndex = Math.max(0, temperatures.length - maxPoints);
        const recentTemps = temperatures.slice(startIndex);

        this.labels = recentTemps.map((t) => {
            const date = new Date(t.timestamp);
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        });

        this.data1 = recentTemps.map(t => t.temp1);
        this.data2 = recentTemps.map(t => t.temp2);

        this.chart.data.labels = this.labels;
        this.chart.data.datasets[0].data = this.data1;
        this.chart.data.datasets[1].data = this.data2;
        this.chart.update('none');
    }
}

class AlerteTemperature {
    constructor(messageElement, temp1Element, temp2Element) {
        this.messageElement = messageElement;
        this.temp1Element = temp1Element;
        this.temp2Element = temp2Element;
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
        const derniere = this.alertes[this.alertes.length - 1];
        if (derniere && 
            derniere.sensorName === alerte.sensorName && 
            derniere.type === alerte.type &&
            Date.now() - derniere.timestamp.getTime() < 5000) {
            return;
        }

        this.alertes.push(alerte);
        if (this.alertes.length > 100) {
            this.alertes.shift();
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

        alertesList.innerHTML = this.alertes.slice().reverse().map((alerte) => `
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
                tag: 'temperature-alert',
                requireInteraction: level === 'high'
            });
        }
    }

    loadAlertes() {
        try {
            const saved = localStorage.getItem('hothothot-alertes');
            if (saved) {
                this.alertes = JSON.parse(saved).map(a => ({
                    ...a,
                    timestamp: new Date(a.timestamp)
                }));
            }
        } catch (e) {
            console.error(e);
        }
    }

    sauvegarderAlertes() {
        try {
            localStorage.setItem('hothothot-alertes', JSON.stringify(this.alertes));
        } catch (e) {
            console.error(e);
        }
    }
}

async function fetchTemperature(rapportMeteo) {
    const statusDot = document.getElementById('apiStatusDot');
    const statusText = document.getElementById('apiStatusText');

    try {
        // utilisation de proxy car marche pas sans
        const response = await fetch('https://api.codetabs.com/v1/proxy?quest=http://api.hothothot.dog');
        if (!response.ok) throw new Error('Erreur API');
        
        const data = await response.json();
        
        const temp1 = parseFloat(data.capteurs[0].Valeur);
        const temp2 = parseFloat(data.capteurs[1].Valeur);
        
        rapportMeteo.ajouterTemperature(temp1, temp2);

        // SUCCÈS : La gommette sur le menu passe au vert
        if (statusDot && statusText) {
            statusDot.style.backgroundColor = '#4CAF50';
            statusText.textContent = 'Connecté';
        }

    } catch (error) {
        console.error("Problème de connexion à l'API :", error);
        
        // ERREUR : La gommette sur le menu passe au rouge
        if (statusDot && statusText) {
            statusDot.style.backgroundColor = '#F44336';
            statusText.textContent = 'Déconnecté';
        }
    }
}

async function loadHistorique(rapportMeteo) {
    try {
        const response = await fetch('/ressources/historique.json');
        const snapshots = await response.json();
        
        snapshots.forEach(snapshot => {
            const temp1 = parseFloat(snapshot.capteurs[0].Valeur);
            const temp2 = parseFloat(snapshot.capteurs[1].Valeur);
            const timestamp = snapshot.capteurs[0].Timestamp * 1000;
            rapportMeteo.ajouterTemperature(temp1, temp2, timestamp);
        });
    } catch (error) {
        console.error(error);
    }
}

async function chargerPageCompte(urlVirtuelle, jsonPath) {
    try {
        const response = await fetch(jsonPath);
        const data = await response.json();
        document.getElementById('accueil').style.display = 'none';
        let comptePage = document.getElementById('pageMonCompte');
        if (!comptePage) {
            comptePage = document.createElement('div');
            comptePage.id = 'pageMonCompte';
            comptePage.className = 'page active';
            document.querySelector('.navbar').insertAdjacentElement('afterend', comptePage);
        }
        comptePage.innerHTML = `
            <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
                <h2>Mon Compte</h2>
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <p><strong>Nom :</strong> ${data.nom}</p>
                    <p><strong>Prénom :</strong> ${data.prenom}</p>
                    <p><strong>Email :</strong> ${data.email}</p>
                    <p><strong>Rôle :</strong> ${data.role}</p>
                    <button id="btnRetourAccueil" style="margin-top: 20px; padding: 10px 20px; cursor: pointer; background: #333; color: white; border: none; border-radius: 4px;">⬅ Retour à l'accueil</button>
                </div>
            </div>
        `;
        comptePage.style.display = 'block';
        document.getElementById('btnRetourAccueil').addEventListener('click', retourAccueil);
        history.pushState({ page: 'compte' }, "Mon Compte", urlVirtuelle);
    } catch (error) {
        console.error("Erreur de chargement du compte :", error);
    }
}

function retourAccueil() {
    const comptePage = document.getElementById('pageMonCompte');
    if (comptePage) comptePage.style.display = 'none';
    
    document.getElementById('accueil').style.display = 'block';
    history.pushState({ page: 'accueil' }, "Accueil", "/");
}

async function chargerPageDoc(urlVirtuelle, jsonPath) {
    try {
        const response = await fetch(jsonPath);
        const data = await response.json();
        document.getElementById('accueil').style.display = 'none';
        if (document.getElementById('pageMonCompte')) document.getElementById('pageMonCompte').style.display = 'none';

        let docPage = document.getElementById('pageDocumentation');
        if (!docPage) {
            docPage = document.createElement('div');
            docPage.id = 'pageDocumentation';
            docPage.className = 'page active';
            document.querySelector('.navbar').insertAdjacentElement('afterend', docPage);
        }

        docPage.innerHTML = `
            <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
                <h2>${data.titre}</h2>
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <p>${data.description}</p>
                    <ul>
                        ${data.points_cles.map(point => `<li>${point}</li>`).join('')}
                    </ul>
                    <button id="btnRetourDoc" style="margin-top: 20px; padding: 10px 20px; cursor: pointer; background: #333; color: white; border: none; border-radius: 4px;">⬅ Retour à l'accueil</button>
                </div>
            </div>
        `;
        docPage.style.display = 'block';

        document.getElementById('btnRetourDoc').addEventListener('click', retourAccueilDepuisDoc);
        history.pushState({ page: 'doc' }, "Documentation", urlVirtuelle);
    } catch (error) {
        console.error("Erreur doc:", error);
    }
}

function retourAccueilDepuisDoc() {
    if (document.getElementById('pageDocumentation')) document.getElementById('pageDocumentation').style.display = 'none';
    document.getElementById('accueil').style.display = 'block';
    history.pushState({ page: 'accueil' }, "Accueil", "/");
}

function setupTabs() {
    const tabs = document.querySelectorAll('[role="tab"]');
    const panels = document.querySelectorAll('[role="tabpanel"]');

    function switchTab(oldTab, newTab) {
        if (!oldTab || !newTab) return;
        
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
            }

            if (targetTab) switchTab(e.target, targetTab);
        });
    });
}

function setupAlertDialog() {
    const alertDialog = document.getElementById('alertDialog');
    if (!alertDialog) return;

    const closeBtn = alertDialog.querySelector('.close-btn');
    const closeBtnFooter = document.getElementById('closeAlertDialog');

    closeBtn?.addEventListener('click', () => alertDialog.close());
    closeBtnFooter?.addEventListener('click', () => alertDialog.close());
}

function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'denied' && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const rapportMeteo = new RapportMeteoObservable();

    const temp1Element = document.getElementById('temperature1');
    const temp2Element = document.getElementById('temperature2');
    const minElement = document.getElementById('minTemp');
    const maxElement = document.getElementById('maxTemp');
    const messageElement = document.getElementById('message');

    const temperatureTempsReel = new TemperatureTempsReel(temp1Element, temp2Element);
    const minMaxTracker = new MinMaxTracker(minElement, maxElement);
    const historiqueGraphique = new HistoriqueGraphique('tempChart');
    const alerteTemperature = new AlerteTemperature(messageElement, temp1Element, temp2Element);

    rapportMeteo.ajouterObservateur(temperatureTempsReel);
    rapportMeteo.ajouterObservateur(minMaxTracker);
    rapportMeteo.ajouterObservateur(historiqueGraphique);
    rapportMeteo.ajouterObservateur(alerteTemperature);

    setupTabs();
    setupAlertDialog();
    requestNotificationPermission();

    loadHistorique(rapportMeteo);
    
    fetchTemperature(rapportMeteo);
    setInterval(() => fetchTemperature(rapportMeteo), 5000);

    setInterval(() => {
        alerteTemperature.sauvegarderAlertes();
    }, 5000);

    const btnCompte = document.getElementById('btnCompte');
    if (btnCompte) {
        btnCompte.addEventListener('click', (e) => {
            e.preventDefault();
            chargerPageCompte('/mon-compte', '/ressources/compte.json');
        });
    }

    const btnDoc = document.getElementById('btnDoc');
    if (btnDoc) {
        btnDoc.addEventListener('click', (e) => {
        e.preventDefault();
        chargerPageDoc('/documentation', '/ressources/documentation.json');
        });
    }

    window.addEventListener('popstate', (e) => {
    const pageAcc = document.getElementById('accueil');
    const pageCompte = document.getElementById('pageMonCompte');
    const pageDoc = document.getElementById('pageDocumentation');

    if (pageCompte) pageCompte.style.display = 'none';
    if (pageDoc) pageDoc.style.display = 'none';

    if (e.state && e.state.page === 'compte') {
        pageAcc.style.display = 'none';
        pageCompte.style.display = 'block';
    } else if (e.state && e.state.page === 'doc') {
        pageAcc.style.display = 'none';
        pageDoc.style.display = 'block';
    } else {
        pageAcc.style.display = 'block';
    }
    });
});