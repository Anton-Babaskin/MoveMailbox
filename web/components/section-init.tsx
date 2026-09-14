'use client';

import { useEffect } from 'react';
import { initWorkspace } from '@/lib/workspace';
import { initCalculator } from '@/lib/calculator';
import { initProviderGuides } from '@/lib/guides';
import type { workspaceRuntime } from '@/content/sections/workspace-runtime';
import type { calculatorRuntime } from '@/content/sections/calculator-runtime';
import type { guidesRuntime } from '@/content/sections/guides-runtime';
import type { Lang } from '@/i18n/config';

/**
 * Запуск императивной логики секций.
 *
 * Сами секции — серверные компоненты: их разметка статична, React в ней ничего
 * не пересчитывает. Клиентским остаётся только этот крошечный запускатель, и
 * гидратации достаётся он, а не всё дерево формы на две сотни узлов.
 *
 * Словарь приходит пропом, уже выбранный по языку. Раньше клиентский компонент
 * импортировал словарь целиком, и в бандл уезжали все три языка сразу — каждый
 * посетитель скачивал тексты, которых никогда не увидит.
 */
export function WorkspaceInit({
  lang,
  strings,
  online,
}: {
  lang: Lang;
  strings: (typeof workspaceRuntime)[Lang];
  online: boolean;
}) {
  useEffect(() => {
    initWorkspace(strings, lang, online);
  }, [strings, lang, online]);
  return null;
}

export function CalculatorInit({
  lang,
  strings,
}: {
  lang: Lang;
  strings: (typeof calculatorRuntime)[Lang];
}) {
  useEffect(() => {
    initCalculator(strings, lang);
  }, [strings, lang]);
  return null;
}

export function ProviderGuidesInit({
  lang,
  strings,
}: {
  lang: Lang;
  strings: (typeof guidesRuntime)[Lang];
}) {
  useEffect(() => {
    initProviderGuides(strings, lang);
  }, [strings, lang]);
  return null;
}
