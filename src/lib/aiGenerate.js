import { DEFAULT_SYSTEM_PROMPT } from "../constants/prompt";

const extractJson = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found in AI response.");
    return JSON.parse(match[0]);
  }
};

const resolveSystemPrompt = (template, finding) =>
  template
    .replaceAll("{issueName}", finding.issueName)
    .replaceAll("{severity}", finding.severity)
    .replaceAll("{notes}", finding.notes);

export async function generateFindingContent({ claudeApiKey, issueName, severity, notes, systemPromptTemplate }) {
  if (!claudeApiKey) {
    throw new Error("Missing API key. Set VITE_CLAUDE_API_KEY in your environment.");
  }
  if (!issueName.trim()) {
    throw new Error("Issue Name is required to generate content.");
  }
  if (!notes.trim()) {
    throw new Error("Brief Notes are required to generate content.");
  }

  const systemPrompt = resolveSystemPrompt(systemPromptTemplate || DEFAULT_SYSTEM_PROMPT, {
    issueName,
    severity,
    notes,
  });

  const userPrompt = JSON.stringify({ issueName, severity, notes }, null, 2);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": claudeApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1200,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Generate report text for this vulnerability and respond in JSON.\n\n${userPrompt}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Claude API error (${res.status}): ${errText || "Request failed"}`);
  }

  const data = await res.json();
  const text = data?.content?.find((x) => x.type === "text")?.text || "";
  const parsed = extractJson(text);

  if (!parsed?.observation || !parsed?.riskImpact || !parsed?.recommendation) {
    throw new Error("AI response did not include all required fields.");
  }

  return {
    observation: parsed.observation.trim(),
    riskImpact: parsed.riskImpact.trim(),
    recommendation: parsed.recommendation.trim(),
  };
}
