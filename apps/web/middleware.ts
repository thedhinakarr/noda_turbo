import { auth } from "@/app/api/auth/[...nextauth]/route";

// The auth function from Auth.js can be directly used as middleware.
// It will automatically handle session checking and redirection.
export default auth;

// The config object specifies which routes the middleware should protect.
export const config = {
  // This matcher ensures the middleware runs on all paths EXCEPT:
  // - /api/ routes (to allow public API access if needed, but auth checks are still done)
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico
  // This effectively protects all your pages.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
