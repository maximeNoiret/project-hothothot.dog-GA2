/**
 * Observateurs - Implémentation des différents observateurs
 */

export class TemperatureTempsReel {
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

export class MinMaxTracker {
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

export class HistoriqueGraphique {
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

export class AlerteTemperature {
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
                badge: '/ressources/images/favicon.webp',
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

