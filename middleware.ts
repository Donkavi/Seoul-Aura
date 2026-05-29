import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    // Admin routes additionally require isAdmin; redirect non-admins to home
    if (pathname.startsWith("/admin") && !req.nextauth.token?.isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      // Any route in the matcher requires a valid token; unauthenticated → /account
      authorized: ({ token }) => !!token,
    },
    pages: {
      // Send unauthenticated users to our custom sign-in page instead of /api/auth/signin
      signIn: "/account",
    },
  }
);

export const config = {
  // /admin/* requires admin, /checkout and /pre-order require any logged-in user
  matcher: ["/admin/:path*", "/checkout", "/pre-order"],
};
