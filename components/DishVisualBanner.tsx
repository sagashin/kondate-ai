'use client';

import React from 'react';
import {
  Flame,
  Clock,
  Utensils,
  Soup,
  Fish,
  Beef,
  Egg,
  Carrot,
  Wheat,
  Sparkles,
} from 'lucide-react';
import { Dish, Genre, MainIngredient } from '@/lib/types';

const GENRE_THEMES: Record<
  Genre,
  {
    gradient: string;
    accentText: string;
    patternColor: string;
  }
> = {
  和食: {
    gradient: 'from-amber-700 via-orange-600 to-amber-500',
    accentText: 'text-amber-100',
    patternColor: 'rgba(255, 251, 235, 0.14)',
  },
  洋食: {
    gradient: 'from-rose-700 via-orange-600 to-amber-500',
    accentText: 'text-rose-100',
    patternColor: 'rgba(255, 241, 242, 0.14)',
  },
  中華: {
    gradient: 'from-red-800 via-red-600 to-orange-500',
    accentText: 'text-red-100',
    patternColor: 'rgba(254, 242, 242, 0.14)',
  },
  '韓国・エスニック': {
    gradient: 'from-orange-700 via-rose-600 to-pink-600',
    accentText: 'text-orange-100',
    patternColor: 'rgba(255, 247, 237, 0.14)',
  },
  その他: {
    gradient: 'from-emerald-700 via-teal-600 to-amber-600',
    accentText: 'text-emerald-100',
    patternColor: 'rgba(236, 253, 245, 0.14)',
  },
};

function getIngredientIcon(mainIngredient: MainIngredient) {
  switch (mainIngredient) {
    case '魚介':
      return Fish;
    case '牛肉':
    case '豚肉':
    case '鶏肉':
      return Beef;
    case '卵・豆腐':
      return Egg;
    case '野菜・きのこ':
      return Carrot;
    case '麺・飯':
      return Wheat;
    default:
      return Utensils;
  }
}

export function DishVisualBanner({
  dish,
  rankBadge,
  compact = false,
}: {
  dish: Dish;
  rankBadge?: string;
  compact?: boolean;
}) {
  const theme = GENRE_THEMES[dish.genre] || GENRE_THEMES['和食'];
  const IngredientIcon = getIngredientIcon(dish.mainIngredient);

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br ${theme.gradient} text-white select-none ${
        compact ? 'h-28 p-3.5' : 'h-40 p-5'
      } flex flex-col justify-between`}
    >
      {/* Subtle culinary geometric SVG artwork background */}
      <svg
        aria-hidden="true"
        className="absolute -right-6 -bottom-8 w-44 h-44 opacity-20 pointer-events-none"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle cx="100" cy="100" r="84" stroke="currentColor" strokeWidth="8" />
        <circle
          cx="100"
          cy="100"
          r="58"
          stroke="currentColor"
          strokeWidth="4"
          strokeDasharray="8 8"
        />
        <path
          d="M55 105C55 130 75 148 100 148C125 148 145 130 145 105H55Z"
          fill="currentColor"
        />
        <path
          d="M80 78C80 68 88 62 88 52M100 75C100 65 108 59 108 49M120 78C120 68 128 62 128 52"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
        />
      </svg>

      {/* Top row: unboxed culinary taxonomy + optional rank */}
      <div className={`relative z-10 flex items-center justify-between gap-2 ${compact ? 'pr-10' : 'pr-12'}`}>
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-white/95 whitespace-nowrap">
          <IngredientIcon className="w-4 h-4 shrink-0" />
          <span>{dish.genre}</span>
          <span aria-hidden="true">·</span>
          <span>{dish.mainIngredient}</span>
          <span aria-hidden="true">·</span>
          <span>{dish.cookingMethod}</span>
        </div>

        {rankBadge && (
          <div className="flex items-center gap-1 text-xs font-bold text-amber-200 tabular-nums whitespace-nowrap shrink-0">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>{rankBadge}</span>
          </div>
        )}
      </div>

      {/* Bottom scrim with title & tabular metrics */}
      <div className="relative z-10">
        <h3
          className={`font-bold tracking-tight text-white leading-snug line-clamp-1 ${
            compact ? 'text-base' : 'text-xl'
          }`}
        >
          {dish.name}
        </h3>
        <div className="mt-1 flex items-center gap-3 text-xs font-medium text-white/90 tabular-nums">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            調理 {dish.prepTimeMinutes}分
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 shrink-0" />
            約{dish.calories} kcal
          </span>
          {!compact && dish.moodTags.length > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="truncate">{dish.moodTags.slice(0, 2).join(' / ')}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
