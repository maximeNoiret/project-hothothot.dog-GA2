/**
 * TemperatureDatabase - Gestion de la base de données IndexedDB
 */
export class TemperatureDatabase {
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

