import { prisma } from '@/lib/db';
import crypto from 'crypto';

export interface IngestedItem {
  source: 'arxiv' | 'huggingface' | 'github' | 'hackernews' | 'producthunt' | 'gaming-rss' | 'crypto-rss' | 'mobile-rss' | 'hardware-rss';
  rawTitle: string;
  rawContent: string;
  sourceUrl: string;
  suggestedDomain?: string;
}

function computeHash(text: string): string {
  return crypto.createHash('sha256').update(text.trim()).digest('hex');
}

function parseRSSFeed(xmlText: string): { title: string; content: string; link: string }[] {
  const items: { title: string; content: string; link: string }[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];
    const titleMatch = itemXml.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/);
    const descMatch = itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>|<description>([\s\S]*?)<\/description>/);
    const linkMatch = itemXml.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>|<link>([\s\S]*?)<\/link>/);
    const guidMatch = itemXml.match(/<guid[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/guid>|<guid[^>]*>([\s\S]*?)<\/guid>/);

    const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : '';
    const content = descMatch ? (descMatch[1] || descMatch[2] || '').replace(/<[^>]*>/g, '').trim() : '';
    const link = linkMatch ? (linkMatch[1] || linkMatch[2] || '').trim() : (guidMatch ? (guidMatch[1] || guidMatch[2] || '').trim() : '');

    if (title && content) {
      items.push({ title, content, link });
    }
  }
  return items;
}

