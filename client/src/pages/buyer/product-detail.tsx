import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { ArrowLeft, Plus, Star, MapPin, Truck } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface ProductDetail {
  id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
  quantity: number;
  category: string;
  image?: string;
  farmerId: number;
  farm?: {
    id: number;
    name: string;
    rating: number;
    description?: string;
    location?: string;
  };
}

export default function ProductDetail() {
  const { id } = useParams();
  const { toast } = useToast();

  const { data: product, isLoading, error } = useQuery<ProductDetail>({
    queryKey: [`/api/produce/${id}`],
    enabled: !!id,
  });

  const handleAddToCart = () => {
    if (!product) return;
    
    toast({
      title: "Added to cart",
      description: `${product.name} added to your cart`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center mb-4">
            <Skeleton className="h-6 w-6 mr-3" />
            <Skeleton className="h-6 w-32" />
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Skeleton className="w-full h-64" />
            
            <div className="p-4">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-6 w-24 mb-4" />
              
              <div className="space-y-2 mb-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-md mx-auto">
          <Link href="/" className="flex items-center text-gray-600 mb-4">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Market
          </Link>
          
          <div className="bg-red-50 text-red-800 p-4 rounded-lg">
            Product not found or failed to load
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
          {/* Product Image */}
          <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full bg-primary-50 flex items-center justify-center text-primary-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Product Details */}
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-xl font-semibold">{product.name}</h1>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {product.category}
              </span>
            </div>
            
            <div className="text-2xl font-bold text-primary-600 mb-4">
              ₦{product.price.toLocaleString()}/{product.unit}
            </div>
            
            {/* Farm Information */}
            {product.farm && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-800">{product.farm.name}</h3>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="text-sm text-gray-600">{product.farm.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                </div>
                {product.farm.location && (
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{product.farm.location}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Product Description */}
            {product.description && (
              <div className="mb-4">
                <h3 className="font-medium text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
              </div>
            )}
            
            {/* Stock Information */}
            <div className="mb-4">
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <Truck className="h-4 w-4 mr-1" />
                <span>Available: {product.quantity} {product.unit}</span>
              </div>
            </div>
            
            {/* Add to Cart Button */}
            <Button 
              onClick={handleAddToCart}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3"
              disabled={product.quantity <= 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              {product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}