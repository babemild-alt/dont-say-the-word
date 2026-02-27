import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: "Don't Say the Word!!!",
    description: 'เกมปาร์ตี้สุดฮา — อย่าพูดคำต้องห้าม!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="th">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Noto+Sans+Thai:wght@400;500;600;700;800;900&family=Lilita+One&display=swap"
                    rel="stylesheet"
                />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="default" />
                <meta name="theme-color" content="#F8F7FC" />
            </head>
            <body>{children}</body>
        </html>
    );
}
