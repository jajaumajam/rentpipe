const functions = require("firebase-functions");
const stripe = require("stripe")("sk_test_YOUR_SECRET_KEY_HERE");

exports.createCheckoutSession = functions.https.onRequest((req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  
  if (req.method === "OPTIONS") {
    res.status(200).send();
    return;
  }

  const {priceId, successUrl, cancelUrl} = req.body;
  
  stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{price: priceId, quantity: 1}],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl
  }).then(session => {
    res.json({sessionId: session.id});
  }).catch(error => {
    res.status(500).json({error: error.message});
  });
});
