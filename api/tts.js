/**
 * ============================================================
 *  EMMA Text-to-Speech API - Vercel Serverless Function
 *  ECC-Zee TBaaS Integration
 *  Optional: Uses OpenAI TTS or ElevenLabs for premium voice
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
    const { text, voice = 'nova' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Limit text length for cost control
    const trimmedText = text.substring(0, 1000);

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Return instructions to use browser TTS
      return res.status(200).json({
        ok: true,
        mode: 'browser',
        message: 'Use browser SpeechSynthesis API',
        text: trimmedText
      });
    }

    // OpenAI TTS - High quality, cost-effective
    // Voices: alloy, echo, fable, onyx, nova, shimmer
    // Nova is warm and professional - perfect for EMMA
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'tts-1', // tts-1 for standard, tts-1-hd for premium
        input: trimmedText,
        voice: voice, // nova = warm female voice
        response_format: 'mp3'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI TTS Error:', errorData);
      return res.status(200).json({
        ok: true,
        mode: 'browser',
        message: 'TTS API unavailable, use browser fallback',
        text: trimmedText
      });
    }

    // Return audio as base64
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return res.status(200).json({
      ok: true,
      mode: 'openai',
      audio: base64Audio,
      format: 'mp3',
      voice: voice
    });

  } catch (error) {
    console.error('TTS Error:', error);
    return res.status(200).json({
      ok: true,
      mode: 'browser',
      message: 'TTS error, use browser fallback',
      text: req.body?.text || ''
    });
  }
}
