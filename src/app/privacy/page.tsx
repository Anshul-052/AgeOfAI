import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How AgeOfAI collects, uses, and protects reader information.',
};

export default function PrivacyPage() {
  return <main className="mx-auto w-full max-w-4xl px-5 py-12 sm:py-16">
    <p className="font-label-caps text-xs font-bold uppercase tracking-widest text-primary">AgeOfAI / Legal</p>
    <h1 className="mt-2 font-headline-xl text-4xl sm:text-5xl">Privacy Policy</h1>
    <p className="mt-3 text-sm text-on-surface-variant">Effective 27 September 2026</p>

    <div className="mt-10 space-y-9 text-base leading-7 text-on-surface">
      <section><h2 className="font-headline-md text-2xl font-bold">Who operates AgeOfAI</h2><p className="mt-2">AgeOfAI is an independent technology publication and a TechLuna project created by Anshul Ramesh Nagpure. This policy explains the information used to operate the website, reader accounts, saved reading features, and newsletter.</p></section>

      <section><h2 className="font-headline-md text-2xl font-bold">Information we collect</h2><ul className="mt-2 list-disc space-y-2 pl-6">
        <li><strong>Reader accounts:</strong> email address, an internal account identifier, and authentication records. Passwords are handled by Supabase Auth and are not visible to AgeOfAI.</li>
        <li><strong>Google sign-in:</strong> when selected, AgeOfAI receives the basic account information needed to authenticate you, including your Google account identifier, email address, name, and profile image. We request only the <code>openid</code>, email, and profile scopes.</li>
        <li><strong>Newsletter:</strong> the email address you submit, subscription status, and delivery status.</li>
        <li><strong>Bookmarks:</strong> saved stories are stored locally in your browser. AgeOfAI does not upload the bookmark list to its servers.</li>
        <li><strong>Technical information:</strong> hosting and security providers may process request logs such as IP address, browser type, timestamps, and requested pages to deliver and protect the service.</li>
      </ul></section>

      <section><h2 className="font-headline-md text-2xl font-bold">How information is used</h2><p className="mt-2">We use information to create and secure reader accounts, keep readers signed in, provide access to issues and archives, send requested account or newsletter emails, prevent abuse, diagnose failures, and maintain the publication. Google user data is used only to authenticate the reader and display account identity. It is not used for advertising, profiling, or training artificial-intelligence models.</p></section>

      <section><h2 className="font-headline-md text-2xl font-bold">Service providers</h2><p className="mt-2">AgeOfAI relies on service providers that process limited information for these purposes: Supabase for authentication and database services; Google when Google sign-in is selected; Brevo for transactional account emails; Vercel and Render for application hosting; and Resend for newsletter delivery when enabled. Each provider processes information under its own terms and privacy commitments.</p></section>

      <section><h2 className="font-headline-md text-2xl font-bold">Sharing and selling</h2><p className="mt-2">We do not sell personal information. We do not share it for targeted advertising. Information may be disclosed to the providers listed above as needed to run AgeOfAI, when required by law, or to protect readers and the service from fraud or abuse.</p></section>

      <section><h2 className="font-headline-md text-2xl font-bold">Retention and control</h2><p className="mt-2">Account information is retained while the account remains active and as reasonably needed for security or legal obligations. Newsletter information is retained until you unsubscribe or request deletion. Browser bookmarks remain on your device until you clear them or your browser storage. You may unsubscribe through the link in a newsletter. Requests to access, correct, or delete personal information can be sent to the support address displayed on the AgeOfAI Google consent screen or to the verified sender address shown in an AgeOfAI account email.</p></section>

      <section><h2 className="font-headline-md text-2xl font-bold">Security and children</h2><p className="mt-2">We use authentication, encrypted transport, and access controls intended to protect reader information, but no online service can guarantee absolute security. AgeOfAI is a general-audience technology publication and is not directed to children under 13.</p></section>

      <section><h2 className="font-headline-md text-2xl font-bold">Changes</h2><p className="mt-2">We may update this policy when the service or its providers change. The effective date above will be revised when material changes are published.</p></section>
    </div>
  </main>;
}
