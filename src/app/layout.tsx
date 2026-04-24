import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ColonReport — Dr. Nardulli | endoscopianardulli.es',
  description:
    'Comprende tu informe de colonoscopia — Plataforma de información médica del Dr. Gianfranco Nardulli Fernández',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head />
      <body className={`${inter.variable} ${playfair.variable}`}>
        {/* Apply saved theme before React hydrates to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var t = localStorage.getItem('colonreport-theme') || 'dark';
              document.documentElement.classList.toggle('dark', t === 'dark');
            } catch(e) {}
          })();
        `}} />
        {children}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(regs) {
              regs.forEach(function(r) { r.unregister(); });
            });
          }
        `}} />
      </body>
    </html>
  );
}
