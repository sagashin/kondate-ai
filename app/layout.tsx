import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import '@fontsource/noto-sans-jp/400.css';
import '@fontsource/noto-sans-jp/500.css';
import '@fontsource/noto-sans-jp/700.css';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-jakarta',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--font-mono',
});

export const viewport: Viewport = {
  themeColor: '#ea580c',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Kondate AI - スマート献立＆YouTubeレシピ連携',
  description:
    'マンネリを完全防止する超スマート献立提案エンジンとYouTube人気レシピ検索・冷蔵庫＆買い物リスト管理を備えたモバイルファーストPWAアプリ。',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KondateAI',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Kondate AI - スマート献立＆YouTubeレシピ連携',
    description:
      'マンネリを完全防止する超スマート献立提案エンジンとYouTube人気レシピ検索・冷蔵庫＆買い物リスト管理を備えたモバイルファーストPWAアプリ。',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kondate AI - スマート献立＆YouTubeレシピ連携',
    description:
      'マンネリを完全防止する超スマート献立提案エンジンとYouTube人気レシピ検索・冷蔵庫＆買い物リスト管理を備えたモバイルファーストPWAアプリ。',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ja"
      className={`${jakarta.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="antialiased bg-stone-100 text-stone-900 selection:bg-orange-500 selection:text-white"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
