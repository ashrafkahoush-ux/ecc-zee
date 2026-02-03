/**
 * ============================================================
 *  EMMA AI Chat API - Vercel Serverless Function
 *  ECC-Zee TBaaS Integration
 *  Secure OpenAI/Claude integration for EMMA responses
 * ============================================================
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      // Fallback to intelligent mock responses if no API key configured
      console.log('⚠️ No OPENAI_API_KEY configured, using smart fallback');
      const fallbackResponse = getSmartFallback(message);
      return res.status(200).json({
        ok: true,
        response: fallbackResponse,
        model: 'fallback',
        mode: 'demo'
      });
    }

    // Real OpenAI integration
    const systemPrompt = `You are EMMA (Enterprise Mind Management Assistant), an AI assistant for Zee Benzarrougue, a luxury real estate advisor based in the UAE/Dubai market.

Your personality:
- Professional yet warm and supportive
- Knowledgeable about real estate, specifically luxury properties
- Proactive in offering actionable suggestions
- Uses elegant, refined language matching Zee's brand
- Includes relevant emojis sparingly for emphasis

Your capabilities:
- Analyze lead pipelines and suggest priorities
- Draft personalized follow-up messages
- Provide property matching insights
- Schedule and task management
- Market analysis and trends

Current context: Zee works with high-net-worth clients in luxury real estate. 
${context ? `Additional context: ${context}` : ''}

Keep responses concise but comprehensive. Use bullet points for lists.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost-effective but powerful
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const emmaResponse = data.choices[0]?.message?.content || 'I apologize, I could not process that request.';

    return res.status(200).json({
      ok: true,
      response: emmaResponse,
      model: 'gpt-4o-mini',
      mode: 'live',
      usage: data.usage
    });

  } catch (error) {
    console.error('EMMA Chat Error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message,
      response: getSmartFallback(req.body?.message || '')
    });
  }
}

/**
 * Smart fallback responses when API is unavailable
 */
function getSmartFallback(message) {
  const lower = message.toLowerCase();

  if (lower.includes('hot lead') || lower.includes('hot leads')) {
    return `🔥 **Your Hot Leads:**

1. **Ahmed Hassan** - Villa in Emirates Hills ($2.4M)
   • Last contact: 3 hours ago
   • Status: Very interested, requesting second viewing

2. **Sarah Al-Maktoum** - Penthouse in Dubai Marina ($1.8M)
   • Viewing scheduled for tomorrow
   • Pre-qualified, ready to negotiate

3. **James Mitchell** - Palm Jumeirah Villa ($3.2M)
   • International buyer from UK
   • Flying in next week for viewing

Would you like me to draft a personalized follow-up for any of these leads?`;
  }

  if (lower.includes('draft') || lower.includes('message') || lower.includes('follow')) {
    return `✉️ **Here's a personalized follow-up template:**

"Dear [Name],

I hope this message finds you well. It was wonderful speaking with you about the [Property Type] in [Location].

I wanted to share that I've identified a few exclusive listings that match your preferences perfectly. Given your interest in [specific feature], I believe these properties deserve your attention.

Would you be available for a private viewing this week? I can arrange a convenient time that suits your schedule.

Looking forward to helping you find your perfect home.

Warm regards,
Zee"

*Shall I customize this for a specific client?*`;
  }

  if (lower.includes('task') || lower.includes('today') || lower.includes('schedule')) {
    return `📋 **Today's Priority Tasks:**

✅ **Completed:**
- Morning market report review
- Responded to 3 inquiry emails

⏰ **Scheduled:**
- 2:00 PM - Viewing with Sarah Al-Maktoum (Marina Gate)
- 4:30 PM - Call with Ahmed Hassan (Second viewing)

📝 **Pending:**
- Send market update to 5 warm leads
- Prepare property comparison for James Mitchell
- Follow up with legal team on contract

Would you like me to help prioritize or reschedule any tasks?`;
  }

  if (lower.includes('pipeline') || lower.includes('summary') || lower.includes('status')) {
    return `📊 **Pipeline Summary:**

| Stage | Leads | Potential Value |
|-------|-------|-----------------|
| 🟢 New | 6 | $8.4M |
| 🟡 Qualified | 4 | $6.2M |
| 🟠 Viewing | 3 | $7.4M |
| 🔴 Negotiation | 2 | $5.0M |

**Total Pipeline:** $27M
**Your Projected Commission (2%):** $540,000

💡 *Focus on the negotiation stage - you're 2 deals away from a record month!*`;
  }

  if (lower.includes('property') || lower.includes('match') || lower.includes('recommend')) {
    return `🏠 **Property Matches for Your Hot Leads:**

**For Ahmed Hassan (Budget: $2-3M, Villa)**
1. Emirates Hills - 6BR, Golf View - $2.4M ⭐
2. Al Barari - 5BR, Garden Villa - $2.8M
3. Jumeirah Golf Estates - 5BR, Modern - $2.2M

**For Sarah Al-Maktoum (Budget: $1.5-2M, Penthouse)**
1. Marina Gate - 3BR, Full Marina View - $1.8M ⭐
2. The Address, Downtown - 3BR, Burj View - $1.9M

Would you like me to prepare detailed comparison sheets?`;
  }

  // Default intelligent response
  return `I understand you're asking about "${message}". 

As your AI copilot, I can help you with:
• 🔥 **Lead Analysis** - Prioritize your hottest opportunities
• ✉️ **Message Drafting** - Personalized client communications  
• 📊 **Pipeline Review** - Track your deals and projections
• 📋 **Task Management** - Stay on top of follow-ups
• 🏠 **Property Matching** - Find perfect fits for clients

How can I assist you today?`;
}
