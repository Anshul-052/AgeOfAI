import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Terms governing access to and use of AgeOfAI.',
};

export default function TermsPage() {
  return <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:py-16">
    <p className="font-label-caps text-xs font-bold uppercase tracking-widest text-primary">AgeOfAI / Legal</p>
    <h1 className="mt-2 font-headline-xl text-4xl sm:text-5xl">Terms of Use</h1>
    <p className="mt-3 text-sm text-on-surface-variant">Effective 27 September 2026</p>

    <div className="mt-10 space-y-9 text-base leading-7 text-on-surface">
      <section><h2 className="font-headline-md text-2xl font-bold">Using AgeOfAI</h2><p className="mt-2">AgeOfAI is an independent technology publication and a TechLuna project. By accessing the website or creating a reader account, you agree to these terms. If you do not agree, do not use the service.</p></section>

      <section><h2 className="font-headline-md text-2xl font-bold">Reader accounts</h2><p className="mt-2">Provide an email address you control and keep your sign-in credentials secure. You are responsible for activity performed through your account. Do not impersonate another person, automate abusive registrations, interfere with authentication, or attempt to access private editorial or administrative systems.</p></section>

      <section><h2 className="font-headline-md text-2xl font-bold">Editorial information</h2><p className="mt-2">AgeOfAI summarizes and explains technology news from identified sources. The publication is for general information and education. It is not professional financial, investment, legal, medical, or cybersecurity advice. Technology changes quickly; verify important decisions against the linked original sources and qualified professionals.</p></section>

      <section><h2 className="font-headline-md text-2xl font-bold">Acceptable use</h2><p className="mt-2">You may use AgeOfAI for personal reading, research, and study. You may not disrupt the service, bypass access controls, scrape it at a harmful rate, distribute malware, misuse account recovery, reproduce substantial portions as a competing publication, or use the service in violation of applicable law.</p></section>

      <section><h2 className="font-headline-md text-2xl font-bold">Content and third-party links</h2><p className="mt-2">AgeOfAI’s original design, editorial presentation, summaries, and branding are protected by applicable intellectual-property laws. Source publishers retain rights in their original reporting and media. Links and images from third parties are provided for context; AgeOfAI does not control their availability, security, or policies.</p></section>

      <section><h2 className="font-headline-md text-2xl font-bold">Availability and changes</h2><p className="mt-2">We may change, suspend, or discontinue features, correct editorial errors, and update these terms. We aim to keep the service useful and available, but uninterrupted or error-free operation is not guaranteed.</p></section>

      <section><h2 className="font-headline-md text-2xl font-bold">Accounts and enforcement</h2><p className="mt-2">Access may be restricted when reasonably necessary to protect readers, comply with law, investigate abuse, or secure the service. You may stop using AgeOfAI at any time and request account deletion through the support address displayed on the Google consent screen or the verified sender address in an AgeOfAI account email.</p></section>

      <section><h2 className="font-headline-md text-2xl font-bold">Responsibility</h2><p className="mt-2">To the extent permitted by law, AgeOfAI is provided as available without warranties beyond those that cannot legally be excluded. AgeOfAI and TechLuna are not responsible for indirect losses resulting from reliance on editorial information, third-party websites, or interruptions outside their reasonable control.</p></section>
    </div>
  </main>;
}
