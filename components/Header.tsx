import Link from 'next/link';
import { getSession } from '@/lib/auth';
import SignOutButton from './SignOutButton';

export default async function Header() {
  const session = await getSession();

  return (
    <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
      <Link href="/" className="font-bold text-xl text-blue-600">
        JobTracker
      </Link>
      <nav className="flex items-center gap-4 text-sm">
        {session?.user ? (
          <>
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <span className="text-gray-400">{session.user.email}</span>
            <SignOutButton />
          </>
        ) : (
          <>
            <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
            <Link href="/register" className="text-blue-600 hover:underline">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}