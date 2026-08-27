# Planifive - Plateforme de Planification et Analytics pour Matchs de Futsal

Planifive est une application web fullstack orientee performance concue pour automatiser l'organisation logistique, le matchmaking equilibre et le suivi statistique de sessions de futsal (Five).

L'application combine une interface utilisateur reactive (App Router Next.js, Glassmorphism, animations GPU), un moteur d'equilibrage d'equipes base sur des metriques individuelles, un systeme de gamification avance (profils style cartes FIFA Ultimate Team, votes MVP, leaderboards) ainsi qu'une passerelle bidirectionnelle avec un serveur Discord.

---

## 1. Architecture Technique

Le projet repose sur une architecture moderne avec separation stricte des responsabilites, typage de bout en bout et optimisation des acces base de donnees.

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

### Points Cles d'Ingenierie

* **Moteur d'interception Zero-DB (Mode Demo)** : Un middleware applicatif isole les sessions invites et sert un dataset simule deterministe de 12 joueurs et 7 matchs sans jamais solliciter ni ecrire dans la base de donnees PostgreSQL de production.
* **Optimisation des requetes ORM** : Elimination des cascades sequentielles (N+1) au profit de requetes Prisma executees en parallele (`Promise.all`), reduisant le Time To First Byte (TTFB) de ~2500ms a ~280ms.
* **Algorithme d'equilibrage de matchs** : Moteur de distribution minimisant le differentiel de note globale (OVR = fonction composite de la technique et du cardio) entre deux equipes de 5 a 6 joueurs.
* **Systeme de notation par les pairs (Peer Rating)** : Calcul dynamique des attributs FUT (PAC, SHO, PAS, DRI, DEF, PHY) croisant les statistiques reelles en match (winrate, serie de victoires) et les evaluations anonymes de la communaute.
* **Automatisation CRON** : Pipelines planifies pour la notification des creneaux complets, les rappels de cloture de votes et le declenchement des sondages MVP post-match.

---

## 2. Stack Technologique

| Domaine | Technologies |
| :--- | :--- |
| **Framework Frontend** | Next.js 16 (App Router), React 19, TypeScript |
| **Styles & Animations** | Tailwind CSS, Vanilla CSS Modules, Framer Motion, Three.js / Canvas |
| **Backend & API** | Next.js Route Handlers, Node.js Runtime |
| **Base de Donnees & ORM** | PostgreSQL (Supabase), Prisma ORM |
| **Authentification** | NextAuth.js (OAuth Discord, Credentials Provider Demo, Guild Restriction) |
| **Integrations Tierces** | Discord API v10, Webhooks, CRON Workers |

---

## 3. Apercu des Fonctionnalites et Captures

### 3.1 Tableau de Bord & Analytics
Vue centralisee regroupant l'etat d'activite de la communaute, le suivi des creneaux a forte affluence, la dynamique de participation sur 7 jours et le joueur du mois (MVP).

![Tableau de bord](docs/screenshots/01-dashboard.png)

### 3.2 Grille de Planification Interactive
Matrice de disponibilites hebdomadaire permettant aux joueurs d'enregistrer leurs creneaux en un clic avec synchronisation d'etat immediate et indicateur d'affluence.

![Grille de planification](docs/screenshots/02-planning-grid.png)

### 3.3 Generateur d'Equipes Equilibrees
Algorithme de matchmaking repartissant automatiquement les inscrits d'un creneau en deux formations homogenes sur la base de leurs evaluations techniques et physiques.

![Generateur d'equipes](docs/screenshots/03-team-generator.png)

### 3.4 Profils Joueurs & Cartes FUT Dynamiques
Fiche de joueur detaillee affichant les attributs calcules (Vitesse, Tir, Passe, Dribble, Defense, Physique), l'analyse des synergies (Meilleur binome) et la bete noire statistique.

![Carte FUT et profil](docs/screenshots/04-fut-card-profile.png)

### 3.5 Classement et Gamification
Leaderboard comparatif base sur le taux de victoire, le ratio victoires/defaites, les series d'invincibilite et le debloquage de badges de performance.

![Classement des joueurs](docs/screenshots/05-leaderboard.png)

### 3.6 Historique des Rencontres & Votes MVP
Journal des scores passes avec composition des effectifs, archivage chronologique et module de vote communautaire pour elire le joueur cle du match.

![Historique des matchs](docs/screenshots/06-history-mvp.png)

---

## 4. Modele de Donnees (Schema Prisma)

Le schema relationnel structure les entites principales suivantes :

* **User** : Compte utilisateur, identifiants Discord, statistiques de jeu de base, metadonnees graphiques (couleur d'accent, avatar).
* **Availability** : Couple (date, heure) liant un utilisateur a un creneau de la semaine.
* **Match** : Score final, date, lieu, associations relationnelles many-to-many vers les equipes et archivage des votes MVP.
* **Call** : Declenchement d'appels de match ponctuels avec suivi des reponses individuelles (Present, Absent, En attente).
* **FUTCardRating** : Evaluations croisees des 6 attributs majeurs entre membres de la communaute.
* **Notification** : File de messages in-app et alertes d'evenements.

---

## 5. Securite et Restrictions d'Acces

1. **Restriction par Serveur Discord (Guild Check)** :
   Le callback de connexion NextAuth verifie l'appartenance de l'utilisateur a la guilde Discord configuree (`DISCORD_GUILD_ID`). Tout utilisateur externe au serveur Five prive est refuse.
2. **Isolation du Mode Demo** :
   Les requetes portant le flag de session demo sont interceptees en amont des controllers Prisma, garantissant l'integrite absolue de la base de production.
3. **Controle des Droits d'Administration** :
   Les routes critiques (gestion des creneaux, saisie des scores, moderation) requierent des privileges administrateurs explicites verifies par email de session.

---

## 6. Installation et Deploiement Local

### Pre-requis
* Node.js version 18.17 ou superieure
* Gestionnaire de paquets `npm` ou `pnpm`
* Instance PostgreSQL (locale ou distante type Supabase / Neon)

### 1. Cloner le depot
```bash
git clone https://github.com/Git-MohamedB/planifive.git
cd planifive
```

### 2. Installer les dependances
```bash
npm install
```

### 3. Configuration des variables d'environnement
Creer un fichier `.env` a la racine en vous basant sur la structure suivante :

```env
# Base de donnees
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

# Cron Security Token
CRON_SECRET="votre_token_securite_cron"
```

### 4. Synchroniser le schema Prisma
```bash
npx prisma generate
npx prisma db push
```

### 5. Lancer le serveur de developpement
```bash
npm run dev
```
L'application est accessible sur `http://localhost:3000`.

---

## 7. Scripts Disponibles

* `npm run dev` : Demarre l'environnement de developpement avec Turbopack.
* `npm run build` : Compile et optimise l'application pour la production.
* `npm run start` : Lance l'application en mode production.
* `npm run lint` : Analyse statique du code source avec ESLint.
