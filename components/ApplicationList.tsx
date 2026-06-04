'use client';

import { useTransition } from 'react';
import { deleteApplication } from '@/app/dashboard/actions';
import type { Application } from '@prisma/client';

const STATUS_STYLES: Record<string, string> = {
  applied: 'bg-blue-100 text-blue-800',
  interview: 'bg-yellow-100 text-yellow-800',
  offer: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

function ApplicationCard({ app }: { app: Application }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(formData: FormData) {
    startTransition(async () => {
      await deleteApplication(formData);
    });
  }

  return (
    <div className={`border rounded p-4 shadow-sm transition-opacity ${isPending ? 'opacity-40' : ''}`}>
      <h3 className="font-bold text-lg">{app.company}</h3>
      <p className="text-gray-600 mb-2">{app.role}</p>
      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLES[app.status] ?? 'bg-gray-100 text-gray-700'}`}>
        {app.status}
      </span>
      {app.notes && (
        <p className="text-sm text-gray-500 mt-2 line-clamp-2">{app.notes}</p>
      )}
      <p className="text-xs text-gray-400 mt-2">
        {new Date(app.appliedDate).toLocaleDateString()}
      </p>
      <form action={handleDelete} className="mt-2">
        <input type="hidden" name="id" value={app.id} />
        <button
          type="submit"
          disabled={isPending}
          className="text-red-500 text-sm hover:underline disabled:opacity-50"
        >
          Delete
        </button>
      </form>
    </div>
  );
}

export default function ApplicationList({ applications }: { applications: Application[] }) {
  if (applications.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        No applications yet. Add your first one above!
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {applications.map((app) => (
        <ApplicationCard key={app.id} app={app} />
      ))}
    </div>
  );
}