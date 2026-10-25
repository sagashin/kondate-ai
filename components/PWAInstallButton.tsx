'use client';

import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function PWAInstallButton({ compact = false }: { compact?: boolean }) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {isInstallable ? (
        <button
          type="button"
          onClick={install}
          aria-label="アプリをホーム画面にインストール"
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 text-white font-semibold shadow-sm hover:bg-orange-700 active:scale-[0.98] transition whitespace-nowrap shrink-0 ${
            compact ? 'px-3 py-2 text-xs min-h-[40px]' : 'px-4 py-2.5 text-sm min-h-[44px]'
          }`}
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>{compact ? 'アプリ追加' : 'ホーム画面に追加'}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          aria-label="ホーム画面への追加方法を表示"
          className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-orange-200 dark:border-slate-700 bg-orange-50/80 dark:bg-slate-800 text-orange-800 dark:text-orange-300 font-medium hover:bg-orange-100 dark:hover:bg-slate-700 active:scale-[0.98] transition whitespace-nowrap shrink-0 ${
            compact ? 'px-3 py-2 text-xs min-h-[40px]' : 'px-4 py-2.5 text-sm min-h-[44px]'
          }`}
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span>{compact ? 'PWA案内' : 'スマホアプリ化'}</span>
        </button>
      )}

      {showGuide && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="pwa-guide-title" className="text-base font-bold text-slate-900 dark:text-white">
                    ホーム画面に追加（PWA）
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ネイティブアプリのように全画面で使えます
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="案内を閉じる"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-3.5">
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Share className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>iPhone / iPad (Safari) の場合</span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  画面下部の「共有」アイコンをタップし、メニューから「ホーム画面に追加」を選択してください。
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-3.5">
                <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <PlusSquare className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>Android (Chrome) / PC の場合</span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  ブラウザ右上のメニュー（︙）またはアドレスバーのインストールアイコンから「アプリをインストール」を選択してください。
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-slate-900 dark:bg-orange-600 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  );
}
