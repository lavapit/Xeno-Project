export async function callGemini(prompt: string, systemInstruction?: string, responseSchema?: any) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("AI API Key (GEMINI_API_KEY or OPENROUTER_API_KEY) is not defined");
  }

  const url = "https://openrouter.ai/api/v1/chat/completions";

  // List of models to try in sequence: Paid Claude 3.5 Sonnet first, then fallback free models
  const modelsToTry = [
    "anthropic/claude-3.5-sonnet",
    "meta-llama/llama-3.3-70b-instruct:free",
    "openrouter/free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "nex-agi/nex-n2-pro:free"
  ];

  let lastError: any = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const model = modelsToTry[i];
    console.log(`[AI] Attempting AI generation with model: ${model} (attempt ${i + 1}/${modelsToTry.length})`);

    const messages: any[] = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    messages.push({ role: "user", content: prompt });

    const payload: any = {
      model: model,
      messages: messages,
      temperature: 0.1,
    };

    if (responseSchema) {
      payload.response_format = { type: "json_object" };
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'Velara CRM'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices[0]?.message?.content;
        if (text) {
          console.log(`[AI] Generation successful using model: ${model}`);
          return text.trim();
        }
      }

      // If we got here, response was not ok
      const errText = await res.text();
      console.warn(`[AI] Model ${model} returned error status ${res.status}: ${errText}`);
      lastError = new Error(`AI API error: ${res.statusText} (${res.status}) - ${errText}`);
      
      // If we hit a rate limit (429), wait 1.5 seconds before trying the next model
      if (res.status === 429) {
        console.log("[AI] Rate limited. Waiting 1500ms before fallback...");
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (err: any) {
      console.warn(`[AI] Failed to query model ${model}:`, err.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to generate response after trying all fallback models");
}

