import { notFound } from 'next/navigation';
import {
  MigrationRoutePage,
  migrationRouteMetadata,
} from '@/components/migration-route-page';
import { isMigrationRouteSlug, migrationRouteSlugs } from '@/data/migration-routes';

export const dynamicParams = false;

export function generateStaticParams() {
  return migrationRouteSlugs.map((route) => ({ route }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ route: string }>;
}) {
  const { route } = await params;
  return migrationRouteMetadata('ru', route);
}

export default async function Page({
  params,
}: {
  params: Promise<{ route: string }>;
}) {
  const { route } = await params;
  if (!isMigrationRouteSlug(route)) notFound();
  return <MigrationRoutePage lang="ru" slug={route} />;
}
