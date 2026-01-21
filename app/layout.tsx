import type { Metadata } from 'next'
import './globals.css'
import { Source_Serif_4 } from 'next/font/google'

const sourceSerif = Source_Serif_4({
    subsets: ['latin'],
    style: ['normal', 'italic'],
    variable: '--font-source-serif', // This creates the CSS variable
})

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
        <html lang="en" className={`${sourceSerif.variable} font-serif`} suppressHydrationWarning>
        <head>
            <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        </head>
        <body className="antialiased">
            {children}
        </body>
        </html>
    )
}