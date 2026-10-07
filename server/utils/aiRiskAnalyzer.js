const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');

const ANALYSIS_CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHED_ANALYSES = 100;
const GEMINI_TIMEOUT_MS = 8000;
const analysisCache = new Map();

const getListingCacheKey = (listingData) =>
  crypto.createHash('sha256').update(JSON.stringify(listingData)).digest('hex');

const getCachedAnalysis = (key) => {
  const cached = analysisCache.get(key);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    analysisCache.delete(key);
    return null;
  }
  return cached.analysis;
};

const cacheAnalysis = (key, analysis) => {
  if (analysisCache.size >= MAX_CACHED_ANALYSES) {
    const oldestKey = analysisCache.keys().next().value;
    if (oldestKey) analysisCache.delete(oldestKey);
  }
  analysisCache.set(key, {
    analysis,
    expiresAt: Date.now() + ANALYSIS_CACHE_TTL_MS
  });
  return analysis;
};

// Heuristic fallback analyzer if external API is unreachable or rate limited
function heuristicAnalyze(listingData) {
  const { title = '', description = '', price = 0, category = '' } = listingData;
  const text = `${title} ${description}`.toLowerCase();
  const numPrice = Number(price) || 0;
  const indicators = [];

  // Check for advance payment / deposit scams
  if (
    text.includes('reservation fee') ||
    text.includes('advance payment') ||
    text.includes('deposit first') ||
    text.includes('downpayment') ||
    text.includes('send deposit') ||
    text.includes('gcash deposit') ||
    text.includes('pay first') ||
    text.includes('shipping fee first') ||
    text.includes('reservation') && (text.includes('gcash') || text.includes('maya'))
  ) {
    indicators.push('Request for advance deposit or reservation fee before meetup');
  }

  // Check for extreme urgency / pressure tactics
  if (
    text.includes('rush') ||
    text.includes('urgent sale') ||
    text.includes('leaving country') ||
    text.includes('first to pay') ||
    text.includes('today only') ||
    text.includes('need cash today') ||
    text.includes('asap')
  ) {
    indicators.push('Urgency and high-pressure sales tactics detected');
  }

  // Check for off-platform communication / links
  if (
    text.includes('telegram') ||
    text.includes('whatsapp') ||
    text.includes('viber') ||
    text.includes('t.me/') ||
    text.includes('wa.me/') ||
    text.includes('bit.ly') ||
    text.includes('tinyurl')
  ) {
    indicators.push('Off-platform communication channel or suspicious link requested');
  }

  // Check for unrealistic price vs high-end tech/gadget keywords
  const isHighEndTech = 
    text.includes('iphone 15') ||
    text.includes('iphone 16') ||
    text.includes('iphone 14 pro') ||
    text.includes('macbook pro') ||
    text.includes('ps5') ||
    text.includes('playstation 5') ||
    text.includes('rtx 4090') ||
    text.includes('rtx 4080');

  if (isHighEndTech && numPrice < 15000 && numPrice > 0) {
    indicators.push('Unusually low price for high-value electronic device');
  }

  // Check for gift cards / crypto
  if (
    text.includes('gift card') ||
    text.includes('crypto') ||
    text.includes('usdt') ||
    text.includes('bitcoin') ||
    text.includes('apple gift')
  ) {
    indicators.push('Untraceable payment method (gift card / crypto) mentioned');
  }

  let riskLevel = 'Low';
  if (indicators.length >= 2 || indicators.some(i => i.includes('advance deposit') || i.includes('Untraceable'))) {
    riskLevel = 'High';
  } else if (indicators.length === 1) {
    riskLevel = 'Medium';
  }

  let summary = 'Standard second-hand listing. Exercise normal caution when arranging meetups.';
  let recommendation = 'Always meet in well-lit, public locations like shopping malls or police stations. Inspect the item thoroughly before handing over payment.';

  if (riskLevel === 'High') {
    summary = 'Potential scam indicators detected. The listing exhibits high-risk patterns such as advance payment requests or unrealistic terms.';
    recommendation = 'DO NOT transfer money, reservation fees, or advance shipping payments before physically examining the product in person.';
  } else if (riskLevel === 'Medium') {
    summary = 'Moderate risk detected due to urgency or off-platform communication preferences.';
    recommendation = 'Insist on communicating strictly within SafeMarket messaging and verify product details in person.';
  }

  return {
    riskLevel,
    riskIndicators: indicators.length > 0 ? indicators : ['No immediate scam flags detected; standard peer-to-peer verification recommended'],
    riskSummary: summary,
    recommendation
  };
}

