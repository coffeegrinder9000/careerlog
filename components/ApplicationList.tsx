'use client';

import { useState, useTransition } from 'react';
import { deleteApplication } from '@/app/dashboard/actions';
import EditApplicationModal from './EditApplicationModal';
import type { Application } from '@prisma/client';

const STATUS_STYLES: Record<string, string> = {
  applied:   'bg-blue-100 text-blue-800',
  interview: 'bg-amber-100 text-amber-800',
  offer:     'bg-emerald-100 text-emerald-800',
  rejected:  'bg-red-100 text-red-800',
};

function ApplicationCard({ app }: { app: Application }) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  function handleDelete(formData: FormData) {
    if (!confirm(`Delete ${app.company} — ${app.role}?`)) return;
    startTransition(async () => {
      await deleteApplication(formData);
    });
  }

  return (
    <>
      {editing && (
        <EditApplicationModal app={app} onClose={() => setEditing(false)} />
      )}

      <div className={`border rounded-xl p-4 shadow-sm transition-opacity ${isPending ? 'opacity-40' : ''}`}>
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-lg leading-tight">{app.company}</h3>
          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLES[app.status] ?? 'bg-gray-100 text-gray-700'}`}>
            {app.status}
          </span>
        </div>

        <p className="text-gray-600 mb-2">{app.role}</p>

        {app.notes && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-2">{app.notes}</p>
        )}

        <p className="text-xs text-gray-400 mb-3">
          {new Date(app.appliedDate).toLocaleDateString()}
        </p>

        <div className="flex gap-3 border-t pt-3">
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-indigo-600 font-medium hover:underline"
          >
            Edit
          </button>

          <form action={handleDelete}>
            <input type="hidden" name="id" value={app.id} />
            <button
              type="submit"
              disabled={isPending}
              className="text-sm text-red-500 hover:underline disabled:opacity-50"
            >
              Delete
            </button>
          </form>
        </div>
      </div>
    </>
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