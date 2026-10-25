<div align="right">
  <a href="./README.md"><img src="https://img.shields.io/badge/Lang-🇬🇧_English-lightgrey?style=for-the-badge" alt="English"></a>
  <a href="./README.fr.md"><img src="https://img.shields.io/badge/Lang-🇫🇷_Français-blue?style=for-the-badge" alt="Français"></a>
</div>

# Planifive

Application web fullstack développée avec Next.js 16, TypeScript, Prisma et PostgreSQL pour automatiser la planification de matchs de futsal (Five), l'équilibrage des équipes, les statistiques joueurs et l'intégration Discord.

Démo en ligne : [https://planifive.vercel.app/](https://planifive.vercel.app/)

![Tableau de bord Planifive](docs/screenshots/dashboardpng.png)

## Contexte & Problème

Organiser des matchs hebdomadaires de foot à 5 dans des conversations de groupe devient vite chaotique : sondages dispersés, désistements tardifs sous le seuil des 10 joueurs et équipes déséquilibrées.

Planifive centralise les votes sur une grille hebdomadaire (lundi au dimanche, 18h à 22h), détecte automatiquement les créneaux complets à 10 joueurs, génère deux équipes équilibrées selon le niveau technique et l'endurance, puis synchronise les appels de match et votes MVP avec Discord.

## Architecture Technique

```mermaid
flowchart LR
    U["Client Web (Next.js 16 / React 19)"] -->|"HTTPS / JWT NextAuth"| MW{"Middleware Mode Démo"}
    MW -->|"Session demo-login"| MEM["Jeu de données en mémoire (12 joueurs, 7 matchs)"]
    MW -->|"Membre Discord vérifié"| API["Routes API App Router (/app/api/*)"]
    API -->|"Requêtes parallèles (Promise.all)"| DB[("PostgreSQL via Prisma ORM")]
    API -->|"Webhooks & Interactions"| DISC["API Discord v10 (Bot & Serveur)"]
    CRON["Tâches CRON (/api/cron)"] -->|"Authorization: CRON_SECRET"| API
```

## Choix d'Ingénierie, Sécurité & Performance

- **Mode démo isolé sans écriture BDD (`demo-login`)** : permet aux recruteurs et visiteurs de tester toutes les fonctionnalités sans compte Discord ni impact sur PostgreSQL, via un middleware servant des données en mémoire sur `/api/dashboard`, `/api/matches` et `/api/availability`.
- **Suppression des requêtes N+1 et déduplication** : remplacement des cascades séquentielles `await` par `Promise.all` et mutualisation des calculs de statistiques en mémoire Node.js, faisant passer la latence API moyenne de ~2500 ms à moins de 300 ms.
- **Contrôle d'accès OAuth Discord & RBAC admin** : le callback NextAuth vérifie l'appartenance au serveur Discord privé (`DISCORD_GUILD_ID`) et résout les droits administrateur côté serveur via `ADMIN_EMAILS` dans la session JWT, sans exposer d'adresses sensibles côté client.
- **Modèle relationnel et équilibrage (`prisma/schema.prisma`)** : entités `User`, `Availability`, `Match`, `Call`, `CallResponse`, `FUTCardRating` et `Notification`. Répartition des 10 joueurs selon un score pondéré (60 % technique, 40 % cardio) avec ajustement manuel possible.

## Démarrage Rapide

### Prérequis

- Node.js >= 18.17 et `npm`
- Une base PostgreSQL (Supabase, Neon ou locale)

### Installation locale

```bash
git clone https://github.com/Git-MohamedB/planifive.git
cd planifive

npm install
```

Créer un fichier `.env` à la racine :

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
DIRECT_URL="postgresql://user:password@host:5432/dbname"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre_secret_nextauth"
ADMIN_EMAILS="admin@exemple.com"

DISCORD_CLIENT_ID="votre_client_id"
DISCORD_CLIENT_SECRET="votre_client_secret"
DISCORD_BOT_TOKEN="votre_bot_token"
DISCORD_GUILD_ID="votre_guild_id"
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
DISCORD_SUMMARY_WEBHOOK_URL="https://discord.com/api/webhooks/..."

CRON_SECRET="votre_token_cron"
```

Synchroniser le schéma et lancer l'application :

```bash
npx prisma generate
npx prisma db push
npm run dev
```

Ouvrir `http://localhost:3000` (le bouton de connexion démo permet de tester l'application sans configurer Discord).

## Pistes d'Amélioration

- Ajouter des tests automatisés (Playwright E2E et tests unitaires d'API) en CI GitHub Actions pour valider le moteur d'équilibrage et les contrôles d'accès.
- Renforcer la validation stricte des entrées API avec Zod et ajouter du rate limiting sur les endpoints publics et CRON.
- Découpler l'envoi des webhooks Discord via une file avec gestion de retry en cas de rate limit API.
