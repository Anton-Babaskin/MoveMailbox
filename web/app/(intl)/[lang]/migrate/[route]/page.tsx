import { notFound } from 'next/navigation';
import {
  MigrationRoutePage,
  migrationRouteMetadata,
} from '@/components/migration-route-page';
import { isMigrationRouteSlug, migrationRouteSlugs } from '@/data/migration-routes';
import { PREFIXED_LANGS, toLang } from '@/i18n/config';

export const dynamicParams = false;

export function generateStaticParams() {
  return PREFIXED_LANGS.flatMap((lang) =>
    migrationRouteSlugs.map((route) => ({ lang, route })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; route: string }>;
}) {
  const { lang, route } = await params;
  const l = toLang(lang);
  return migrationRouteMetadata(l, route);
}

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string; route: string }>;
}) {
  const { lang, route } = await params;
  const l = toLang(lang);
  if (!isMigrationRouteSlug(route)) notFound();
  return <MigrationRoutePage lang={l} slug={route} />;
}
