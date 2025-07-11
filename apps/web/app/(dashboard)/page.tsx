// FILE: apps/web/app/(dashboard)/page.tsx
// This is the Server Component for the Overview page.

import { Suspense } from 'react';
import { getClient } from '@/lib/apollo-rsc';
import { GET_OVERVIEW_DATA } from '@/lib/graphql/queries';
import { OverviewView } from '@/components/views/overview/OverviewView';
import { OverviewSkeleton } from '@/components/views/overview/OverviewSkeleton';

export default async function OverviewPage() {
  const client = getClient();

  const { data, error } = await client.query({
    query: GET_OVERVIEW_DATA,
    fetchPolicy: 'no-cache',
  });

  if (error) {
    return <p className="p-8 text-red-500">Error: {error.message}</p>;
  }

  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <OverviewView initialData={data} />
    </Suspense>
  );
}