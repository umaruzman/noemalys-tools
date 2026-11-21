import { Archive, Bookmark, ScanLine, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import styles from './home.module.css';

const features = [
  { icon: ScanLine, title: 'Resize a batch', description: 'Set one size and format for a whole folder of JPEG, PNG, or WebP images.' },
  { icon: Bookmark, title: 'Save a preset', description: 'Keep your dimensions and compression settings ready for next time.' },
  { icon: Archive, title: 'Download a ZIP', description: 'Get the finished batch in one file or save images individually.' },
];

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={`shell ${styles.heroGrid}`}>
          <div className={styles.copy}>
            <h1 id="home-title">Batch image<br />resizer<span>.</span></h1>
            <p>Resize, compress, and convert a whole batch of images in your browser.</p>
            <Link href="/image-resizer/" className={styles.launch}>
              <ScanLine size={20} aria-hidden="true" />
              Open image resizer
            </Link>
            <div className={styles.privacy}><ShieldCheck size={18} aria-hidden="true" /> Images stay on your device</div>
          </div>
          <div className={styles.art}>
            <img src="/resize-illustration.webp" alt="" width="800" height="533" fetchPriority="high" />
          </div>
        </div>
      </section>
      <ul className={`shell ${styles.features}`}>
        {features.map(({ icon: Icon, title, description }) => (
          <li key={title}>
            <Icon size={23} aria-hidden="true" />
            <div><h2>{title}</h2><p>{description}</p></div>
          </li>
        ))}
      </ul>
    </main>
  );
}
