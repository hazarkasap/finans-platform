import { auth } from "@/auth";

const protectedPrefixes = ["/dashboard", "/groups", "/accounts", "/bills", "/portfolio"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return Response.redirect(loginUrl);
  }

  const isAuthPage =
    pathname === "/login" || pathname === "/register";
  if (isAuthPage && req.auth) {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/groups/:path*",
    "/accounts/:path*",
    "/bills/:path*",
    "/portfolio/:path*",
    "/login",
    "/register",
  ],
};
