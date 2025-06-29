import { auth } from "@/auth"; // Use the new central auth file

export default auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};