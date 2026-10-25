import {
  Dish,
  Genre,
  MainIngredient,
  CookingMethod,
  MealHistoryEntry,
  RecommendationFilter,
  ScoredDish,
  UserSettings,
  YouTubeCreatorLink,
} from './types';

/**
 * Checks if two ingredient names match (handling partial synonyms like "豚ロース肉" and "豚肉", "サバ（サバ缶）" and "サバ")
 */
export function isIngredientMatch(dishIngredient: string, targetItem: string): boolean {
  const a = dishIngredient.trim().toLowerCase();
  const b = targetItem.trim().toLowerCase();
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;

  // Common root matches in Japanese cooking
  const roots = ['鶏', '豚', '牛', '鮭', 'サバ', 'エビ', '豆腐', '卵', 'ねぎ', 'ネギ', 'キャベツ', '玉ねぎ', 'じゃがいも', 'なす', 'トマト', 'きのこ', 'しめじ', 'えのき'];
  for (const r of roots) {
    if (a.includes(r) && b.includes(r)) {
      // Distinguish 鶏もも肉 vs 鶏むね肉 if user specifically chose one, unless generic
      if (r === '鶏' && ((a.includes('もも') && b.includes('むね')) || (a.includes('むね') && b.includes('もも')))) {
        return false;
      }
      return true;
    }
  }
  return false;
}

/**
 * Difference in calendar days between two YYYY-MM-DD strings
 */
export function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA + 'T00:00:00Z').getTime();
  const b = new Date(dateB + 'T00:00:00Z').getTime();
  return Math.round(Math.abs(a - b) / (1000 * 60 * 60 * 24));
}

/**
 * Returns today's date in YYYY-MM-DD format
 */
