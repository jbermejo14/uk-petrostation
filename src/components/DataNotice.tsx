import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { getSnapshotNotice } from '@/lib/data';

/**
 * Aviso visible en todas las páginas cuando los datos no son en vivo.
 * No se pinta si la fuente del dataset es en vivo (isLiveSource true).
 */
export default function DataNotice() {
  const notice = getSnapshotNotice();
  if (!notice) return null;

  return (
    <div
      role="status"
      className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs sm:text-sm text-amber-300 light:text-amber-800"
    >
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
      <p>{notice}</p>
    </div>
  );
}
