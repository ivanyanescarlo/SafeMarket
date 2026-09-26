import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function RiskBadge({ level = 'Low', size = 'sm', showLabel = true }) {
  const norm = (level || 'Low').toLowerCase();

  if (norm === 'high') {
    return (
      <span
        title="Gemini AI Scam Risk Analyzer: High Risk Warning"
        className={`inline-flex items-center gap-1 font-semibold rounded-full border border-rose-200 bg-rose-50 text-rose-700 ${
          size === 'lg' ? 'px-3 py-1 text-sm' : size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
        }`}
      >
        <ShieldAlert className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3 text-rose-600'} />
        {showLabel && <span>High Risk</span>}
      </span>
    );
  }

  if (norm === 'medium' || norm === 'moderate') {
    return (
      <span
        title="Gemini AI Scam Risk Analyzer: Medium Risk Flag"
        className={`inline-flex items-center gap-1 font-semibold rounded-full border border-amber-200 bg-amber-50 text-amber-700 ${
          size === 'lg' ? 'px-3 py-1 text-sm' : size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
        }`}
      >
        <AlertTriangle className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3 text-amber-600'} />
        {showLabel && <span>Medium Risk</span>}
      </span>
    );
  }

  // Low / Safe
  return (
    <span
      title="Gemini AI Scam Risk Analyzer: Low Scam Risk"
      className={`inline-flex items-center gap-1 font-semibold rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 ${
        size === 'lg' ? 'px-3 py-1 text-sm' : size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
      }`}
    >
      <ShieldCheck className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3 text-emerald-600'} />
      {showLabel && <span>Low Risk</span>}
    </span>
  );
}
