import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Admin from "@/models/Admin";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        await connectDB();
        const user = await User.findOne({ email: credentials.email.toLowerCase() });
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: (user._id as { toString(): string }).toString(),
          name: user.name,
          email: user.email,
          image: user.image ?? null,
        };
      },
    }),
  ],

  callbacks: {
    /** Upsert the Google user into MongoDB on every Google sign-in */
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectDB();
          await User.findOneAndUpdate(
            { email: user.email },
            {
              $setOnInsert: {
                name: user.name ?? "",
                email: user.email,
                subscriptionStatus: "none",
                addresses: [],
                phoneVerified: false,
              },
              $set: {
                googleId: account.providerAccountId,
                image: user.image ?? "",
              },
            },
            { upsert: true, new: true }
          );
        } catch (err) {
          console.error("[NextAuth] signIn upsert error:", err);
        }
      }
      return true;
    },

    /**
     * Runs at sign-in (user present) and whenever the client calls session update()
     * (trigger === "update"). We refresh isAdmin, phone, and phoneVerified from the DB
     * so the OTP verification result propagates into the session without a re-login.
     */
    async jwt({ token, user, trigger }) {
      if (user || trigger === "update") {
        try {
          await connectDB();
          const email = (user?.email ?? token.email)?.toLowerCase() ?? "";
          const bootstrapAdmin = process.env.ADMIN_EMAIL?.toLowerCase();
          const isBootstrap = !!bootstrapAdmin && email === bootstrapAdmin;
          const [dbUser, dbAdmin] = await Promise.all([
            User.findOne({ email }),
            Admin.findOne({ email }),
          ]);
          token.isAdmin = isBootstrap || !!dbAdmin;
          token.phone = dbUser?.phone ?? "";
          token.phoneVerified = dbUser?.phoneVerified ?? false;
        } catch {
          token.isAdmin = token.isAdmin ?? false;
          token.phoneVerified = token.phoneVerified ?? false;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
        (session.user as any).isAdmin = token.isAdmin ?? false;
        (session.user as any).phone = token.phone ?? "";
        (session.user as any).phoneVerified = token.phoneVerified ?? false;
      }
      return session;
    },
  },

  pages: {
    signIn: "/account",
    error: "/account",
  },

  session: { strategy: "jwt" },

  secret: process.env.NEXTAUTH_SECRET,
};
