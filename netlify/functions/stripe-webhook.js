const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const PLAN_CREDITS = {
  'price_1TMAa53Rp2hyMOOPJQbLdRfg': { plan: 'pro', credits: 15 },
  'price_1TMAaX3Rp2hyMOOPjbgQzYt9': { plan: 'max', credits: 50 },
};

exports.handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  console.log('Webhook event:', stripeEvent.type);

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    const userId = session.metadata?.userId;
    
    console.log('Session userId:', userId);
    console.log('Session subscription:', session.subscription);

    if (!userId) {
      console.error('No userId in metadata');
      return { statusCode: 200, body: 'OK - no userId' };
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      const priceId = subscription.items.data[0].price.id;
      const planData = PLAN_CREDITS[priceId];

      console.log('PriceId:', priceId, 'PlanData:', planData);

      if (planData) {
        const { error } = await supabase
          .from('profiles')
          .update({
            plan: planData.plan,
            credits_remaining: planData.credits,
            stripe_subscription_id: session.subscription,
          })
          .eq('id', userId);

        if (error) {
          console.error('Supabase update error:', error);
        } else {
          console.log('Plan updated to:', planData.plan, 'for user:', userId);
        }
      }
    } catch (err) {
      console.error('Error processing checkout:', err);
    }
  }

  if (stripeEvent.type === 'customer.subscription.deleted') {
    const subscription = stripeEvent.data.object;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (data) {
      await supabase
        .from('profiles')
        .update({ plan: 'free', credits_remaining: 3, stripe_subscription_id: null })
        .eq('id', data.id);
      console.log('Plan reset to free for user:', data.id);
    }
  }

  return { statusCode: 200, body: 'OK' };
};
