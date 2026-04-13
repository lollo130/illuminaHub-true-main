const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { priceId, userId, userEmail } = JSON.parse(event.body);

    // Valida che userId sia un UUID valido per evitare metadata injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!userId || !uuidRegex.test(userId)) {
      return { statusCode: 400, body: JSON.stringify({ error: 'userId non valido' }) };
    }
    if (!priceId || typeof priceId !== 'string' || priceId.length > 100) {
      return { statusCode: 400, body: JSON.stringify({ error: 'priceId non valido' }) };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail,
      metadata: { userId },
      success_url: `https://illuminahub.netlify.app/?payment=success`,
      cancel_url: `https://illuminahub.netlify.app/?payment=cancelled`,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
