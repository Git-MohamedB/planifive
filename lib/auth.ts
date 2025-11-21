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
    }),
  ],
  callbacks: {
    session: async ({ session, user, token }) => {
      // Try to get data from token first (JWT strategy)
      if (token) {
        session.user.id = token.sub!;
        // @ts-ignore
        session.user.name = token.name;
        // @ts-ignore
        session.user.image = token.picture;
        // @ts-ignore
        session.user.email = token.email;
      }
      // Then try from user (database strategy)
      else if (user) {
        // @ts-ignore
        session.user.id = user.id;
        // @ts-ignore
        session.user.name = user.name;
        // @ts-ignore
        session.user.image = user.image;
        // @ts-ignore
        session.user.email = user.email;
      }

      console.log("=== AUTH.TS SESSION CALLBACK ===");
      console.log("Token:", token);
      console.log("User:", user);
      console.log("Final session:", session);

      return session;
    },
  },
};