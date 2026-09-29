import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldAlert, AlertTriangle, Eye, CheckCircle, Ban } from 'lucide-react';
import api from '../../services/api';
import RiskBadge from '../../components/common/RiskBadge';

export default function AdminAiMonitoring({ onAction }) {
  const [flaggedListings, setFlaggedListings] = useState([]);
  const [filterLevel, setFilterLevel] = useState('All');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchAiData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterLevel !== 'All') params.set('riskLevel', filterLevel);

      const res = await api.get(`/admin/ai-monitoring?${params.toString()}`);
      if (res.success) {
        setFlaggedListings(res.flaggedListings || []);
      }
    } catch (err) {
      console.error('Failed to load AI monitoring data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAiData();
  }, [filterLevel]);

  const handleTakeDown = async (item) => {
    const reason = prompt(
      `Enter reason for taking down "${item.title}":`,
      'Flagged as scam by Gemini AI risk analyzer (Advance deposit / unrealistic terms)'
    );
    if (reason === null) return;

    setActionLoading(item._id);
    try {
      await api.put(`/admin/listings/${item._id}/moderate`, {
        status: 'removed',
        removalReason: reason
      });
      fetchAiData();
      if (onAction) onAction();
    } catch (err) {
      alert(err.message || 'Failed to moderate listing.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-safegreen-600" />
            <span>AI Risk Monitor</span>
          </h2>
        </div>

        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
        >
          <option value="All">High & Medium Risks</option>
          <option value="High">High Risk Only</option>
          <option value="Medium">Medium Risk Only</option>
        </select>
      </div>

      {/* Info notice */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Scam Prevention Policy:</span>
          <span>
            Gemini provides automated risk assessments and flags indicators like advance payment demands or extreme urgency. Administrators investigate and make the final decision to remove fraudulent listings.
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading AI monitoring data...</div>
        ) : flaggedListings.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No flagged listings currently match this filter.
          </div>
        ) : (
          flaggedListings.map((item) => (
            <div
              key={item._id}
              className={`p-5 rounded-2xl border transition-all ${
                item.riskLevel === 'High'
                  ? 'border-rose-200 bg-rose-50/30'
                  : 'border-amber-200 bg-amber-50/20'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                
                <div className="flex items-start gap-4">
                  <img
                    src={item.images?.[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200'}
                    alt=""
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <RiskBadge level={item.riskLevel} />
                      <span className="text-xs text-slate-400">
                        Status: <strong className="text-slate-700">{item.status}</strong>
                      </span>
                    </div>

                    <Link
                      to={`/product/${item._id}`}
                      className="text-sm font-bold text-slate-900 hover:text-safegreen-700 mt-1 block"
                    >
                      {item.title}
                    </Link>

                    <div className="flex items-center gap-2 text-xs mt-1">
                      <span className="font-bold text-slate-900">₱{item.price?.toLocaleString()}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600">Seller: @{item.sellerId?.username}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">
                        {item.location?.cityMunicipality}, {item.location?.province}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    to={`/product/${item._id}`}
                    className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    View Listing
                  </Link>
                  {item.status === 'active' && (
                    <button
                      type="button"
                      disabled={actionLoading === item._id}
                      onClick={() => handleTakeDown(item)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs"
                    >
                      Takedown Item
                    </button>
                  )}
                </div>

              </div>

              {/* Detected Indicators List */}
              <div className="mt-4 pt-3 border-t border-slate-200/80">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Gemini AI Detected Indicators:
                </span>
                <ul className="space-y-1">
                  {item.riskIndicators?.map((ind, idx) => (
                    <li key={idx} className="text-xs text-rose-800 font-medium flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{ind}</span>
                    </li>
                  ))}
                </ul>
                {item.riskSummary && (
                  <p className="text-xs text-slate-600 mt-2 italic bg-white/80 p-2 rounded-lg border border-slate-200">
                    "{item.riskSummary}"
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
