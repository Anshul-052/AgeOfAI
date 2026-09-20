import Link from 'next/link';
import domains from '@/lib/domains.json';
import SearchBar from './SearchBar';
import AccountControls from './AccountControls';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function Navbar() {
  const supabase = await createSupabaseServerClient();
  const { data } = supabase ? await supabase.auth.getClaims() : { data: null };
  const email = typeof data?.claims?.email === 'string' ? data.claims.email : undefined;
  return <header className="masthead print:hidden">
    <div className="masthead-top"><span>Independent technology chronicle</span><span><AccountControls email={email} /></span></div>
    <Link href="/" className="masthead-title" aria-label="AgeOfAI home">AgeOfAI<span className="masthead-period">.</span></Link>
    <div className="masthead-nav"><nav aria-label="Main navigation"><Link href="/">Latest edition</Link><Link href="/search">All stories</Link><Link href="/issues">Past editions</Link><Link href="/bookmarks">Saved stories</Link></nav><SearchBar /></div>
    <nav className="domain-rail" aria-label="Technology domains">{domains.map(d => <Link key={d.id} href={`/topics/${encodeURIComponent(d.id)}`}>{d.label}</Link>)}</nav>
  </header>;
}
