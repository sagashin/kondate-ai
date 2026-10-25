'use client';

import React from 'react';
import {
  Calendar,
  BarChart3,
  Trash2,
  Clock,
  Flame,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Utensils,
} from 'lucide-react';
import { Dish, MealHistoryEntry } from '@/lib/types';
import {
  calculateHistoryAnalytics,
  daysBetween,
  getTodayISO,
} from '@/lib/recommendation-engine';
import { GENRES, MAIN_INGREDIENTS, COOKING_METHODS } from '@/lib/recipes-data';

interface HistoryAnalyticsTabProps {
  history: MealHistoryEntry[];
  allDishes: Dish[];
  cooldownDays: number;
  onRemoveHistoryEntry: (id: string) => void;
  onClearHistory: () => void;
  onSelectDishDetail: (dish: Dish) => void;
}

const GENRE_BAR_COLORS: Record<string, string> = {
  和食: 'bg-amber-600',
  洋食: 'bg-rose-600',
  中華: 'bg-red-600',
  '韓国・エスニック': 'bg-orange-500',
  その他: 'bg-emerald-600',
};

export function HistoryAnalyticsTab({
  history,
  allDishes,
  cooldownDays,
  onRemoveHistoryEntry,
  onClearHistory,
  onSelectDishDetail,
}: HistoryAnalyticsTabProps) {
  const analytics = calculateHistoryAnalytics(history);
  const todayISO = getTodayISO();

  return (
    <div className="space-y-6 pb-8">
      {/* Summary KPI & Variety Balance Card */}
      <section
        aria-label="栄養・ジャンルバランス集計"
        className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-stone-200/80 dark:border-slate-800 space-y-5"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
              マンネリ防止＆ローテーション診断
            </p>
            <h2 className="text-lg font-bold text-stone-900 dark:text-white tracking-tight mt-0.5">
              最近の栄養・ジャンルバランス
            </h2>
          </div>
          <BarChart3 className="w-5 h-5 text-orange-600 shrink-0" />
        </div>

        {/* 3 Metric Summary Strip */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-stone-50 dark:bg-slate-800/70 p-3.5">
            <span className="block text-[11px] font-medium text-stone-500 dark:text-slate-400">
              累計決定数
            </span>
            <span className="mt-1 block text-xl font-bold text-stone-900 dark:text-white tabular-nums">
              {analytics.totalMeals}
              <span className="text-xs font-normal text-stone-500 ml-1">回</span>
            </span>
          </div>

          <div className="rounded-2xl bg-stone-50 dark:bg-slate-800/70 p-3.5">
            <span className="block text-[11px] font-medium text-stone-500 dark:text-slate-400">
              平均カロリー
            </span>
            <span className="mt-1 block text-xl font-bold text-stone-900 dark:text-white tabular-nums">
              {analytics.avgCalories || '—'}
              {analytics.avgCalories > 0 && (
                <span className="text-xs font-normal text-stone-500 ml-1">kcal</span>
              )}
            </span>
          </div>

          <div className="rounded-2xl bg-stone-50 dark:bg-slate-800/70 p-3.5">
            <span className="block text-[11px] font-medium text-stone-500 dark:text-slate-400">
              多様性スコア
            </span>
            <span className="mt-1 block text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {analytics.varietyScore}
              <span className="text-xs font-normal text-stone-500 ml-0.5">点</span>
            </span>
          </div>
        </div>

        {/* Insight callout */}
        <div className="rounded-2xl bg-amber-50/80 dark:bg-slate-800/80 p-3.5 flex items-start gap-2.5 text-xs text-stone-800 dark:text-slate-200 leading-relaxed">
          <Sparkles className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
          <span>{analytics.insightMessage}</span>
        </div>

        {/* Genre Balance Chart */}
        <div className="space-y-2.5 pt-2 border-t border-stone-200/70 dark:border-slate-800">
          <h3 className="text-xs font-bold text-stone-800 dark:text-slate-200">
            料理ジャンル比率
          </h3>
          <div className="space-y-2">
            {GENRES.map((genre) => {
              const count = analytics.genreCounts[genre] || 0;
              const pct =
                analytics.totalMeals > 0
                  ? Math.round((count / analytics.totalMeals) * 100)
                  : 0;
              return (
                <div key={genre} className="space-y-1">
                  <div className="flex items-center justify-between text-xs tabular-nums">
                    <span className="font-medium text-stone-700 dark:text-slate-300">
                      {genre}
                    </span>
                    <span className="text-stone-500 dark:text-slate-400">
                      {count}回 ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-stone-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        GENRE_BAR_COLORS[genre] || 'bg-orange-600'
                      }`}
                      style={{ width: `${Math.max(pct, count > 0 ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Ingredient & Cooking Method Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-stone-200/70 dark:border-slate-800">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-stone-800 dark:text-slate-200">
              メイン食材バランス
            </h3>
            <div className="space-y-1.5">
              {MAIN_INGREDIENTS.map((ing) => {
                const count = analytics.ingredientCounts[ing] || 0;
                const pct =
                  analytics.totalMeals > 0
                    ? Math.round((count / analytics.totalMeals) * 100)
                    : 0;
                return (
                  <div
                    key={ing}
                    className="flex items-center justify-between text-xs tabular-nums"
                  >
                    <span className="text-stone-700 dark:text-slate-300 w-24 truncate">
                      {ing}
                    </span>
                    <div className="flex-1 mx-2 h-2 rounded-full bg-stone-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-orange-500"
                        style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                    <span className="text-stone-500 dark:text-slate-400 w-8 text-right">
                      {count}回
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-stone-800 dark:text-slate-200">
              調理法バランス
            </h3>
            <div className="space-y-1.5">
              {COOKING_METHODS.map((method) => {
                const count = analytics.methodCounts[method] || 0;
                const pct =
                  analytics.totalMeals > 0
                    ? Math.round((count / analytics.totalMeals) * 100)
                    : 0;
                return (
                  <div
                    key={method}
                    className="flex items-center justify-between text-xs tabular-nums"
                  >
                    <span className="text-stone-700 dark:text-slate-300 w-24 truncate">
                      {method}
                    </span>
                    <div className="flex-1 mx-2 h-2 rounded-full bg-stone-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.max(pct, count > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                    <span className="text-stone-500 dark:text-slate-400 w-8 text-right">
                      {count}回
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Meal History Timeline Section */}
      <section
        aria-label="献立決定履歴タイムライン"
        className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-stone-200/80 dark:border-slate-800 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            <h3 className="text-base font-bold text-stone-900 dark:text-white">
              献立タイムライン履歴
            </h3>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="text-xs font-medium text-stone-400 hover:text-rose-600 transition"
            >
              履歴をリセット
            </button>
          )}
        </div>

        <p className="text-xs text-stone-500 dark:text-slate-400">
          直近{cooldownDays}日以内に決定した料理は「クールダウン中」となり、提案ガチャから自動的に除外されます。
        </p>

        {history.length === 0 ? (
          <div className="rounded-2xl bg-stone-50 dark:bg-slate-800/60 p-8 text-center space-y-2">
            <Utensils className="w-8 h-8 text-stone-400 mx-auto" />
            <p className="text-sm font-semibold text-stone-700 dark:text-slate-300">
              まだ決定した献立履歴がありません
            </p>
            <p className="text-xs text-stone-500 dark:text-slate-400">
              ホーム画面で「今日の献立に決定！」を押すと、ここにカレンダー履歴が記録されます。
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-slate-800">
            {history.map((entry) => {
              const diffDays = daysBetween(todayISO, entry.dateISO);
              const inCooldown = diffDays <= cooldownDays;
              const matchedDish = allDishes.find((d) => d.id === entry.dishId);

              return (
                <li
                  key={entry.id}
                  className="py-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-slate-400 tabular-nums">
                      <span className="font-semibold text-stone-700 dark:text-slate-300">
                        {entry.dateISO === todayISO
                          ? `今日 (${entry.dateISO})`
                          : `${entry.dateISO} (${diffDays}日前)`}
                      </span>
                      {inCooldown && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                            クールダウン除外中
                          </span>
                        </>
                      )}
                    </div>

                    {matchedDish ? (
                      <button
                        type="button"
                        onClick={() => onSelectDishDetail(matchedDish)}
                        className="text-left text-sm font-bold text-stone-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition truncate block"
                      >
                        {entry.dishName}
                      </button>
                    ) : (
                      <span className="block text-sm font-bold text-stone-900 dark:text-white truncate">
                        {entry.dishName}
                      </span>
                    )}

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 dark:text-slate-400 tabular-nums">
                      <span className="whitespace-nowrap">{entry.genre}</span>
                      <span aria-hidden="true">·</span>
                      <span className="whitespace-nowrap">{entry.mainIngredient}</span>
                      <span aria-hidden="true">·</span>
                      <span className="whitespace-nowrap">{entry.cookingMethod}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        {entry.prepTimeMinutes}分
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
                        <Flame className="w-3 h-3" />
                        {entry.calories}kcal
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveHistoryEntry(entry.id)}
                    aria-label={`${entry.dishName}の履歴を削除`}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-stone-400 hover:text-rose-600 transition shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
