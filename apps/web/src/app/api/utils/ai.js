// Server-only OpenAI helpers (do NOT import in client code)
// Uses process.env.OPENAI_API_KEY; keep calls server-side only.

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function openaiFetch(path, payload) {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY secret");
  }
  const res = await fetch(`https://api.openai.com/v1${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `OpenAI ${path} -> [${res.status}] ${res.statusText}: ${text}`,
    );
  }
  return res.json();
}

export async function embedTexts(texts) {
  if (!Array.isArray(texts) || !texts.length) return [];
  const json = await openaiFetch("/embeddings", {
    model: "text-embedding-3-small",
    input: texts,
  });
  return (json.data || []).map((d) => d.embedding);
}

export async function chatJSON({
  system,
  user,
  model = "gpt-4o-mini",
  temperature = 0.2,
}) {
  const json = await openaiFetch("/chat/completions", {
    model,
    temperature,
    response_format: { type: "json_object" },
    messages: [
      system ? { role: "system", content: system } : null,
      { role: "user", content: user },
    ].filter(Boolean),
  });
  try {
    const content = json.choices?.[0]?.message?.content || "{}";
    return JSON.parse(content);
  } catch (e) {
    throw new Error("Failed to parse JSON response from OpenAI");
  }
}

export async function visionAnalyze({
  images = [],
  prompt,
  model = "gpt-4o-mini",
  temperature = 0.0,
}) {
  // images: array of URLs
  if (!images.length) return null;
  const messages = [
    {
      role: "system",
      content: "You are a precise vision analyst for restaurant images.",
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: prompt || "Analyze these food/restaurant images.",
        },
        ...images.map((url) => ({ type: "image_url", image_url: { url } })),
      ],
    },
  ];
  const json = await openaiFetch("/chat/completions", {
    model,
    temperature,
    messages,
  });
  return json.choices?.[0]?.message?.content || "";
}
