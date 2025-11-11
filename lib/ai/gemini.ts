/**
 * Gemini AI Integration
 * - Detect meme tokens with AI
 * - Generate plain English risk explanations
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SecurityCheck } from '../security/adapters';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

// ============================================================================
// MEME TOKEN DETECTION
// ============================================================================

export interface MemeDetectionResult {
  isMeme: boolean;
  confidence: number;
  reasoning: string;
}

/**
 * Use Gemini AI to detect if token is a meme coin
 */
export async function detectMemeTokenWithAI(
  tokenData: any,
  metadata?: any
): Promise<MemeDetectionResult> {
  
  const ai = getGenAI();
  
  if (!ai) {
    console.log('[Gemini AI] No API key configured, using fallback');
    return detectMemeFallback(tokenData, metadata);
  }
  
  try {
    const model = ai.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent classification
        maxOutputTokens: 200
      }
    });
    
    const prompt = `
Classify this cryptocurrency token as MEME or UTILITY.

Token: ${tokenData.name || 'Unknown'} (${tokenData.symbol || 'Unknown'})
Description: ${metadata?.description || 'None provided'}
Category: ${metadata?.category || 'Unknown'}

MEME indicators:
- Names: PEPE, SHIB, DOGE, MAGA, TRUMP, MOON, SAFE, INU, FLOKI
- Themes: dogs, cats, political figures, internet memes
- Purpose: purely speculative, no utility
- Community: hype-driven, sentiment-based

UTILITY indicators:
- Clear product or service
- Technical whitepaper
- DeFi protocol (staking, lending, DEX)
- Infrastructure (oracles, bridges)
- Gaming, NFT platforms

Respond ONLY in this JSON format:
{
  "classification": "MEME" or "UTILITY",
  "confidence": 0-100,
  "reasoning": "brief explanation in one sentence"
}
    `;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const response = JSON.parse(jsonMatch[0]);
      
      console.log(`[Gemini AI] Classification: ${response.classification} (${response.confidence}%)`);
      
      return {
        isMeme: response.classification === 'MEME',
        confidence: response.confidence,
        reasoning: response.reasoning
      };
    }
    
    throw new Error('Invalid JSON response from Gemini');
    
  } catch (error: any) {
    console.error('[Gemini AI] Meme detection failed:', error.message);
    return detectMemeFallback(tokenData, metadata);
  }
}

/**
 * Fallback rule-based meme detection
 */
function detectMemeFallback(tokenData: any, metadata?: any): MemeDetectionResult {
  const name = (tokenData.name || '').toUpperCase();
  const symbol = (tokenData.symbol || '').toUpperCase();
  const description = (metadata?.description || '').toUpperCase();
  
  const memeKeywords = [
    'MAGA', 'TRUMP', 'PEPE', 'SHIB', 'DOGE', 'INU', 'FLOKI', 
    'MOON', 'SAFE', 'ELON', 'BABY', 'ROCKET', 'WOJAK',
    'CAT', 'DOG', 'FROG', 'APE', 'BONK'
  ];
  
  const hasMemeName = memeKeywords.some(keyword => 
    name.includes(keyword) || symbol.includes(keyword) || description.includes(keyword)
  );
  
  if (hasMemeName) {
    return {
      isMeme: true,
      confidence: 80,
      reasoning: 'Token name/symbol matches known meme patterns'
    };
  }
  
  return {
    isMeme: false,
    confidence: 60,
    reasoning: 'No meme indicators detected (rule-based)'
  };
}

// ============================================================================
// AI RISK EXPLANATION
// ============================================================================

/**
 * Generate plain English risk explanation using Gemini AI
 */
export async function generateAIExplanation(
  tokenName: string,
  chainName: string,
  riskScore: number,
  riskLevel: string,
  securityChecks: SecurityCheck[],
  isMeme: boolean
): Promise<string> {
  
  const ai = getGenAI();
  
  if (!ai) {
    console.log('[Gemini AI] No API key configured, using fallback explanation');
    return generateFallbackExplanation(tokenName, riskScore, riskLevel, securityChecks);
  }
  
  try {
    const model = ai.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 400
      }
    });
    
    const criticalIssues = securityChecks
      .filter(c => c.severity === 'CRITICAL')
      .map(c => c.message)
      .join('\n');
    
    const warningIssues = securityChecks
      .filter(c => c.severity === 'WARNING')
      .map(c => c.message)
      .join('\n');
    
    const prompt = `
You are a crypto security expert analyzing ${tokenName} on ${chainName}.

Risk Score: ${riskScore}/100 (${riskLevel} RISK)
Token Type: ${isMeme ? 'Meme Coin' : 'Utility Token'}

Critical Issues:
${criticalIssues || 'None detected'}

Warning Issues:
${warningIssues || 'None detected'}

Provide a 3-sentence risk assessment:
1. Main risk summary in simple terms
2. Why this matters specifically on ${chainName}
3. Direct recommendation: BUY / RESEARCH MORE / AVOID

Use simple language. Be direct and actionable.
    `;
    
    const result = await model.generateContent(prompt);
    const explanation = result.response.text();
    
    console.log(`[Gemini AI] Generated explanation (${explanation.length} chars)`);
    
    return explanation;
    
  } catch (error: any) {
    console.error('[Gemini AI] Explanation failed:', error.message);
    return generateFallbackExplanation(tokenName, riskScore, riskLevel, securityChecks);
  }
}

/**
 * Fallback explanation without AI
 */
function generateFallbackExplanation(
  tokenName: string,
  riskScore: number,
  riskLevel: string,
  securityChecks: SecurityCheck[]
): string {
  
  const criticalCount = securityChecks.filter(c => c.severity === 'CRITICAL').length;
  const warningCount = securityChecks.filter(c => c.severity === 'WARNING').length;
  
  let explanation = `${tokenName} has a risk score of ${riskScore}/100 (${riskLevel}). `;
  
  if (criticalCount > 0) {
    const issues = securityChecks
      .filter(c => c.severity === 'CRITICAL')
      .map(c => c.name)
      .join(', ');
    
    explanation += `Critical issues detected: ${issues}. `;
    
    if (riskScore >= 75) {
      explanation += `AVOID - Critical security risks make this token dangerous to hold.`;
    } else {
      explanation += `RESEARCH MORE - Address these critical issues before investing.`;
    }
  } else if (warningCount > 0) {
    explanation += `${warningCount} warning${warningCount > 1 ? 's' : ''} found. `;
    
    if (riskScore >= 50) {
      explanation += `RESEARCH MORE - Moderate risks require careful evaluation.`;
    } else {
      explanation += `RESEARCH MORE - Review warnings but token shows potential.`;
    }
  } else {
    if (riskScore < 30) {
      explanation += `No major security issues detected. BUY - Token passes basic security checks.`;
    } else if (riskScore < 50) {
      explanation += `Some risk factors present. RESEARCH MORE - Check tokenomics carefully.`;
    } else {
      explanation += `Elevated risk from market factors. RESEARCH MORE - High risk environment.`;
    }
  }
  
  return explanation;
}

/**
 * Generate AI-powered insights for specific risk factors
 */
export async function generateFactorInsights(
  factors: Record<string, number>,
  tokenName: string
): Promise<string[]> {
  
  const ai = getGenAI();
  if (!ai) return [];
  
  try {
    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    // Find top 3 riskiest factors
    const sorted = Object.entries(factors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    
    const prompt = `
Explain these risk factors for ${tokenName} in simple terms (one sentence each):

${sorted.map(([name, score]) => `- ${name.replace(/_/g, ' ')}: ${score}/100`).join('\n')}

Focus on what each means for investors.
    `;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    return text.split('\n').filter(line => line.trim().length > 0);
    
  } catch (error) {
    return [];
  }
}

// ============================================================================
// COMPREHENSIVE AI SUMMARY (A + B + C)
// ============================================================================

export interface AISummaryResult {
  executive_summary: string;
  recommendation: 'BUY' | 'RESEARCH_MORE' | 'AVOID';
  classification: {
    type: 'MEME_TOKEN' | 'UTILITY_TOKEN';
    confidence: number;
  };
  factor_explanations: {
    [key: string]: string;
  };
  top_risk_factors: Array<{
    name: string;
    score: number;
    explanation: string;
    impact: string;
  }>;
  key_insights: string[];
}

/**
 * Generate comprehensive AI analysis including:
 * A) Executive Summary (3-4 sentences + recommendation)
 * B) Factor Explanations (why each score matters)
 * C) Top 3 Riskiest Factors Detailed Analysis
 */
export async function generateComprehensiveAISummary(
  tokenName: string,
  chainName: string,
  riskScore: number,
  riskLevel: string,
  breakdown: Record<string, number>,
  criticalFlags: string[],
  warningFlags: string[],
  positiveSignals: string[],
  isMeme: boolean,
  memeConfidence: number,
  additionalContext?: {
    marketCap?: number;
    liquidityUSD?: number;
    holderCount?: number;
    twitterMetrics?: any;
  }
): Promise<AISummaryResult> {
  
  const ai = getGenAI();
  
  if (!ai) {
    console.log('[Gemini AI] No API key configured, using fallback summary');
    return generateAISummaryFallback(
      tokenName,
      riskScore,
      riskLevel,
      breakdown,
      isMeme,
      memeConfidence
    );
  }
  
  try {
    const model = ai.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.4, // Professional but explanatory
        maxOutputTokens: 800
      }
    });

    // Build comprehensive context for the AI
    const factorsText = Object.entries(breakdown)
      .map(([name, score]) => `${name}: ${score}/100`)
      .join(', ');

    const flagsText = {
      critical: criticalFlags.length > 0 ? criticalFlags.join(', ') : 'None',
      warnings: warningFlags.length > 0 ? warningFlags.join(', ') : 'None',
      positive: positiveSignals.length > 0 ? positiveSignals.join(', ') : 'None'
    };

    const prompt = `You are a professional cryptocurrency security analyst. Analyze this token comprehensively.

TOKEN: ${tokenName} on ${chainName}
OVERALL RISK SCORE: ${riskScore}/100 (${riskLevel})
TOKEN TYPE: ${isMeme ? 'Meme Token' : 'Utility Token'} (${memeConfidence}% confidence)

RISK FACTOR BREAKDOWN:
${factorsText}

SECURITY FLAGS:
- Critical Issues: ${flagsText.critical}
- Warning Issues: ${flagsText.warnings}
- Positive Signals: ${flagsText.positive}

${additionalContext?.marketCap ? `MARKET DATA:
- Market Cap: $${(additionalContext.marketCap / 1e6).toFixed(2)}M
- Liquidity: $${(additionalContext.liquidityUSD ? additionalContext.liquidityUSD / 1e3 : 0).toFixed(2)}K
- Holders: ${additionalContext.holderCount?.toLocaleString() || 'N/A'}` : ''}

RESPOND ONLY IN THIS JSON FORMAT (no markdown, pure JSON):
{
  "executive_summary": "3-4 sentences summarizing the token's risk profile, key concerns, and overall investment appeal. Write like a professional analyst.",
  "recommendation": "BUY or RESEARCH_MORE or AVOID",
  "factor_explanations": {
    "factor_name_1": "Why this factor matters for token holders",
    "factor_name_2": "Why this factor matters for token holders",
    "factor_name_3": "Why this factor matters for token holders",
    "factor_name_4": "Why this factor matters for token holders",
    "factor_name_5": "Why this factor matters for token holders"
  },
  "top_risk_factors": [
    {
      "name": "Highest risk factor name",
      "score": 95,
      "explanation": "Detailed explanation of why this score is concerning",
      "impact": "Impact on token holders: specific risks or dangers"
    },
    {
      "name": "Second highest risk factor",
      "score": 80,
      "explanation": "Detailed explanation",
      "impact": "Impact on token holders"
    },
    {
      "name": "Third highest risk factor",
      "score": 70,
      "explanation": "Detailed explanation",
      "impact": "Impact on token holders"
    }
  ],
  "key_insights": [
    "Key insight 1",
    "Key insight 2",
    "Key insight 3"
  ]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    console.log(`[Gemini AI] Generated comprehensive summary (${text.length} chars)`);

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        executive_summary: parsed.executive_summary,
        recommendation: parsed.recommendation,
        classification: {
          type: isMeme ? 'MEME_TOKEN' : 'UTILITY_TOKEN',
          confidence: memeConfidence
        },
        factor_explanations: parsed.factor_explanations || {},
        top_risk_factors: parsed.top_risk_factors || [],
        key_insights: parsed.key_insights || []
      };
    }

    throw new Error('Invalid JSON response from Gemini');

  } catch (error: any) {
    console.error('[Gemini AI] Comprehensive summary failed:', error.message);
    return generateAISummaryFallback(
      tokenName,
      riskScore,
      riskLevel,
      breakdown,
      isMeme,
      memeConfidence
    );
  }
}

/**
 * Fallback summary when AI is unavailable
 */
function generateAISummaryFallback(
  tokenName: string,
  riskScore: number,
  riskLevel: string,
  breakdown: Record<string, number>,
  isMeme: boolean,
  memeConfidence: number
): AISummaryResult {
  
  // Find top 3 factors
  const topFactors = Object.entries(breakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const summary = `${tokenName} presents a ${riskLevel.toLowerCase()} risk profile with an overall risk score of ${riskScore}/100. ` +
    `This ${isMeme ? 'meme token' : 'utility token'} (${memeConfidence}% confidence) exhibits mixed risk characteristics. ` +
    `Key concerns include elevated ${topFactors[0]?.[0]?.toLowerCase() || 'market'} risk. ` +
    `Further research is recommended before making investment decisions.`;

  const recommendation = riskScore >= 75 ? 'AVOID' : riskScore >= 50 ? 'RESEARCH_MORE' : 'BUY';

  const factorExplanations: Record<string, string> = {};
  Object.entries(breakdown).forEach(([name, score]) => {
    if (score >= 70) {
      factorExplanations[name] = `This factor shows elevated risk (${score}/100) and requires attention.`;
    } else if (score >= 40) {
      factorExplanations[name] = `This factor shows moderate concern (${score}/100). Monitor closely.`;
    } else {
      factorExplanations[name] = `This factor appears relatively safe (${score}/100).`;
    }
  });

  return {
    executive_summary: summary,
    recommendation,
    classification: {
      type: isMeme ? 'MEME_TOKEN' : 'UTILITY_TOKEN',
      confidence: memeConfidence
    },
    factor_explanations: factorExplanations,
    top_risk_factors: topFactors.map(([name, score]) => ({
      name,
      score,
      explanation: `This is the ${topFactors.indexOf([name, score]) + 1}${['st', 'nd', 'rd'][topFactors.indexOf([name, score])] || 'th'} highest risk factor for ${tokenName}.`,
      impact: score >= 70 ? 'Significant risk - closely evaluate impact on investment thesis' : 'Moderate risk - requires monitoring'
    })),
    key_insights: [
      `Token classification: ${isMeme ? 'Meme Token' : 'Utility Token'} (${memeConfidence}% confidence)`,
      `Overall Risk Assessment: ${riskLevel} (${riskScore}/100)`,
      `Recommendation: ${recommendation.replace(/_/g, ' ')}`
    ]
  };
}
