'use client';

import React, { useState } from 'react';
import {
  Ban,
  CalendarClock,
  Youtube,
  Moon,
  Sun,
  Smartphone,
  Monitor,
  Plus,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';
import { UserSettings } from '@/lib/types';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsTabProps {
  settings: UserSettings;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onResetAllData: () => void;
}

const COMMON_DISLIKED_PRESETS = [
  'トマト',
  'なす',
  'ピーマン',
  'きのこ',
  'しめじ',
  'えのき',
  'サバ',
  'むきエビ',
  'キムチ',
  '豆板醤',
  '牛乳',
  'チーズ',
];

export function SettingsTab({
  settings,
  onUpdateSettings,
  onResetAllData,
}: SettingsTabProps) {
  const [customDisliked, setCustomDisliked] = useState('');
  const [apiKeyDraft, setApiKeyDraft] = useState(settings.youtubeApiKey);
  const [apiSaved, setApiSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const toggleDisliked = (item: string) => {
    const exists = settings.dislikedIngredients.includes(item);
    const next = exists
      ? settings.dislikedIngredients.filter((i) => i !== item)
      : [...settings.dislikedIngredients, item];
    onUpdateSettings({ dislikedIngredients: next });
  };

  const handleAddDislikedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customDisliked.trim();
    if (!trimmed) return;
    if (!settings.dislikedIngredients.includes(trimmed)) {
      onUpdateSettings({
        dislikedIngredients: [...settings.dislikedIngredients, trimmed],
      });
    }
    setCustomDisliked('');
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({ youtubeApiKey: apiKeyDraft.trim() });
    setApiSaved(true);
    setTimeout(() => setApiSaved(false), 2500);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Appearance & PWA Card */}
      <section
        aria-label="外観・アプリ設定"
        className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-stone-200/80 dark:border-slate-800 space-y-4"
      >
        <h2 className="text-base font-bold text-stone-900 dark:text-white">
          表示モード＆スマホアプリ化（PWA）
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={() => onUpdateSettings({ darkMode: !settings.darkMode })}
            className="min-h-[48px] px-4 py-3 rounded-2xl bg-stone-50 dark:bg-slate-800/80 hover:bg-stone-100 dark:hover:bg-slate-800 flex items-center justify-between text-left transition"
          >
            <div className="flex items-center gap-2.5">
              {settings.darkMode ? (
                <Moon className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <Sun className="w-5 h-5 text-orange-600 shrink-0" />
              )}
              <div>
                <span className="block text-xs font-bold text-stone-900 dark:text-white">
                  カラーテーマ
                </span>
                <span className="block text-[11px] text-stone-500 dark:text-slate-400">
                  現在：{settings.darkMode ? 'ダークモード' : 'ライトモード'}
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
              切替
            </span>
          </button>

          {/* Desktop Frame Toggle */}
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ desktopPhoneFrame: !settings.desktopPhoneFrame })
            }
            className="min-h-[48px] px-4 py-3 rounded-2xl bg-stone-50 dark:bg-slate-800/80 hover:bg-stone-100 dark:hover:bg-slate-800 flex items-center justify-between text-left transition"
          >
            <div className="flex items-center gap-2.5">
              {settings.desktopPhoneFrame ? (
                <Smartphone className="w-5 h-5 text-orange-600 shrink-0" />
              ) : (
                <Monitor className="w-5 h-5 text-orange-600 shrink-0" />
              )}
              <div>
                <span className="block text-xs font-bold text-stone-900 dark:text-white">
                  PC表示レイアウト
                </span>
                <span className="block text-[11px] text-stone-500 dark:text-slate-400">
                  {settings.desktopPhoneFrame
                    ? 'スマホフレーム中央表示'
                    : '2カラム・ワイド表示'}
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
              切替
            </span>
          </button>
        </div>

        <div className="rounded-2xl bg-stone-50 dark:bg-slate-800/60 p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-stone-900 dark:text-white">
              ホーム画面にアプリとして追加
            </p>
            <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5">
              ブラウザの枠なしでネイティブアプリのように起動できます
            </p>
          </div>
          <PWAInstallButton />
        </div>
      </section>

      {/* Cooldown Days Setting */}
      <section
        aria-label="クールダウン日数の設定"
        className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-stone-200/80 dark:border-slate-800 space-y-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-orange-600 shrink-0" />
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white">
                献立クールダウン除外日数
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                一度「決定」した料理を何日間ガチャ候補から除外するか設定します
              </p>
            </div>
          </div>
          <span className="text-lg font-bold text-orange-600 dark:text-orange-400 tabular-nums shrink-0">
            {settings.cooldownDays}日間
          </span>
        </div>

        <div className="space-y-2">
          <label htmlFor="cooldown-range" className="sr-only">
            クールダウン日数スライダー
          </label>
          <input
            id="cooldown-range"
            type="range"
            min={0}
            max={14}
            step={1}
            value={settings.cooldownDays}
            onChange={(e) =>
              onUpdateSettings({ cooldownDays: Number(e.target.value) })
            }
            className="w-full accent-orange-600 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-stone-400 tabular-nums">
            <span>0日（除外なし）</span>
            <span>3日</span>
            <span>7日（推奨）</span>
            <span>10日</span>
            <span>14日</span>
          </div>
        </div>
      </section>

      {/* Disliked / Excluded Ingredients Setting */}
      <section
        aria-label="除外したい苦手食材の設定"
        className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-stone-200/80 dark:border-slate-800 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Ban className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-white">
              除外したい苦手・アレルギー食材
            </h2>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
              選択した食材を含むメニューはスマート提案ガチャから自動的に除外されます
            </p>
          </div>
        </div>

        {settings.dislikedIngredients.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {settings.dislikedIngredients.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => toggleDisliked(item)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <span>除外中：{item}</span>
                <X className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleAddDislikedSubmit} className="flex gap-2">
          <label htmlFor="disliked-input" className="sr-only">
            除外したい食材を追加
          </label>
          <input
            id="disliked-input"
            type="text"
            value={customDisliked}
            onChange={(e) => setCustomDisliked(e.target.value)}
            placeholder="苦手食材を入力して除外（例：パクチー、セロリ）"
            className="flex-1 min-h-[44px] rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 px-3.5 text-sm text-stone-900 dark:text-white"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 rounded-xl bg-stone-900 dark:bg-rose-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>除外登録</span>
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {COMMON_DISLIKED_PRESETS.map((item) => {
            const active = settings.dislikedIngredients.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => toggleDisliked(item)}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  active
                    ? 'bg-rose-600 text-white'
                    : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:bg-stone-200/70'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
      </section>

      {/* Optional YouTube Data API v3 Key Setting */}
      <section
        aria-label="YouTube Data API連携モード設定"
        className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-stone-200/80 dark:border-slate-800 space-y-4"
      >
        <div className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-white">
              YouTube Data API キー設定（任意オプション）
            </h2>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
              未設定でもワンタップ検索リンクで全機能が使えます。キーを設定すると料理詳細画面で再生数トップ3の動画をアプリ内プレーヤーで直接再生できます。
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveApiKey} className="flex gap-2">
          <label htmlFor="youtube-api-key-input" className="sr-only">
            YouTube Data API v3 キー
          </label>
          <input
            id="youtube-api-key-input"
            type="password"
            value={apiKeyDraft}
            onChange={(e) => setApiKeyDraft(e.target.value)}
            placeholder="AIzaSy...（任意・端末のLocalStorageにのみ保存）"
            className="flex-1 min-h-[44px] rounded-xl border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 px-3.5 text-sm text-stone-900 dark:text-white font-mono"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition"
          >
            {apiSaved ? <Check className="w-4 h-4" /> : null}
            <span>{apiSaved ? '保存済み' : '保存'}</span>
          </button>
        </form>
      </section>

      {/* Data Reset */}
      <section
        aria-label="データ初期化"
        className="rounded-3xl bg-white dark:bg-slate-900 p-5 shadow-sm border border-stone-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
      >
        <div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-white">
            アプリデータの初期化
          </h3>
          <p className="text-xs text-stone-500 dark:text-slate-400">
            履歴・冷蔵庫・買い物リスト・設定を初期状態に戻します
          </p>
        </div>

        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 hover:text-rose-600 text-xs font-semibold inline-flex items-center gap-1.5 transition shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>データ初期化</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onResetAllData();
                setConfirmReset(false);
              }}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold"
            >
              本当に初期化する
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-slate-800 text-xs font-semibold"
            >
              キャンセル
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
