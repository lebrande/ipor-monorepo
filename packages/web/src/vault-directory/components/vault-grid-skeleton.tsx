import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';

const VaultCardSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="w-10 h-10 rounded-full ml-4" />
      </div>
    </CardHeader>

    <CardContent className="space-y-4">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-6 w-3/4" />
        </div>
        <div>
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-6 w-1/2" />
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-5 w-2/3" />
        </div>
        <div>
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-5 w-3/4" />
        </div>
      </div>
    </CardContent>

    <CardFooter className="border-t">
      <div className="flex items-center justify-between w-full">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </CardFooter>
  </Card>
);

export const VaultGridSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 20 }).map((_, index) => (
        <VaultCardSkeleton key={index} />
      ))}
    </div>
  );
};