/**
 * Analyze a listing using Gemini API (gemini-3.8-flash)
 * With intelligent graceful fallback
 */
async function analyzeListingWithGemini(listingData) {
  const { title, description, price, category, condition, location, brand, model } = listingData;
  const cacheKey = getListingCacheKey({ title, description, price, category, condition, location, brand, model });
  const cachedAnalysis = getCachedAnalysis(cacheKey);
  if (cachedAnalysis) return cachedAnalysis;

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[Gemini AI] No GEMINI_API_KEY found, using heuristic analyzer');
    return cacheAnalysis(cacheKey, heuristicAnalyze(listingData));
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({
      model: 'gemini-3.8-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    }, {
      timeout: GEMINI_TIMEOUT_MS
    });

    const prompt = `You are SafeMarket AI Listing Risk Analyzer, an automated scam prevention system for a Philippine local second-hand community marketplace.

Analyze this second-hand product listing for scam, fraud, and risk indicators:
Title: ${title || 'N/A'}
Description: ${description || 'N/A'}
Price: ₱${price || '0'} (Philippine Pesos)
Category: ${category || 'N/A'}
Condition: ${condition || 'N/A'}
Location: ${typeof location === 'object' ? `${location.cityMunicipality}, ${location.province}` : (location || 'N/A')}
Brand: ${brand || 'N/A'}
Model: ${model || 'N/A'}

Common scam indicators in local peer-to-peer marketplaces:
1. Advance payment requests (asking for GCash/Maya/bank transfer reservation deposit before meetup).
2. Urgency and pressure tactics ("urgent sale", "leaving country today", "first to deposit gets it", "limited time").
3. Unrealistic / too-good-to-be-true pricing (e.g. flagship phones, gaming consoles, laptops priced unrealistically low).
4. Off-platform contact requests (e.g. Telegram, WhatsApp, Viber links, external phishing URLs).
5. Vague or contradictory descriptions.
6. Counterfeits, non-existent delivery promises, untraceable gift card/crypto payments.

You must respond in valid JSON matching this schema:
{
  "riskLevel": "Low" | "Medium" | "High",
  "riskIndicators": ["string"],
  "riskSummary": "string (1-2 sentences summarizing the safety assessment)",
  "recommendation": "string (actionable advice for the buyer/seller)"
}

Ensure "riskLevel" is strictly one of: "Low", "Medium", or "High".
"riskIndicators" should be a list of 1 to 4 concise bullet point explanations of the indicators found. If Low risk, mention positive safe signs or normal market indicators.`;

    const result = await geminiModel.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean response text in case markdown code blocks are present
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned);

    // Normalize riskLevel
    let level = 'Low';
    if (parsed.riskLevel) {
      const normalized = parsed.riskLevel.toString().trim().toLowerCase();
      if (normalized.includes('high')) level = 'High';
      else if (normalized.includes('medium') || normalized.includes('moderate')) level = 'Medium';
      else level = 'Low';
    }

    return cacheAnalysis(cacheKey, {
      riskLevel: level,
      riskIndicators: Array.isArray(parsed.riskIndicators) && parsed.riskIndicators.length > 0 
        ? parsed.riskIndicators 
        : ['Price and description conform to marketplace standards'],
      riskSummary: parsed.riskSummary || 'Standard second-hand marketplace listing.',
      recommendation: parsed.recommendation || 'Meet in a safe public place and inspect the item before finalizing payment.'
    });
  } catch (error) {
    console.error(`[Gemini AI] Error during AI analysis: ${error.message}. Engaging heuristic fallback.`);
    return cacheAnalysis(cacheKey, heuristicAnalyze(listingData));
  }
}

module.exports = {
  analyzeListingWithGemini,
  heuristicAnalyze
};
