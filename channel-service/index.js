const express = require('express')
const app = express()
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Channel Service Simulator is active and running.');
});

const OUTCOMES = [
  { status: 'delivered', weight: 40 },
  { status: 'opened',    weight: 25 },
  { status: 'clicked',   weight: 15 },
  { status: 'read',      weight: 10 },
  { status: 'failed',    weight: 10 },
]

function pickOutcome() {
  const total = OUTCOMES.reduce((s, o) => s + o.weight, 0)
  let rand = Math.random() * total
  for (const o of OUTCOMES) {
    rand -= o.weight
    if (rand <= 0) return o.status
  }
  return 'delivered'
}

app.post('/send', async (req, res) => {
  const { messageId, recipient, message, channel, callbackUrl } = req.body

  console.log(`Received send request for messageId: ${messageId}, recipient: ${recipient}, channel: ${channel}`);

  // Respond immediately — do NOT make the CRM wait
  res.json({ received: true, messageId })

  // Simulate async delivery delay: 1–6 seconds
  const delay = 1000 + Math.random() * 5000
  
  setTimeout(async () => {
    const status = pickOutcome()
    console.log(`Sending outcome "${status}" for messageId: ${messageId} to ${callbackUrl}`);
    
    // If opened/clicked, first fire "delivered", then fire the richer event
    if (status === 'opened' || status === 'clicked') {
      await fireCallback(callbackUrl, messageId, 'delivered')
      await sleep(500 + Math.random() * 1000)
    }
    
    await fireCallback(callbackUrl, messageId, status)
  }, delay)
})

async function fireCallback(callbackUrl, messageId, status) {
  try {
    const res = await fetch(callbackUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, status })
    })
    console.log(`Callback for messageId ${messageId} with status ${status} returned: ${res.status}`);
  } catch (err) {
    console.error(`Callback for messageId ${messageId} failed: ${err.message}. Retrying...`);
    // Retry once after 2 seconds
    await sleep(2000)
    try { 
      const res = await fetch(callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, status })
      }) 
      console.log(`Retry callback for messageId ${messageId} returned: ${res.status}`);
    } catch (e) {
      console.error(`Retry callback for messageId ${messageId} failed: ${e.message}`);
    }
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Channel service running on :${PORT}`))
