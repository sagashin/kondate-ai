'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Youtube,
  ExternalLink,
  ShoppingBag,
  Check,
  Sparkles,
  Heart,
  ChefHat,
  Play,
  Loader2,
  CheckCircle2,
  Utensils,
} from 'lucide-react';
import { Dish, YouTubeVideoItem } from '@/lib/types';
import { buildYouTubeCreatorLinks, isIngredientMatch } from '@/lib/recommendation-engine';
import { DishVisualBanner } from './DishVisualBanner';

interface DishDetailModalProps {
  dish: Dish | null;
  onClose: () => void;
  fridgeItems: string[];
  isFavorite: boolean;
  onToggleFavorite: (dishId: string) => void;
  onDecideMeal: (dish: Dish, addMissingToCart: boolean) => void;
  onAddIngredientsToShopping: (ingredients: string[], dishName: string) => void;
  youtubeApiKey: string;
}

export function DishDetailModal({
  dish,
  onClose,
  fridgeItems,
  isFavorite,
  onToggleFavorite,
  onDecideMeal,
  onAddIngredientsToShopping,
  youtubeApiKey,
}: DishDetailModalProps) {
  const [addedToCart, setAddedToCart] = useState(false);
  const [decided, setDecided] = useState(false);

  // YouTube Data API v3 state
  const [ytVideos, setYtVideos] = useState<YouTubeVideoItem[]>([]);
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  // AI Chef advice state
  const [aiAdvice, setAiAdvice] = useState<{
    advice: string;
    substitutions: string;
    timeSaverTip: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    setAddedToCart(false);
    setDecided(false);
    setYtVideos([]);
    setYtError(null);
    setActiveVideoId(null);
    setAiAdvice(null);

    if (!dish) return;

    // If user configured a YouTube Data API Key, fetch top 3 popular videos automatically
    if (youtubeApiKey && youtubeApiKey.trim().length > 10) {
      let cancelled = false;
      setYtLoading(true);
      const q = encodeURIComponent(`${dish.name} レシピ`);
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&order=viewCount&q=${q}&type=video&key=${encodeURIComponent(
        youtubeApiKey.trim()
      )}`;

      fetch(url)
        .then(async (res) => {
          if (!res.ok) {
            throw new Error('YouTube APIリクエストに失敗しました。キーを確認してください。');
          }
          return res.json();
        })
        .then((data) => {
          if (cancelled) return;
          const items: YouTubeVideoItem[] = (data.items || []).map(
            (item: {
              id?: { videoId?: string };
              snippet?: {
                title?: string;
                channelTitle?: string;
                thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
              };
            }) => ({
              videoId: item.id?.videoId || '',
              title: item.snippet?.title || '',
              channelTitle: item.snippet?.channelTitle || '',
              thumbnailUrl:
                item.snippet?.thumbnails?.medium?.url ||
                item.snippet?.thumbnails?.default?.url ||
                '',
            })
          );
          const valid = items.filter((v) => v.videoId);
          setYtVideos(valid);
          if (valid.length > 0) {
            setActiveVideoId(valid[0].videoId);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            setYtError(err instanceof Error ? err.message : '動画の取得に失敗しました');
          }
        })
        .finally(() => {
          if (!cancelled) setYtLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }
  }, [dish, youtubeApiKey]);

  if (!dish) return null;

  const creatorLinks = buildYouTubeCreatorLinks(dish.name);
  const missingIngredients = dish.ingredients.filter(
    (ing) => !fridgeItems.some((f) => isIngredientMatch(ing, f))
  );

  const handleAskAiChef = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishName: dish.name,
          ingredients: dish.ingredients,
          fridgeItems,
          mood: dish.moodTags[0] || '',
        }),
      });
      const data = await res.json();
      setAiAdvice(data);
    } catch {
      setAiAdvice({
        advice: '下味をしっかりつけることで、短時間でも味が決まりやすくなります。',
        substitutions: '冷蔵庫の余り野菜やきのこ類を加えるとボリュームアップします。',
        timeSaverTip: '合わせ調味料を先に用意しておくと調理がスムーズです。',
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dish-detail-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-stone-200 dark:border-slate-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top visual header */}
        <div className="relative">
          <DishVisualBanner dish={dish} />
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleFavorite(dish.id)}
              aria-label={isFavorite ? 'お気に入りから解除' : 'お気に入りに追加'}
              className={`min-w-[44px] min-h-[44px] rounded-full backdrop-blur-md flex items-center justify-center transition ${
                isFavorite
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'bg-black/35 text-white hover:bg-black/50'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="詳細モーダルを閉じる"
              className="min-w-[44px] min-h-[44px] rounded-full bg-black/35 text-white hover:bg-black/50 backdrop-blur-md flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="p-5 space-y-6">
          {/* Catchphrase & Side Dish Pairing */}
          <div>
            <h2 id="dish-detail-title" className="sr-only">
              {dish.name}のレシピ詳細とYouTube連携
            </h2>
            <p className="text-sm text-stone-700 dark:text-slate-300 leading-relaxed">
              {dish.catchphrase}
            </p>
            <div className="mt-3 rounded-2xl bg-amber-50/80 dark:bg-slate-800/80 p-3.5 flex items-start gap-3">
              <Utensils className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-stone-900 dark:text-white">
                  おすすめ副菜・汁物ペアリング：
                </span>
                <span className="text-stone-700 dark:text-slate-300 ml-1">
                  {dish.sideDishSuggestion}
                </span>
              </div>
            </div>
          </div>

          {/* YouTube Popular Recipe Integration Section */}
          <div className="space-y-3 pt-2 border-t border-stone-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-600 shrink-0" />
                <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                  YouTube人気レシピをワンタップ検索
                </h4>
              </div>
              <span className="text-xs text-stone-500 dark:text-slate-400">
                最適クエリ自動生成
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {creatorLinks.map((link, idx) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-2 text-xs font-semibold transition active:scale-[0.99] ${
                    idx === 0
                      ? 'sm:col-span-2 bg-red-600 hover:bg-red-700 text-white shadow-sm'
                      : 'bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200'
                  }`}
                >
                  <div className="truncate">
                    <span className="block truncate">{link.label}</span>
                    <span
                      className={`block text-[11px] font-normal truncate ${
                        idx === 0 ? 'text-red-100' : 'text-stone-500 dark:text-slate-400'
                      }`}
                    >
                      {link.channelHint}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 shrink-0 opacity-80" />
                </a>
              ))}
            </div>

            {/* Optional YouTube Data API v3 Embedded Player Mode */}
            {youtubeApiKey.trim().length > 10 && (
              <div className="mt-4 space-y-3 rounded-2xl bg-stone-50 dark:bg-slate-800/60 p-3.5">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-700 dark:text-slate-300">
                  <span>アプリ内再生（再生回数トップ動画）</span>
                  {ytLoading && (
                    <span className="inline-flex items-center gap-1 text-orange-600">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      取得中...
                    </span>
                  )}
                </div>

                {ytError && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {ytError}（上のワンタップ検索ボタンから直接YouTubeを開けます）
                  </p>
                )}

                {activeVideoId && (
                  <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                    <iframe
                      title={`${dish.name} YouTubeレシピ動画`}
                      src={`https://www.youtube.com/embed/${activeVideoId}`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {ytVideos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {ytVideos.map((v) => (
                      <button
                        key={v.videoId}
                        type="button"
                        onClick={() => setActiveVideoId(v.videoId)}
                        className={`text-left rounded-xl p-1.5 transition border ${
                          activeVideoId === v.videoId
                            ? 'border-orange-500 bg-orange-50/60 dark:bg-slate-800'
                            : 'border-transparent hover:bg-stone-200/50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-stone-200 dark:bg-slate-700">
                          {v.thumbnailUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={v.thumbnailUrl}
                              alt={v.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                            <Play className="w-5 h-5 text-white fill-white" />
                          </div>
                        </div>
                        <p className="mt-1 text-[11px] font-medium text-stone-800 dark:text-slate-200 line-clamp-2 leading-tight">
                          {v.title}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ingredients & Fridge Status */}
          <div className="space-y-3 pt-2 border-t border-stone-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-stone-900 dark:text-white">
                主な必要食材（{dish.ingredients.length}品目）
              </h4>
              <button
                type="button"
                onClick={() => {
                  onAddIngredientsToShopping(
                    missingIngredients.length > 0 ? missingIngredients : dish.ingredients,
                    dish.name
                  );
                  setAddedToCart(true);
                }}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-slate-800 text-orange-700 dark:text-orange-300 hover:bg-orange-100 text-xs font-semibold inline-flex items-center gap-1.5 transition whitespace-nowrap"
              >
                {addedToCart ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>買い物リストに追加済み</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>
                      {missingIngredients.length > 0
                        ? `不足分(${missingIngredients.length}品)を買い物リストへ`
                        : '全材料を買い物リストへ'}
                    </span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {dish.ingredients.map((ing) => {
                const inFridge = fridgeItems.some((f) => isIngredientMatch(ing, f));
                return (
                  <div
                    key={ing}
                    className="flex items-center justify-between px-3 py-2 rounded-xl bg-stone-50 dark:bg-slate-800/70 text-xs"
                  >
                    <span className="font-medium text-stone-800 dark:text-slate-200 truncate">
                      {ing}
                    </span>
                    <span
                      className={`ml-2 shrink-0 font-semibold ${
                        inFridge
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-stone-400 dark:text-slate-500'
                      }`}
                    >
                      {inFridge ? '冷蔵庫あり' : '要購入'}
                    </span>
                  </div>
                );
              })}
            </div>

            {dish.tips && (
              <div className="rounded-2xl bg-stone-50 dark:bg-slate-800/60 p-3.5 text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
                <span className="font-bold text-stone-900 dark:text-white">調理のコツ：</span>{' '}
                {dish.tips}
              </div>
            )}
          </div>

          {/* Optional AI Chef Advice (Server-Side Gemini API) */}
          <div className="pt-2 border-t border-stone-200/70 dark:border-slate-800">
            {!aiAdvice ? (
              <button
                type="button"
                onClick={handleAskAiChef}
                disabled={aiLoading}
                className="w-full min-h-[44px] rounded-xl bg-stone-100 hover:bg-stone-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                    <span>AIシェフがアレンジ＆時短術を考案中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    <span>AIシェフに「冷蔵庫食材での代用・時短のコツ」を聞く</span>
                  </>
                )}
              </button>
            ) : (
              <div className="rounded-2xl bg-orange-50/70 dark:bg-slate-800/90 p-4 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-orange-900 dark:text-orange-300">
                  <ChefHat className="w-4 h-4 shrink-0" />
                  <span>AIスマートシェフのアドバイス</span>
                </div>
                <p className="text-stone-700 dark:text-slate-300 leading-relaxed">
                  <strong>ポイント：</strong>
                  {aiAdvice.advice}
                </p>
                <p className="text-stone-700 dark:text-slate-300 leading-relaxed">
                  <strong>代用・アレンジ：</strong>
                  {aiAdvice.substitutions}
                </p>
                <p className="text-stone-700 dark:text-slate-300 leading-relaxed">
                  <strong>時短テクニック：</strong>
                  {aiAdvice.timeSaverTip}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Bottom Action Bar: Decide Meal */}
        <div className="sticky bottom-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 py-3.5 border-t border-stone-200/80 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={() => {
              onDecideMeal(dish, true);
              setDecided(true);
            }}
            className="flex-1 min-h-[48px] px-4 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 active:scale-[0.98] transition whitespace-nowrap"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>
              {decided
                ? '今日の献立に決定済み！（リスト追加済）'
                : 'この料理を今日の献立に決定！（不足材料も追加）'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
