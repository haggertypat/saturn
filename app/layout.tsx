import type { Metadata } from 'next'
import './globals.css'
import { Source_Serif_4, Inter } from 'next/font/google'
import { ThemeInit } from '@/components/ThemeInit'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-sans'
})

const sourceSerif = Source_Serif_4({
    subsets: ['latin'],
    style: ['normal', 'italic'],
    variable: '--font-source-serif', // This creates the CSS variable
})

export const metadata: Metadata = {
    title: 'Journal',
    description: 'A minimal journal app',
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