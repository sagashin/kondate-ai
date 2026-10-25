'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Dices,
  Sparkles,
  Youtube,
  CheckCircle2,
  ShoppingBag,
  Clock,
  Refrigerator,
  ChevronRight,
  Heart,
  RotateCcw,
  SlidersHorizontal,
  UtensilsCrossed,
  ExternalLink,
} from 'lucide-react';
import {
  Dish,
  Genre,
  MealHistoryEntry,
  MoodTag,
  RecommendationFilter,
  ScoredDish,
} from '@/lib/types';
import { GENRES, MOOD_TAGS } from '@/lib/recipes-data';
import { buildYouTubeCreatorLinks } from '@/lib/recommendation-engine';
import { DishVisualBanner } from './DishVisualBanner';

interface HomeGachaTabProps {
  recommendations: ScoredDish[];
  filter: RecommendationFilter;
  onUpdateFilter: (patch: Partial<RecommendationFilter>) => void;
  onSpinGacha: () => void;
  isSpinning: boolean;
  fridgeItems: string[];
  favorites: string[];
  onToggleFavorite: (dishId: string) => void;
  onSelectDishDetail: (dish: Dish) => void;
  onDecideMeal: (dish: Dish, addMissingToCart: boolean) => void;
  onAddIngredientsToShopping: (ingredients: string[], dishName: string) => void;
  recentHistory: MealHistoryEntry[];
  onSwitchToFridgeTab: () => void;
}

const TIME_OPTIONS: { label: string; value: number | null }[] = [
  { label: '指定なし', value: null },
  { label: '15分以内', value: 15 },
  { label: '20分以内', value: 20 },
];

