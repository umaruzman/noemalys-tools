import type { Metadata } from 'next';
import Resizer from './resizer';
import styles from './resizer.module.css';

export const metadata: Metadata = {
  title: 'Batch image resizer and compressor',
  description: 'Resize and compress batches of JPEG, PNG, and WebP images in your browser. Save presets and download a ZIP.',
  alternates: { canonical: '/image-resizer/' },
};

export default function Page() {
  return <main className="shell main">
    <div className={styles.intro}><h1>Batch image<br />resizer<span>.</span></h1>
      <p>Resize and compress a batch at once.<br />Your images stay on your device.</p></div>
    <Resizer />
  </main>;
}
