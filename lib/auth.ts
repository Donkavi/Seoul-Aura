import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    /** Upsert the Google user into MongoDB on every sign-in */
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
          // Still allow sign-in even if DB write fails
        }
      }
      return true;
    },

    /** Expose the MongoDB _id on the session */
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },

    async jwt({ token }) {
      return token;
    },
  },

  pages: {
    signIn: "/account",
    error: "/account",
  },

  session: { strategy: "jwt" },

  secret: process.env.NEXTAUTH_SECRET,
};
