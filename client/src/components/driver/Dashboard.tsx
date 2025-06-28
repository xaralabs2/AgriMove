import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/auth/authContext';

export default function Dashboard() {
  const { user } = useAuth();
  
  // In a real app, we'd fetch these metrics from the backend
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/driver/dashboard'],
    queryFn: async () => {
      // For demo purposes, return mock data
      // In a real app, this would fetch from API
      return {
        availableOrders: 12,
        myDeliveries: 2,
        todayEarnings: 3500,
        rating: 4.7
      };
    }
  });
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <Skeleton className="h-7 w-40 mb-3" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-50 p-3 rounded-lg">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
      <h2 className="text-lg font-semibold mb-3">Dashboard</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-primary-50 p-3 rounded-lg">
          <div className="text-gray-600 text-sm">Available Orders</div>
          <div className="text-2xl font-semibold text-primary-600">
            {dashboardData?.availableOrders || 0}
          </div>
        </div>
        <div className="bg-secondary-100 p-3 rounded-lg">
          <div className="text-gray-600 text-sm">My Deliveries</div>
          <div className="text-2xl font-semibold text-secondary-600">
            {dashboardData?.myDeliveries || 0}
          </div>
        </div>
        <div className="bg-accent-50 p-3 rounded-lg">
          <div className="text-gray-600 text-sm">Today's Earnings</div>
          <div className="text-2xl font-semibold text-accent-600">
            ₦{(dashboardData?.todayEarnings || 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-gray-600 text-sm">Rating</div>
          <div className="text-2xl font-semibold text-gray-600 flex items-center">
            {dashboardData?.rating || 0}
            <svg 
              className="w-5 h-5 text-yellow-400 ml-1" 
              fill="currentColor" 
              viewBox="0 0 20 20" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
