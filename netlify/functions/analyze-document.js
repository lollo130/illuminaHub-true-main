const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;

const GEMINI_PROMPT = (truncated, filename) => `Sei un assistente universitario esperto. Analizza il testo estratto dal documento "${filename}" e crea appunti universitari completi in italiano.

TESTO DEL DOCUMENTO:
${truncated}

---

Crea appunti con ESATTAMENTE queste sezioni:

## 1. Riassunto
Scrivi un testo discorsivo di almeno 10 frasi. NON usare elenchi numerati. Spiega tutti gli argomenti principali nel dettaglio.

## 2. Domande di Studio
5 domande tipiche d'esame con risposta completa di 4-5 righe:
- Domanda: testo della domanda
  Risposta: risposta dettagliata

## 3. Concetti Chiave
8-10 concetti, ognuno con 2-3 righe di spiegazione:
- concetto: spiegazione dettagliata

## 4. Punti da Ricordare
8-10 punti fondamentali per l'esame, ognuno spiegato in 2 righe:
- punto: spiegazione

## 5. Schemi e Tabelle
Crea 2-3 tabelle markdown riassuntive dei concetti più importanti del documento.
Usa questo formato esatto:
| Colonna 1 | Colonna 2 | Colonna 3 |
|-----------|-----------|-----------|
| dato      | dato      | dato      |

Poi, in fondo a tutto, aggiungi un blocco JSON con dati per grafici nel seguente formato ESATTO (non modificare i tag):
<<<CHARTS>>>
{
  "charts": [
    {
      "type": "bar",
      "title": "titolo del grafico",
      "description": "cosa rappresenta",
      "data": [
        {"name": "etichetta", "value": 85},
        {"name": "etichetta", "value": 60}
      ]
    },
    {
      "type": "radar",
      "title": "titolo secondo grafico",
      "description": "cosa rappresenta",
      "data": [
        {"subject": "argomento", "value": 80},
        {"subject": "argomento", "value": 65}
      ]
    }
  ]
}
<<<END_CHARTS>>>

I grafici devono rappresentare SOLO la distribuzione o importanza relativa degli argomenti COME DESCRITTI NEL TESTO. I valori sono stime qualitative (0-100) basate su quanto spazio il documento dedica a ciascun argomento.
REGOLE FERREE PER I GRAFICI:
- NON creare MAI grafici su "frequenza negli esami" o "argomenti degli esami passati"
- NON inventare statistiche sugli esami
- Crea SOLO grafici che mostrano la distribuzione degli argomenti trattati nel documento stesso
- I valori devono essere stime basate sullo spazio dedicato nel testo, non su dati esterni
Basati SOLO sul documento. Sii preciso e tecnico.`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // 1. Verifica autenticazione tramite JWT
  const authHeader = event.headers['authorization'] || event.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Non autorizzato' }) };
  }
  const token = authHeader.slice(7);

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Token non valido' }) };
  }

  // 2. Parsing del body
  let text, filename;
  try {
    const body = JSON.parse(event.body);
    text = body.text;
    filename = body.filename;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body non valido' }) };
  }

  if (!text || text.trim().length < 50) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Testo troppo corto o vuoto' }) };
  }

  // 3. Verifica crediti server-side
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('plan, credits_remaining')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Profilo non trovato' }) };
  }

  if (profile.plan !== 'max' && profile.credits_remaining <= 0) {
    return { statusCode: 402, body: JSON.stringify({ error: 'Crediti esauriti! Passa a un piano superiore.' }) };
  }

  // 4. Decremento atomico crediti (con condizione per evitare race condition)
  if (profile.plan !== 'max') {
    const { error: creditError } = await supabase
      .from('profiles')
      .update({ credits_remaining: profile.credits_remaining - 1 })
      .eq('id', user.id)
      .gt('credits_remaining', 0); // Previene il decremento sotto zero

    if (creditError) {
      return { statusCode: 409, body: JSON.stringify({ error: 'Errore aggiornamento crediti, riprova.' }) };
    }
  }

  // 5. Chiama Gemini API
  const truncated = text.length > 30000
    ? text.substring(0, 30000) + '\n\n[Documento troncato per limiti di lunghezza]'
    : text;

  let geminiResult;
  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: GEMINI_PROMPT(truncated, filename) }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 8000 }
        })
      }
    );

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      // Ripristina il credito se Gemini fallisce
      if (profile.plan !== 'max') {
        await supabase
          .from('profiles')
          .update({ credits_remaining: profile.credits_remaining })
          .eq('id', user.id);
      }
      return { statusCode: 502, body: JSON.stringify({ error: err.error?.message || 'Errore API Gemini' }) };
    }

    const data = await geminiRes.json();
    geminiResult = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Analisi non disponibile.';
  } catch (err) {
    // Ripristina il credito su errore di rete
    if (profile.plan !== 'max') {
      await supabase
        .from('profiles')
        .update({ credits_remaining: profile.credits_remaining })
        .eq('id', user.id);
    }
    return { statusCode: 502, body: JSON.stringify({ error: 'Errore di connessione a Gemini' }) };
  }

  const newCredits = profile.plan === 'max' ? null : profile.credits_remaining - 1;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: geminiResult, credits_remaining: newCredits }),
  };
};
