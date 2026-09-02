# Planifive - Plateforme de Planification et d'Analytics pour Matchs de Futsal

Planifive est une application web fullstack conçue pour automatiser l'organisation logistique, le matchmaking équilibré et l'analyse statistique de sessions de futsal (Five).

Le projet transforme l'organisation traditionnellement chaotique des matchs (sondages éparpillés sur WhatsApp, déséquilibres de niveau, désistements imprévus) en une expérience fluide et automatisée grâce à une interface réactive, un algorithme d'équilibrage d'équipes et une passerelle bidirectionnelle avec Discord.

Pour tester la démo : https://planifive.vercel.app/
---

## 1. Fonctionnalités et Parcours Utilisateur

### 1.1 Tableau de Bord Centralisé (Dashboard)
Le tableau de bord offre une vue synthétique de l'activité hebdomadaire :
* **Indicateurs d'affluence** : Suivi du nombre de joueurs disponibles sur la semaine en cours.
* **Créneaux à forte affluence (Golden Slots)** : Détection automatique des créneaux atteignant le seuil de 10 joueurs requis pour un match.
* **Tendance sur 7 jours** : Graphique d'activité quotidien permettant d'identifier les jours les plus prisés.
* **Bilan personnel & Win Rate** : Statistiques individuelles (victoires, nuls, défaites, série en cours) calculées en temps réel.
* **Joueur du Mois (MVP)** : Mise en avant du joueur le plus performant sur les 30 derniers jours.

![Tableau de bord Planifive](docs/screenshots/dashboardpng.png)

---

### 1.2 Grille de Planification Interactive
Une matrice hebdomadaire interactive (Lundi à Dimanche, de 18h à 22h) :
* **Vote en un clic** : Inscription instantanée sur un créneau horaire avec mise à jour optimiste de l'interface (Optimistic UI).
* **Visibilité des effectifs** : Affichage des jauges de remplissage (ex: 8/10, 10/10) et des avatars des participants.
* **Mise en valeur des créneaux complets** : Les créneaux atteignant 10 inscrits passent automatiquement en surbrillance dorée et débloquent les actions de match.

![Grille de planification des disponibilités](docs/screenshots/planning.png)

---

### 1.3 Moteur d'Équilibrage et Générateur d'Équipes
Dès qu'un créneau réunit au moins 10 participants, le générateur d'équipes peut être déclenché :
* **Distribution algorithmique** : Répartition des 10 joueurs en deux formations (Équipe A vs Équipe B) en minimisant l'écart de niveau global (OVR).
* **Prise en compte des attributs** : La note de chaque joueur combine sa note technique (60%) et son niveau d'endurance/cardio (40%).
* **Ajustement manuel** : Possibilité de rééquilibrer les compositions avant validation finale.

