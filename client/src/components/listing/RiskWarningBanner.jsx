import React from 'react';
import { ShieldAlert, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

export default function RiskWarningBanner({
  riskLevel = 'Low',
  riskIndicators = [],
  riskSummary = '',
  recommendation = ''
}) {
  const norm = (riskLevel || 'Low').toLowerCase();

  if (norm === 'high') {
    return (
      <div className="rounded-xl border-2 border-rose-300 bg-rose-50/80 p-5 shadow-sm my-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-rose-100 text-rose-700 flex-shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-600 text-white">
                AI Warning
              </span>
              <h4 className="text-base font-bold text-rose-900">
                High Risk Listing Detected
              </h4>
            </div>
            <p className="text-sm text-rose-800 mt-1 font-medium">
              {riskSummary || 'Potential warning signs and high scam probability indicators were identified by Gemini AI.'}
            </p>

            {riskIndicators && riskIndicators.length > 0 && (
              <div className="mt-3 bg-white/80 rounded-lg p-3 border border-rose-200">
                <p className="text-xs font-bold text-rose-900 uppercase tracking-wider mb-1.5">
                  Detected Risk Indicators:
                </p>
                <ul className="space-y-1">
                  {riskIndicators.map((ind, idx) => (
                    <li key={idx} className="text-xs text-rose-700 flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-3 flex items-start gap-2 text-xs font-semibold text-rose-900 bg-rose-100/70 p-2.5 rounded-lg border border-rose-200">
              <Info className="w-4 h-4 text-rose-700 flex-shrink-0 mt-0.5" />
              <span>
                {recommendation || 'Always verify the seller and inspect product details in a public place. NEVER send advance deposits or GCash reservation fees before meetup.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (norm === 'medium' || norm === 'moderate') {
    return (
      <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 shadow-sm my-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100 text-amber-800 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-600 text-white">
                AI Notice
              </span>
              <h4 className="text-sm font-bold text-amber-900">
                Medium Risk Notice – Exercise Caution
              </h4>
            </div>
            <p className="text-xs text-amber-800 mt-1">
              {riskSummary || 'Moderate risk indicators such as pricing variance or urgency were detected by Gemini AI.'}
            </p>

            {riskIndicators && riskIndicators.length > 0 && (
              <div className="mt-2.5 bg-white/70 rounded-md p-2.5 border border-amber-200">
                <ul className="space-y-1">
                  {riskIndicators.map((ind, idx) => (
                    <li key={idx} className="text-xs text-amber-800 flex items-start gap-1.5">
                      <span className="text-amber-600">•</span>
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-2 text-xs text-amber-900 italic">
              SafeMarket Tip: {recommendation || 'Keep all messages within SafeMarket and transact face-to-face in daylight.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Low Risk Banner
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 my-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 flex-shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white">
              AI Verified
            </span>
            <h4 className="text-sm font-bold text-emerald-900">
              Low Scam Risk – Standard Community Listing
            </h4>
          </div>
          <p className="text-xs text-emerald-800 mt-1">
            {riskSummary || 'Gemini AI Listing Risk Analyzer found standard second-hand pricing with no suspicious advance payment triggers.'}
          </p>
          <p className="mt-1.5 text-xs text-emerald-700 italic">
            {recommendation || 'Standard precaution: Meet in a well-lit public place and test the item before finalizing payment.'}
          </p>
        </div>
      </div>
    </div>
  );
}
