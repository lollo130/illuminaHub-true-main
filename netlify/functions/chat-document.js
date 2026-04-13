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
  let noteContent, question;
  try {
    const body = JSON.parse(event.body);
    noteContent = body.noteContent;
    question = body.question;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body non valido' }) };
  }

  if (!question || question.trim().length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Domanda vuota' }) };
  }

  const cleanContent = (noteContent || '').replace(/<<<CHARTS>>>[\s\S]*?<<<END_CHARTS>>>/g, '').substring(0, 20000);

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Sei un assistente universitario. Rispondi SOLO basandoti sul seguente documento.

DOCUMENTO:
${cleanContent}

DOMANDA DELLO STUDENTE: ${question}

Rispondi in italiano, in modo preciso e conciso. Se la risposta non è nel documento, dillo chiaramente.`
            }]
          }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 1000 }
        })
      }
    );

    if (!geminiRes.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Errore API Gemini' }) };
    }

    const data = await geminiRes.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Non ho trovato una risposta nel documento.';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answer }),
    };
  } catch {
    return { statusCode: 502, body: JSON.stringify({ error: 'Errore di connessione a Gemini' }) };
  }
};
