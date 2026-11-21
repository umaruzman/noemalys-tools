import type { Metadata } from 'next';
import '@fontsource/sora/600.css';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/600.css';
import '@fontsource/jetbrains-mono/400.css';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://tools.noemalys.com'),
  title: { default: 'Noemalys Tools', template: '%s · Noemalys Tools' },
  description: 'Free browser tools from Noemalys.',
  icons: '/mark.svg',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>
    <header><div className="shell bar">
      <a href="https://noemalys.com" className="brand"><img src="/mark.svg" width="36" height="24" alt="" />Noemalys</a>
      <a href="/" className="nav">Tools</a>
    </div></header>
    {children}
    <footer><div className="shell bar"><a href="https://noemalys.com">Built by Noemalys</a><span>Thought, resolved.</span></div></footer>
  </body></html>;
}
