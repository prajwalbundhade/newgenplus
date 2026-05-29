/**
 * Login layout — no auth required.
 * Isolated from the admin layout so unauthenticated users can reach it.
 */

export const metadata = {
  title: 'Admin Login — NewGenPlus',
  robots: 'noindex, nofollow',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  // LoginForm renders its own full-page layout (min-h-screen, centered).
  // This layout is a transparent pass-through.
  return <>{children}</>
}
