/**
 * RapportMeteoObservable - Implémentation du pattern Observer
 */
export class RapportMeteoObservable {
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

