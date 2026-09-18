import { prisma } from '../src/lib/db';

async function main() {
  console.log('📰 Curating Volume 1, Issue 1 — First Edition of AgeOfAI...');

  // Reset database tables
  await prisma.story.deleteMany({});
  await prisma.issue.deleteMany({});
  await prisma.tag.deleteMany({});

  // Create Tags
  const tagsData = [
    'Reasoning',
    'Chain-of-Thought',
    'VLA-Models',
    'FlashAttention',
    'Agentic-AI',
    'Cyber-Defense',
    'Local-LLMs',
    'Benchmark-Controversy'
  ];

  const tagRecords: Record<string, { id: string; name: string }> = {};
  for (const tagName of tagsData) {
    const tag = await prisma.tag.create({ data: { name: tagName } });
    tagRecords[tagName] = tag;
  }

  // Create Volume 1, Issue 1
  const issue = await prisma.issue.create({
    data: {
      volume: 'Volume 1',
      issueNumber: 1,
      publishedAt: new Date('2026-07-27T00:00:00Z'),
      isPublished: true,
      layout: 'editorial-and-drama-split',
      coverImageUrl: 'https://image.pollinations.ai/prompt/Vintage%20broadsheet%20newspaper%20woodcut%20illustration%20of%20artificial%20intelligence%20brain%20circuits%20and%20robotic%20gears%20monochrome?width=800&height=450&nologo=true&seed=1001',
      coverImagePrompt: 'Volume 1 Issue 1 Broadsheet Header: The Dawn of Reasoning Models & Agentic Systems'
    }
  });

  // Real Curated Stories
  const stories = [
    {
      title: 'DeepSeek-R1 & OpenAI o3: The Shift from Pattern Matching to Test-Time Compute Reasoning',
      crux: 'The AI landscape has reached a monumental pivot point. Rather than relying solely on pre-training scaling laws, frontier architectures like DeepSeek-R1 and OpenAI o3 allocate test-time compute to generate verified chains-of-thought (CoT) before outputting final answers. For CS students, this marks a shift from LLMs as next-token predictors to deliberate algorithmic search engines executing reinforcement learning (RL) verification over complex multi-step reasoning trees.',
      sourceUrl: 'https://arxiv.org/abs/2501.12948',
      imageUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1000&q=80',
      domain: 'LLMs',
      severity: 'major',
      publishedAt: new Date('2026-07-26T12:00:00Z'),
      issueId: issue.id,
      tags: [tagRecords['Reasoning'], tagRecords['Chain-of-Thought']]
    },
    {
      title: 'Vision-Language-Action (VLA) Networks: How Spatial Intelligence is Revolutionizing Humanoid Robotics',
      crux: 'Humanoid robotics platforms including Figure 02 and Tesla Optimus Gen 2 are abandoning hardcoded inverse kinematics in favor of end-to-end Vision-Language-Action (VLA) models. By training directly on multi-modal vision and tactile telemetry, VLA models translate natural language prompts directly into 6-DOF joint trajectory commands, allowing robots to adapt zero-shot to unfamiliar spatial environments.',
      sourceUrl: 'https://huggingface.co/papers',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      domain: 'Robotics',
      severity: 'notable',
      publishedAt: new Date('2026-07-26T14:00:00Z'),
      issueId: issue.id,
      tags: [tagRecords['VLA-Models'], tagRecords['Agentic-AI']]
    },
    {
      title: 'DARPA AI Cyber Challenge: Autonomous Vulnerability Discovery Engines Outperform Human Auditors',
      crux: 'Cybersecurity research has entered an autonomous arms race. Autonomous Cyber Reasoning Systems (CRS) utilizing fine-tuned LLMs and fuzzing engines successfully identified 0-day memory corruption vulnerabilities across critical Linux kernel sub-modules within minutes. Security researchers emphasize that verifying LLM-generated exploit chains requires strict formal verification sandbox boundaries.',
      sourceUrl: 'https://github.com/trending',
      imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1000&q=80',
      domain: 'Cybersecurity',
      severity: 'major',
      publishedAt: new Date('2026-07-26T15:30:00Z'),
      issueId: issue.id,
      tags: [tagRecords['Cyber-Defense'], tagRecords['Agentic-AI']]
    },
    {
      title: 'FlashAttention-3 & RingAttention: Pushing Context Windows Beyond 1 Million Tokens Without SRAM Bottlenecks',
      crux: 'Standard attention mechanisms scale quadratically in memory O(N²), causing severe SRAM memory bandwidth bottlenecks on modern GPU clusters. FlashAttention-3 leverages asynchronous GPU tensor core operations and warp-specialized scheduling to compute exact softmax attention in block-wise tiles. Combined with RingAttention across distributed nodes, systems can now ingest entire codebases into active context.',
      sourceUrl: 'https://arxiv.org/abs/2407.08608',
      imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1000&q=80',
      domain: 'Research',
      severity: 'major',
      publishedAt: new Date('2026-07-26T16:00:00Z'),
      issueId: issue.id,
      tags: [tagRecords['FlashAttention']]
    },
    {
      title: 'The Rise of Agentic Pair Programming: Cursor, Devin & Autonomous Repo Refactoring Engines',
      crux: 'Software engineering workflows are transitioning from static autocompletion to autonomous repository agents. Modern AI coding assistants construct multi-file dependency graphs, execute background unit test suites, and iteratively fix syntax and logic bugs before opening pull requests. Engineers are focusing more on architectural design and system invariants rather than boilerplate syntax.',
      sourceUrl: 'https://github.com',
      imageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1000&q=80',
      domain: 'Startups',
      severity: 'notable',
      publishedAt: new Date('2026-07-26T17:00:00Z'),
      issueId: issue.id,
      tags: [tagRecords['Agentic-AI']]
    },
    {
      title: 'Local High-Throughput Inference: vLLM, TensorRT-LLM & Quantization Benchmarks for Workstations',
      crux: 'Deploying LLMs locally on consumer hardware has reached sub-millisecond TTFT (Time-To-First-Token) thanks to PagedAttention and GGUF/AWQ 4-bit quantization techniques. Using vLLM or TensorRT-LLM, CS students can run 70B parameter models on single workstation GPUs by avoiding KV-cache memory fragmentation.',
      sourceUrl: 'https://github.com/vllm-project/vllm',
      domain: 'Tools',
      severity: 'normal',
      publishedAt: new Date('2026-07-26T18:00:00Z'),
      issueId: issue.id,
      tags: [tagRecords['Local-LLMs']]
    },
    {
      title: 'THE BACK PAGE: Benchmark Contamination Wars & The Synthetic Data Infinite Loop',
      crux: 'DRAMA & CONTROVERSY: The AI research community is embroiled in a heated debate over benchmark saturation. With models scoring 95%+ on MMLU and GSM8K, evidence suggests public benchmark test sets are leaking into pre-training corpora. Meanwhile, researchers warn of "Model Autophagy Disorder" (MAD)—where training future LLMs on AI-generated web text degrades semantic diversity over generations.',
      sourceUrl: 'https://huggingface.co/blog',
      domain: 'Drama',
      severity: 'major',
      publishedAt: new Date('2026-07-26T19:00:00Z'),
      issueId: issue.id,
      tags: [tagRecords['Benchmark-Controversy']]
    }
  ];

  for (const storyData of stories) {
    const { tags, ...data } = storyData;
    await prisma.story.create({
      data: {
        ...data,
        tags: {
          connect: tags.map(t => ({ id: t.id }))
        }
      }
    });
  }

  console.log('✅ Volume 1, Issue 1 published successfully with 7 real curated stories and broadsheet artwork!');
}

main()
  .catch((e) => {
    console.error('Failed to seed Edition 1:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
