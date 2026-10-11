import React from 'react';
import { ExternalLink, Search } from 'lucide-react';

const formatPrice = (value) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(value);

export default function GoogleSearchSources({ analysis, listing, className = '' }) {
  const sources = Array.isArray(analysis?.comparisonSources) ? analysis.comparisonSources : [];
  const comparablePrices = Array.isArray(analysis?.comparablePrices)
    ? analysis.comparablePrices
    : sources.filter((source) => Number.isFinite(source.pricePhp));
  const hasSources = sources.length > 0;
  const queryTerms = [...new Set(
    [listing?.brand, listing?.model, listing?.title]
      .map((term) => term?.trim())
      .filter(Boolean)
      .filter((term, index, terms) =>
        terms.findIndex((candidate) => candidate.toLowerCase() === term.toLowerCase()) === index
      )
  )];
  const searchQuery = [...queryTerms, 'used price Philippines'].join(' ');
  const googleSearchUrl = searchQuery
    ? `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`
    : null;

  return (
    <section className={`mt-4 rounded-xl border border-slate-200 bg-white p-4 ${className}`} aria-label="Price comparison sources">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 flex-shrink-0 text-safegreen-700" />
        <h4 className="text-sm font-bold text-slate-900">Price comparison sources</h4>
      </div>

      {!hasSources ? (
        <div className="mt-3">
          {googleSearchUrl && (
            <a
              href={googleSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-blue-700 underline hover:text-blue-900"
            >
              View comparable prices on Google
              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
            </a>
          )}
        </div>
      ) : (
        <>
          {comparablePrices.length === 0 && (
            <p className="mt-2 text-xs text-amber-800">
              {analysis?.analysisSourceMessage || 'Google Search found pages, but no exact price for a comparable used listing was verified.'}
            </p>
          )}

          <div className="mt-3">
            <h5 className="text-xs font-bold text-slate-900">Websites and prices found</h5>
            <ul className="mt-2 space-y-2">
              {sources.map((source) => (
                <li key={source.url} className="min-w-0">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 underline hover:text-blue-900"
                  >
                    {source.title || source.url}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                  {Number.isFinite(source.pricePhp) && source.pricePhp > 0 ? (
                    <p className="mt-0.5 text-sm font-bold text-safegreen-800">
                      Listed price: {formatPrice(source.pricePhp)}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-slate-600">No exact comparable price verified for this source.</p>
                  )}
                  {source.productTitle && <p className="text-xs text-slate-700">{source.productTitle}</p>}
                  {source.condition && <p className="text-xs text-slate-500">Condition: {source.condition}</p>}
                  <p className="break-all text-[11px] text-slate-500">{source.url}</p>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Open each source to confirm its current price, product, and condition.
          </p>
        </>
      )}
    </section>
  );
}
