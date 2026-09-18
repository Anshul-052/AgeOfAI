interface StoryItem {
  id: string;
  title: string;
  crux: string;
  domain: string;
  severity: string;
  sourceUrl: string;
}

interface IssueData {
  id: string;
  volume: string;
  issueNumber: number;
  publishedAt: Date;
  stories: StoryItem[];
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function safeHttpUrl(value: string, fallback: string): string {
  try { const url = new URL(value); return /^https?:$/.test(url.protocol) ? url.toString() : fallback; } catch { return fallback; }
}

export function generateNewsletterHtml(issue: IssueData, subscriberEmail: string, siteUrl: string, unsubscribeSecret: string): string {
  const baseUrl = safeHttpUrl(siteUrl, 'http://localhost:3000').replace(/\/$/, '');
  const unsubscribeToken = createUnsubscribeToken(subscriberEmail, unsubscribeSecret);
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  const issueUrl = `${baseUrl}/issues/${encodeURIComponent(issue.id)}`;

  const storiesHtml = issue.stories.map((story) => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e2e8f0;">
        <span style="font-family: monospace; font-size: 10px; text-transform: uppercase; background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; color: #475569;">
          ${escapeHtml(story.domain)} • ${escapeHtml(story.severity)}
        </span>
        <h2 style="font-family: Georgia, serif; font-size: 18px; margin: 8px 0 6px 0; color: #0f172a;">
          <a href="${safeHttpUrl(story.sourceUrl, issueUrl)}" style="color: #0f172a; text-decoration: none;">${escapeHtml(story.title)}</a>
        </h2>
        <p style="font-family: Georgia, serif; font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 10px 0;">
          ${escapeHtml(story.crux)}
        </p>
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AgeOfAI — ${issue.volume} Issue #${issue.issueNumber}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: system-ui, -apple-system, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #cbd5e1; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <!-- Header Masthead -->
          <tr>
            <td style="padding: 24px 30px; text-align: center; border-bottom: 3px double #0f172a; background-color: #0f172a; color: #ffffff;">
              <h1 style="font-family: Times New Roman, serif; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; margin: 0; color: #ffffff;">
                AgeOfAI
              </h1>
              <p style="font-family: monospace; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 6px 0 0 0; color: #94a3b8;">
                Weekly CS & Engineering Broadsheet • ${issue.volume} Issue #${issue.issueNumber}
              </p>
            </td>
          </tr>

          <!-- Intro Banner -->
          <tr>
            <td style="padding: 16px 30px; background-color: #f1f5f9; border-bottom: 1px solid #cbd5e1; text-align: center;">
              <p style="font-family: sans-serif; font-size: 13px; color: #334155; margin: 0;">
                📖 View the interactive page-flip issue on the web: 
                <a href="${issueUrl}" style="color: #2563eb; font-weight: bold; text-decoration: underline;">Open Broadsheet Reader →</a>
              </p>
            </td>
          </tr>

          <!-- Stories Content -->
          <tr>
            <td style="padding: 10px 30px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                ${storiesHtml}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; text-align: center; background-color: #0f172a; color: #64748b; font-size: 11px; font-family: sans-serif;">
              <p style="margin: 0 0 8px 0; color: #94a3b8;">
                AgeOfAI — Curated weekly magazine for computer science & engineering students.
              </p>
              <p style="margin: 0;">
                <a href="${unsubscribeUrl}" style="color: #64748b; text-decoration: underline;">Unsubscribe from emails</a>
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
import { createUnsubscribeToken } from './newsletterTokens';
