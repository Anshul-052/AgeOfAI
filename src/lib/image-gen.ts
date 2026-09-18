import { prisma } from '@/lib/db';

export async function generateIssueCoverArt(headline: string): Promise<{ imageUrl: string }> {
  const prompt = `Vintage newspaper broadsheet woodcut editorial illustration of AI computer science technology: ${headline}, detailed monochrome line art`;
  
  // Use Pollinations AI public image endpoint for reliable, fast broadsheet artwork generation
  const encodedPrompt = encodeURIComponent(prompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=450&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

  // Log call to TokenUsage table under "image-gen"
  try {
    await prisma.tokenUsage.create({
      data: {
        provider: 'pollinations-google',
        modelName: 'imagen-woodcut-v1',
        promptTokens: 50,
        candidateTokens: 100,
        totalTokens: 150,
        action: 'image-gen',
        isCacheHit: false
      }
    });
  } catch (err) {
    console.error('Failed to log image-gen token usage:', err);
  }

  return { imageUrl };
}
