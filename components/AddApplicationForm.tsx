'use client';

import { useRef, useState, useTransition } from 'react';
import { addApplication } from '@/app/dashboard/actions';

export default function AddApplicationForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('applied');
  function handleAction(formData: FormData) {
    startTransition(async () => {
      await addApplication(formData);
      formRef.current?.reset();
      setSelectedStatus('applied');
      setOpen(false);
    });
  }

  return (
    <div className="mb-8">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Application
        </button>
      )}

      {open && (
        <form
          ref={formRef}
          action={handleAction}
          className="p-6 border-2 border-blue-200 rounded-xl space-y-4 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md"
        >
          <h2 className="text-lg font-bold text-indigo-700">New Application</h2>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-blue-700">Company</label>
            <input
              name="company"
              placeholder="e.g. Acme Corp"
              required
              className="w-full p-2 border-2 border-blue-200 rounded-lg bg-white text-black focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 placeholder-blue-300"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-violet-700">Role / Position</label>
            <input
              name="role"
              placeholder="e.g. Frontend Engineer"
              required
              className="w-full p-2 border-2 border-violet-200 rounded-lg bg-white text-black focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200 placeholder-violet-300"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-emerald-700">Status</label>
            <select
              name="status"
              className="w-full p-2 border-2 border-emerald-200 rounded-lg bg-white text-black focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
            >
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-amber-700">Notes (optional)</label>
            <textarea
              name="notes"
              placeholder="Any details worth remembering..."
              rows={2}
              className="w-full p-2 border-2 border-amber-200 rounded-lg bg-white text-black focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 placeholder-amber-300"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded border hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}