![Générateur d'équipes équilibrées](docs/screenshots/team-generation.png)
![Résultat de la génération d'équipes](docs/screenshots/team-generation-2.png)

---

### 1.4 Profils Joueurs et Cartes FUT Dynamiques
Chaque joueur dispose d'une carte personnalisée inspirée du mode Ultimate Team de FIFA :
* **Attributs calculés (PAC, SHO, PAS, DRI, DEF, PHY)** : Générés dynamiquement en combinant l'assiduité, le taux de victoire et les données de performance.
* **Évaluation par les pairs (Peer Rating)** : Les membres peuvent s'évaluer mutuellement de manière anonyme pour affiner les statistiques communautaires.
* **Synergies et Némésis** : Détection statistique du binôme le plus efficace (Meilleur Duo) et du joueur adverse le plus redoutable (Bête Noire).
* **Système de Badges** : Récompenses débloquées selon des paliers (Roi du Five, Le Métronome, Guerrier du Week-end, etc.).

![Carte FUT et profil joueur](docs/screenshots/carte-fut.png)

---

### 1.5 Classement Général et Gamification
Un leaderboard dynamique classe l'ensemble des joueurs selon leurs performances :
* **Critères de classement** : Taux de victoire (Win Rate), volume de victoires, ratio victoires/défaites et forme récente.
* **Podium visuel** : Mise en valeur des trois meilleurs joueurs de la saison.
* **Filtrage et recherche** : Consultation rapide des fiches et statistiques de chaque membre.

![Classement général des joueurs](docs/screenshots/leaderboard.png)

---

### 1.6 Historique des Matchs et Élection du MVP
Un journal complet assure la traçabilité de toutes les rencontres passées :
* **Feuilles de match** : Date, lieu (ex: Le Five, UrbanSoccer), score final et composition exacte des deux équipes.
* **Module de vote MVP** : Après chaque match, les participants peuvent voter pour le meilleur joueur de la rencontre directement depuis l'interface ou via Discord.

![Historique des rencontres](docs/screenshots/history.png)
![Module de vote pour le MVP du match](docs/screenshots/election-mvp.png)

---

### 1.7 Écosystème Discord et Tâches Planifiées (CRON)
L'application est synchronisée en temps réel avec un serveur Discord dédié :
* **Webhooks automatisés** : Annonce des créneaux complets, récapitulatifs hebdomadaires et alertes d'appels de match.
* **Bot Discord interactif** : Envoi d'embeds enrichis avec boutons d'interaction permettant de voter ou de répondre à un appel sans quitter Discord.
* **Synchronisation des avatars** : Récupération automatique des photos de profil et pseudos Discord.
* **Pipelines CRON** : Tâches d'arrière-plan automatisant les rappels de disponibilité et les clôtures de votes.

---

## 2. Architecture Technique et Choix d'Ingénierie

```text
               +---------------------------------------------------+
               |             Client Web (Next.js 16)               |
               |  - React 19 / Server & Client Components          |
               |  - Framer Motion / Three.js Canvas                |
               |  - Optimistic UI Updates & Haptic Feedback        |
               +-------------------------+-------------------------+
                                         |
                            HTTPS / JSON | NextAuth JWT
                                         v
               +---------------------------------------------------+
               |             Next.js API Route Handlers            |
               |  - Parallelized Query Execution (Promise.all)     |
               |  - Demo Sandbox Middleware (Zero-DB In-Memory)    |
               |  - Webhook Handlers & CRON Worker Endpoints       |
               +------------+--------------------+-----------------+
                            |                    |
              Prisma Client |                    | REST / Bot API
                            v                    v
            +----------------------+   +-------------------+
            | PostgreSQL Database  |   |   Discord Server  |
            | (Supabase Cluster)   |   |   - Webhooks      |
            +----------------------+   |   - Interactions  |
                                       +-------------------+
```

### 2.1 Mode Démo Hermétique (Zero-DB Sandbox)
Pour permettre aux visiteurs et recruteurs d'explorer l'intégralité de l'application sans nécessiter de compte Discord ni polluer la base de production :
* Un provider d'authentification dédié (`demo-login`) initialise une session invité.
* Un middleware applicatif intercepte toutes les routes API (`/api/dashboard`, `/api/matches`, `/api/availability`, etc.) pour servir un jeu de données simulé en mémoire (12 joueurs, 7 matchs, créneaux complets).
* Aucune écriture n'est effectuée sur PostgreSQL : chaque session bénéficie d'une expérience propre et reproductible.

### 2.2 Optimisation des Performances Backend
* **Éradication des requêtes séquentielles (N+1)** : Remplacement des cascades de requêtes `await` successives par des exécutions parallèles (`Promise.all`).
* **Déduplication en mémoire** : Réduction du nombre d'appels à la base de données (la table des matchs n'est interrogée qu'une seule fois par cycle de dashboard, les métriques secondaires étant calculées en mémoire Node.js/V8).
* **Gain mesuré** : Réduction du temps de réponse moyen de l'API de **~2500 ms à moins de 300 ms** (gain de performance x8).

### 2.3 Sécurité et Contrôle d'Accès
* **Vérification d'appartenance Discord (Guild Check)** : Le callback NextAuth vérifie auprès de l'API Discord que le compte appartient bien au serveur Five privé. Tout utilisateur externe est automatiquement refusé.
* **Privilèges Administrateurs** : Les routes sensibles (gestion des créneaux, saisie des scores, modération) sont protégées par vérification d'email au niveau serveur.

---

## 3. Stack Technologique

| Domaine | Technologies | Rôle |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript | Architecture modulaire, Server & Client Components, typage strict |
| **Styling & UI** | Vanilla CSS Modules, Tailwind CSS, Framer Motion | Glassmorphism, animations GPU, design responsive |
| **Effets Visuels** | Three.js, Canvas | Logo dynamique et effets interactifs |
| **Backend** | Next.js Route Handlers, Node.js Runtime | Endpoints REST, logique métier, pipelines de données |
| **Base de Données & ORM** | PostgreSQL (Supabase), Prisma ORM | Modélisation relationnelle, requêtes typées, migrations |
| **Authentification** | NextAuth.js | OAuth Discord, Credentials Demo Provider, sessions JWT sécurisées |
| **Automatisation** | Discord API v10, Webhooks, CRON Jobs | Notifications automatisées et intégration Discord bidirectionnelle |

---

## 4. Modèle de Données (Schéma Prisma)

Le schéma relationnel PostgreSQL est structuré autour des entités suivantes :

* **User** : Profil du joueur, identifiants Discord, notes techniques/cardio de base, couleur d'accent et préférences.
* **Availability** : Association entre un joueur, une date et une heure de créneau.
* **Match** : Résultat d'une rencontre, date, lieu, relations many-to-many vers les compositions d'équipes et registre des votes MVP.
* **Call** : Instance d'appel de match ponctuel avec suivi des statuts de réponse (Accepté, Refusé, En attente).
* **FUTCardRating** : Évaluations croisées des 6 attributs majeurs (PAC, SHO, PAS, DRI, DEF, PHY) attribuées entre joueurs.
* **Notification** : File d'alertes in-app pour les événements clés (créneaux complets, rappels de vote).

---

## 5. Installation et Démarrage Local

### Pré-requis
* Node.js version 18.17 ou supérieure
* Gestionnaire de paquets `npm` ou `pnpm`
* Instance PostgreSQL (Supabase, Neon ou instance locale)

### 1. Cloner le dépôt
```bash
git clone https://github.com/Git-MohamedB/planifive.git
cd planifive
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer les variables d'environnement
Créer un fichier `.env` à la racine du projet en renseignant les clés nécessaires :

```env
# Base de données PostgreSQL (Supabase)
DATABASE_URL="postgresql://user:password@host:5432/dbname"
DIRECT_URL="postgresql://user:password@host:5432/dbname"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre_secret_nextauth"

# Discord OAuth & Bot
DISCORD_CLIENT_ID="votre_client_id"
DISCORD_CLIENT_SECRET="votre_client_secret"
DISCORD_BOT_TOKEN="votre_bot_token"
DISCORD_GUILD_ID="votre_guild_id"

# Webhooks Discord
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
DISCORD_SUMMARY_WEBHOOK_URL="https://discord.com/api/webhooks/..."

# Sécurité des tâches CRON
CRON_SECRET="votre_token_securite_cron"
```

### 4. Synchroniser le schéma de base de données
```bash
npx prisma generate
npx prisma db push
```

### 5. Lancer l'application en développement
```bash
npm run dev
```
L'application est accessible à l'adresse `http://localhost:3000`.

---

## 6. Scripts Disponibles

* `npm run dev` : Lance le serveur de développement avec Turbopack.
* `npm run build` : Compile et optimise le bundle de production.
* `npm run start` : Démarre le serveur de production.
* `npm run lint` : Exécute l'analyse statique du code avec ESLint.