export function getTodayISO(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Smart recommendation engine that scores dishes and prevents meal fatigue
 */
export function scoreAndRecommendDishes(params: {
  allDishes: Dish[];
  history: MealHistoryEntry[];
  fridgeItems: string[];
  filter: RecommendationFilter;
  settings: UserSettings;
  todayISO?: string;
  count?: number;
  shuffleJitter?: number; // 0 for deterministic unit tests, >0 for Gacha shuffle feel
}): ScoredDish[] {
  const {
    allDishes,
    history,
    fridgeItems,
    filter,
    settings,
    todayISO = getTodayISO(),
    count = 3,
    shuffleJitter = 0,
  } = params;

  const activeFridge =
    filter.selectedFridgeItems.length > 0 ? filter.selectedFridgeItems : fridgeItems;

  // 1. Exclude dishes containing disliked ingredients
  const safeDishes = allDishes.filter((dish) => {
    for (const disliked of settings.dislikedIngredients) {
      if (!disliked.trim()) continue;
      if (
        dish.name.includes(disliked) ||
        dish.mainIngredient.includes(disliked) ||
        dish.ingredients.some((ing) => isIngredientMatch(ing, disliked))
      ) {
        return false;
      }
    }
    return true;
  });

  // 2. Identify cooldown dish IDs (decided within settings.cooldownDays)
  const cooldownDays = Math.max(0, settings.cooldownDays ?? 7);
  const cooldownDishIds = new Set<string>();
  const recent2DaysMeals: MealHistoryEntry[] = [];

  for (const entry of history) {
    const diff = daysBetween(todayISO, entry.dateISO);
    if (diff <= cooldownDays) {
      cooldownDishIds.add(entry.dishId);
    }
    if (diff <= 2) {
      recent2DaysMeals.push(entry);
    }
  }

  // Sort recent meals newest first
  recent2DaysMeals.sort((a, b) => b.timestamp - a.timestamp);
  const latestMeal = recent2DaysMeals[0];

  // Helper to evaluate a candidate pool
  const evaluatePool = (pool: Dish[], isCooldownRelaxed: boolean): ScoredDish[] => {
    return pool.map((dish) => {
      let score = 100;
      const reasons: string[] = [];

      // A. Fridge ingredient matching
      const matchedFridgeItems: string[] = [];
      const missingIngredients: string[] = [];

      for (const ing of dish.ingredients) {
        const matched = activeFridge.find((f) => isIngredientMatch(ing, f));
        if (matched) {
          matchedFridgeItems.push(ing);
        } else {
          missingIngredients.push(ing);
        }
      }

      if (matchedFridgeItems.length > 0) {
        score += matchedFridgeItems.length * 28;
        const sample = matchedFridgeItems.slice(0, 2).join('・');
        if (dish.prepTimeMinutes <= 15) {
          reasons.push(`冷蔵庫の「${sample}」が使える時短${dish.prepTimeMinutes}分メニュー！`);
        } else {
          reasons.push(`冷蔵庫にある「${sample}」を無駄なく消費できる献立！`);
        }
      }

      // B. Overlap Penalty & Variety Bonus against recent 2 days
      if (recent2DaysMeals.length > 0) {
        let genreOverlap = false;
        let ingredientOverlap = false;
        let methodOverlap = false;

        for (const recent of recent2DaysMeals) {
          if (recent.genre === dish.genre) genreOverlap = true;
          if (recent.mainIngredient === dish.mainIngredient) ingredientOverlap = true;
          if (recent.cookingMethod === dish.cookingMethod) methodOverlap = true;
        }

        if (genreOverlap) score -= 30;
        if (ingredientOverlap) score -= 40;
        if (methodOverlap) score -= 25;

        if (!genreOverlap && !ingredientOverlap && !methodOverlap && latestMeal) {
          score += 35;
          reasons.push(
            `直近の「${latestMeal.genre}×${latestMeal.mainIngredient}」と被らない、新鮮な「${dish.genre}×${dish.mainIngredient}×${dish.cookingMethod}」！`
          );
        } else if (!ingredientOverlap && latestMeal) {
          score += 15;
          reasons.push(
            `前回が「${latestMeal.mainIngredient}」だったので、今日は「${dish.mainIngredient}」を使った${dish.genre}を提案！`
          );
        }
      }

      // C. Mood & Time Filter bonuses
      if (filter.mood && dish.moodTags.includes(filter.mood)) {
        score += 25;
        reasons.push(`今日の気分「${filter.mood}」にぴったりの人気メニュー！`);
      }

      if (filter.maxTimeMinutes && dish.prepTimeMinutes <= filter.maxTimeMinutes) {
        score += 15;
      }

      // D. Default fallback reason if none triggered yet
      if (reasons.length === 0) {
        if (dish.moodTags.includes('時短15分')) {
          reasons.push(`調理目安${dish.prepTimeMinutes}分！忙しい日でもパパッと作れる鉄板${dish.genre}`);
        } else if (dish.moodTags.includes('ガッツリ')) {
          reasons.push(`白米が進む！「${dish.mainIngredient}×${dish.cookingMethod}」の満足度抜群メニュー`);
        } else {
          reasons.push(`栄養と彩りのバランスが良い「${dish.genre}×${dish.mainIngredient}」の定番献立`);
        }
      }

      if (shuffleJitter > 0) {
        score += (Math.random() - 0.5) * shuffleJitter;
      }

      return {
        dish,
        score: Math.round(score),
        primaryReason: reasons[0],
        reasons,
        matchedFridgeItems,
        missingIngredients,
        isCooldownRelaxed,
      };
    });
  };

  // 3. Apply strict filters first (cooldown + mood + maxTime + genre)
  const applyCriteria = (dishes: Dish[], enforceCooldown: boolean, enforceStrictFilters: boolean) => {
    return dishes.filter((d) => {
      if (enforceCooldown && cooldownDishIds.has(d.id)) return false;
      if (enforceStrictFilters) {
        if (filter.mood && !d.moodTags.includes(filter.mood)) return false;
        if (filter.maxTimeMinutes && d.prepTimeMinutes > filter.maxTimeMinutes) return false;
        if (filter.genre && d.genre !== filter.genre) return false;
        if (filter.prioritizeFridge && activeFridge.length > 0) {
          const hasMatch = d.ingredients.some((ing) =>
            activeFridge.some((f) => isIngredientMatch(ing, f))
          );
          if (!hasMatch) return false;
        }
      }
      return true;
    });
  };

  let candidates = applyCriteria(safeDishes, true, true);
  let isCooldownRelaxed = false;

  // If strict filters leave fewer than `count` dishes, relax strict filter constraints while keeping cooldown
  if (candidates.length < count) {
    const relaxedFilterCandidates = applyCriteria(safeDishes, true, false);
    const existingIds = new Set(candidates.map((d) => d.id));
    for (const d of relaxedFilterCandidates) {
      if (!existingIds.has(d.id)) {
        candidates.push(d);
      }
    }
  }

  // If even after relaxing filters cooldown leaves fewer than `count` dishes, relax cooldown
  if (candidates.length < count) {
    isCooldownRelaxed = true;
    const allSafe = applyCriteria(safeDishes, false, false);
    const existingIds = new Set(candidates.map((d) => d.id));
    for (const d of allSafe) {
      if (!existingIds.has(d.id)) {
        candidates.push(d);
      }
    }
  }

  const scored = evaluatePool(candidates, isCooldownRelaxed);
  scored.sort((a, b) => b.score - a.score);

  // 4. Diversify the top `count` selections so all 3 cards aren't identical in genre & ingredient
  const selected: ScoredDish[] = [];
  const usedIngredients = new Set<MainIngredient>();
  const usedGenres = new Set<Genre>();

  // First pass: pick highest scoring dishes with distinct mainIngredients
  for (const item of scored) {
    if (selected.length >= count) break;
    if (!usedIngredients.has(item.dish.mainIngredient) || selected.length === 0) {
      selected.push(item);
      usedIngredients.add(item.dish.mainIngredient);
      usedGenres.add(item.dish.genre);
    }
  }

  // Second pass: fill remaining slots if needed
  for (const item of scored) {
    if (selected.length >= count) break;
    if (!selected.some((s) => s.dish.id === item.dish.id)) {
      selected.push(item);
    }
  }

  return selected;
}

/**
 * Generates the 5 popular YouTube creator / ranking search links for a dish
 */
export function buildYouTubeCreatorLinks(dishName: string): YouTubeCreatorLink[] {
  const cleanName = dishName.replace(/（.*?）/g, '').trim();

  return [
    {
      id: 'popular',
      label: '🔥 人気順（再生数順）で探す',
      shortLabel: '🔥 人気順',
      query: `${cleanName} レシピ 人気`,
      // sp=CAM%253D sorts by view count on YouTube
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${cleanName} レシピ`
      )}&sp=CAM%253D`,
      channelHint: '再生回数トップの定番レシピ動画',
    },
    {
      id: 'ryuji',
      label: '🍳 リュウジのバズレシピ',
      shortLabel: '🍳 リュウジ',
      query: `${cleanName} リュウジ バズレシピ`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${cleanName} リュウジ バズレシピ`
      )}`,
      channelHint: '至高シリーズ・爆速おつまみ系',
    },
    {
      id: 'kohkentetsu',
      label: '👨‍🍳 コウケンテツ',
      shortLabel: '👨‍🍳 コウケンテツ',
      query: `${cleanName} コウケンテツ`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${cleanName} コウケンテツ`
      )}`,
      channelHint: '家庭の調味料で作れる優しい定番味',
    },
    {
      id: 'kurashiru',
      label: '🥗 クラシル / DELISH KITCHEN',
      shortLabel: '🥗 クラシル・DELISH',
      query: `${cleanName} クラシル DELISH KITCHEN`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${cleanName} クラシル DELISH KITCHEN`
      )}`,
      channelHint: '1分動画で手順がすぐ分かる基本レシピ',
    },
    {
      id: 'muscle',
      label: '💪 筋肉・ヘルシー系',
      shortLabel: '💪 筋肉・ヘルシー',
      query: `${cleanName} 高タンパク 低脂質 レシピ`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${cleanName} 高タンパク ヘルシー レシピ`
      )}`,
      channelHint: '高タンパク・ダイエット向けアレンジ',
    },
  ];
}

export interface HistoryAnalytics {
  totalMeals: number;
  avgCalories: number;
  avgPrepTime: number;
  varietyScore: number; // 0-100
  genreCounts: Record<Genre, number>;
  ingredientCounts: Record<MainIngredient, number>;
  methodCounts: Record<CookingMethod, number>;
  insightMessage: string;
}

export function calculateHistoryAnalytics(history: MealHistoryEntry[]): HistoryAnalytics {
  const genreCounts: Record<Genre, number> = {
    和食: 0,
    洋食: 0,
    中華: 0,
    '韓国・エスニック': 0,
    その他: 0,
  };
  const ingredientCounts: Record<MainIngredient, number> = {
    鶏肉: 0,
    豚肉: 0,
    牛肉: 0,
    魚介: 0,
    '卵・豆腐': 0,
    '野菜・きのこ': 0,
    '麺・飯': 0,
  };
  const methodCounts: Record<CookingMethod, number> = {
    炒める: 0,
    煮る: 0,
    焼く: 0,
    揚げる: 0,
    '蒸す・茹でる': 0,
    '和える・生': 0,
  };

  if (history.length === 0) {
    return {
      totalMeals: 0,
      avgCalories: 0,
      avgPrepTime: 0,
      varietyScore: 100,
      genreCounts,
      ingredientCounts,
      methodCounts,
      insightMessage: 'まだ献立履歴がありません。ホーム画面から今日の献立を決定してみましょう！',
    };
  }

  let totalCal = 0;
  let totalTime = 0;

  for (const h of history) {
    genreCounts[h.genre] = (genreCounts[h.genre] || 0) + 1;
    ingredientCounts[h.mainIngredient] = (ingredientCounts[h.mainIngredient] || 0) + 1;
    methodCounts[h.cookingMethod] = (methodCounts[h.cookingMethod] || 0) + 1;
    totalCal += h.calories || 500;
    totalTime += h.prepTimeMinutes || 15;
  }

  const recent7 = history.slice(0, 7);
  const uniqueGenres = new Set(recent7.map((h) => h.genre)).size;
  const uniqueIngredients = new Set(recent7.map((h) => h.mainIngredient)).size;
  const uniqueMethods = new Set(recent7.map((h) => h.cookingMethod)).size;

  const denom = Math.min(recent7.length, 5) || 1;
  const rawVariety =
    ((uniqueGenres / Math.min(denom, 4)) * 35 +
      (uniqueIngredients / denom) * 40 +
      (uniqueMethods / Math.min(denom, 4)) * 25);
  const varietyScore = Math.min(100, Math.round(rawVariety));

  // Find least eaten ingredient or genre for actionable advice
  const fishCount = ingredientCounts['魚介'] || 0;
  const vegCount = (ingredientCounts['野菜・きのこ'] || 0) + (ingredientCounts['卵・豆腐'] || 0);

  let insightMessage = 'ジャンル・食材ともにバランス良くローテーションできています！';
  if (fishCount === 0 && history.length >= 3) {
    insightMessage = '最近お肉料理が多めです。次回は「魚介」や「さっぱり」気分の和食・洋食がおすすめです！';
  } else if (vegCount === 0 && history.length >= 4) {
    insightMessage = '卵・豆腐や野菜メインのヘルシー献立を挟むと、栄養バランスがさらに整います。';
  }

  return {
    totalMeals: history.length,
    avgCalories: Math.round(totalCal / history.length),
    avgPrepTime: Math.round(totalTime / history.length),
    varietyScore,
    genreCounts,
    ingredientCounts,
    methodCounts,
    insightMessage,
  };
}
