'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Heart,
  Plus,
  BookOpen,
  Clock,
  Flame,
  X,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import {
  CookingMethod,
  Dish,
  Genre,
  MainIngredient,
  MoodTag,
} from '@/lib/types';
import {
  COOKING_METHODS,
  GENRES,
  MAIN_INGREDIENTS,
  MOOD_TAGS,
} from '@/lib/recipes-data';
import { DishVisualBanner } from './DishVisualBanner';

interface RecipeEncyclopediaTabProps {
  allDishes: Dish[];
  favorites: string[];
  onToggleFavorite: (dishId: string) => void;
  onSelectDishDetail: (dish: Dish) => void;
  onAddCustomDish: (newDish: Dish) => void;
  onDeleteCustomDish: (dishId: string) => void;
}

export function RecipeEncyclopediaTab({
  allDishes,
  favorites,
  onToggleFavorite,
  onSelectDishDetail,
  onAddCustomDish,
  onDeleteCustomDish,
}: RecipeEncyclopediaTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<Genre | 'ALL'>('ALL');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Custom dish form state
  const [newName, setNewName] = useState('');
  const [newCatchphrase, setNewCatchphrase] = useState('');
  const [newGenre, setNewGenre] = useState<Genre>('和食');
  const [newMainIngredient, setNewMainIngredient] = useState<MainIngredient>('鶏肉');
  const [newCookingMethod, setNewCookingMethod] = useState<CookingMethod>('炒める');
  const [newPrepTime, setNewPrepTime] = useState(15);
  const [newCalories, setNewCalories] = useState(500);
  const [newIngredientsText, setNewIngredientsText] = useState('');
  const [newSideDish, setNewSideDish] = useState('');
  const [newMoods, setNewMoods] = useState<MoodTag[]>(['時短15分']);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredDishes = useMemo(() => {
    return allDishes.filter((dish) => {
      if (onlyFavorites && !favorites.includes(dish.id)) return false;
      if (selectedGenre !== 'ALL' && dish.genre !== selectedGenre) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const inName = dish.name.toLowerCase().includes(q);
        const inCatch = dish.catchphrase.toLowerCase().includes(q);
        const inIng = dish.ingredients.some((i) => i.toLowerCase().includes(q));
        if (!inName && !inCatch && !inIng) return false;
      }
      return true;
    });
  }, [allDishes, favorites, onlyFavorites, selectedGenre, searchQuery]);

  const handleCreateCustomDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setFormError('料理名を入力してください');
      return;
    }
    const parsedIngredients = newIngredientsText
      .split(/[、,・\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (parsedIngredients.length === 0) {
      setFormError('主な食材を1つ以上入力してください（読点やカンマ区切り）');
      return;
    }

    const customDish: Dish = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      catchphrase:
        newCatchphrase.trim() ||
        `${newGenre}×${newMainIngredient}で作るわが家のオリジナル定番メニュー`,
      prepTimeMinutes: Number(newPrepTime) || 15,
      calories: Number(newCalories) || 500,
      genre: newGenre,
      mainIngredient: newMainIngredient,
      cookingMethod: newCookingMethod,
      moodTags: newMoods.length > 0 ? newMoods : ['ガッツリ'],
      ingredients: parsedIngredients,
      sideDishSuggestion: newSideDish.trim() || '季節のサラダ＋お好みのスープ',
      isCustom: true,
    };

    onAddCustomDish(customDish);
    setNewName('');
    setNewCatchphrase('');
    setNewIngredientsText('');
    setNewSideDish('');
    setFormError(null);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Search & Header Card */}
      <section
        aria-label="レシピ図鑑検索とフィルター"
        className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-stone-200/80 dark:border-slate-800 space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-white tracking-tight">
              レシピ図鑑（全{allDishes.length}品目）
            </h2>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
              お気に入り登録やオリジナルメニューの追加ができます
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>新規追加</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <label htmlFor="recipe-search-input" className="sr-only">
            料理名や食材でレシピを検索
          </label>
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="recipe-search-input"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="料理名・食材名で検索（例：鶏むね、豆腐、パスタ）"
            className="w-full min-h-[44px] rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 pl-10 pr-4 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Genre & Favorites Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setOnlyFavorites((v) => !v)}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition ${
              onlyFavorites
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-current' : ''}`} />
            <span>お気に入り ({favorites.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedGenre('ALL')}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedGenre === 'ALL'
                ? 'bg-stone-900 dark:bg-white text-white dark:text-slate-900'
                : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
            }`}
          >
            すべて
          </button>

          {GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => setSelectedGenre(genre)}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedGenre === genre
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </section>

      {/* Recipe Catalog Grid */}
      {filteredDishes.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 p-10 text-center border border-stone-200/80 dark:border-slate-800 space-y-2">
          <BookOpen className="w-8 h-8 text-stone-400 mx-auto" />
          <p className="text-sm font-bold text-stone-700 dark:text-slate-300">
            条件に一致するレシピが見つかりません
          </p>
          <p className="text-xs text-stone-500 dark:text-slate-400">
            検索キーワードを変えるか、右上の「新規追加」からオリジナルメニューを登録してください。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredDishes.map((dish) => {
            const isFav = favorites.includes(dish.id);
            return (
              <article
                key={dish.id}
                className="rounded-2xl bg-white dark:bg-slate-900 shadow-xs border border-stone-200/80 dark:border-slate-800 overflow-hidden flex flex-col justify-between"
              >
                <div>
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
                    className="relative cursor-pointer"
                  >
                    <DishVisualBanner
                      dish={dish}
                      compact
                      rankBadge={dish.isCustom ? 'マイレシピ' : undefined}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(dish.id);
                      }}
                      aria-label={
                        isFav
                          ? `${dish.name}をお気に入り解除`
                          : `${dish.name}をお気に入り登録`
                      }
                      className={`absolute top-2.5 right-2.5 z-20 min-w-[40px] min-h-[40px] rounded-full backdrop-blur-md flex items-center justify-center transition ${
                        isFav
                          ? 'bg-rose-500 text-white'
                          : 'bg-black/30 text-white hover:bg-black/50'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <div className="p-4 space-y-2">
                    <p className="text-xs text-stone-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {dish.catchphrase}
                    </p>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400 truncate">
                      材料：{dish.ingredients.join(' · ')}
                    </p>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectDishDetail(dish)}
                    className="flex-1 min-h-[40px] rounded-xl bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 text-xs font-semibold transition"
                  >
                    レシピ詳細・YouTube
                  </button>
                  {dish.isCustom && (
                    <button
                      type="button"
                      onClick={() => onDeleteCustomDish(dish.id)}
                      aria-label={`${dish.name}を削除`}
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-stone-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal to Add New Original Recipe */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-custom-recipe-title"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-stone-200 dark:border-slate-800 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3
                id="add-custom-recipe-title"
                className="text-base font-bold text-stone-900 dark:text-white"
              >
                新規オリジナルメニュー追加
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                aria-label="モーダルを閉じる"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 px-3.5 py-2.5 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCustomDish} className="space-y-4 text-xs">
              <div>
                <label
                  htmlFor="custom-dish-name"
                  className="block font-bold text-stone-700 dark:text-slate-300 mb-1"
                >
                  料理名（必須）
                </label>
                <input
                  id="custom-dish-name"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例：特製ねぎ塩レモン豚丼"
                  className="w-full min-h-[42px] rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 px-3 text-sm text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="custom-dish-ingredients"
                  className="block font-bold text-stone-700 dark:text-slate-300 mb-1"
                >
                  主な食材（必須・読点やカンマ区切り）
                </label>
                <input
                  id="custom-dish-ingredients"
                  type="text"
                  value={newIngredientsText}
                  onChange={(e) => setNewIngredientsText(e.target.value)}
                  placeholder="例：豚バラ肉、長ねぎ、レモン、ご飯"
                  className="w-full min-h-[42px] rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 px-3 text-sm text-stone-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label
                    htmlFor="custom-dish-genre"
                    className="block font-bold text-stone-700 dark:text-slate-300 mb-1"
                  >
                    ジャンル
                  </label>
                  <select
                    id="custom-dish-genre"
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value as Genre)}
                    className="w-full min-h-[42px] rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 px-2.5 text-stone-900 dark:text-white"
                  >
                    {GENRES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="custom-dish-main-ing"
                    className="block font-bold text-stone-700 dark:text-slate-300 mb-1"
                  >
                    メイン食材
                  </label>
                  <select
                    id="custom-dish-main-ing"
                    value={newMainIngredient}
                    onChange={(e) =>
                      setNewMainIngredient(e.target.value as MainIngredient)
                    }
                    className="w-full min-h-[42px] rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 px-2.5 text-stone-900 dark:text-white"
                  >
                    {MAIN_INGREDIENTS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="custom-dish-method"
                    className="block font-bold text-stone-700 dark:text-slate-300 mb-1"
                  >
                    調理法
                  </label>
                  <select
                    id="custom-dish-method"
                    value={newCookingMethod}
                    onChange={(e) =>
                      setNewCookingMethod(e.target.value as CookingMethod)
                    }
                    className="w-full min-h-[42px] rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 px-2.5 text-stone-900 dark:text-white"
                  >
                    {COOKING_METHODS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="custom-dish-time"
                    className="block font-bold text-stone-700 dark:text-slate-300 mb-1"
                  >
                    調理時間（分）
                  </label>
                  <input
                    id="custom-dish-time"
                    type="number"
                    min={3}
                    max={120}
                    value={newPrepTime}
                    onChange={(e) => setNewPrepTime(Number(e.target.value))}
                    className="w-full min-h-[42px] rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 px-3 text-stone-900 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="custom-dish-cal"
                    className="block font-bold text-stone-700 dark:text-slate-300 mb-1"
                  >
                    目安カロリー（kcal）
                  </label>
                  <input
                    id="custom-dish-cal"
                    type="number"
                    min={100}
                    max={1500}
                    step={10}
                    value={newCalories}
                    onChange={(e) => setNewCalories(Number(e.target.value))}
                    className="w-full min-h-[42px] rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 px-3 text-stone-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <span className="block font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                  気分タグ（複数選択可）
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {MOOD_TAGS.map((tag) => {
                    const active = newMoods.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() =>
                          setNewMoods((prev) =>
                            active ? prev.filter((t) => t !== tag) : [...prev, tag]
                          )
                        }
                        className={`min-h-[36px] px-3 py-1 rounded-xl text-xs font-semibold transition ${
                          active
                            ? 'bg-orange-600 text-white'
                            : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label
                  htmlFor="custom-dish-catch"
                  className="block font-bold text-stone-700 dark:text-slate-300 mb-1"
                >
                  キャッチコピー・メモ（任意）
                </label>
                <input
                  id="custom-dish-catch"
                  type="text"
                  value={newCatchphrase}
                  onChange={(e) => setNewCatchphrase(e.target.value)}
                  placeholder="例：ごま油とレモンの風味でさっぱり食べられる一品"
                  className="w-full min-h-[42px] rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 px-3 text-stone-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[48px] rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>レシピ図鑑に登録する</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
