'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Home,
  Refrigerator,
  Calendar,
  BookOpen,
  Settings,
  CheckCircle2,
  ShoppingBag,
  Sparkles,
  CheckSquare,
  Square,
  ChevronRight,
} from 'lucide-react';
import {
  Dish,
  MealHistoryEntry,
  RecommendationFilter,
  ShoppingItem,
  UserSettings,
} from '@/lib/types';
import { INITIAL_DISHES } from '@/lib/recipes-data';
import {
  calculateHistoryAnalytics,
  getTodayISO,
  isIngredientMatch,
  scoreAndRecommendDishes,
} from '@/lib/recommendation-engine';
import { HomeGachaTab } from '@/components/HomeGachaTab';
import { FridgeShoppingTab } from '@/components/FridgeShoppingTab';
import { HistoryAnalyticsTab } from '@/components/HistoryAnalyticsTab';
import { RecipeEncyclopediaTab } from '@/components/RecipeEncyclopediaTab';
import { SettingsTab } from '@/components/SettingsTab';
import { DishDetailModal } from '@/components/DishDetailModal';
import { PWAInstallButton } from '@/components/PWAInstallButton';

type ActiveTab = 'home' | 'fridge' | 'history' | 'encyclopedia' | 'settings';

const STORAGE_KEYS = {
  CUSTOM_DISHES: 'kondate_custom_dishes_v1',
  FAVORITES: 'kondate_favorites_v1',
  FRIDGE: 'kondate_fridge_v1',
  SHOPPING: 'kondate_shopping_v1',
  HISTORY: 'kondate_history_v1',
  SETTINGS: 'kondate_settings_v1',
};

const DEFAULT_SETTINGS: UserSettings = {
  dislikedIngredients: [],
  cooldownDays: 7,
  youtubeApiKey: '',
  darkMode: false,
  desktopPhoneFrame: false,
};

function getDateDaysAgoISO(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return getTodayISO(d);
}

function getInitialSeedHistory(): MealHistoryEntry[] {
  return [
    {
      id: 'seed-h1',
      dishId: 'jp-04',
      dishName: 'サバの味噌煮',
      genre: '和食',
      mainIngredient: '魚介',
      cookingMethod: '煮る',
      calories: 440,
      prepTimeMinutes: 20,
      dateISO: getDateDaysAgoISO(1),
      timestamp: Date.now() - 86400000,
    },
    {
      id: 'seed-h2',
      dishId: 'we-03',
      dishName: 'チキンの完熟トマトガーリック煮込み',
      genre: '洋食',
      mainIngredient: '鶏肉',
      cookingMethod: '煮る',
      calories: 490,
      prepTimeMinutes: 20,
      dateISO: getDateDaysAgoISO(2),
      timestamp: Date.now() - 2 * 86400000,
    },
  ];
}

const DEFAULT_FRIDGE = ['豚バラ肉', 'キャベツ', '卵', '玉ねぎ'];

const DEFAULT_SHOPPING: ShoppingItem[] = [
  {
    id: 'seed-s1',
    name: 'ピーマン',
    checked: false,
    fromDishName: '豚バラとキャベツの回鍋肉（ホイコーロー）',
    addedAt: Date.now() - 3600000,
  },
  {
    id: 'seed-s2',
    name: '長ねぎ',
    checked: false,
    fromDishName: '本格四川風・旨辛麻婆豆腐',
    addedAt: Date.now() - 7200000,
  },
];

