import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

console.log("🔵 LOADING AUTH ROUTE HANDLER");
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };