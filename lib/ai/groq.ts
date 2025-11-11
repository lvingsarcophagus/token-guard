/**
 * Groq AI Integration
 * Fast AI inference using Groq Cloud API
 */

import Groq from 'groq-sdk'

let groq: Groq | null = null

function getGroqClient(): Groq | null {
  if (!groq && process.env.GROQ_API_KEY) {
    console.log('[Groq AI] Initializing with API key...')
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })
  }
  
  if (!groq) {
    console.warn('[Groq AI] GROQ_API_KEY not configured in environment')
    return null
  }
  
  return groq
}

/**
 * Use Groq AI to detect if token is a meme coin
 */
export async function detectMemeTokenWithAI(
  token: { symbol?: string; name?: string },
  metadata?: { description?: string; website?: string; twitter?: string; tokenName?: string; tokenSymbol?: string }
): Promise<{
  isMeme: boolean
  confidence: number
  reasoning: string
  classification?: 'MEME_TOKEN' | 'UTILITY_TOKEN' | 'GOVERNANCE_TOKEN' | 'UNKNOWN'
}> {
  try {
    const client = getGroqClient()

    if (!client) {
      console.log('[Groq AI] No API key configured, using fallback')
      return {
        isMeme: false,
        classification: 'UNKNOWN',
        confidence: 0,
        reasoning: 'AI classification unavailable - no API key'
      }
    }

    const tokenName = token.name || metadata?.tokenName || 'Unknown'
    const tokenSymbol = token.symbol || metadata?.tokenSymbol || 'Unknown'
    
    const prompt = `Analyze this cryptocurrency token and classify it. Return ONLY valid JSON.

Token Name: ${tokenName}
Symbol: ${tokenSymbol}
${metadata?.description ? `Description: ${metadata.description}` : ''}
${metadata?.website ? `Website: ${metadata.website}` : ''}
${metadata?.twitter ? `Twitter: ${metadata.twitter}` : ''}

Classify as one of: MEME_TOKEN, UTILITY_TOKEN, GOVERNANCE_TOKEN, or UNKNOWN

Meme tokens typically:
- Have dog, cat, or animal themes
- Use internet memes or viral references
- Have community-focused names
- Lack clear utility beyond speculation

Return JSON format:
{
  "classification": "MEME_TOKEN | UTILITY_TOKEN | GOVERNANCE_TOKEN | UNKNOWN",
  "confidence": 0-100,
  "reasoning": "brief explanation"
}`

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile", // Fast, high-quality model
      messages: [
        {
          role: "system",
          content: "You are a cryptocurrency analyst. Respond ONLY with valid JSON. No markdown, no code blocks, just raw JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    })

    const responseText = completion.choices[0]?.message?.content?.trim() || ''
    
    // Clean response - remove markdown code blocks if present
    let jsonText = responseText
    if (jsonText.includes('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.replace(/```\n?/g, '')
    }
    
    const response = JSON.parse(jsonText)

    if (!response.classification || !response.confidence || !response.reasoning) {
      throw new Error('Invalid response structure from Groq')
    }

    console.log(`[Groq AI] Classification: ${response.classification} (${response.confidence}%)`);

    return {
      isMeme: response.classification === 'MEME_TOKEN',
      classification: response.classification,
      confidence: response.confidence,
      reasoning: response.reasoning
    }
  } catch (error: any) {
    console.error('[Groq AI] Meme detection failed:', error.message);
    return {
      isMeme: false,
      classification: 'UNKNOWN',
      confidence: 0,
      reasoning: `AI classification failed: ${error.message}`
    }
  }
}

/**
 * Generate plain English risk explanation using Groq AI
 */
export async function generateAIExplanation(
  tokenName: string,
  tokenSymbol: string,
  riskScore: number,
  riskLevel: string,
  factors: Array<{ name: string; value: number; weight: number }>
): Promise<string> {
  try {
    const client = getGroqClient()

    if (!client) {
      console.log('[Groq AI] No API key configured, using fallback explanation')
      const defaultExplanations: Record<string, string> = {
        'LOW': `${tokenName} (${tokenSymbol}) shows strong fundamentals with a low risk score of ${riskScore}/100. Most risk factors are favorable.`,
        'MEDIUM': `${tokenName} (${tokenSymbol}) has moderate risk with a score of ${riskScore}/100. Some concerns exist but overall acceptable for cautious investors.`,
        'HIGH': `${tokenName} (${tokenSymbol}) presents significant risks with a score of ${riskScore}/100. Multiple red flags detected - invest with extreme caution.`,
        'CRITICAL': `${tokenName} (${tokenSymbol}) shows critical risk factors with a score of ${riskScore}/100. Strong signs of potential scam or rug pull. AVOID.`
      }
      return defaultExplanations[riskLevel] || `Risk assessment: ${riskScore}/100`
    }

    const topFactors = factors
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map(f => `${f.name}: ${f.value}/100`)
      .join(', ')

    const prompt = `Generate a clear, concise risk explanation for this cryptocurrency token.

Token: ${tokenName} (${tokenSymbol})
Risk Score: ${riskScore}/100 (${riskLevel})
Top Risk Factors: ${topFactors}

Write 2-3 sentences explaining:
1. Overall risk assessment
2. Key concerns or strengths
3. Recommendation for investors

Be direct, professional, and actionable. No fluff.`

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a cryptocurrency risk analyst. Provide clear, actionable insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 300,
    })

    const explanation = completion.choices[0]?.message?.content?.trim() || 
      `Risk Score: ${riskScore}/100 - ${riskLevel} risk level detected.`

    console.log(`[Groq AI] Generated explanation (${explanation.length} chars)`);

    return explanation
  } catch (error: any) {
    console.error('[Groq AI] Explanation failed:', error.message);
    return `Risk Score: ${riskScore}/100 - ${riskLevel} risk level. Analysis details available above.`
  }
}

/**
 * Generate comprehensive AI summary with structured insights
 */
export async function generateComprehensiveAISummary(
  tokenData: {
    name: string
    symbol: string
    chain: string
    riskScore: number
    riskLevel: string
    price?: number
    marketCap?: number
    holders?: number
    liquidity?: number
    age?: string
    factors: Array<{ name: string; value: number; description?: string }>
    redFlags?: string[]
    greenFlags?: string[]
  }
): Promise<{
  overview: string
  keyInsights: string[]
  riskAnalysis: string
  recommendation: string
  technicalDetails: string
}> {
  try {
    const client = getGroqClient()

    if (!client) {
      console.log('[Groq AI] No API key configured, using fallback summary')
      return {
        overview: `${tokenData.name} (${tokenData.symbol}) is a ${tokenData.chain} token with a risk score of ${tokenData.riskScore}/100.`,
        keyInsights: [
          `Risk Level: ${tokenData.riskLevel}`,
          tokenData.holders ? `Holder Count: ${tokenData.holders}` : 'Limited holder data',
          tokenData.liquidity ? `Liquidity: $${tokenData.liquidity.toLocaleString()}` : 'Liquidity data unavailable'
        ],
        riskAnalysis: `Token presents ${tokenData.riskLevel.toLowerCase()} risk based on available data.`,
        recommendation: tokenData.riskScore > 70 ? 'High risk - avoid or use extreme caution' : 'Proceed with appropriate risk management',
        technicalDetails: `Chain: ${tokenData.chain}, Age: ${tokenData.age || 'Unknown'}`
      }
    }

    const factorsSummary = tokenData.factors
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
      .map(f => `${f.name}: ${f.value}/100${f.description ? ` - ${f.description}` : ''}`)
      .join('\n')

    const prompt = `Analyze this cryptocurrency token and provide structured insights:

## Token Information
- Name: ${tokenData.name}
- Symbol: ${tokenData.symbol}
- Chain: ${tokenData.chain}
- Risk Score: ${tokenData.riskScore}/100 (${tokenData.riskLevel})
${tokenData.price ? `- Price: $${tokenData.price}` : ''}
${tokenData.marketCap ? `- Market Cap: $${tokenData.marketCap.toLocaleString()}` : ''}
${tokenData.holders ? `- Holders: ${tokenData.holders}` : ''}
${tokenData.liquidity ? `- Liquidity: $${tokenData.liquidity.toLocaleString()}` : ''}
${tokenData.age ? `- Age: ${tokenData.age}` : ''}

## Risk Factors
${factorsSummary}

${tokenData.redFlags && tokenData.redFlags.length > 0 ? `## Red Flags
${tokenData.redFlags.join('\n')}` : ''}

${tokenData.greenFlags && tokenData.greenFlags.length > 0 ? `## Green Flags  
${tokenData.greenFlags.join('\n')}` : ''}

Provide a comprehensive analysis in JSON format:
{
  "overview": "2-3 sentence summary of the token",
  "keyInsights": ["insight 1", "insight 2", "insight 3", "insight 4"],
  "riskAnalysis": "detailed risk assessment (3-4 sentences)",
  "recommendation": "clear investment recommendation",
  "technicalDetails": "technical highlights and chain-specific details"
}

Be professional, actionable, and data-driven. No speculation.`

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert cryptocurrency analyst. Provide structured, actionable insights in JSON format. No markdown code blocks, just raw JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 1500,
    })

    const responseText = completion.choices[0]?.message?.content?.trim() || ''
    
    // Clean response - remove markdown code blocks if present
    let jsonText = responseText
    if (jsonText.includes('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.replace(/```\n?/g, '')
    }
    
    const summary = JSON.parse(jsonText)

    if (!summary.overview || !summary.keyInsights || !summary.riskAnalysis || 
        !summary.recommendation || !summary.technicalDetails) {
      throw new Error('Invalid JSON structure from Groq')
    }

    console.log(`[Groq AI] Generated comprehensive summary`);

    return summary
  } catch (error: any) {
    console.error('[Groq AI] Comprehensive summary failed:', error.message);
    return {
      overview: `${tokenData.name} (${tokenData.symbol}) - ${tokenData.chain} token with ${tokenData.riskLevel} risk.`,
      keyInsights: [
        `Risk Score: ${tokenData.riskScore}/100`,
        tokenData.holders ? `${tokenData.holders} holders` : 'Limited data',
        `Risk Level: ${tokenData.riskLevel}`
      ],
      riskAnalysis: `Token analysis shows ${tokenData.riskLevel.toLowerCase()} risk based on available metrics.`,
      recommendation: tokenData.riskScore > 70 ? 'Exercise extreme caution' : 'Proceed with standard risk management',
      technicalDetails: `${tokenData.chain} blockchain, Age: ${tokenData.age || 'Unknown'}`
    }
  }
}
