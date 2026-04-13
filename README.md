# 🔥 Projet HotHotHot DOG - Complément Web

Bienvenue sur le dépôt de notre projet de surveillance de températures, réalisé dans le cadre du module de Complément Web.

🔗 **Lien vers le site en ligne (Netlify) :** [https://guileless-arithmetic-93c51e.netlify.app](https://guileless-arithmetic-93c51e.netlify.app)

---

## ⚠️ Notes importantes à l'attention du correcteur

### 1. Concernant l'heure du rendu
Vous remarquerez qu'un *push* a été effectué en dehors de la limite de temps impartie. Il s'agit d'une erreur d'inattention de la part de notre équipe : nous étions persuadés que la date limite de rendu était fixée à **mardi soir (23h59)** et non mardi matin. Nous nous excusons sincèrement pour cette confusion sur l'horaire.

### 2. Concernant le design et l'interface
L'aspect visuel du site (le code CSS, l'esthétique générale de l'interface) a été généré avec l'aide d'une Intelligence Artificielle. Notre objectif était d'avoir un rendu propre et agréable à la navigation, afin de pouvoir concentrer 100% de notre effort manuel sur la logique JavaScript et les exigences techniques du TD. Le rReadme aussi.

---

## 🚀 Fonctionnalités implémentées (Prérequis du TD)

Toute la logique Javascript a été refactorisée pour répondre aux attentes du projet :

- **Architecture Orientée Objet** : Implémentation du pattern *Observer* (Observable / Observers) pour gérer la mise à jour des données en temps réel.
- **Appels Réseaux (Fetch)** : 
  - Récupération des températures en temps réel depuis l'API distante (`http://api.hothothot.dog`) via un proxy pour gérer le HTTPS.
  - Chargement de l'historique des températures depuis un fichier `.json` simulé côté serveur.
- **Accessibilité (ARIA)** : Intégration des rôles et états ARIA (`aria-live`, `role="alert"`, gestion des `tabindex` pour le système d'onglets) pour garantir la lisibilité par les lecteurs d'écran.
- **Navigation AJAX (Single Page App)** : Navigation fluide sans rechargement vers les pages "Mon Compte" et "Documentation" en chargeant des fichiers JSON.
- **Historique du Navigateur** : Utilisation de l'API `History` (`pushState` et événement `popstate`) pour garantir le bon fonctionnement des boutons "Précédent" et "Suivant" du navigateur malgré la navigation AJAX.

---

## 🛠️ Installation en local

Si vous souhaitez faire tourner le projet en local (pour éviter les erreurs CORS liées à l'API) :
1. Clonez ce dépôt.
2. Lancez un serveur web local à la racine du projet (ex: *Live Server* sur VS Code ou `npx serve`).
3. Ouvrez `index.html` dans votre navigateur.
