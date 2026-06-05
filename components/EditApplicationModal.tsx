'use client';

import { useTransition, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { updateApplication } from '@/app/dashboard/update-action';
import type { Application } from '@prisma/client';

const STATUS_OPTIONS = [
  { value: 'applied',   label: 'Applied',   active: 'bg-blue-500 text-white border-blue-500',       inactive: 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50' },
  { value: 'interview', label: 'Interview', active: 'bg-amber-500 text-white border-amber-500',     inactive: 'bg-white text-amber-600 border-amber-300 hover:bg-amber-50' },
  { value: 'offer',     label: 'Offer',     active: 'bg-emerald-500 text-white border-emerald-500', inactive: 'bg-white text-emerald-600 border-emerald-300 hover:bg-emerald-50' },
  { value: 'rejected',  label: 'Rejected',  active: 'bg-red-500 text-white border-red-500',         inactive: 'bg-white text-red-600 border-red-300 hover:bg-red-50' },
];

interface Props {
  app: Application;
  onClose: () => void;
}

export default function EditApplicationModal({ app, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedStatus, setSelectedStatus] = useState(app.status);
  const statusInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function handleAction(formData: FormData) {
    startTransition(async () => {
      await updateApplication(formData);
      router.refresh(); // re-fetches server component data so status badge and chart update
      onClose();
    });
  }

  return (
    // Backdrop — click outside to close
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      {/* Modal panel — stop click from bubbling to backdrop */}
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-indigo-700">Edit Application</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <form action={handleAction} className="space-y-4">
          {/* Hidden fields */}
          <input type="hidden" name="id" value={app.id} />
          <input type="hidden" name="status" ref={statusInputRef} defaultValue={app.status} />

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-blue-700">Company</label>
            <input
              name="company"
              defaultValue={app.company}
              required
              className="w-full p-2 border-2 border-blue-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-violet-700">Role / Position</label>
            <input
              name="role"
              defaultValue={app.role}
              required
              className="w-full p-2 border-2 border-violet-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-emerald-700">Status</label>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map(({ value, label, active, inactive }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSelectedStatus(value);
                    if (statusInputRef.current) statusInputRef.current.value = value;
                  }}
                  className={`px-3 py-1.5 rounded-lg border-2 text-sm font-semibold transition-colors ${
                    selectedStatus === value ? active : inactive
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-amber-700">Notes (optional)</label>
            <textarea
              name="notes"
              defaultValue={app.notes ?? ''}
              rows={3}
              className="w-full p-2 border-2 border-amber-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border hover:bg-gray-100 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}