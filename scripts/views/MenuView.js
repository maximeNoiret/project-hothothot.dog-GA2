// scripts/views/MenuView.js
export class MenuView {
    constructor() {
        // Les boutons du menu
        this.homeLink = document.getElementById('link-home');
        this.docLink = document.getElementById('link-doc');
        
        // Les deux sections
        this.vueAccueil = document.getElementById('vue-accueil');
        this.vueDoc = document.getElementById('vue-doc');
        
        this.initEvents();
    }

    initEvents() {
        this.homeLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.renderHome();
        });

        this.docLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.renderDoc();
        });
    }

    renderDoc() {
        // 1. On injecte tout ton texte HTML dans la section vide
        this.vueDoc.innerHTML = `
            <h1>Documentation</h1>
            
            <h2>Notre Équipe</h2>
            <ul>
                <li>Adam Kuropatwa-Butté</li>
                <li>Maxime Noiret</li>
                <li>Dimitri Crespo–michailid</li>
            </ul>

            <h2>Description du projet</h2>
            <h3>Organisation</h3>
            <p>
                Le projet : <a href="https://github.com/maximeNoiret/project-hothothot.dog-GA2" target="_blank">Projet Hot-Hot-Hot-Hot-Hot-Hot-Hot-Hot</a><br>
                La consigne: <a href="https://github.com/maximeNoiret/project-hothothot.dog-GA2/projects/5" target="_blank">La consigne</a>
            </p>

            <h3>Avec quelle outils nous avant travailler ?</h3>
            <p>Les voici :</p>
            <ul>
                <li><strong>HTML/CSS</strong> : Pour la structures et le visuel de tout les pages.</li>
                <li><strong>JavaScript</strong> : pour la PWA.</li>
                <li><strong>GitHub</strong> : pour notre collaboration.</li>
            </ul>`;

        this.vueAccueil.hidden = true;
        this.vueDoc.hidden = false;
    }
    
    renderHome() {
        this.vueDoc.hidden = true;
        this.vueAccueil.hidden = false;
    }
}