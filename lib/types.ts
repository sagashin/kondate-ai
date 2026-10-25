export type Genre = '和食' | '洋食' | '中華' | '韓国・エスニック' | 'その他';

export type MainIngredient =
  | '鶏肉'
  | '豚肉'
  | '牛肉'
  | '魚介'
  | '卵・豆腐'
  | '野菜・きのこ'
  | '麺・飯';

export type CookingMethod =
  | '炒める'
  | '煮る'
  | '焼く'
  | '揚げる'
  | '蒸す・茹でる'
  | '和える・生';

export type MoodTag =
  | 'ガッツリ'
  | 'さっぱり'
  | '時短15分'
  | '節約'
  | 'おつまみ'
  | 'ヘルシー';

export interface Dish {
  id: string;
  name: string;
  catchphrase: string;
  prepTimeMinutes: number;
  calories: number;
  genre: Genre;
  mainIngredient: MainIngredient;
  cookingMethod: CookingMethod;
  moodTags: MoodTag[];
  ingredients: string[];
  sideDishSuggestion: string;
  tips?: string;
  isCustom?: boolean;
}

export interface MealHistoryEntry {
  id: string;
  dishId: string;
  dishName: string;
  genre: Genre;
  mainIngredient: MainIngredient;
  cookingMethod: CookingMethod;
  calories: number;
  prepTimeMinutes: number;
  dateISO: string; // YYYY-MM-DD
  timestamp: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
  fromDishName?: string;
  addedAt: number;
}

export interface UserSettings {
  dislikedIngredients: string[];
  cooldownDays: number;
  youtubeApiKey: string;
  darkMode: boolean;
  desktopPhoneFrame: boolean;
}

export interface RecommendationFilter {
  mood: MoodTag | null;
  maxTimeMinutes: number | null;
  genre: Genre | null;
  prioritizeFridge: boolean;
  selectedFridgeItems: string[];
}

export interface ScoredDish {
  dish: Dish;
  score: number;
  primaryReason: string;
  reasons: string[];
  matchedFridgeItems: string[];
  missingIngredients: string[];
  isCooldownRelaxed?: boolean;
}

export interface YouTubeCreatorLink {
  id: string;
  label: string;
  shortLabel: string;
  query: string;
  url: string;
  channelHint: string;
}

export interface YouTubeVideoItem {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt?: string;
}
