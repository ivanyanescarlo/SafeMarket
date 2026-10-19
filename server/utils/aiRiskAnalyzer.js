const crypto = require('crypto');

const ANALYSIS_CACHE_TTL_MS = 2 * 60 * 1000;
const MAX_CACHED_ANALYSES = 100;
const GEMINI_TIMEOUT_MS = 15000;
const GEMINI_MIN_REQUEST_INTERVAL_MS = 15000;
const GEMINI_INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const analysisCache = new Map();
let geminiRequestQueue = Promise.resolve();
let lastGeminiRequestAt = 0;

async function waitForGeminiRequestSlot() {
  let releaseQueue;
  const previousRequest = geminiRequestQueue;
  geminiRequestQueue = new Promise((resolve) => {
    releaseQueue = resolve;
  });

  await previousRequest;
  const waitMs = Math.max(
    0,
    lastGeminiRequestAt + GEMINI_MIN_REQUEST_INTERVAL_MS - Date.now()
  );
  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  lastGeminiRequestAt = Date.now();
  releaseQueue();
}

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

// Local fallback checks scam-related listing text without claiming live price validation.
function heuristicAnalyze(
  listingData,
  analysisSourceMessage = 'Live web price and product checks are unavailable because no grounded search results were returned.'
) {
  const { title = '', description = '', price = 0, category = '', brand = '', model = '' } = listingData;
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

  let summary = 'No obvious scam-related wording was detected by the basic text check. Product identity and market price were not verified.';
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
    riskIndicators: indicators.length > 0
      ? indicators
      : ['Basic text check found no obvious scam indicators; product identity and asking price were not verified'],
    riskSummary: summary,
    recommendation,
    analysisSourceStatus: 'unavailable',
    analysisSourceMessage,
    productCheck: {
      titleStatus: 'uncertain',
      brandStatus: brand ? 'uncertain' : 'not_provided',
      modelStatus: model ? 'uncertain' : 'not_provided',
      summary: 'Product details could not be verified against live web results.'
    },
    priceCheck: {
      status: 'unable_to_assess',
      riskLevel: 'Unverified',
      lowPhp: null,
      highPhp: null,
      summary: 'No live comparable prices could be verified.'
    },
    comparisonSources: [],
    comparablePrices: [],
    analyzedAt: new Date().toISOString()
  };
}

const getModelOutput = (interaction) => {
  const steps = Array.isArray(interaction.steps)
    ? interaction.steps
    : Array.isArray(interaction.output)
      ? interaction.output
      : [];
  const outputSteps = steps.filter((step) => step.type === 'model_output');
  const content = outputSteps.flatMap((step) => Array.isArray(step.content) ? step.content : []);
  const text = content.filter((item) => item.type === 'text').map((item) => item.text || '').join('\n');
  const annotations = [];
  const pending = [interaction];
  const visited = new Set();
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || typeof current !== 'object' || visited.has(current)) continue;
    visited.add(current);
    if (Array.isArray(current.annotations)) annotations.push(...current.annotations);
    if (Array.isArray(current)) pending.push(...current);
    else pending.push(...Object.values(current));
  }
  return { text, annotations };
};

const safeSourcesFromAnnotations = (annotations) => {
  const uniqueSources = new Map();

  for (const annotation of annotations) {
    if (annotation.type !== 'url_citation' || typeof annotation.url !== 'string') continue;
    try {
      const url = new URL(annotation.url);
      if (url.protocol !== 'https:') continue;
      uniqueSources.set(url.href, {
        title: typeof annotation.title === 'string' && annotation.title.trim()
          ? annotation.title.trim()
          : url.hostname,
        url: url.href
      });
    } catch {
      continue;
    }
  }

  return Array.from(uniqueSources.values()).slice(0, 8);
};

const normalizeComparablePrices = (items, comparisonSources) => {
  if (!Array.isArray(items)) return [];

  const sourceByUrl = new Map(comparisonSources.map((source) => [source.url, source]));
  const comparables = new Map();

  for (const item of items) {
    if (!item || typeof item.url !== 'string') continue;
    let url;
    try {
      url = new URL(item.url);
    } catch {
      continue;
    }
    if (url.protocol !== 'https:') continue;

    const source = sourceByUrl.get(url.href);
    const pricePhp = Number(item.pricePhp);
    if (!source || !Number.isFinite(pricePhp) || pricePhp <= 0) continue;

    comparables.set(source.url, {
      title: source.title,
      url: source.url,
      pricePhp,
      productTitle: typeof item.productTitle === 'string' ? item.productTitle.trim().slice(0, 200) : '',
      condition: typeof item.condition === 'string' ? item.condition.trim().slice(0, 100) : ''
    });
  }

  return Array.from(comparables.values()).slice(0, 8);
};

