import {
  fetchActivity,
  fetchActivityInflows,
  fetchActivityMetadata,
  type ActivitySearchParams,
} from '@/activity/fetch-activity';
import { ActivityServer } from './activity-server';

export const metadata = {
  title: 'Activity - Fusion by IPOR',
};

interface PageProps {
  searchParams: Promise<ActivitySearchParams>;
}

export default async function ActivityPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const [activityData, inflowsData, metadataData] = await Promise.all([
    fetchActivity(params),
    fetchActivityInflows(params.chains),
    fetchActivityMetadata(),
  ]);

  return (
    <ActivityServer
      initialData={activityData}
      inflows={inflowsData}
      metadata={metadataData}
      searchParams={params}
    />
  );
}
