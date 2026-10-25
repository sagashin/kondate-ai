import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_DISHES } from './recipes-data';
import {
  scoreAndRecommendDishes,
  buildYouTubeCreatorLinks,
  calculateHistoryAnalytics,
  isIngredientMatch,
} from './recommendation-engine';
import { MealHistoryEntry, RecommendationFilter, UserSettings } from './types';

const defaultSettings: UserSettings = {
  dislikedIngredients: [],
  cooldownDays: 7,
  youtubeApiKey: '',
  darkMode: false,
  desktopPhoneFrame: false,
};

const emptyFilter: RecommendationFilter = {
  mood: null,
  maxTimeMinutes: null,
  genre: null,
  prioritizeFridge: false,
  selectedFridgeItems: [],
};

test('INITIAL_DISHES contains 50+ rich preset recipes across all genres', () => {
  assert.ok(INITIAL_DISHES.length >= 50, `Expected >= 50 dishes, got ${INITIAL_DISHES.length}`);
  for (const dish of INITIAL_DISHES) {
    assert.ok(dish.name.length > 0);
    assert.ok(dish.ingredients.length >= 3);
    assert.ok(dish.prepTimeMinutes > 0);
  }
});

test('cooldown exclusion excludes dishes eaten within the last 7 days', () => {
  const targetDish = INITIAL_DISHES[0]; // jp-01 豚の生姜焼き
  const history: MealHistoryEntry[] = [
    {
      id: 'h-1',
      dishId: targetDish.id,
      dishName: targetDish.name,
      genre: targetDish.genre,
      mainIngredient: targetDish.mainIngredient,
      cookingMethod: targetDish.cookingMethod,
      calories: targetDish.calories,
      prepTimeMinutes: targetDish.prepTimeMinutes,
      dateISO: '2026-10-21', // 3 days before 2026-10-24
      timestamp: Date.now() - 3 * 86400000,
    },
  ];

  const results = scoreAndRecommendDishes({
    allDishes: INITIAL_DISHES,
    history,
    fridgeItems: [],
    filter: emptyFilter,
    settings: defaultSettings,
    todayISO: '2026-10-24',
    count: 10,
  });

  assert.equal(
    results.some((r) => r.dish.id === targetDish.id),
    false,
    'Dish eaten 3 days ago must be excluded by 7-day cooldown'
  );
});

test('overlap penalty lowers score of same genre/ingredient/method as yesterday and boosts non-overlapping dishes', () => {
  const history: MealHistoryEntry[] = [
    {
      id: 'h-yesterday',
      dishId: 'jp-04',
      dishName: 'サバの味噌煮',
      genre: '和食',
      mainIngredient: '魚介',
      cookingMethod: '煮る',
      calories: 440,
      prepTimeMinutes: 20,
      dateISO: '2026-10-23',
      timestamp: Date.now() - 86400000,
    },
  ];

  const results = scoreAndRecommendDishes({
    allDishes: INITIAL_DISHES,
    history,
    fridgeItems: [],
    filter: emptyFilter,
    settings: defaultSettings,
    todayISO: '2026-10-24',
    count: 3,
  });

  assert.equal(results.length, 3);
  const top = results[0];
  assert.notEqual(top.dish.genre, '和食');
  assert.notEqual(top.dish.mainIngredient, '魚介');
  assert.notEqual(top.dish.cookingMethod, '煮る');
  assert.ok(top.primaryReason.includes('和食×魚介'));
});

test('fridge ingredients boost matching recipes and generate fridge-specific reason', () => {
  const results = scoreAndRecommendDishes({
    allDishes: INITIAL_DISHES,
    history: [],
    fridgeItems: ['豚バラ肉', 'キャベツ', 'ピーマン'],
    filter: { ...emptyFilter, prioritizeFridge: true },
    settings: defaultSettings,
    todayISO: '2026-10-24',
    count: 3,
  });

  assert.ok(results.length > 0);
  assert.ok(results[0].matchedFridgeItems.length >= 2);
  assert.ok(results[0].primaryReason.includes('冷蔵庫'));
});

test('disliked ingredients strictly exclude matching dishes', () => {
  const results = scoreAndRecommendDishes({
    allDishes: INITIAL_DISHES,
    history: [],
    fridgeItems: [],
    filter: emptyFilter,
    settings: { ...defaultSettings, dislikedIngredients: ['トマト', 'なす'] },
    todayISO: '2026-10-24',
    count: 50,
  });

  for (const r of results) {
    const hasDisliked = r.dish.ingredients.some(
      (ing) => isIngredientMatch(ing, 'トマト') || isIngredientMatch(ing, 'なす')
    );
    assert.equal(hasDisliked, false, `Dish ${r.dish.name} should have been excluded`);
  }
});

test('buildYouTubeCreatorLinks returns all 5 creator search buttons with valid URLs', () => {
  const links = buildYouTubeCreatorLinks('豚の生姜焼き');
  assert.equal(links.length, 5);
  assert.ok(links[0].label.includes('人気順'));
  assert.ok(links[1].label.includes('リュウジ'));
  assert.ok(links[2].label.includes('コウケンテツ'));
  assert.ok(links[3].label.includes('クラシル'));
  assert.ok(links[4].label.includes('筋肉・ヘルシー'));
  assert.ok(links[0].url.startsWith('https://www.youtube.com/results?search_query='));
});

test('calculateHistoryAnalytics computes accurate distributions and variety score', () => {
  const history: MealHistoryEntry[] = [
    {
      id: '1',
      dishId: 'jp-01',
      dishName: '豚の生姜焼き',
      genre: '和食',
      mainIngredient: '豚肉',
      cookingMethod: '焼く',
      calories: 540,
      prepTimeMinutes: 15,
      dateISO: '2026-10-24',
      timestamp: 1000,
    },
    {
      id: '2',
      dishId: 'we-03',
      dishName: 'チキンの完熟トマト煮',
      genre: '洋食',
      mainIngredient: '鶏肉',
      cookingMethod: '煮る',
      calories: 490,
      prepTimeMinutes: 20,
      dateISO: '2026-10-23',
      timestamp: 900,
    },
  ];
  const stats = calculateHistoryAnalytics(history);
  assert.equal(stats.totalMeals, 2);
  assert.equal(stats.genreCounts['和食'], 1);
  assert.equal(stats.genreCounts['洋食'], 1);
  assert.ok(stats.varietyScore > 50);
});
