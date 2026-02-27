import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: "Don't Say the Word!!!",
    description: 'A party game where you must avoid saying your secret Thai word!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="th">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Bangers&family=Noto+Sans+Thai:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="theme-color" content="#0f0f1a" />
            </head>
            <body>{children}</body>
        </html>
    );
}
