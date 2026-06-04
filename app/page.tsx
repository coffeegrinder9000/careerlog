import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">CareerLog</h1>
      <p className="text-lg mb-8 text-gray-600">Track your job search in one place.</p>
      <div className="flex gap-4">
        <Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Login
        </Link>
        <Link href="/register" className="bg-slate-800 text-white px-6 py-2 rounded hover:bg-slate-900">
          Register
        </Link>
      </div>
    </main>
  );
}
