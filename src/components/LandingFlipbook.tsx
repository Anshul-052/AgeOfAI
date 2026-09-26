"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";

interface FlipBookHandle {
  pageFlip(): {
    flipNext(): void;
    flipPrev(): void;
  };
}

const pageNames = [
  "Cover",
  "The proposition",
  "Built to remember",
  "The whole map",
  "TechLuna",
  "The editorial desk",
  "The founder",
  "Begin reading",
];

const domainRows = [
  ["AI & language models", "Robotics", "Cybersecurity"],
  ["Research", "Developer tools", "Web development"],
  ["Cloud & DevOps", "Data & databases", "Hardware & chips"],
  ["Mobile", "Gaming & graphics", "XR & spatial"],
  ["Networks & telecom", "Startups & funding", "Policy & society"],
];

export default function LandingFlipbook() {
  const stageRef = useRef<HTMLElement>(null);
  const bookRef = useRef<FlipBookHandle | null>(null);
  const turnLockRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 720, height: 900 });
  const [isPortrait, setIsPortrait] = useState(false);

  const turn = useCallback((direction: "next" | "previous") => {
    if (turnLockRef.current) return;
    turnLockRef.current = true;
    if (direction === "next") bookRef.current?.pageFlip().flipNext();
    else bookRef.current?.pageFlip().flipPrev();
    window.setTimeout(() => { turnLockRef.current = false; }, 780);
  }, []);

  useEffect(() => {
    const measure = () => {
      const portrait = window.innerWidth < 820;
      setIsPortrait(portrait);
      setDimensions({
        width: portrait ? window.innerWidth : Math.floor(window.innerWidth / 2),
        height: window.innerHeight,
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 18 || event.ctrlKey) return;
      event.preventDefault();
      turn(event.deltaY > 0 ? "next" : "previous");
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowDown", "ArrowRight", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        turn("next");
      }
      if (["ArrowUp", "ArrowLeft", "PageUp"].includes(event.key)) {
        event.preventDefault();
        turn("previous");
      }
    };
    const stage = stageRef.current;
    stage?.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      stage?.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [turn]);

  const moveLight = (event: React.PointerEvent<HTMLElement>) => {
    const x = `${(event.clientX / window.innerWidth) * 100}%`;
    const y = `${(event.clientY / window.innerHeight) * 100}%`;
    event.currentTarget.style.setProperty("--pointer-x", x);
    event.currentTarget.style.setProperty("--pointer-y", y);
  };

  const stopFlip = (event: React.MouseEvent) => event.stopPropagation();

  return (
    <main
      ref={stageRef}
      className="landing-stage"
      onPointerMove={moveLight}
      style={{ "--landing-page": currentPage } as React.CSSProperties}
    >
      <div className="landing-ambient" aria-hidden="true"><span /><span /><span /></div>

      <div className="landing-book-shell">
        <HTMLFlipBook
          key={`${isPortrait ? "portrait" : "landscape"}-${dimensions.width}x${dimensions.height}`}
          ref={bookRef}
          width={dimensions.width}
          height={dimensions.height}
          size="fixed"
          minWidth={dimensions.width}
          maxWidth={dimensions.width}
          minHeight={dimensions.height}
          maxHeight={dimensions.height}
          startPage={Math.min(currentPage, pageNames.length - 1)}
          drawShadow
          flippingTime={900}
          usePortrait={isPortrait}
          startZIndex={20}
          autoSize={false}
          maxShadowOpacity={0.65}
          showCover={false}
          mobileScrollSupport
          clickEventForward
          useMouseEvents
          swipeDistance={24}
          showPageCorners
          disableFlipByClick={false}
          onFlip={(event: { data: number }) => setCurrentPage(event.data)}
          className="landing-book"
          style={{ margin: 0 }}
        >
          <section className="landing-page landing-cover">
            <div className="cover-grid" aria-hidden="true" />
            <div className="cover-orbit cover-orbit-one" aria-hidden="true" />
            <div className="cover-orbit cover-orbit-two" aria-hidden="true" />
            <header className="landing-running-head"><span>Issue zero · The introduction</span><span>Independent technology chronicle</span></header>
            <div className="cover-core">
              <p className="landing-kicker">Meet your weekly map of technology</p>
              <h1>Age<br />Of<br />AI<span>.</span></h1>
              <p className="cover-deck">All of tech.<br />One issue.<br />Zero feed fatigue.</p>
            </div>
            <footer className="cover-footer"><span>Scroll to turn</span><span>Tap the edge</span><span>Press ↓</span></footer>
          </section>

          <section className="landing-page landing-paper proposition-page">
            <header className="landing-running-head"><span>01 / The proposition</span><span>Read across technology</span></header>
            <div className="landing-page-body">
              <p className="landing-kicker">The internet has updates. You need perspective.</p>
              <h2>Tech moves in every direction.<br /><em>We draw the map.</em></h2>
              <div className="landing-columns">
                <p>AgeOfAI is a domain-by-domain technology magazine for people who want the full picture without living inside twelve feeds. Each issue brings the week&apos;s meaningful developments into one deliberate reading experience.</p>
                <blockquote>“Know what changed.<br />Understand why it matters.<br />Find it when you need it.”</blockquote>
              </div>
            </div>
            <footer className="landing-folio"><span>AgeOfAI</span><span>1</span></footer>
          </section>

          <section className="landing-page landing-paper memory-page">
            <header className="landing-running-head"><span>02 / The product</span><span>A magazine with a memory</span></header>
            <div className="landing-page-body">
              <p className="landing-kicker">News that does not disappear after breakfast.</p>
              <h2>Read now.<br />Retrieve later.</h2>
              <div className="memory-stack" aria-label="AgeOfAI reader features">
                <article><span>01</span><h3>Every major field</h3><p>One edition spanning the technology landscape.</p></article>
                <article><span>02</span><h3>Permanent archive</h3><p>Search by story, tool, topic, or domain whenever curiosity returns.</p></article>
                <article><span>03</span><h3>Your own trail</h3><p>Bookmark the stories worth keeping and build a personal study guide.</p></article>
              </div>
              <p className="landing-pullquote">A weekly magazine today.<br />A useful knowledge base tomorrow.</p>
            </div>
            <footer className="landing-folio"><span>Built for curious readers</span><span>2</span></footer>
          </section>

          <section className="landing-page landing-ink domain-page">
            <header className="landing-running-head"><span>03 / The coverage</span><span>Almost every corner of tech</span></header>
            <div className="landing-page-body">
              <p className="landing-kicker">The whole map, not the loudest neighbourhood.</p>
              <h2>Across<br />technology.</h2>
              <div className="domain-ledger">
                {domainRows.map((row, rowIndex) => row.map((domain, index) => (
                  <span key={domain} style={{ "--domain-delay": `${(rowIndex * 3 + index) * 70}ms` } as React.CSSProperties}>{domain}</span>
                )))}
              </div>
            </div>
            <footer className="landing-folio"><span>Fifteen fields. One point of view.</span><span>3</span></footer>
          </section>

          <section className="landing-page landing-paper techluna-page">
            <header className="landing-running-head"><span>04 / The studio</span><span>TechLuna presents</span></header>
            <div className="landing-page-body techluna-layout">
              <div className="techluna-mark-wrap">
                <div className="techluna-rings" aria-hidden="true" />
                <Image src="/brand/techluna-logo.webp" alt="TechLuna logo" fill sizes="(max-width: 820px) 70vw, 34vw" className="techluna-mark" priority />
              </div>
              <div className="techluna-copy">
                <p className="landing-kicker">The small startup behind the big curiosity.</p>
                <h2>TechLuna</h2>
                <p>TechLuna started because I was bored enough to ask AI inconvenient questions and curious enough to keep building the answers.</p>
                <p>Now it is where I experiment with problems we have not noticed yet. No dramatic garage story. Just ideas, prototypes, and an unreasonable amount of fun.</p>
                <strong>AgeOfAI is one of those ideas that refused to stay small.</strong>
              </div>
            </div>
            <footer className="landing-folio"><span>Built out of curiosity</span><span>4</span></footer>
          </section>

          <section className="landing-page landing-paper desk-page">
            <header className="landing-running-head"><span>05 / The desk</span><span>Machine speed. Human permission.</span></header>
            <div className="landing-page-body">
              <p className="landing-kicker">The editor works fast. The editor does not publish.</p>
              <h2>A newsroom<br />with a final human word.</h2>
              <div className="desk-flow">
                <article><span>Scan</span><p>Monitor reliable sources across every technology domain.</p></article>
                <article><span>Filter</span><p>Remove duplicates, noise, and stories without enough substance.</p></article>
                <article><span>Cross-check</span><p>Draft from source material and preserve the original trail.</p></article>
                <article><span>Approve</span><p>Nothing enters an issue until the editor gives explicit permission.</p></article>
              </div>
              <blockquote>Automation can prepare the page.<br />Judgement decides what belongs on it.</blockquote>
            </div>
            <footer className="landing-folio"><span>Source-checked by design</span><span>5</span></footer>
          </section>

          <section className="landing-page landing-paper founder-page">
            <div className="founder-photo" aria-label="Portrait of Anshul Ramesh Nagpure">
              <Image src="/brand/anshul-ramesh-nagpure.webp" alt="Anshul Ramesh Nagpure" fill sizes="(max-width: 820px) 100vw, 50vw" className="founder-image" priority />
              <div className="founder-photo-caption"><span>Founder / maker / artist</span><span>Pune, India</span></div>
            </div>
            <div className="founder-copy">
              <header className="landing-running-head"><span>06 / About</span><span>The person asking too many questions</span></header>
              <div className="founder-copy-inner">
                <p className="landing-kicker">Anshul Ramesh Nagpure</p>
                <h2>Curiosity is<br />the full-time job.</h2>
                <p>I am a third-year B.Tech student at Vishwakarma Institute of Technology, Pune, and a full-time artist in more directions than a sensible bio should allow: lyricist, poet, music producer, rapper, and writer.</p>
                <p>I am an AI enthusiast with a slightly unreasonable need to know how everything works. The plan is to turn a small experiment called TechLuna into a full-blown company—one useful, strange idea at a time.</p>
                <blockquote>“I do not collect interests.<br />I follow them until they become work.”</blockquote>
              </div>
              <footer className="landing-folio"><span>Anshul / TechLuna</span><span>6</span></footer>
            </div>
          </section>

          <section className="landing-page landing-back-cover">
            <div className="back-cover-signal" aria-hidden="true"><i /><i /><i /><i /></div>
            <header className="landing-running-head"><span>07 / Your turn</span><span>The archive is open</span></header>
            <div className="back-cover-copy">
              <p className="landing-kicker">The next useful thing you learn could be one page away.</p>
              <h2>Stop chasing<br />the feed.<br /><em>Start reading.</em></h2>
              <p>One account. Every issue. Every domain. Every story worth finding again.</p>
              <div className="landing-cta-row" onClick={stopFlip}>
                <Link href="/read" prefetch={false}>Enter AgeOfAI</Link>
                <Link href="/login?next=%2Fread" prefetch={false} className="landing-cta-secondary">Sign in</Link>
              </div>
            </div>
            <footer className="back-cover-footer"><span>AgeOfAI</span><span>A TechLuna experiment</span></footer>
          </section>
        </HTMLFlipBook>
      </div>

      <aside className="landing-controls" aria-label="Landing page controls" onClick={stopFlip}>
        <button type="button" onClick={() => turn("previous")} disabled={currentPage === 0} aria-label="Previous page">↑</button>
        <div className="landing-progress">
          <span style={{ height: `${((currentPage + 1) / pageNames.length) * 100}%` }} />
        </div>
        <p><strong>{String(currentPage + 1).padStart(2, "0")}</strong><span>/ {String(pageNames.length).padStart(2, "0")}</span></p>
        <button type="button" onClick={() => turn("next")} disabled={currentPage >= pageNames.length - 1} aria-label="Next page">↓</button>
      </aside>

      <div className="landing-status" aria-live="polite">{pageNames[currentPage]}</div>
    </main>
  );
}
