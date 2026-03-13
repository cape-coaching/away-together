import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Apple Sign-In — add in Phase 2 when building the iOS app
    // AppleProvider({
    //   clientId: process.env.APPLE_CLIENT_ID!,
    //   clientSecret: process.env.APPLE_CLIENT_SECRET!,
    // }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Upsert user on sign-in
      await prisma.user.upsert({
        where: { email: user.email },
        update: { name: user.name ?? "", avatarUrl: user.image },
        create: {
          email: user.email,
          name: user.name ?? "",
          username: generateUsername(user.email),
          avatarUrl: user.image,
        },
      });

      return true;
    },

    async session({ session }) {
      if (session.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, username: true },
        });
        if (dbUser) {
          (session.user as typeof session.user & { id: string; username: string }).id = dbUser.id;
          (session.user as typeof session.user & { id: string; username: string }).username = dbUser.username;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

function generateUsername(email: string): string {
  const base = email.split("@")[0].replace(/[^a-z0-9_]/gi, "_").toLowerCase();
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `${base}_${suffix}`;
}
