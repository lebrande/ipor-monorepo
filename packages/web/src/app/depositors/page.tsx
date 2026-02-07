import {
  fetchDepositors,
  type DepositorSearchParams,
} from '@/depositors/fetch-depositors';
import { DepositorsServer } from './depositors-server';

export const metadata = {
  title: 'Depositors - Fusion by IPOR',
};

interface PageProps {
  searchParams: Promise<DepositorSearchParams>;
}

export default async function DepositorsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  try {
    const data = await fetchDepositors(params);

    return <DepositorsServer initialData={data} searchParams={params} />;
  } catch {
    return (
      <div className="min-h-screen bg-muted">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Depositors
            </h1>
            <p className="text-muted-foreground">
              Explore depositors across IPOR Fusion vaults
            </p>
          </div>
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-muted-foreground">
              Unable to load depositor data. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }
}
