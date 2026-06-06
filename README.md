# CRM Vitres & Cie

Mini-CRM web pour une activité de **nettoyage de vitres** — clients, agenda, devis, factures, relances et rapports, le tout dans une seule application qui tourne directement dans le navigateur.

---

## ✨ Fonctionnalités

- **Accueil** — tableau de bord : chiffre d'affaires, RDV du jour, devis en cours, notifications et tâches à traiter.
- **Ma journée** — vue centrée sur les interventions du jour.
- **Clients** — carnet d'adresses (particuliers & professionnels), recherche et filtres.
- **Agenda** — calendrier semaine/mois, création de RDV (intervention, devis, appel…).
- **Devis** — création, envoi, suivi (créé → envoyé → accepté).
- **Factures** — facturation, encaissements et règlements (créée → envoyée → payée).
- **Relances** — rappels automatiques (RDV, devis sans réponse, factures en retard).
- **Rapports** — chiffre d'affaires mensuel, meilleurs clients, répartition de la clientèle.
- **Réglages** — profil de l'entreprise, facturation, apparence (thème, police, couleur, densité).
- **Archives** — historique des RDV, devis et factures.

---

## 💾 Sauvegarde des données

Les données saisies (clients, RDV, devis, factures, règlements, réglages) sont **enregistrées
automatiquement dans le navigateur** (localStorage) — elles survivent à un rafraîchissement
ou à une fermeture de l'onglet.

> ⚠️ **À savoir :** le stockage est **local à chaque navigateur / appareil**. Les données ne sont
> ni synchronisées entre appareils, ni partagées entre utilisateurs, et sont perdues si le cache
> du navigateur est vidé. Pour une synchronisation multi-appareils, il faudrait brancher une base
> de données en ligne (ex. Supabase ou Firebase).

---

## 🚀 Utilisation

Aucune installation, aucune compilation. C'est un site statique :

- **En local :** ouvrez simplement `index.html` dans un navigateur.
- **En ligne :** déployez le dossier tel quel sur un hébergeur statique (Netlify, GitHub Pages, Vercel…).

### Déploiement sur Netlify

1. Connectez votre compte Netlify à GitHub.
2. « Add new site » → « Import an existing project » → choisissez ce dépôt.
3. Laissez les réglages par défaut (pas de commande de build, dossier de publication = racine).
4. « Deploy » — le site est en ligne.

---

## 🗂️ Structure du projet

```
index.html            Page d'entrée (charge React + les scripts ci-dessous)
app.jsx               Coquille de l'application : navigation, routage, panneau Tweaks
core/
  data.js             Données métier + sauvegarde automatique (localStorage)
ui/
  components.jsx      Composants réutilisables (boutons, cartes, titres, icônes…)
  tweaks-panel.jsx    Panneau de personnalisation (thème, police, accent, densité)
forms/
  forms.jsx           Formulaires : client, devis/facture, rendez-vous, règle de relance
views/
  views-core.jsx      Accueil, Clients, Fiche client, Ma journée
  views-ops.jsx       Agenda, Devis, Factures, document papier
  views-more.jsx      Relances, Rapports, Réglages, Archives
styles/
  styles.css          Styles de base (thème, composants)
  views.css           Styles spécifiques aux écrans
```

---

## 🛠️ Technique

- **React 18** + **Babel Standalone** (JSX transpilé dans le navigateur, sans étape de build).
- Aucune dépendance à installer — tout est chargé via CDN dans `index.html`.

---

*Vitres & Cie — Julien Mercier · Nettoyage de vitres, Lyon.*
