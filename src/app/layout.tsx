import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';

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
        <html lang="tr">
            <body className="font-sans app-shell">
                <Providers>
                    <Navbar />
                    <main className="min-h-screen page-enter">{children}</main>
                </Providers>
            </body>
        </html>
    );
}
