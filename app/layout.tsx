import type { Metadata } from 'next'
import './globals.css'
import { Source_Serif_4 } from 'next/font/google'
import { ThemeInit } from '@/components/ThemeInit'

const sourceSerif = Source_Serif_4({
    subsets: ['latin'],
    style: ['normal', 'italic'],
    variable: '--font-source-serif', // This creates the CSS variable
})

export const metadata: Metadata = {
    title: 'Saturn',
    description: 'A dream journal',
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className={`${sourceSerif.variable} font-serif`}>
        <body className="antialiased">
            <ThemeInit />
            {children}
        </body>
        </html>
    )
}