export default function KondateAppPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [hydrated, setHydrated] = useState(false);

  // Persistent state
  const [customDishes, setCustomDishes] = useState<Dish[]>([]);
  const [favorites, setFavorites] = useState<string[]>(['jp-01', 'cn-01', 'we-02']);
  const [fridgeItems, setFridgeItems] = useState<string[]>(DEFAULT_FRIDGE);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(DEFAULT_SHOPPING);
  const [history, setHistory] = useState<MealHistoryEntry[]>(getInitialSeedHistory);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  // Recommendation filter & Gacha state
  const [filter, setFilter] = useState<RecommendationFilter>({
    mood: null,
    maxTimeMinutes: null,
    genre: null,
    prioritizeFridge: false,
    selectedFridgeItems: [],
  });
  const [gachaSeed, setGachaSeed] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedDishDetail, setSelectedDishDetail] = useState<Dish | null>(null);
  const [toastBanner, setToastBanner] = useState<{
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  // Hydrate from LocalStorage
  useEffect(() => {
    try {
      const savedCustom = localStorage.getItem(STORAGE_KEYS.CUSTOM_DISHES);
      if (savedCustom) setCustomDishes(JSON.parse(savedCustom));

      const savedFavs = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (savedFavs) setFavorites(JSON.parse(savedFavs));

      const savedFridge = localStorage.getItem(STORAGE_KEYS.FRIDGE);
      if (savedFridge) setFridgeItems(JSON.parse(savedFridge));

      const savedShopping = localStorage.getItem(STORAGE_KEYS.SHOPPING);
      if (savedShopping) setShoppingList(JSON.parse(savedShopping));

      const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (savedHistory) setHistory(JSON.parse(savedHistory));

      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
      }
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Save to LocalStorage whenever state changes after hydration
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEYS.CUSTOM_DISHES, JSON.stringify(customDishes));
  }, [customDishes, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }, [favorites, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEYS.FRIDGE, JSON.stringify(fridgeItems));
  }, [fridgeItems, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEYS.SHOPPING, JSON.stringify(shoppingList));
  }, [shoppingList, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }, [history, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings, hydrated]);

  const allDishes = useMemo(
    () => [...customDishes, ...INITIAL_DISHES],
    [customDishes]
  );

  const recommendations = useMemo(() => {
    // gachaSeed is included to allow fresh shuffle rolls
    const jitter = gachaSeed > 0 ? 48 : 0;
    return scoreAndRecommendDishes({
      allDishes,
      history,
      fridgeItems,
      filter,
      settings,
      count: 3,
      shuffleJitter: jitter,
    });
  }, [allDishes, history, fridgeItems, filter, settings, gachaSeed]);

  const showToast = useCallback(
    (message: string, actionLabel?: string, onAction?: () => void) => {
      setToastBanner({ message, actionLabel, onAction });
      setTimeout(() => {
        setToastBanner((prev) => (prev?.message === message ? null : prev));
      }, 4500);
    },
    []
  );

  const handleSpinGacha = () => {
    setIsSpinning(true);
    setTimeout(() => {
      setGachaSeed((s) => s + 1);
      setIsSpinning(false);
    }, 320);
  };

  const handleUpdateFilter = (patch: Partial<RecommendationFilter>) => {
    setFilter((prev) => ({ ...prev, ...patch }));
  };

  const handleToggleFavorite = (dishId: string) => {
    setFavorites((prev) =>
      prev.includes(dishId) ? prev.filter((id) => id !== dishId) : [...prev, dishId]
    );
  };

  const handleAddIngredientsToShopping = useCallback(
    (ingredients: string[], dishName?: string) => {
      setShoppingList((prev) => {
        const existingNames = new Set(prev.map((i) => i.name.trim()));
        const additions: ShoppingItem[] = [];
        for (const ing of ingredients) {
          const clean = ing.trim();
          if (clean && !existingNames.has(clean)) {
            existingNames.add(clean);
            additions.push({
              id: `shop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: clean,
              checked: false,
              fromDishName: dishName,
              addedAt: Date.now(),
            });
          }
        }
        return [...additions, ...prev];
      });
      showToast(
        `買い物リストに${ingredients.length}品目を追加しました`,
        'リストを見る',
        () => setActiveTab('fridge')
      );
    },
    [showToast]
  );

  const handleDecideMeal = useCallback(
    (dish: Dish, addMissingToCart: boolean) => {
      const entry: MealHistoryEntry = {
        id: `hist-${Date.now()}`,
        dishId: dish.id,
        dishName: dish.name,
        genre: dish.genre,
        mainIngredient: dish.mainIngredient,
        cookingMethod: dish.cookingMethod,
        calories: dish.calories,
        prepTimeMinutes: dish.prepTimeMinutes,
        dateISO: getTodayISO(),
        timestamp: Date.now(),
      };
      setHistory((prev) => [entry, ...prev]);

      const missing = dish.ingredients.filter(
        (ing) => !fridgeItems.some((f) => isIngredientMatch(ing, f))
      );

      if (addMissingToCart) {
        const toAdd = missing.length > 0 ? missing : dish.ingredients;
        handleAddIngredientsToShopping(toAdd, dish.name);
        showToast(
          `「${dish.name}」を今日の献立に決定し、材料を買い物リストに追加しました！`,
          '履歴を見る',
          () => setActiveTab('history')
        );
      } else {
        showToast(
          `「${dish.name}」を今日の献立に決定しました！`,
          missing.length > 0 ? `不足材料(${missing.length})を買い物リストへ` : '履歴を見る',
          () => {
            if (missing.length > 0) {
              handleAddIngredientsToShopping(missing, dish.name);
            } else {
              setActiveTab('history');
            }
          }
        );
      }
    },
    [fridgeItems, handleAddIngredientsToShopping, showToast]
  );

  const handleToggleFridgeItem = (item: string) => {
    setFridgeItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleAddCustomFridgeItem = (item: string) => {
    setFridgeItems((prev) => (prev.includes(item) ? prev : [item, ...prev]));
  };

  const handleResetAllData = () => {
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_DISHES);
    localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    localStorage.removeItem(STORAGE_KEYS.FRIDGE);
    localStorage.removeItem(STORAGE_KEYS.SHOPPING);
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    setCustomDishes([]);
    setFavorites(['jp-01', 'cn-01', 'we-02']);
    setFridgeItems(DEFAULT_FRIDGE);
    setShoppingList(DEFAULT_SHOPPING);
    setHistory(getInitialSeedHistory());
    setSettings(DEFAULT_SETTINGS);
    showToast('すべてのデータを初期状態にリセットしました');
  };

  const uncheckedShoppingCount = shoppingList.filter((i) => !i.checked).length;
  const analytics = useMemo(() => calculateHistoryAnalytics(history), [history]);

  return (
    <div className={settings.darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-[#faf7f2] dark:bg-slate-950 text-stone-900 dark:text-slate-100 pb-20 transition-colors">
        {/* Top Bar Contract: 3 Zones (1-line Brand Wordmark — 5 Single-Line Nav Links — 1 Primary Action) */}
        <header className="flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5 bg-white/95 dark:bg-slate-900/95 border-b border-stone-200/80 dark:border-slate-800">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('home');
            }}
            className="text-lg font-bold tracking-tight text-stone-900 dark:text-white whitespace-nowrap shrink-0"
          >
            Kondate AI
          </a>

          {/* Zone 2: 5 concise single-line text navigation links on desktop */}
          <nav
            aria-label="メインナビゲーション"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-slate-300"
          >
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`hover:text-orange-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'home'
                  ? 'text-orange-600 dark:text-orange-400 font-bold underline underline-offset-8'
                  : ''
              }`}
            >
              提案ガチャ
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fridge')}
              className={`hover:text-orange-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'fridge'
                  ? 'text-orange-600 dark:text-orange-400 font-bold underline underline-offset-8'
                  : ''
              }`}
            >
              冷蔵庫・買い物
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`hover:text-orange-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'history'
                  ? 'text-orange-600 dark:text-orange-400 font-bold underline underline-offset-8'
                  : ''
              }`}
            >
              履歴・分析
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('encyclopedia')}
              className={`hover:text-orange-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'encyclopedia'
                  ? 'text-orange-600 dark:text-orange-400 font-bold underline underline-offset-8'
                  : ''
              }`}
            >
              レシピ図鑑
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`hover:text-orange-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'settings'
                  ? 'text-orange-600 dark:text-orange-400 font-bold underline underline-offset-8'
                  : ''
              }`}
            >
              設定
            </button>
          </nav>

          {/* Zone 3: 1 primary action (PWA Install or Quick Gacha) */}
          <div className="flex items-center gap-3 shrink-0">
            <PWAInstallButton compact />
          </div>
        </header>

        {/* Main Workspace Container */}
        <main
          className={`mx-auto px-4 sm:px-6 pt-5 ${
            settings.desktopPhoneFrame
              ? 'max-w-md'
              : 'max-w-md lg:max-w-6xl lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start'
          }`}
        >
          {/* Primary Mobile-First Column */}
          <div className={settings.desktopPhoneFrame ? 'w-full' : 'lg:col-span-7 xl:col-span-8'}>
            {/* Toast Feedback Banner */}
            {toastBanner && (
              <div
                role="status"
                className="mb-4 rounded-2xl bg-stone-900 dark:bg-orange-600 text-white px-4 py-3 shadow-lg flex items-center justify-between gap-3 text-xs font-medium"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-white shrink-0" />
                  <span>{toastBanner.message}</span>
                </div>
                {toastBanner.actionLabel && toastBanner.onAction && (
                  <button
                    type="button"
                    onClick={() => {
                      toastBanner.onAction?.();
                      setToastBanner(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold shrink-0 transition"
                  >
                    {toastBanner.actionLabel}
                  </button>
                )}
              </div>
            )}

            {activeTab === 'home' && (
              <HomeGachaTab
                recommendations={recommendations}
                filter={filter}
                onUpdateFilter={handleUpdateFilter}
                onSpinGacha={handleSpinGacha}
                isSpinning={isSpinning}
                fridgeItems={fridgeItems}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onSelectDishDetail={(dish) => setSelectedDishDetail(dish)}
                onDecideMeal={handleDecideMeal}
                onAddIngredientsToShopping={handleAddIngredientsToShopping}
                recentHistory={history}
                onSwitchToFridgeTab={() => setActiveTab('fridge')}
              />
            )}

            {activeTab === 'fridge' && (
              <FridgeShoppingTab
                fridgeItems={fridgeItems}
                onToggleFridgeItem={handleToggleFridgeItem}
                onAddCustomFridgeItem={handleAddCustomFridgeItem}
                onClearFridge={() => setFridgeItems([])}
                shoppingList={shoppingList}
                onAddShoppingItem={(name, fromDishName) =>
                  handleAddIngredientsToShopping([name], fromDishName)
                }
                onToggleShoppingItem={(id) =>
                  setShoppingList((prev) =>
                    prev.map((item) =>
                      item.id === id ? { ...item, checked: !item.checked } : item
                    )
                  )
                }
                onRemoveShoppingItem={(id) =>
                  setShoppingList((prev) => prev.filter((item) => item.id !== id))
                }
                onClearCheckedShopping={() =>
                  setShoppingList((prev) => prev.filter((item) => !item.checked))
                }
                onClearAllShopping={() => setShoppingList([])}
                onGoToGachaWithFridge={() => {
                  setFilter((prev) => ({ ...prev, prioritizeFridge: true }));
                  setActiveTab('home');
                }}
              />
            )}

            {activeTab === 'history' && (
              <HistoryAnalyticsTab
                history={history}
                allDishes={allDishes}
                cooldownDays={settings.cooldownDays}
                onRemoveHistoryEntry={(id) =>
                  setHistory((prev) => prev.filter((h) => h.id !== id))
                }
                onClearHistory={() => setHistory([])}
                onSelectDishDetail={(dish) => setSelectedDishDetail(dish)}
              />
            )}

            {activeTab === 'encyclopedia' && (
              <RecipeEncyclopediaTab
                allDishes={allDishes}
                favorites={favorites}
                onToggleFavorite={handleToggleFavorite}
                onSelectDishDetail={(dish) => setSelectedDishDetail(dish)}
                onAddCustomDish={(newDish) => {
                  setCustomDishes((prev) => [newDish, ...prev]);
                  showToast(`「${newDish.name}」をレシピ図鑑に追加しました！`);
                }}
                onDeleteCustomDish={(dishId) =>
                  setCustomDishes((prev) => prev.filter((d) => d.id !== dishId))
                }
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                settings={settings}
                onUpdateSettings={(patch) =>
                  setSettings((prev) => ({ ...prev, ...patch }))
                }
                onResetAllData={handleResetAllData}
              />
            )}
          </div>

          {/* Desktop Companion Sidebar (Hidden on mobile or when Phone Frame Only mode is enabled) */}
          {!settings.desktopPhoneFrame && (
            <aside
              aria-label="キッチン・ステータスボード"
              className="hidden lg:flex lg:col-span-5 xl:col-span-4 flex-col gap-5 sticky top-6"
            >
              {/* Live Fridge Quick Card */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-stone-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Refrigerator className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                      冷蔵庫の在庫 ({fridgeItems.length}品目)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('fridge')}
                    className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    管理
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {fridgeItems.length === 0 ? (
                  <p className="text-xs text-stone-500">在庫登録なし</p>
                ) : (
                  <p className="text-xs text-stone-700 dark:text-slate-300 leading-relaxed">
                    {fridgeItems.join(' · ')}
                  </p>
                )}
              </div>

              {/* Live Shopping Checklist Quick Card */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-stone-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-orange-600" />
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                      買い物リスト (残り{uncheckedShoppingCount}品)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('fridge')}
                    className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    すべて見る
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {shoppingList.length === 0 ? (
                  <p className="text-xs text-stone-500">買い物リストは空です</p>
                ) : (
                  <ul className="divide-y divide-stone-100 dark:divide-slate-800">
                    {shoppingList.slice(0, 5).map((item) => (
                      <li key={item.id} className="py-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setShoppingList((prev) =>
                              prev.map((s) =>
                                s.id === item.id ? { ...s, checked: !s.checked } : s
                              )
                            )
                          }
                          className="flex items-center gap-2 text-xs text-left truncate flex-1"
                        >
                          {item.checked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-stone-400 shrink-0" />
                          )}
                          <span
                            className={`truncate ${
                              item.checked
                                ? 'line-through text-stone-400'
                                : 'text-stone-800 dark:text-slate-200 font-medium'
                            }`}
                          >
                            {item.name}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 7-Day Rotation & Cooldown Summary Card */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-stone-200/80 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    <h3 className="text-sm font-bold text-stone-900 dark:text-white">
                      ローテーション診断
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    多様性 {analytics.varietyScore}点
                  </span>
                </div>

                <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
                  {analytics.insightMessage}
                </p>

                {history.length > 0 && (
                  <div className="pt-2 border-t border-stone-100 dark:border-slate-800 space-y-1.5">
                    <span className="block text-[11px] font-semibold text-stone-400">
                      直近の決定メニュー（{settings.cooldownDays}日間クールダウン除外）
                    </span>
                    {history.slice(0, 3).map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between text-xs tabular-nums"
                      >
                        <span className="font-medium text-stone-800 dark:text-slate-200 truncate">
                          {h.dishName}
                        </span>
                        <span className="text-stone-400 shrink-0 ml-2">
                          {h.genre} · {h.mainIngredient}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}
        </main>

        {/* Glassmorphism Fixed Bottom Navigation Bar (5 Tabs, 56px height <= 15% mobile viewport) */}
        <nav
          aria-label="ボトムナビゲーション"
          className="fixed bottom-0 left-0 right-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-t border-stone-200/80 dark:border-slate-800"
        >
          <div className="max-w-md mx-auto grid grid-cols-5 items-center h-14 px-1">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`min-h-[48px] flex flex-col items-center justify-center transition ${
                activeTab === 'home'
                  ? 'text-orange-600 dark:text-orange-400 font-bold'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-900'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                ホーム
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('fridge')}
              className={`relative min-h-[48px] flex flex-col items-center justify-center transition ${
                activeTab === 'fridge'
                  ? 'text-orange-600 dark:text-orange-400 font-bold'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-900'
              }`}
            >
              <Refrigerator className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                冷蔵庫・買物
              </span>
              {uncheckedShoppingCount > 0 && (
                <span className="sr-only">買い物リスト残り{uncheckedShoppingCount}件</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`min-h-[48px] flex flex-col items-center justify-center transition ${
                activeTab === 'history'
                  ? 'text-orange-600 dark:text-orange-400 font-bold'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-900'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                履歴・分析
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('encyclopedia')}
              className={`min-h-[48px] flex flex-col items-center justify-center transition ${
                activeTab === 'encyclopedia'
                  ? 'text-orange-600 dark:text-orange-400 font-bold'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-900'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                レシピ図鑑
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`min-h-[48px] flex flex-col items-center justify-center transition ${
                activeTab === 'settings'
                  ? 'text-orange-600 dark:text-orange-400 font-bold'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-900'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                設定
              </span>
            </button>
          </div>
        </nav>

        {/* Dish Detail & YouTube Recipe Modal */}
        <DishDetailModal
          dish={selectedDishDetail}
          onClose={() => setSelectedDishDetail(null)}
          fridgeItems={fridgeItems}
          isFavorite={
            selectedDishDetail ? favorites.includes(selectedDishDetail.id) : false
          }
          onToggleFavorite={handleToggleFavorite}
          onDecideMeal={handleDecideMeal}
          onAddIngredientsToShopping={handleAddIngredientsToShopping}
          youtubeApiKey={settings.youtubeApiKey}
        />
      </div>
    </div>
  );
}
