import Link from 'next/link';
import domains from '@/lib/domains.json';
import SearchBar from './SearchBar';

export default function Navbar() {
  return <header className="masthead print:hidden">
    <div className="masthead-top"><span>Independent technology chronicle</span><span>Every Sunday · Free to read</span></div>
    <Link href="/" className="masthead-title" aria-label="AgeOfAI home">AgeOfAI<span className="masthead-period">.</span></Link>
    <div className="masthead-nav"><nav aria-label="Main navigation"><Link href="/">Latest edition</Link><Link href="/search">All stories</Link><Link href="/issues">Past editions</Link><Link href="/bookmarks">Saved stories</Link></nav><SearchBar /></div>
    <nav className="domain-rail" aria-label="Technology domains">{domains.map(d => <Link key={d.id} href={`/topics/${encodeURIComponent(d.id)}`}>{d.label}</Link>)}</nav>
  </header>;
}
