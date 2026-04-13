const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Verifica autenticazione
  const authHeader = event.headers['authorization'] || event.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Non autorizzato' }) };
  }
  const token = authHeader.slice(7);

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Token non valido' }) };
  }

  // Parsing del body
  let prompt, maxOutputTokens, temperature;
  try {
    const body = JSON.parse(event.body);
    prompt = body.prompt;
    maxOutputTokens = body.maxOutputTokens || 3000;
    temperature = body.temperature ?? 0.2;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body non valido' }) };
  }

  if (!prompt || prompt.trim().length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Prompt vuoto' }) };
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens }
        })
      }
    );

    if (!geminiRes.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Errore API Gemini' }) };
    }

    const data = await geminiRes.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result }),
    };
  } catch {
    return { statusCode: 502, body: JSON.stringify({ error: 'Errore di connessione a Gemini' }) };
  }
};
