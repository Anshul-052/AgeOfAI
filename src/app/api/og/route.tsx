import { ImageResponse } from 'next/og';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'AgeOfAI Magazine';
    const volume = searchParams.get('volume') || 'Volume 1';
    const issueNumber = searchParams.get('issue') || '1';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            fontFamily: 'serif',
            padding: '40px',
            border: '12px solid #334155',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '4px double #94a3b8',
              paddingBottom: '16px',
              marginBottom: '24px',
              width: '100%',
            }}
          >
            <h1
              style={{
                fontSize: 64,
                fontWeight: 900,
                letterSpacing: '4px',
                textTransform: 'uppercase',
                margin: 0,
                color: '#ffffff',
              }}
            >
              AgeOfAI
            </h1>
          </div>

          <div
            style={{
              fontSize: 20,
              fontFamily: 'monospace',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: '#38bdf8',
              marginBottom: '20px',
            }}
          >
            Weekly CS & Engineering Broadsheet • {volume} Issue #{issueNumber}
          </div>

          <div
            style={{
              fontSize: 36,
              fontWeight: 'bold',
              textAlign: 'center',
              maxWidth: '900px',
              lineHeight: 1.3,
              color: '#f1f5f9',
            }}
          >
            {title}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('OG Image generation error:', error);
    return new Response('Failed to generate OG image', { status: 500 });
  }
}
