export async function callGemini(prompt: string, systemInstruction?: string, responseSchema?: any) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined");
  }

  // Use the standard gemini-1.5-flash model
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const payload: any = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {}
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [
        { text: systemInstruction }
      ]
    };
  }

  if (responseSchema) {
    payload.generationConfig.responseMimeType = "application/json";
    payload.generationConfig.responseSchema = responseSchema;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error: ${res.statusText} (${res.status}) - ${errText}`);
  }

  const data = await res.json();
  try {
    const text = data.candidates[0].content.parts[0].text;
    return text;
  } catch (e) {
    console.error("Failed to parse Gemini response:", JSON.stringify(data));
    throw new Error("Invalid response format from Gemini API");
  }
}