export async function fetchArxivCandidates(): Promise<IngestedItem[]> {
  try {
    const url = 'https://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.CL+OR+cat:cs.LG+OR+cat:cs.CV&max_results=15&sortBy=submittedDate&sortOrder=descending';
    const res = await fetch(url, { headers: { 'User-Agent': 'AgeOfAI/1.0' }, next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const xmlText = await res.text();
    const items: IngestedItem[] = [];

    const entries = xmlText.split('<entry>');
    for (let i = 1; i < entries.length; i++) {
      const entry = entries[i];
      const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
      const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
      const idMatch = entry.match(/<id>([\s\S]*?)<\/id>/);

      const rawTitle = titleMatch ? titleMatch[1].replace(/\n/g, ' ').trim() : '';
      const rawContent = summaryMatch ? summaryMatch[1].replace(/\n/g, ' ').trim() : '';
      const sourceUrl = idMatch ? idMatch[1].trim() : '';

      if (rawTitle && rawContent) {
        items.push({
          source: 'arxiv',
          rawTitle,
          rawContent,
          sourceUrl,
          suggestedDomain: 'LLMs'
        });
      }
    }
    return items;
  } catch (error) {
    console.error('arXiv fetch error:', error);
    return [];
  }
}

export async function fetchHuggingFaceCandidates(): Promise<IngestedItem[]> {
  try {
    const url = 'https://huggingface.co/api/daily_papers';
    const res = await fetch(url, { headers: { 'User-Agent': 'AgeOfAI/1.0' }, next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const data = await res.json();
    const items: IngestedItem[] = [];

    if (Array.isArray(data)) {
      for (const item of data.slice(0, 15)) {
        const paper = item.paper || {};
        const rawTitle = paper.title || '';
        const rawContent = paper.summary || paper.ai_summary || paper.title || '';
        const sourceUrl = paper.id ? `https://huggingface.co/papers/${paper.id}` : 'https://huggingface.co/papers';

        if (rawTitle) {
          items.push({
            source: 'huggingface',
            rawTitle,
            rawContent,
            sourceUrl,
            suggestedDomain: 'Research'
          });
        }
      }
    }
    return items;
  } catch (error) {
    console.error('HuggingFace fetch error:', error);
    return [];
  }
}

export async function fetchGitHubCandidates(): Promise<IngestedItem[]> {
  try {
    const url = 'https://api.github.com/search/repositories?q=topic:machine-learning+topic:artificial-intelligence&sort=stars&order=desc&per_page=15';
    const res = await fetch(url, { 
      headers: { 
        'User-Agent': 'AgeOfAI/1.0',
        'Accept': 'application/vnd.github.v3+json'
      },
      next: { revalidate: 3600 } 
    });
    if (!res.ok) return [];

    const data = await res.json();
    const items: IngestedItem[] = [];

    if (Array.isArray(data.items)) {
      for (const repo of data.items) {
        const rawTitle = repo.full_name || repo.name;
        const rawContent = repo.description || `Popular AI Repository: ${repo.full_name} (${repo.stargazers_count} stars). Primary language: ${repo.language || 'Python'}.`;
        const sourceUrl = repo.html_url;

        if (rawTitle) {
          items.push({
            source: 'github',
            rawTitle,
            rawContent,
            sourceUrl,
            suggestedDomain: 'Tools'
          });
        }
      }
    }
    return items;
  } catch (error) {
    console.error('GitHub fetch error:', error);
    return [];
  }
}

export async function fetchHackerNewsCandidates(): Promise<IngestedItem[]> {
  try {
    const topStoriesUrl = 'https://hacker-news.firebaseio.com/v0/topstories.json';
    const res = await fetch(topStoriesUrl, { headers: { 'User-Agent': 'AgeOfAI/1.0' }, next: { revalidate: 1800 } });
    if (!res.ok) return [];

    const storyIds = await res.json();
    const topIds = (storyIds as number[]).slice(0, 30);
    const items: IngestedItem[] = [];

    for (const id of topIds) {
      try {
        const storyUrl = `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
        const storyRes = await fetch(storyUrl, { headers: { 'User-Agent': 'AgeOfAI/1.0' }, next: { revalidate: 3600 } });
        if (!storyRes.ok) continue;

        const story = await storyRes.json();
        if (!story || story.type !== 'story' || story.dead || story.deleted) continue;

        const rawTitle = story.title || '';
        const rawContent = story.text || story.url ? `Hacker News discussion: ${story.url || ''} (${story.score} points, ${story.descendants || 0} comments)` : '';
        const sourceUrl = story.url || `https://news.ycombinator.com/item?id=${id}`;

        if (rawTitle && rawContent) {
          items.push({
            source: 'hackernews',
            rawTitle,
            rawContent,
            sourceUrl,
            suggestedDomain: 'Web Development'
          });
        }
      } catch (storyError) {
        console.error(`Hacker News story ${id} fetch error:`, storyError);
      }
    }
    return items;
  } catch (error) {
    console.error('Hacker News fetch error:', error);
    return [];
  }
}

export async function fetchProductHuntCandidates(): Promise<IngestedItem[]> {
  try {
    const url = 'https://api.producthunt.com/v2/api/graphql';
    const query = `
      query {
        posts(first: 15, order: VOTES, postedAfter: "${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}") {
          edges {
            node {
              name
              tagline
              description
              url
              votesCount
              topics {
                edges {
                  node {
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;

    const token = process.env.PRODUCT_HUNT_TOKEN;
    if (!token) {
      console.warn('PRODUCT_HUNT_TOKEN not configured, skipping Product Hunt ingestion');
      return [];
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'AgeOfAI/1.0'
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 3600 }
    });

    if (!res.ok) {
      console.error('Product Hunt API error:', res.status, await res.text());
      return [];
    }

    const data = await res.json();
    const items: IngestedItem[] = [];

    if (data.data?.posts?.edges) {
      for (const edge of data.data.posts.edges) {
        const post = edge.node;
        const rawTitle = post.name || '';
        const topics = post.topics?.edges?.map((e: { node: { name: string } }) => e.node.name).join(', ') || '';
        const rawContent = `${post.tagline || ''} ${post.description || ''} Topics: ${topics} (${post.votesCount} votes)`;
        const sourceUrl = post.url || '';

        if (rawTitle) {
          items.push({
            source: 'producthunt',
            rawTitle,
            rawContent,
            sourceUrl,
            suggestedDomain: 'Web Development'
          });
        }
      }
    }
    return items;
  } catch (error) {
    console.error('Product Hunt fetch error:', error);
    return [];
  }
}

export async function fetchGamingRSSCandidates(): Promise<IngestedItem[]> {
  try {
    const feeds = [
      'https://www.gamasutra.com/rss/news.xml',
      'https://www.gamesindustry.biz/rss',
      'https://www.polygon.com/rss/index.xml',
      'https://kotaku.com/rss',
    ];

    const items: IngestedItem[] = [];

    for (const feedUrl of feeds) {
      try {
        const res = await fetch(feedUrl, { headers: { 'User-Agent': 'AgeOfAI/1.0' }, next: { revalidate: 3600 } });
        if (!res.ok) {
          console.warn(`Gaming RSS feed ${feedUrl} returned ${res.status}`);
          continue;
        }

        const xmlText = await res.text();
        const parsed = parseRSSFeed(xmlText);

        for (const item of parsed.slice(0, 5)) {
          items.push({
            source: 'gaming-rss',
            rawTitle: item.title,
            rawContent: item.content,
            sourceUrl: item.link,
            suggestedDomain: 'Gaming'
          });
        }
      } catch (feedError) {
        console.error(`Gaming RSS feed ${feedUrl} error:`, feedError);
      }
    }
    return items;
  } catch (error) {
    console.error('Gaming RSS fetch error:', error);
    return [];
  }
}

export async function fetchCryptoRSSCandidates(): Promise<IngestedItem[]> {
  try {
    const feeds = [
      'https://coindesk.com/arc/outboundfeeds/rss/',
      'https://www.theblock.co/rss.xml',
      'https://decrypt.co/feed',
      'https://cointelegraph.com/rss',
    ];

    const items: IngestedItem[] = [];

    for (const feedUrl of feeds) {
      try {
        const res = await fetch(feedUrl, { headers: { 'User-Agent': 'AgeOfAI/1.0' }, next: { revalidate: 3600 } });
        if (!res.ok) {
          console.warn(`Crypto RSS feed ${feedUrl} returned ${res.status}`);
          continue;
        }

        const xmlText = await res.text();
        const parsed = parseRSSFeed(xmlText);

        for (const item of parsed.slice(0, 5)) {
          items.push({
            source: 'crypto-rss',
            rawTitle: item.title,
            rawContent: item.content,
            sourceUrl: item.link,
            suggestedDomain: 'Crypto & Web3'
          });
        }
      } catch (feedError) {
        console.error(`Crypto RSS feed ${feedUrl} error:`, feedError);
      }
    }
    return items;
  } catch (error) {
    console.error('Crypto RSS fetch error:', error);
    return [];
  }
}

export async function fetchMobileRSSCandidates(): Promise<IngestedItem[]> {
  try {
    const feeds = [
      'https://developer.apple.com/news/rss/news.rss',
      'https://android-developers.googleblog.com/feeds/posts/default',
      'https://www.mobileworldlive.com/feed/',
      'https://www.phonearena.com/rss',
    ];

    const items: IngestedItem[] = [];

    for (const feedUrl of feeds) {
      try {
        const res = await fetch(feedUrl, { headers: { 'User-Agent': 'AgeOfAI/1.0' }, next: { revalidate: 3600 } });
        if (!res.ok) {
          console.warn(`Mobile RSS feed ${feedUrl} returned ${res.status}`);
          continue;
        }

        const xmlText = await res.text();
        const parsed = parseRSSFeed(xmlText);

        for (const item of parsed.slice(0, 5)) {
          items.push({
            source: 'mobile-rss',
            rawTitle: item.title,
            rawContent: item.content,
            sourceUrl: item.link,
            suggestedDomain: 'Mobile'
          });
        }
      } catch (feedError) {
        console.error(`Mobile RSS feed ${feedUrl} error:`, feedError);
      }
    }
    return items;
  } catch (error) {
    console.error('Mobile RSS fetch error:', error);
    return [];
  }
}

export async function fetchHardwareRSSCandidates(): Promise<IngestedItem[]> {
  try {
    const feeds = [
      'https://www.anandtech.com/rss',
      'https://www.tomshardware.com/rss',
      'https://www.theregister.com/headlines.atom',
      'https://arstechnica.com/gadgets/feed/',
    ];

    const items: IngestedItem[] = [];

    for (const feedUrl of feeds) {
      try {
        const res = await fetch(feedUrl, { headers: { 'User-Agent': 'AgeOfAI/1.0' }, next: { revalidate: 3600 } });
        if (!res.ok) {
          console.warn(`Hardware RSS feed ${feedUrl} returned ${res.status}`);
          continue;
        }

        const xmlText = await res.text();
        const parsed = parseRSSFeed(xmlText);

        for (const item of parsed.slice(0, 5)) {
          items.push({
            source: 'hardware-rss',
            rawTitle: item.title,
            rawContent: item.content,
            sourceUrl: item.link,
            suggestedDomain: 'Hardware'
          });
        }
      } catch (feedError) {
        console.error(`Hardware RSS feed ${feedUrl} error:`, feedError);
      }
    }
    return items;
  } catch (error) {
    console.error('Hardware RSS fetch error:', error);
    return [];
  }
}

export async function runIngestionPipeline() {
  console.log('Running Multi-Source Ingestion Pipeline...');
  const results = await Promise.allSettled([
    fetchArxivCandidates(),
    fetchHuggingFaceCandidates(),
    fetchGitHubCandidates(),
    fetchHackerNewsCandidates(),
    fetchProductHuntCandidates(),
    fetchGamingRSSCandidates(),
    fetchCryptoRSSCandidates(),
    fetchMobileRSSCandidates(),
    fetchHardwareRSSCandidates(),
  ]);

  const allCandidates: IngestedItem[] = [];
  const sourceNames = ['arxiv', 'huggingface', 'github', 'hackernews', 'producthunt', 'gaming-rss', 'crypto-rss', 'mobile-rss', 'hardware-rss'];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      allCandidates.push(...result.value);
      console.log(`  ${sourceNames[index]}: ${result.value.length} candidates`);
    } else {
      console.error(`  ${sourceNames[index]} FAILED:`, result.reason);
    }
  });

  let createdCount = 0;

  for (const item of allCandidates) {
    const contentHash = computeHash(item.rawContent);

    try {
      const existing = await prisma.ingestedCandidate.findFirst({
        where: { contentHash }
      });

      if (!existing) {
        await prisma.ingestedCandidate.create({
          data: {
            source: item.source,
            rawTitle: item.rawTitle,
            rawContent: item.rawContent,
            sourceUrl: item.sourceUrl,
            contentHash,
            status: 'pending',
            suggestedDomain: item.suggestedDomain
          }
        });
        createdCount++;
      }
    } catch (err) {
      console.error('Error storing candidate:', item.rawTitle, err);
    }
  }

  console.log(`Ingestion complete. Processed ${allCandidates.length} items, created ${createdCount} new candidates.`);
  return { totalFetched: allCandidates.length, newCreated: createdCount };
}
