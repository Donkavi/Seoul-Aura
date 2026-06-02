import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token as { isAdmin?: boolean; phoneVerified?: boolean } | null;

    // Admin routes additionally require isAdmin; redirect non-admins to home
    if (pathname.startsWith("/admin") && !token?.isAdmin) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Customer flows require a verified phone number
    if ((pathname === "/checkout" || pathname === "/pre-order") && !token?.phoneVerified) {
      const url = new URL("/verify-phone", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
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
  // /admin/* requires admin; /checkout & /pre-order require a verified phone; /verify-phone requires login
  matcher: ["/admin/:path*", "/checkout", "/pre-order", "/verify-phone"],
};
