export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    // Skip auth check for public routes
    '/((?!api|_next/static|_next/image|favicon.ico|auth/login|auth/register).*)',
  ],
}