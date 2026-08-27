import { NextAuthOptions, DefaultSession, DefaultUser } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

declare module "next-auth" {
  interface User extends DefaultUser {
    isBanned?: boolean;
    accentColor?: string;
    customName?: string;
    isDemo?: boolean;
  }
  interface Session {
    user: {
      id: string;
      isBanned?: boolean;
      accentColor?: string;
      customName?: string;
      isDemo?: boolean;
    } & DefaultSession["user"];
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      id: "demo-login",
      name: "Mode Démo",
      credentials: {},
      async authorize() {
        // Renvoie l'utilisateur invité démo sans aucune écriture en base
        return {
          id: "demo-user",
          name: "Kylian M. (Démo)",
          email: "demo@planifive.app",
          image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          accentColor: "#22C55E",
          customName: "Kylian (Invité)",
          isDemo: true,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    signIn: async ({ user, account, profile }) => {
      // 1. Accès immédiat pour le compte Démo (Zero-DB)
      if (account?.provider === "credentials" || user?.id === "demo-user" || user?.email === "demo@planifive.app") {
        return true;
      }

      if (!user || !account) return false;

      // 2. Vérification de sécurité Serveur Discord (Guild Check)
      // Si DISCORD_GUILD_ID est défini, seuls les membres du serveur Discord peuvent se connecter
      if (account.provider === "discord") {
        const guildId = process.env.DISCORD_GUILD_ID;
        const botToken = process.env.DISCORD_BOT_TOKEN;

        if (guildId && botToken && profile) {
          try {
            const discordUserId = (profile as any).id;
            const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`, {
              headers: {
                Authorization: `Bot ${botToken}`,
              },
            });

            if (!res.ok) {
              console.warn(`⛔ Utilisateur Discord ${discordUserId} rejeté : non membre du serveur ${guildId}`);
              return false; // Bloque la connexion
            }
          } catch (err) {
            console.error("⚠️ Erreur lors de la vérification de guilde Discord:", err);
          }
        }
      }

      // 3. Vérification de bannissement en base
      if (user.email) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
          // @ts-ignore
          if (dbUser?.isBanned) {
            console.log(`⛔ User ${user.email} is banned. Blocking sign in.`);
            return false; // Blocks sign in
          }
        } catch (e) {
          console.error("Error checking banned status:", e);
        }
      }

      // 4. Mise à jour de l'avatar et du nom Discord
      if (user.id && account.provider === "discord" && profile) {
        try {
          const p = profile as any;
          let imageUrl = user.image;

          if (p.avatar) {
            const format = p.avatar.startsWith("a_") ? "gif" : "png";
            imageUrl = `https://cdn.discordapp.com/avatars/${p.id}/${p.avatar}.${format}`;
          } else {
            const discriminator = parseInt(p.discriminator ?? "0");
            if (discriminator === 0 && p.id) {
              const defaultId = Number(BigInt(p.id) >> BigInt(22)) % 6;
              imageUrl = `https://cdn.discordapp.com/embed/avatars/${defaultId}.png`;
            } else {
              imageUrl = `https://cdn.discordapp.com/embed/avatars/${discriminator % 5}.png`;
            }
          }

          const name = p.global_name || p.username || user.name;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              image: imageUrl,
              name: name,
            },
          });
          console.log(`✅ User ${name} updated with latest Discord data`);
        } catch (e) {
          console.error("⚠️ Error updating user on signin:", e);
        }
      }
      return true;
    },
    jwt: async ({ token, user, account, profile, trigger, session }) => {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.picture = user.image;
        token.name = user.name;
        // @ts-ignore
        token.accentColor = (user as any).accentColor || "#22C55E";
        // @ts-ignore
        token.customName = (user as any).customName || null;
        // @ts-ignore
        token.isDemo = user.id === "demo-user" || (user as any).isDemo === true;
      }
      if (trigger === "update" && session) {
        if (session.accentColor) token.accentColor = session.accentColor;
        if (session.customName !== undefined) token.customName = session.customName;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.image = token.picture;
        session.user.email = token.email;
        // @ts-ignore
        session.user.accentColor = (token.accentColor as string) || "#22C55E";
        // @ts-ignore
        session.user.customName = (token.customName as string) || null;
        // @ts-ignore
        session.user.isDemo = token.isDemo || token.id === "demo-user";
      }
      return session;
    },
  },
};

export const ADMIN_EMAILS = ["sheizeracc@gmail.com"];

export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === email.trim().toLowerCase());
}