/**
 * NotificationService - Gestion des permissions et notifications
 */

export class NotificationService {
    static requestPermission() {
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
}

/**
 * DailyResetService - Gestion de la réinitialisation quotidienne
 */
export class DailyResetService {
    static checkDailyReset(minMaxTracker) {
        const lastResetDate = localStorage.getItem('hothothot-last-reset-date');
        const today = new Date().toLocaleDateString('fr-FR');

        if (lastResetDate !== today) {
            console.log('Nouveau jour: réinitialisation des min/max');
            minMaxTracker.reset();
            localStorage.setItem('hothothot-last-reset-date', today);
        }

        setInterval(() => {
            const currentDate = new Date().toLocaleDateString('fr-FR');
            const savedDate = localStorage.getItem('hothothot-last-reset-date');
            
            if (savedDate !== currentDate) {
                minMaxTracker.reset();
                localStorage.setItem('hothothot-last-reset-date', currentDate);
            }
        }, 3600000);
    }
}

