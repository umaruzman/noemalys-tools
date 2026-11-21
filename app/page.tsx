import Link from 'next/link';

export default function Home() {
  return <main className="shell main"><h1>Noemalys Tools</h1>
    <Link className="toolLink" href="/image-resizer/"><strong>Batch image resizer</strong><span>Resize, compress, and download images in your browser.</span></Link>
  </main>;
}
