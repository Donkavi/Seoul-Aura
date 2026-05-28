import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // token.isAdmin was set in the jwt() callback at sign-in time
    if (!req.nextauth.token?.isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      // Must be authenticated first; unauthenticated → NextAuth sends to sign-in page
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*"],
};
