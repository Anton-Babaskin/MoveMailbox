import { notFound } from 'next/navigation';
import {
  MigrationRoutePage,
  migrationRouteMetadata,
} from '@/components/migration-route-page';
import { isMigrationRouteSlug, migrationRouteSlugs } from '@/data/migration-routes';
import {
  ProviderHubPage,
  providerHubMetadata,
} from '@/components/provider-hub-page';
import { isProviderHubSlug, providerHubSlugs } from '@/data/provider-hubs';

export const dynamicParams = false;

/* Под /migrate/ живут два типа страниц: маршруты A → B (gmail-to-outlook) и
   страницы одного провайдера (gmail). Слаги не пересекаются — маршрут всегда
   с «-to-», — поэтому сегмент общий, а компонент выбирается по слагу. */
export function generateStaticParams() {
  return [...migrationRouteSlugs, ...providerHubSlugs].map((route) => ({ route }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ route: string }>;
}) {
  const { route } = await params;
  return isProviderHubSlug(route)
    ? providerHubMetadata('ru', route)
    : migrationRouteMetadata('ru', route);
}

export default async function Page({
  params,
}: {
  params: Promise<{ route: string }>;
}) {
  const { route } = await params;
  if (isProviderHubSlug(route)) return <ProviderHubPage lang="ru" slug={route} />;
  if (!isMigrationRouteSlug(route)) notFound();
  return <MigrationRoutePage lang="ru" slug={route} />;
}
