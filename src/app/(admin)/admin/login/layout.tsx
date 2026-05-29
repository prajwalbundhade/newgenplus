/**
 * Login layout — no auth required.
 * Isolated from the admin layout so unauthenticated users can reach it.
 */

export const metadata = {
  title: 'Admin Login — NewGenPlus',
  robots: 'noindex, nofollow',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5]">
      {children}
    </div>
  )
}
