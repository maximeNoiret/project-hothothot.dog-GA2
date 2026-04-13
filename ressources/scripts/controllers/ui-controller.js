/**
 * UIController - Gestion des composants UI
 */

export class UIController {
    static setupTabs() {
        const tabs = document.querySelectorAll('[role="tab"]');
        const panels = document.querySelectorAll('[role="tabpanel"]');

        const switchTab = (oldTab, newTab) => {
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
        };

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

    static setupAlertDialog() {
        const alertDialog = document.getElementById('alertDialog');
        if (!alertDialog) return;

        const closeBtn = alertDialog.querySelector('.close-btn');
        const closeBtnFooter = document.getElementById('closeAlertDialog');

        closeBtn.addEventListener('click', () => alertDialog.close());
        closeBtnFooter.addEventListener('click', () => alertDialog.close());
    }
}

