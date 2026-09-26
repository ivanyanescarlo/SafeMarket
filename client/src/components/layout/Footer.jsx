import React from 'react';
import { ShieldCheck, AlertCircle, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
      {/* Scam Prevention Notice Banner */}
      <div className="bg-safegreen-950/80 border-b border-safegreen-900/60 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-safegreen-900/60 text-safegreen-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                SafeMarket Scam Prevention Policy
              </p>
              <p className="text-xs text-safegreen-200/80">
                SafeMarket does NOT process payments or escrow. Never send GCash or bank reservation deposits before physical meetup.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-safegreen-800/60 text-safegreen-300 border border-safegreen-700/50">
            Powered by Gemini AI Listing Risk Analyzer
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-safegreen-600 flex items-center justify-center text-white font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white">SafeMarket</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              A secure, trusted local second-hand marketplace for Philippine communities. Discover pre-loved gadgets, furniture, vehicles, and collectibles with real-time AI scam detection.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
              <span>Made for Philippine Communities</span>
              <span>•</span>
              <span>No Hidden Payment Fees</span>
            </div>
          </div>

          {/* Safety Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Safety & Verification
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Meetup in Well-Lit Public Malls</li>
              <li>Inspect Items Physically</li>
              <li>Gemini AI Scam Risk Analyzer</li>
              <li>Community Report System</li>
              <li>Verified Seller Activation</li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Top Categories
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>Mobile Phones & Gadgets</li>
              <li>Computers & Laptops</li>
              <li>Vehicles & Auto Parts</li>
              <li>Home & Furniture</li>
              <li>Hobbies, Games & Toys</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} SafeMarket Philippines. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
