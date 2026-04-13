/**
 * Configuration de l'application
 */

export const CONFIG = {
    // WebSocket Configuration
    websocket: {
        url: 'wss://ws.hothothot.dog:9502',
        maxReconnectAttempts: 5,
        reconnectDelay: 3000
    },

    // Database Configuration
    database: {
        name: 'HotHotHot',
        version: 1,
        storeName: 'temperatures'
    },

    // Chart Configuration
    chart: {
        maxPoints: 50
    },

    // Alert Configuration
    alert: {
        maxAlerts: 100,
        deduplicateInterval: 5000, // 5 secondes
        coldThreshold: 0,           // °C
        warmThreshold: 20,          // °C
        hotThreshold: 30            // °C
    },

    // Simulation Configuration
    simulation: {
        interval: 2000,              // ms
        tempMin: -10,                // °C
        tempMax: 50                  // °C
    },

    // Alert Saving Configuration
    alertSaving: {
        interval: 5000               // ms
    },

    // Daily Reset Configuration
    dailyReset: {
        checkInterval: 3600000       // 1 heure en ms
    }
};