const normalizeStatus = (value, allowed, fallback) =>
  allowed.includes(value) ? value : fallback;

const getPriceRiskLevel = (askingPrice, lowPhp, highPhp, hasValidRange) => {
  if (!hasValidRange) return 'Unverified';
  if (askingPrice > highPhp * 1.5 || askingPrice < lowPhp * 0.5) return 'High';
  if (askingPrice > highPhp * 1.15 || askingPrice < lowPhp * 0.85) return 'Medium';
  return 'Low';
};

/**
 * Analyze a listing using Gemini with Google Search grounding and cited sources.
 */
async function analyzeListingWithGemini(listingData) {
  const { title, description, price, category, condition, location, brand, model } = listingData;
  const cacheKey = getListingCacheKey({ title, description, price, category, condition, location, brand, model });
  const cachedAnalysis = getCachedAnalysis(cacheKey);
  if (cachedAnalysis) return cachedAnalysis;

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[Gemini AI] No GEMINI_API_KEY found, using heuristic analyzer');
    return heuristicAnalyze(
      listingData,
      'Gemini API is not configured. Basic scam-text screening only; product identity and price were not verified.'
    );
  }

  try {
    const prompt = `You are SafeMarket's listing safety and product price checker for the Philippine second-hand marketplace. Use Google Search results to verify product identity and compare current prices in the Philippines.

Listing to check:
Title: ${title || 'N/A'}
Description: ${description || 'N/A'}
Price: ₱${price || '0'} (Philippine Pesos)
Category: ${category || 'N/A'}
Condition: ${condition || 'N/A'}
Location: ${typeof location === 'object' ? `${location.cityMunicipality}, ${location.province}` : (location || 'N/A')}
Brand: ${brand || 'N/A'}
Model: ${model || 'N/A'}

Search for the exact product title, brand, and model, prioritizing Philippine product pages and second-hand listings. Compare only genuinely similar used products with matching model/specifications and similar condition. Record the exact displayed PHP asking price for each comparable listing and its exact URL from the Google Search citations. Do not include an approximate market value or a price that is not visible in the cited result/page.

Check:
1. Whether the title, brand, and model appear consistent with the product pages. Do not guess missing details.
2. Whether the asking price is below, within, or above the supported comparable second-hand price range. Do not use unrelated new-product prices as second-hand comparables.
3. Common scam indicators:
1. Advance payment requests (asking for GCash/Maya/bank transfer reservation deposit before meetup).
2. Urgency and pressure tactics ("urgent sale", "leaving country today", "first to deposit gets it", "limited time").
3. Unrealistic / too-good-to-be-true pricing.
4. Off-platform contact requests or suspicious links.
5. Vague or contradictory descriptions, counterfeits, or untraceable payment methods.

Respond with only valid JSON matching this schema:
{
  "riskLevel": "Low" | "Medium" | "High",
  "riskIndicators": ["string"],
  "riskSummary": "string",
  "recommendation": "string",
  "productCheck": {
    "titleStatus": "match" | "mismatch" | "uncertain",
    "brandStatus": "match" | "mismatch" | "uncertain" | "not_provided",
    "modelStatus": "match" | "mismatch" | "uncertain" | "not_provided",
    "summary": "brief evidence-based explanation"
  },
  "priceCheck": {
    "status": "below_market" | "within_market" | "above_market" | "unable_to_assess",
    "lowPhp": number | null,
    "highPhp": number | null,
    "summary": "brief comparison explanation"
  },
  "comparablePrices": [
    {
      "url": "exact cited URL",
      "productTitle": "title of comparable used listing",
      "pricePhp": 0,
      "condition": "stated used condition or unknown"
    }
  ]
}

Price assessment requirements:
- Include a comparablePrices item only when Google Search provides both a citation for the exact URL and an exact asking price in Philippine pesos for a relevant used listing. The application verifies that every item URL matches a Google Search citation.
- Do not convert another currency, estimate a price, invent a price, URL, or source name, or treat a product retail price as a used asking price.
- Only provide a market range if comparablePrices includes at least one valid item. Otherwise set status to "unable_to_assess", both range fields to null, and say why.
- If the supplied product identity conflicts with reliable sources, use "mismatch"; if evidence is inconclusive, use "uncertain".
- Do not treat a low price alone as proof of a scam.
- Use Philippine pesos for all prices.`;

    await waitForGeminiRequestSlot();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(GEMINI_INTERACTIONS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          model: 'gemini-3.8-flash',
          input: prompt,
          tools: [{ type: 'google_search' }]
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const error = new Error(`Grounded Gemini request failed with HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }

    const interaction = await response.json();
    const { text: responseText, annotations } = getModelOutput(interaction);
    if (!responseText) throw new Error('Grounded Gemini response did not contain analysis text');
    const comparisonSources = safeSourcesFromAnnotations(annotations);
    
    // Clean response text in case markdown code blocks are present
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleaned);
    const comparablePrices = normalizeComparablePrices(parsed.comparablePrices, comparisonSources);
    const sourcesWithPrices = comparisonSources.map((source) => ({
      ...source,
      ...(comparablePrices.find((comparable) => comparable.url === source.url) || {})
    }));
    const rawProductCheck = parsed.productCheck || {};
    const rawPriceCheck = parsed.priceCheck || {};
    const productCheck = {
      titleStatus: normalizeStatus(rawProductCheck.titleStatus, ['match', 'mismatch', 'uncertain'], 'uncertain'),
      brandStatus: brand
        ? normalizeStatus(rawProductCheck.brandStatus, ['match', 'mismatch', 'uncertain'], 'uncertain')
        : 'not_provided',
      modelStatus: model
        ? normalizeStatus(rawProductCheck.modelStatus, ['match', 'mismatch', 'uncertain'], 'uncertain')
        : 'not_provided',
      summary: typeof rawProductCheck.summary === 'string'
        ? rawProductCheck.summary
        : 'Product details could not be verified.'
    };
    const askingPrice = Number(price);
    const comparablePriceValues = comparablePrices.map((comparable) => comparable.pricePhp);
    const lowPhp = comparablePriceValues.length > 0 ? Math.min(...comparablePriceValues) : null;
    const highPhp = comparablePriceValues.length > 0 ? Math.max(...comparablePriceValues) : null;
    const hasValidPriceRange = Number.isFinite(askingPrice) && askingPrice > 0 && lowPhp !== null;
    const priceCheck = {
      status: hasValidPriceRange
        ? askingPrice < lowPhp
          ? 'below_market'
          : askingPrice > highPhp
            ? 'above_market'
            : 'within_market'
        : 'unable_to_assess',
      riskLevel: getPriceRiskLevel(askingPrice, lowPhp, highPhp, hasValidPriceRange),
      lowPhp,
      highPhp,
      summary: comparablePrices.length > 0 && typeof rawPriceCheck.summary === 'string'
        ? rawPriceCheck.summary
        : 'No exact PHP prices for comparable used listings were found in the cited pages.'
    };

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
      recommendation: parsed.recommendation || 'Meet in a safe public place and inspect the item before finalizing payment.',
      analysisSourceStatus: sourcesWithPrices.some((source) => Number.isFinite(source.pricePhp)) ? 'grounded' : 'unavailable',
      analysisSourceMessage: sourcesWithPrices.some((source) => Number.isFinite(source.pricePhp))
        ? ''
        : comparisonSources.length > 0
          ? 'Google Search found web pages, but no exact PHP prices for comparable used listings were available.'
          : 'Google Search did not return cited source pages for this analysis.',
      productCheck,
      priceCheck,
      comparisonSources: sourcesWithPrices,
      comparablePrices,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[Gemini AI] Error during AI analysis: ${error.message}. Engaging heuristic fallback.`);
    let analysisSourceMessage = 'Google Search product and price checks failed. Basic scam-text screening only; product identity and price were not verified.';
    if (error.status === 429) {
      analysisSourceMessage = 'Google Search comparison is unavailable because Gemini API quota or rate limits were reached (HTTP 429). Basic scam-text screening only; product identity and price were not verified.';
    } else if (error.status === 401 || error.status === 403) {
      analysisSourceMessage = `Google Search comparison is unavailable because Gemini API access was denied (HTTP ${error.status}). Check the API key and Search grounding access. Basic scam-text screening only; product identity and price were not verified.`;
    }
    return heuristicAnalyze(listingData, analysisSourceMessage);
  }
}

module.exports = {
  analyzeListingWithGemini,
  heuristicAnalyze
};
