/**
 * WebSocketTemperature - Gestion de la connexion WebSocket
 */
export class WebSocketTemperature {
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

