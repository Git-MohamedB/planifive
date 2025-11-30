import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    signIn: async ({ user, account, profile }) => {
      // Basic check to ensure we have necessary data
      if (!user || !account) return false;
      return true;
    },
    session: async ({ session, user, token }) => {
      // Try to get data from token first (JWT strategy)
      if (token) {
        if (!session.user) session.user = {} as any;
        session.user.id = token.sub!;
        session.user.name = token.name;
        session.user.image = token.picture;
        session.user.email = token.email;
      }
      // Then try from user (database strategy)
      else if (user) {
        if (!session.user) session.user = {} as any;
        session.user.id = user.id;
        session.user.name = user.name;
        session.user.image = user.image;
        session.user.email = user.email;
      }

      return session;
    },
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};