import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: 'Sosyal Kulüp',
    description: 'Şirket içi sosyal kulüp ve etkinlik platformu',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="tr" className={inter.variable}>
            <body className="font-sans">
                <Providers>
                    <Navbar />
                    <main className="min-h-screen">{children}</main>
                </Providers>
            </body>
        </html>
    );
}
