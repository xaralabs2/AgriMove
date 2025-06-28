import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';

interface Farm {
  id: number;
  name: string;
  rating: number;
  image: string;
  distance?: string; // This would come from geolocation in a real app
}

export default function FeaturedFarms() {
  const { data: farms, isLoading, error } = useQuery<Farm[]>({
    queryKey: ['/api/farms/featured'],
  });

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Featured Farms</h2>
          <span className="text-accent-500 text-sm">See All</span>
        </div>
        <div className="overflow-x-auto">
          <div className="flex space-x-4 pb-2">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="min-w-[150px] bg-white rounded-lg shadow overflow-hidden">
                <Skeleton className="h-20 w-full" />
                <div className="p-2">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !farms) {
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Featured Farms</h2>
        </div>
        <div className="bg-red-50 text-red-800 p-2 rounded-md text-sm">
          Failed to load farms
        </div>
      </div>
    );
  }

  // Add mock distances since we don't have real geolocation
  const farmData = farms.map((farm, index) => ({
    ...farm,
    distance: `${(index + 2.5).toFixed(1)} km`
  }));

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Featured Farms</h2>
        <a href="#" className="text-accent-500 text-sm">See All</a>
      </div>
      <div className="overflow-x-auto">
        <div className="flex space-x-4 pb-2">
          {farmData.map((farm) => (
            <Link key={farm.id} href={`/farm/${farm.id}`}>
              <div className="min-w-[150px] bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="h-20 bg-gray-100 flex items-center justify-center">
                  {farm.image ? (
                    <img 
                      src={farm.image} 
                      alt={farm.name} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-100 flex items-center justify-center text-primary-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <h3 className="font-medium text-sm">{farm.name}</h3>
                  <div className="flex items-center text-xs text-gray-500">
                    <svg 
                      className="w-3 h-3 text-yellow-400 mr-1" 
                      fill="currentColor" 
                      viewBox="0 0 20 20" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{farm.rating.toFixed(1)}</span>
                    <span className="mx-1">•</span>
                    <span>{farm.distance}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
