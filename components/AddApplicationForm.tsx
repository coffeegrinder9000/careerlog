'use client';

import { useRef, useState, useTransition } from 'react';
import { addApplication } from '@/app/dashboard/actions';

export default function AddApplicationForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function handleAction(formData: FormData) {
    startTransition(async () => {
      await addApplication(formData);
      formRef.current?.reset();
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
          className="p-4 border rounded space-y-3 bg-gray-50"
        >
          <h2 className="font-semibold">New Application</h2>
          <input
            name="company"
            placeholder="Company *"
            required
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            name="role"
            placeholder="Role / Position *"
            required
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <select name="status" className="w-full p-2 border rounded bg-white">
            <option value="applied">Applied</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>
          <textarea
            name="notes"
            placeholder="Notes (optional)"
            rows={2}
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
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