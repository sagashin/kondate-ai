'use client';

import React, { useState } from 'react';
import {
  Refrigerator,
  ShoppingBag,
  Plus,
  Trash2,
  Check,
  Sparkles,
  CheckSquare,
  Square,
  X,
} from 'lucide-react';
import { FRIDGE_PRESET_CATEGORIES } from '@/lib/recipes-data';
import { ShoppingItem } from '@/lib/types';

interface FridgeShoppingTabProps {
  fridgeItems: string[];
  onToggleFridgeItem: (item: string) => void;
  onAddCustomFridgeItem: (item: string) => void;
  onClearFridge: () => void;
  shoppingList: ShoppingItem[];
  onAddShoppingItem: (name: string, fromDishName?: string) => void;
  onToggleShoppingItem: (id: string) => void;
  onRemoveShoppingItem: (id: string) => void;
  onClearCheckedShopping: () => void;
  onClearAllShopping: () => void;
  onGoToGachaWithFridge: () => void;
}

export function FridgeShoppingTab({
  fridgeItems,
  onToggleFridgeItem,
  onAddCustomFridgeItem,
  onClearFridge,
  shoppingList,
  onAddShoppingItem,
  onToggleShoppingItem,
  onRemoveShoppingItem,
  onClearCheckedShopping,
  onClearAllShopping,
  onGoToGachaWithFridge,
}: FridgeShoppingTabProps) {
  const [subTab, setSubTab] = useState<'fridge' | 'shopping'>('fridge');
  const [customFridgeInput, setCustomFridgeInput] = useState('');
  const [customShopInput, setCustomShopInput] = useState('');

  const handleAddFridgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customFridgeInput.trim();
    if (!trimmed) return;
    onAddCustomFridgeItem(trimmed);
    setCustomFridgeInput('');
  };

  const handleAddShopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customShopInput.trim();
    if (!trimmed) return;
    onAddShoppingItem(trimmed);
    setCustomShopInput('');
  };

  const checkedCount = shoppingList.filter((i) => i.checked).length;

  return (
    <div className="space-y-6 pb-8">
      {/* Sub-navigation segmented control */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-stone-200/70 dark:bg-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setSubTab('fridge')}
          className={`min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition whitespace-nowrap ${
            subTab === 'fridge'
              ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-xs'
              : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
          }`}
        >
          <Refrigerator className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>冷蔵庫の食材 ({fridgeItems.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('shopping')}
          className={`min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition whitespace-nowrap ${
            subTab === 'shopping'
              ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-white shadow-xs'
              : 'text-stone-600 dark:text-slate-400 hover:text-stone-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-orange-600 shrink-0" />
          <span>
            買い物リスト ({shoppingList.length - checkedCount}/{shoppingList.length})
          </span>
        </button>
      </div>

      {subTab === 'fridge' ? (
        <section
          aria-label="冷蔵庫の食材管理"
          className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-stone-200/80 dark:border-slate-800 space-y-5"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white">
                今ある冷蔵庫の食材
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                登録した食材を優先的に使う時短・節約メニューを自動提案します
              </p>
            </div>
            {fridgeItems.length > 0 && (
              <button
                type="button"
                onClick={onClearFridge}
                className="text-xs font-medium text-stone-400 hover:text-rose-600 transition shrink-0"
              >
                すべてクリア
              </button>
            )}
          </div>

          {/* Currently stocked items */}
          <div className="rounded-2xl bg-stone-50 dark:bg-slate-800/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 dark:text-slate-300">
                現在のストック（{fridgeItems.length}品目）
              </span>
              {fridgeItems.length > 0 && (
                <button
                  type="button"
                  onClick={onGoToGachaWithFridge}
                  className="min-h-[36px] px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>この食材で献立ガチャを回す</span>
                </button>
              )}
            </div>

            {fridgeItems.length === 0 ? (
              <p className="text-xs text-stone-500 dark:text-slate-400 py-2">
                下のボタンをタップするか、自由入力で冷蔵庫にある食材を追加してください。
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {fridgeItems.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onToggleFridgeItem(item)}
                    aria-label={`冷蔵庫から${item}を削除`}
                    className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-emerald-700 transition"
                  >
                    <span>{item}</span>
                    <X className="w-3.5 h-3.5 opacity-80" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Ingredient Input Form */}
          <form onSubmit={handleAddFridgeSubmit} className="flex gap-2">
            <label htmlFor="custom-fridge-input" className="sr-only">
              冷蔵庫の食材を自由入力で追加
            </label>
            <input
              id="custom-fridge-input"
              type="text"
              value={customFridgeInput}
              onChange={(e) => setCustomFridgeInput(e.target.value)}
              placeholder="食材名を入力して追加（例：アボカド、ちくわ）"
              className="flex-1 min-h-[44px] rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 px-3.5 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              className="min-h-[44px] px-4 rounded-xl bg-stone-900 dark:bg-orange-600 text-white text-xs font-bold inline-flex items-center gap-1.5 hover:opacity-90 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>追加</span>
            </button>
          </form>

          {/* Categorized Quick-Tap Preset Chips */}
          <div className="space-y-4 pt-2">
            {FRIDGE_PRESET_CATEGORIES.map((cat) => (
              <div key={cat.category} className="space-y-2">
                <h3 className="text-xs font-bold text-stone-700 dark:text-slate-300">
                  {cat.category}（ワンタップでON/OFF）
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {cat.items.map((item) => {
                    const active = fridgeItems.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => onToggleFridgeItem(item)}
                        className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition ${
                          active
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:bg-stone-200/70'
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section
          aria-label="買い物リスト管理"
          className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-stone-200/80 dark:border-slate-800 space-y-5"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white">
                買い物チェックリスト
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 tabular-nums">
                全{shoppingList.length}品目 · 購入済み {checkedCount}品目
              </p>
            </div>

            {shoppingList.length > 0 && (
              <div className="flex items-center gap-2">
                {checkedCount > 0 && (
                  <button
                    type="button"
                    onClick={onClearCheckedShopping}
                    className="min-h-[36px] px-2.5 py-1 rounded-xl bg-stone-100 dark:bg-slate-800 text-xs font-semibold text-stone-600 dark:text-slate-300 hover:bg-stone-200 transition"
                  >
                    完了済みを削除
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClearAllShopping}
                  className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-medium text-stone-400 hover:text-rose-600 transition"
                >
                  全クリア
                </button>
              </div>
            )}
          </div>

          {/* Add new shopping item form */}
          <form onSubmit={handleAddShopSubmit} className="flex gap-2">
            <label htmlFor="custom-shop-input" className="sr-only">
              買うものを追加
            </label>
            <input
              id="custom-shop-input"
              type="text"
              value={customShopInput}
              onChange={(e) => setCustomShopInput(e.target.value)}
              placeholder="買うものを追加（例：牛乳、ごま油、ラップ）"
              className="flex-1 min-h-[44px] rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 px-3.5 text-sm text-stone-900 dark:text-white placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              className="min-h-[44px] px-4 rounded-xl bg-orange-600 text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-orange-700 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>追加</span>
            </button>
          </form>

          {/* Checklist rows */}
          {shoppingList.length === 0 ? (
            <div className="rounded-2xl bg-stone-50 dark:bg-slate-800/60 p-8 text-center space-y-2">
              <ShoppingBag className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="text-sm font-semibold text-stone-700 dark:text-slate-300">
                買い物リストは空です
              </p>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                ホームの献立カードから「不足材料を買い物リストへ」を押すとワンタップで追加されます。
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100 dark:divide-slate-800">
              {shoppingList.map((item) => (
                <li
                  key={item.id}
                  className="py-2.5 flex items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => onToggleShoppingItem(item.id)}
                    className="flex-1 min-h-[44px] flex items-center gap-3 text-left group"
                  >
                    {item.checked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-5 h-5 text-stone-400 group-hover:text-orange-600 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-medium truncate ${
                          item.checked
                            ? 'line-through text-stone-400 dark:text-slate-500'
                            : 'text-stone-900 dark:text-white'
                        }`}
                      >
                        {item.name}
                      </span>
                      {item.fromDishName && (
                        <span className="block text-[11px] text-stone-400 dark:text-slate-500 truncate">
                          献立：{item.fromDishName}
                        </span>
                      )}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveShoppingItem(item.id)}
                    aria-label={`${item.name}を買い物リストから削除`}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-stone-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
