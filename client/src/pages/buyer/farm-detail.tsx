import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { ArrowLeft, Star, MapPin, Phone, Package } from 'lucide-react';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface FarmDetail {
  id: number;
  name: string;
  description: string;
  address: string;
  image?: string;
  rating: number;
  farmerId: number;
  farmer?: {
    id: number;
    name: string;
  };
  produce?: Array<{
    id: number;
    name: string;
    price: number;
    unit: string;
    category: string;
    image?: string;
    quantity: number;
  }>;
}

export default function FarmDetail() {
  const { id } = useParams();

  const { data: farm, isLoading, error } = useQuery<FarmDetail>({
    queryKey: [`/api/farms/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-4">
            <Skeleton className="h-6 w-6 mr-3" />
            <Skeleton className="h-6 w-32" />
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Skeleton className="w-full h-48" />
            
            <div className="p-4">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-4" />
              
              <div className="space-y-2 mb-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              
              <Skeleton className="h-6 w-32 mb-4" />
              
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex">
                    <Skeleton className="w-16 h-16 mr-3" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !farm) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <Link href="/" className="flex items-center text-gray-600 mb-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Market
          </Link>
          
          <div className="bg-red-50 text-red-800 p-4 rounded-lg">
            Farm not found or failed to load
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <Link href="/" className="flex items-center text-gray-600 mb-4">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Market
        </Link>
        
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Farm Image */}
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            {farm.image ? (
              <img 
                src={farm.image} 
                alt={farm.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-primary-50 flex items-center justify-center text-primary-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Farm Details */}
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-xl font-semibold">{farm.name}</h1>
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                <span className="text-sm text-gray-600">{farm.rating?.toFixed(1) || '0.0'}</span>
              </div>
            </div>
            
            {/* Farmer Information */}
            {farm.farmer && (
              <div className="text-sm text-gray-600 mb-3">
                Owned by {farm.farmer.name}
              </div>
            )}
            
            {/* Farm Address */}
            {farm.address && (
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{farm.address}</span>
              </div>
            )}
            
            {/* Farm Description */}
            {farm.description && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-800 mb-2">About this farm</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{farm.description}</p>
              </div>
            )}
            
            {/* Available Produce */}
            {farm.produce && farm.produce.length > 0 && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Available Produce ({farm.produce.length} items)
                </h3>
                <div className="space-y-3">
                  {farm.produce.map((item) => (
                    <Link key={item.id} href={`/product/${item.id}`}>
                      <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg mr-3 flex items-center justify-center">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-full h-full object-cover rounded-lg" 
                            />
                          ) : (
                            <div className="w-full h-full bg-primary-50 flex items-center justify-center text-primary-500 rounded-lg">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800">{item.name}</h4>
                          <p className="text-primary-600 font-semibold">
                            ₦{item.price.toLocaleString()}/{item.unit}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} {item.unit} available
                          </p>
                        </div>
                        <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {item.category}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}