import React, { useState } from 'react';

export default function ReasonActionModal({
  title,
  description,
  reasonLabel = 'Reason',
  initialReason = '',
  confirmLabel,
  confirmClassName = 'bg-rose-600 hover:bg-rose-700',
  onCancel,
  onConfirm
}) {
  const [reason, setReason] = useState(initialReason);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!reason.trim()) {
      setError(`Enter a ${reasonLabel.toLowerCase()}.`);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onConfirm(reason.trim());
    } catch (err) {
      setError(err.message || 'The action could not be completed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-action-dialog-title"
      >
        <div>
          <h3 id="admin-action-dialog-title" className="text-base font-bold text-slate-900">
            {title}
          </h3>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <div>
          <label htmlFor="admin-action-reason" className="mb-1.5 block text-xs font-semibold text-slate-700">
            {reasonLabel}
          </label>
          <textarea
            id="admin-action-reason"
            rows={3}
            maxLength={500}
            required
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-safegreen-500"
          />
        </div>

        {error && <p role="alert" className="text-xs font-medium text-rose-700">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            disabled={submitting}
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-50 ${confirmClassName}`}
          >
            {submitting ? 'Saving...' : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}