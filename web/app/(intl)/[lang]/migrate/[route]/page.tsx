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
import { PREFIXED_LANGS, toLang } from '@/i18n/config';

export const dynamicParams = false;

/* См. русское дерево: в сегменте два типа страниц, слаги не пересекаются. */
export function generateStaticParams() {
  return PREFIXED_LANGS.flatMap((lang) =>
    [...migrationRouteSlugs, ...providerHubSlugs].map((route) => ({ lang, route })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; route: string }>;
}) {
  const { lang, route } = await params;
  const l = toLang(lang);
  return isProviderHubSlug(route)
    ? providerHubMetadata(l, route)
    : migrationRouteMetadata(l, route);
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; route: string }>;
}) {
  const { lang, route } = await params;
  const l = toLang(lang);
  if (isProviderHubSlug(route)) return <ProviderHubPage lang={l} slug={route} />;
  if (!isMigrationRouteSlug(route)) notFound();
  return <MigrationRoutePage lang={l} slug={route} />;
}
