import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Admin from "@/models/Admin";

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
        }
      }
      return true;
    },

    /**
     * On first sign-in (user object present), check the Admin collection.
     * The result is stored in the JWT so middleware can read it without a DB call.
     */
    async jwt({ token, user }) {
      if (user) {
        // Called once at sign-in — embed isAdmin for the lifetime of this session
        try {
          await connectDB();
          const email = user.email?.toLowerCase() ?? "";
          const bootstrapAdmin = process.env.ADMIN_EMAIL?.toLowerCase();
          const isBootstrap = !!bootstrapAdmin && email === bootstrapAdmin;
          const dbAdmin = await Admin.findOne({ email });
          token.isAdmin = isBootstrap || !!dbAdmin;
        } catch {
          token.isAdmin = false;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
        (session.user as any).isAdmin = token.isAdmin ?? false;
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
