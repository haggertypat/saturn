import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Saturn',
    description: 'A dream journal',
}

const themeInitScript = `
(() => {
  try {
    const stored = localStorage.getItem('theme'); // 'dark' | 'light' | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', dark);
  } catch {}
})();
`;


export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="font-serif" suppressHydrationWarning>
        <head>
            <link
                rel="stylesheet"
                href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,200..900;1,200..900&display=swap"
            />
            <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        </head>
        <body className="antialiased">
            {children}
        </body>
        </html>
    )
}
