import { prisma } from '../src/lib/db';

async function main() {
  console.log('Seeding AgeOfAI Volume 1, Issue 1 (First Edition)...');

  await prisma.story.deleteMany({});
  await prisma.issue.deleteMany({});
  await prisma.tag.deleteMany({});

  const tagsData = [
    'Reasoning',
    'Chain-of-Thought',
    'VLA-Models',
    'FlashAttention',
    'Agentic-AI',
    'Cyber-Defense',
    'Local-LLMs',
    'Benchmark-Controversy',
    'Hackathon',
    'Fellowship',
    'Cloud-Credits',
    'React',
    'NextJS',
    'WebAssembly',
    'GameDev',
    'UnrealEngine',
    'Blockchain',
    'DeFi',
    'ZeroKnowledge',
    'iOS',
    'Android',
    'SwiftUI',
    'JetpackCompose',
    'GPU',
    'RISC-V',
    'Silicon',
  ];

  const tagRecords: Record<string, { id: string; name: string }> = {};
  for (const tagName of tagsData) {
    const tag = await prisma.tag.create({ data: { name: tagName } });
    tagRecords[tagName] = tag;
  }

  const now = new Date();

  const issue = await prisma.issue.create({
    data: {
      volume: 'Volume 1',
      issueNumber: 1,
      publishedAt: now,
      isPublished: true,
      layout: 'editorial-and-drama-split',
    }
  });

  const stories = [
    {
      title: 'DeepSeek-R1 & OpenAI o3: The Shift from Pattern Matching to Test-Time Compute Reasoning',
      crux: 'The AI landscape has reached a monumental pivot point. Rather than relying solely on pre-training scaling laws, frontier architectures like DeepSeek-R1 and OpenAI o3 allocate test-time compute to generate verified chains-of-thought (CoT) before outputting final answers. For CS students, this marks a shift from LLMs as next-token predictors to deliberate algorithmic search engines executing reinforcement learning (RL) verification over complex multi-step reasoning trees.',
      sourceUrl: 'https://arxiv.org/abs/2501.12948',
      domain: 'LLMs',
      severity: 'major',
      publishedAt: now,
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
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['VLA-Models'], tagRecords['Agentic-AI']]
    },
    {
      title: 'DARPA AI Cyber Challenge: Autonomous Vulnerability Discovery Engines Outperform Human Auditors',
      crux: 'Cybersecurity research has entered an autonomous arms race. Autonomous Cyber Reasoning Systems (CRS) utilizing fine-tuned LLMs and fuzzing engines successfully identified 0-day memory corruption vulnerabilities across critical Linux kernel sub-modules within minutes. Security researchers emphasize that verifying LLM-generated exploit chains requires strict formal verification sandbox boundaries.',
      sourceUrl: 'https://github.com/trending',
      domain: 'Cybersecurity',
      severity: 'major',
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['Cyber-Defense'], tagRecords['Agentic-AI']]
    },
    {
      title: 'FlashAttention-3 & RingAttention: Pushing Context Windows Beyond 1 Million Tokens Without SRAM Bottlenecks',
      crux: 'Standard attention mechanisms scale quadratically in memory O(N²), causing severe SRAM memory bandwidth bottlenecks on modern GPU clusters. FlashAttention-3 leverages asynchronous GPU tensor core operations and warp-specialized scheduling to compute exact softmax attention in block-wise tiles. Combined with RingAttention across distributed nodes, systems can now ingest entire codebases into active context.',
      sourceUrl: 'https://arxiv.org/abs/2407.08608',
      domain: 'Research',
      severity: 'major',
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['FlashAttention']]
    },
    {
      title: 'The Rise of Agentic Pair Programming: Cursor, Devin & Autonomous Repo Refactoring Engines',
      crux: 'Software engineering workflows are transitioning from static autocompletion to autonomous repository agents. Modern AI coding assistants construct multi-file dependency graphs, execute background unit test suites, and iteratively fix syntax and logic bugs before opening pull requests. Engineers are focusing more on architectural design and system invariants rather than boilerplate syntax.',
      sourceUrl: 'https://github.com',
      domain: 'Startups & Funding',
      severity: 'notable',
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['Agentic-AI']]
    },
    {
      title: 'Local High-Throughput Inference: vLLM, TensorRT-LLM & Quantization Benchmarks for Workstations',
      crux: 'Deploying LLMs locally on consumer hardware has reached sub-millisecond TTFT (Time-To-First-Token) thanks to PagedAttention and GGUF/AWQ 4-bit quantization techniques. Using vLLM or TensorRT-LLM, CS students can run 70B parameter models on single workstation GPUs by avoiding KV-cache memory fragmentation.',
      sourceUrl: 'https://github.com/vllm-project/vllm',
      domain: 'Tools',
      severity: 'normal',
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['Local-LLMs']]
    },

    // --- Web Development ---
    {
      title: 'React 19 & Next.js 15: Server Components, Actions, and the Future of Full-Stack React',
      crux: 'React 19 introduces the use() hook for reading resources during render, Server Actions for mutations, and improved hydration. Next.js 15 aligns with React 19, adding Turbopack by default, async request APIs, and instrumentation hooks. The combined release redefines how full-stack React applications handle data fetching, caching, and server-client boundaries.',
      sourceUrl: 'https://react.dev/blog/2024/12/05/react-19',
      domain: 'Web Development',
      severity: 'major',
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['React'], tagRecords['NextJS']]
    },
    {
      title: 'WebAssembly Component Model Goes 1.0: Polyglot Modules for the Browser and Beyond',
      crux: 'The WebAssembly Component Model reaches 1.0, enabling language-agnostic component composition with wit (WebAssembly Interface Types). Developers can now write components in Rust, Go, or C++ and link them at runtime in the browser or Wasm runtimes like Wasmtime. This unlocks true polyglot web applications and portable plugins for edge platforms.',
      sourceUrl: 'https://github.com/WebAssembly/component-model',
      domain: 'Web Development',
      severity: 'notable',
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['WebAssembly']]
    },

    // --- Gaming ---
    {
      title: 'Unreal Engine 5.5: Nanite Tessellation, MegaLights, and the Path to Photorealism',
      crux: 'Unreal Engine 5.5 introduces Nanite tessellation for displacement mapping without manual LODs, MegaLights for millions of dynamic area lights, and a rewritten animation layering system. Combined with Lumen global illumination, the engine pushes real-time rendering closer to offline path-tracing quality while maintaining 60 FPS on current-gen consoles.',
      sourceUrl: 'https://www.unrealengine.com/en-US/blog',
      domain: 'Gaming',
      severity: 'major',
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['GameDev'], tagRecords['UnrealEngine']]
    },
    {
      title: 'Godot 4.3: .NET 8 Support, Rendering Improvements, and the Open-Source Alternative',
      crux: 'Godot 4.3 adds first-class C#/.NET 8 support via GodotSharp, improves the Vulkan renderer with mobile VRR and FSR 3.1, and introduces a new GPU-driven particle system. The MIT-licensed engine continues to gain traction among indie studios and educators as a viable alternative to proprietary engines.',
      sourceUrl: 'https://godotengine.org/article',
      domain: 'Gaming',
      severity: 'notable',
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['GameDev']]
    },

    // --- Crypto & Web3 ---
    {
      title: 'Ethereum Pectra Upgrade: Account Abstraction, Verkle Trees, and Validator Experience',
      crux: 'The Pectra upgrade (Prague + Electra) brings EIP-7702 (native account abstraction), Verkle tree migration for stateless clients, and EIP-7251 (max effective balance increase to 2,048 ETH). These changes reduce validator hardware requirements, enable smart contract wallets at the protocol layer, and lay groundwork for stateless verification.',
      sourceUrl: 'https://ethereum.org/en/roadmap/',
      domain: 'Crypto & Web3',
      severity: 'major',
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['Blockchain'], tagRecords['ZeroKnowledge']]
    },
    {
      title: 'Zero-Knowledge Virtual Machines (zkVMs): SP1, RISC Zero, and the End of Custom Circuits',
      crux: 'General-purpose zkVMs like SP1 and RISC Zero allow developers to write verifiable programs in Rust without hand-writing arithmetic circuits. By executing standard RISC-V binaries inside a ZK proof system, these platforms dramatically lower the barrier to building ZK applications — from rollups to bridging to private AI inference.',
      sourceUrl: 'https://www.risczero.com/',
      domain: 'Crypto & Web3',
      severity: 'notable',
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['ZeroKnowledge'], tagRecords['DeFi']]
    },

    // --- Mobile ---
    {
      title: 'iOS 18 & Swift 6: Apple Intelligence, Data Race Safety, and the Swift Testing Framework',
      crux: 'iOS 18 debuts Apple Intelligence with on-device foundation models, Private Cloud Compute for larger models, and App Intents for Siri integration. Swift 6 enforces compile-time data race safety via strict concurrency checking. The new Swift Testing framework replaces XCTest with expressive macros, parallel execution, and parameterized tests.',
      sourceUrl: 'https://developer.apple.com/documentation',
      domain: 'Mobile',
      severity: 'major',
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['iOS'], tagRecords['SwiftUI']]
    },
    {
      title: 'Android 15, Jetpack Compose 1.7, and the Kotlin Multiplatform Push',
      crux: 'Android 15 (VanillaIceCream) adds predictive back gestures, health connect updates, and satellite connectivity APIs. Jetpack Compose 1.7 brings strong skipping, improved text rendering, and Material 3 Expressive. Kotlin Multiplatform stabilizes for iOS targets, enabling shared business logic across Android, iOS, Desktop, and Web from a single codebase.',
      sourceUrl: 'https://developer.android.com/about/versions/15',
      domain: 'Mobile',
      severity: 'notable',
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['Android'], tagRecords['JetpackCompose']]
    },

    // --- Hardware ---
    {
      title: 'NVIDIA Blackwell GB200: 208B Transistors, NVLink 5.0, and the AI Superchip Era',
      crux: 'The Blackwell GB200 NVL72 combines two GB200 GPUs with a Grace CPU via 900 GB/s NVLink-C2C, delivering 20 petaFLOPS FP4 per rack. NVLink 5.0 scales to 576 GPUs in a single domain. TSMC 4NP process and CoWoS-L packaging enable the largest compute density ever shipped — targeting trillion-parameter model training and inference.',
      sourceUrl: 'https://www.nvidia.com/en-us/data-center/blackwell-platform/',
      domain: 'Hardware',
      severity: 'major',
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['GPU'], tagRecords['Silicon']]
    },
    {
      title: 'RISC-V Enters the Datacenter: Ventana Veyron V1, SiFive P870, and the Open ISA Momentum',
      crux: 'High-performance RISC-V cores are shipping in silicon: Ventana\'s Veyron V1 (12-wide out-of-order, 3.6 GHz) and SiFive\'s P870 (superscalar, Linux-capable) target server and edge workloads. The RVA23 profile standardizes vector, crypto, and hypervisor extensions. Hyperscalers are evaluating RISC-V for custom accelerators and sovereign compute stacks.',
      sourceUrl: 'https://riscv.org/',
      domain: 'Hardware',
      severity: 'notable',
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['RISC-V'], tagRecords['Silicon']]
    },

    // --- Campus (Student-focused content) ---
    {
      title: 'How to Build Your First RAG Pipeline: A Step-by-Step Guide for CS Students',
      crux: 'Retrieval-Augmented Generation (RAG) is the foundational pattern for grounding LLMs in private data. This tutorial walks through chunking strategies, embedding model selection (BGE-M3 vs. Nomic), vector database choices (Qdrant, pgvector, Milvus), and evaluation metrics (hit rate, MRR) — all runnable on a laptop with Ollama and LangChain.',
      sourceUrl: 'https://github.com/langchain-ai/langchain',
      domain: 'Campus',
      severity: 'major',
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['Agentic-AI'], tagRecords['Local-LLMs']]
    },
    {
      title: 'CS Career Guide 2026: From LeetCode to System Design — What FAANG Actually Tests',
      crux: 'Breaking down the modern interview loop: coding (patterns, not memorization), system design (scalability, consistency, trade-offs), behavioral (impact, conflict, growth), and domain-specific rounds (ML infra, distributed systems, frontend architecture). Includes a 12-week prep calendar, recommended resources, and negotiation playbook for new grad offers.',
      sourceUrl: 'https://www.teamblind.com',
      domain: 'Campus',
      severity: 'notable',
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['Fellowship']]
    },

    // --- Opportunities Entries for CS Students ---
    {
      title: 'Google Summer of Code 2026: Open-Source AI Infrastructure Grants ($3,000–$6,000 Stipends)',
      crux: 'Google • GSoC 2026 is accepting applications from university CS students for open-source AI projects including PyTorch optimizations, vLLM kernels, and HuggingFace Transformers features. Eligible: Currently enrolled undergrad and grad students.',
      sourceUrl: 'https://summerofcode.withgoogle.com',
      domain: 'Opportunities',
      severity: 'major',
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['Fellowship'], tagRecords['Agentic-AI']]
    },
    {
      title: 'AWS Cloud Student Innovators Program: $2,500 in Free GPU Credits for AI/ML Research',
      crux: 'Amazon Web Services • Student research teams working on open-source ML models can claim $2,500 in AWS cloud credits for NVIDIA H100/A100 instances. Deadline: Rolling basis for enrolled engineering students.',
      sourceUrl: 'https://aws.amazon.com/developer/community/grants',
      domain: 'Opportunities',
      severity: 'notable',
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['Cloud-Credits']]
    },
    {
      title: 'HackMIT 2026 & Global Agentic AI Hackathon: $50,000 Prize Pool for Autonomous Systems',
      crux: 'MIT & Anthropic • 48-hour global hybrid hackathon focusing on autonomous AI agent benchmarks, multi-agent coordination, and formal verification. Open to all university students globally.',
      sourceUrl: 'https://hackmit.org',
      domain: 'Opportunities',
      severity: 'major',
      publishedAt: now,
      issueId: issue.id,
      tags: [tagRecords['Hackathon'], tagRecords['Agentic-AI']]
    },

    // --- Back Page Drama ---
    {
      title: 'THE BACK PAGE: Benchmark Contamination Wars & The Synthetic Data Infinite Loop',
      crux: 'DRAMA & CONTROVERSY: The AI research community is embroiled in a heated debate over benchmark saturation. With models scoring 95%+ on MMLU and GSM8K, evidence suggests public benchmark test sets are leaking into pre-training corpora. Meanwhile, researchers warn of "Model Autophagy Disorder" (MAD)—where training future LLMs on AI-generated web text degrades semantic diversity over generations.',
      sourceUrl: 'https://huggingface.co/blog',
      domain: 'Drama',
      severity: 'major',
      publishedAt: now,
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

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
