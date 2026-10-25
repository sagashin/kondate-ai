import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Kondate AI - スマート献立＆YouTubeレシピ連携',
    short_name: 'KondateAI',
    description:
      'マンネリを完全防止する超スマート献立提案エンジンとYouTube人気レシピ検索・冷蔵庫＆買い物リスト管理を備えたモバイルファーストPWAアプリ。',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fffbf7',
    theme_color: '#ea580c',
    icons: [
      {
        src: '/pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
