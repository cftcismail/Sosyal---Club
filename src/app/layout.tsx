import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
    title: 'Sosyal Kulüp - Şirket İçi Sosyal Platform',
    description: 'Şirket içi sosyal kulüp ve etkinlik platformu',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="tr">
            <body className="font-sans">
                <Providers>
                    <Navbar />
                    <main className="min-h-screen">{children}</main>
                </Providers>
            </body>
        </html>
    );
}