export function HomeGachaTab({
  recommendations,
  filter,
  onUpdateFilter,
  onSpinGacha,
  isSpinning,
  fridgeItems,
  favorites,
  onToggleFavorite,
  onSelectDishDetail,
  onDecideMeal,
  onAddIngredientsToShopping,
  recentHistory,
  onSwitchToFridgeTab,
}: HomeGachaTabProps) {
  const [decidedIds, setDecidedIds] = useState<Record<string, boolean>>({});
  const [cartAddedIds, setCartAddedIds] = useState<Record<string, boolean>>({});
  const [showAllFilters, setShowAllFilters] = useState(false);

  const latestMeal = recentHistory[0];

  const handleQuickDecide = (scored: ScoredDish) => {
    onDecideMeal(scored.dish, false);
    setDecidedIds((prev) => ({ ...prev, [scored.dish.id]: true }));
  };

  const handleQuickAddCart = (scored: ScoredDish) => {
    const itemsToAdd =
      scored.missingIngredients.length > 0
        ? scored.missingIngredients
        : scored.dish.ingredients;
    onAddIngredientsToShopping(itemsToAdd, scored.dish.name);
    setCartAddedIds((prev) => ({ ...prev, [scored.dish.id]: true }));
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Smart Filter & Gacha Trigger Panel */}
      <section
        aria-label="スマート献立フィルターと提案ガチャ"
        className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-stone-200/80 dark:border-slate-800 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
              ワンパターン完全防止エンジン搭載
            </p>
            <h2 className="text-lg font-bold text-stone-900 dark:text-white tracking-tight mt-0.5">
              今日のスマート献立ガチャ
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowAllFilters((v) => !v)}
            aria-expanded={showAllFilters}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-stone-200/70 transition whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showAllFilters ? 'シンプル表示' : '詳細条件'}</span>
          </button>
        </div>

        {/* Context banner showing recent meal rotation awareness */}
        {latestMeal && (
          <div className="rounded-2xl bg-stone-50 dark:bg-slate-800/70 px-3.5 py-2.5 text-xs text-stone-600 dark:text-slate-300 flex items-center justify-between gap-2">
            <span className="truncate">
              直近の献立：
              <strong className="text-stone-900 dark:text-white font-semibold ml-1">
                {latestMeal.dishName}
              </strong>{' '}
              （{latestMeal.genre} · {latestMeal.mainIngredient} · {latestMeal.cookingMethod}）
            </span>
            <span className="text-[11px] text-orange-700 dark:text-orange-300 font-medium shrink-0">
              被り回避中
            </span>
          </div>
        )}

        {/* Mood Selector (Interactive Filter Controls) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-700 dark:text-slate-300">
              今日の気分で絞り込む
            </span>
            {(filter.mood ||
              filter.maxTimeMinutes ||
              filter.genre ||
              filter.prioritizeFridge ||
              filter.selectedFridgeItems.length > 0) && (
              <button
                type="button"
                onClick={() =>
                  onUpdateFilter({
                    mood: null,
                    maxTimeMinutes: null,
                    genre: null,
                    prioritizeFridge: false,
                    selectedFridgeItems: [],
                  })
                }
                className="text-xs font-medium text-stone-500 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                条件リセット
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {MOOD_TAGS.map((mood: MoodTag) => {
              const active = filter.mood === mood;
              return (
                <button
                  key={mood}
                  type="button"
                  onClick={() => onUpdateFilter({ mood: active ? null : mood })}
                  className={`min-h-[42px] px-2.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap truncate ${
                    active
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:bg-stone-200/70 dark:hover:bg-slate-700'
                  }`}
                >
                  {mood}
                </button>
              );
            })}
          </div>
        </div>

        {/* Fridge & Time quick row */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() =>
              onUpdateFilter({ prioritizeFridge: !filter.prioritizeFridge })
            }
            className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition whitespace-nowrap ${
              filter.prioritizeFridge
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:bg-stone-200/70'
            }`}
          >
            <Refrigerator className="w-4 h-4 shrink-0" />
            <span>冷蔵庫の食材を優先 ({fridgeItems.length})</span>
          </button>

          <div className="flex items-center gap-1 bg-stone-100 dark:bg-slate-800 p-1 rounded-xl">
            {TIME_OPTIONS.map((opt) => {
              const active = filter.maxTimeMinutes === opt.value;
              return (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => onUpdateFilter({ maxTimeMinutes: opt.value })}
                  className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Expanded Filter Drawer: Genre & Specific Fridge Item Selection */}
        <AnimatePresence>
          {showAllFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-3 pt-2 border-t border-stone-200/70 dark:border-slate-800"
            >
              <div>
                <span className="block text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1.5">
                  料理ジャンル指定
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateFilter({ genre: null })}
                    className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      filter.genre === null
                        ? 'bg-stone-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
                    }`}
                  >
                    すべて
                  </button>
                  {GENRES.map((g: Genre) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() =>
                        onUpdateFilter({ genre: filter.genre === g ? null : g })
                      }
                      className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        filter.genre === g
                          ? 'bg-stone-900 dark:bg-white text-white dark:text-slate-900'
                          : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-stone-700 dark:text-slate-300">
                    今日使いたい冷蔵庫の食材（タップで複数選択可）
                  </span>
                  <button
                    type="button"
                    onClick={onSwitchToFridgeTab}
                    className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    食材を編集
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {fridgeItems.length === 0 ? (
                  <p className="text-xs text-stone-500 dark:text-slate-400">
                    冷蔵庫に食材が登録されていません。「冷蔵庫・買い物」タブから登録すると提案精度が上がります。
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {fridgeItems.map((item) => {
                      const selected = filter.selectedFridgeItems.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => {
                            const next = selected
                              ? filter.selectedFridgeItems.filter((i) => i !== item)
                              : [...filter.selectedFridgeItems, item];
                            onUpdateFilter({
                              selectedFridgeItems: next,
                              prioritizeFridge: next.length > 0 ? true : filter.prioritizeFridge,
                            });
                          }}
                          className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                            selected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Primary Gacha Spin Button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={onSpinGacha}
          disabled={isSpinning}
          className="w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white font-bold text-base shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2.5 transition cursor-pointer"
        >
          <motion.span
            animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <Dices className="w-5 h-5" />
          </motion.span>
          <span>
            {isSpinning
              ? '最適バランスを計算＆シャッフル中...'
              : '献立ガチャを回す（最適3品を提案）'}
          </span>
        </motion.button>
      </section>

      {/* Proposed 3 Dishes Section */}
      <section aria-label="提案された献立カード一覧" className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              あなたへの最適献立ベスト3
            </h3>
          </div>
          <span className="text-xs text-stone-500 dark:text-slate-400 tabular-nums">
            カードタップで詳細＆動画再生
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5">
          <AnimatePresence mode="popLayout">
            {recommendations.map((item, index) => {
              const { dish, score, primaryReason, matchedFridgeItems, missingIngredients } =
                item;
              const isFav = favorites.includes(dish.id);
              const isDecided = !!decidedIds[dish.id];
              const isCartAdded = !!cartAddedIds[dish.id];
              const creatorLinks = buildYouTubeCreatorLinks(dish.name);

              return (
                <motion.article
                  key={`${dish.id}-${index}`}
                  layout
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{
                    duration: 0.22,
                    delay: index * 0.05,
                  }}
                  className="rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-stone-200/80 dark:border-slate-800 overflow-hidden flex flex-col"
                >
                  {/* Visual Banner Header (Clickable to open detail modal) */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectDishDetail(dish)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectDishDetail(dish);
                      }
                    }}
                    className="relative cursor-pointer group text-left"
                  >
                    <DishVisualBanner
                      dish={dish}
                      rankBadge={`おすすめ #${index + 1}`}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(dish.id);
                      }}
                      aria-label={
                        isFav
                          ? `${dish.name}をお気に入りから解除`
                          : `${dish.name}をお気に入りに追加`
                      }
                      className={`absolute top-3 right-3 z-20 min-w-[44px] min-h-[44px] rounded-full backdrop-blur-md flex items-center justify-center transition ${
                        isFav
                          ? 'bg-rose-500 text-white shadow-md'
                          : 'bg-black/30 text-white hover:bg-black/50'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4">
                    {/* Recommendation Reason Box (No thick left border per frontend-design) */}
                    <div className="rounded-2xl bg-amber-50/90 dark:bg-slate-800/90 px-4 py-3 flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                      <div className="text-xs leading-relaxed text-stone-800 dark:text-slate-200 font-medium">
                        {primaryReason}
                      </div>
                    </div>

                    {/* Catchphrase & Side Dish Pairing */}
                    <div className="space-y-1.5">
                      <p className="text-sm text-stone-700 dark:text-slate-300 leading-relaxed">
                        {dish.catchphrase}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-slate-400">
                        <strong className="font-semibold text-stone-700 dark:text-slate-300">
                          副菜提案：
                        </strong>
                        {dish.sideDishSuggestion}
                      </p>
                    </div>

                    {/* Ingredients clean unboxed summary */}
                    <div className="text-xs text-stone-600 dark:text-slate-300 space-y-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-stone-900 dark:text-white">
                          主な材料：
                        </span>
                        <span>{dish.ingredients.join(' · ')}</span>
                      </div>
                      {matchedFridgeItems.length > 0 && (
                        <p className="text-emerald-700 dark:text-emerald-400 font-medium">
                          冷蔵庫在庫あり：{matchedFridgeItems.join(' · ')}
                        </p>
                      )}
                    </div>

                    {/* YouTube Popular Creator One-Tap Search Buttons */}
                    <div className="pt-3 border-t border-stone-200/70 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Youtube className="w-4 h-4 text-red-600 shrink-0" />
                          YouTube人気レシピをすぐ開く
                        </span>
                        <button
                          type="button"
                          onClick={() => onSelectDishDetail(dish)}
                          className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-0.5"
                        >
                          詳細・アプリ内再生
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {creatorLinks.map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 hover:text-red-700 dark:text-slate-200 text-xs font-medium inline-flex items-center gap-1 transition whitespace-nowrap"
                          >
                            <span>{link.shortLabel}</span>
                            <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>

                    {/* Primary Action Buttons: Decide Meal + 1-Tap Add to Shopping List */}
                    <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleQuickDecide(item)}
                        className={`min-h-[46px] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-[0.98] whitespace-nowrap ${
                          isDecided
                            ? 'bg-emerald-600 text-white'
                            : 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>
                          {isDecided ? '今日の献立に決定済み！' : '今日の献立に決定！'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickAddCart(item)}
                        className={`min-h-[46px] px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-[0.98] whitespace-nowrap ${
                          isCartAdded
                            ? 'bg-stone-200 dark:bg-slate-700 text-stone-800 dark:text-white'
                            : 'bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4 shrink-0 text-orange-600 dark:text-orange-400" />
                        <span>
                          {isCartAdded
                            ? '買い物リストに追加済み'
                            : missingIngredients.length > 0
                            ? `不足材料(${missingIngredients.length}品)を買い物リストへ`
                            : '材料を買い物リストに追加'}
                        </span>
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
