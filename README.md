# Planifive

**Planifive** est une application web personnelle conçue pour simplifier l'organisation de matchs de foot en salle (Five). Elle centralise la gestion des créneaux, les votes de disponibilité et les statistiques des joueurs.

## Objectif du Projet

Ce projet a été développé pour répondre à un besoin personnel : automatiser l'organisation chronophage des matchs hebdomadaires via WhatsApp. Il sert aujourd'hui de démonstration technique de mes compétences en développement Fullstack et en intégration d'API tierces (Discord).

## Aperçu de l'application

Voici quelques captures d'écran illustrant les différentes fonctionnalités de Planifive :

### Grille de Planification & Votes
![Grille de planning](images/grille_1.png)
![Grille de planning](images/grille_2.png)

### Appel pour un match
![Appel](images/call.png)

### Classement (Gamification)
![Classement des joueurs](images/leaderboard.png)

### Historique des Matchs
![Historique des matchs passés](images/history.png)

### Panel d'Administration
![Page d'administration](images/admin1.png)
![Page d'administration](images/admin2.png)

### Bot Discord
![Match Chaud du moment](images/bot1.png)
![Réponse à un appel](images/bot2.png)

## Fonctionnalités Principales

* ** Planification & Votes** : Système interactif permettant aux joueurs de voter pour leurs créneaux de disponibilité.
* ** Écosystème Connecté (Discord)** :
    * Notifications automatiques des nouveaux sondages.
    * Rappels de vote via bot Discord personnalisé.
    * Synchronisation des avatars utilisateurs Discord <-> App.
* ** Gamification** : Leaderboard dynamique suivant les performances et l'assiduité des joueurs.
* ** Automatisation** : Tâches planifiées (CRON) pour la clôture des votes et l'envoi de rappels.
* ** Sécurité** : Authentification robuste via NextAuth.

## Stack Technique

Architecture moderne axée sur la performance et la type-safety :

| Domaine | Technologie | Usage |
| :--- | :--- | :--- |
| **Frontend** | ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS-blue) | App Router, Server Components, Design System |
| **Backend** | ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![NextAuth](https://img.shields.io/badge/NextAuth-Security-orange) | API Routes, Authentification, Cron Jobs |
| **Data** | ![Prisma](https://img.shields.io/badge/Prisma-ORM-blue) ![SQL](https://img.shields.io/badge/Database-SQLite-blue) | Modélisation des données, gestion des migrations |
| **Langage** | ![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue) | Typage strict de bout en bout |
| **Bot** | ![Discord.js](https://img.shields.io/badge/Discord.js-Bot-5865F2) | Interactivité et notifications temps réel |

## Aperçu de l'Architecture

Le projet suit une architecture modulaire basée sur le **Next.js App Router** :

```text
/app
 ├── /api            # Endpoints API (Auth, Discord Hooks, Cron jobs)
 ├── /leaderboard    # Page de classement avec styles SCSS dédiés
 ├── /history        # Historique des matchs passés
 ├── /admin          # Interface d'administration
 └── /components     # Composants UI réutilisables (Modales de vote, Cartes)
/lib                 # Logique métier partagée (Client Discord, Prisma Singleton)
/prisma              # Schéma de base de données relationnelle
