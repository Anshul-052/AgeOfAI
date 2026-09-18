import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function draftStory(content: string) {
  const prompt = `You are an expert AI journalist writing for "AgeOfAI," a weekly magazine for engineering students. 
Given the following raw text or article content, generate a concise, engaging summary (crux) of 2-3 paragraphs.
Also, suggest 1-3 relevant tags (e.g., "RAG", "reinforcement learning", "OpenAI"), a domain (choose from: LLMs, Robotics, Cybersecurity, Research, Startups, Tools, Drama), and a severity level (normal, notable, major).

Format your response exactly as JSON:
{
  "crux": "Your summary here...",
  "tags": ["tag1", "tag2"],
  "domain": "LLMs",
  "severity": "normal"
}

Article Content:
${content}
`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1000,
      temperature: 0.2,
      messages: [
        { role: "user", content: prompt }
      ]
    });

    const text = response.content.find(c => c.type === 'text')?.text || "{}";
    
    // Attempt to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Claude API error:", error);
    throw new Error("Failed to generate draft from Claude.");
  }
}
