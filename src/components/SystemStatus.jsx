import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';

const ROWS = [
  ['database', 'Database', 'Connected', 'Not reachable'],
  ['error_monitoring', 'Error alerts (server)', 'On', 'Add SENTRY_DSN on Vercel'],
  ['error_monitoring_frontend', 'Error alerts (website)', 'On', 'Add VITE_SENTRY_DSN on Vercel'],
  ['weekly_email', 'Weekly parent email', 'On', 'Add RESEND_API_KEY and EMAIL_FROM'],
  ['weekly_email_schedule', 'Email schedule', 'On', 'Add CRON_SECRET'],
  ['azure_voice', 'Azure tutor voice', 'On', 'Using the free Google voice'],
];

// Admin: which services are switched on. Shows only yes/no, never secret values.
const SystemStatus = () => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    apiFetch('/api/admin/system-status')
      .then((res) => (res.ok ? res.json() : null))
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  if (!status) return null;

  return (
    <div className="mb-10 rounded-xl bg-white p-6 shadow">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">System status</h2>
        <p className="text-sm text-gray-500">
          {status.environment} · database “{status.database_name}” · version {status.version}
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ROWS.map(([key, label, on, off]) => (
          <li key={key} className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${status[key] ? 'bg-green-500' : 'bg-amber-400'}`} />
            <span>
              <span className="font-semibold">{label}</span>
              <span className="block text-gray-500">{status[key] ? on : off}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SystemStatus;
