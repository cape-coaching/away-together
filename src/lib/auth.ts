import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

const isDev = process.env.NODE_ENV === "development" || process.env.DEMO_LOGIN === "true";

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

    // Dev-only demo login — bypasses OAuth for local testing
    ...(isDev
      ? [
          CredentialsProvider({
            id: "demo-login",
            name: "Demo Login",
            credentials: {},
            async authorize() {
              const user = await prisma.user.upsert({
                where: { email: "demo@awaytogether.app" },
                update: {},
                create: {
                  username: "traveler_demo",
                  email: "demo@awaytogether.app",
                  name: "Kevin",
                  bio: "Collecting experiences around the world",
                },
              });
              return { id: user.id, name: user.name, email: user.email };
            },
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Credentials provider already handled the upsert in authorize()
      if (account?.provider === "demo-login") return true;

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

    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
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
