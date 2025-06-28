import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { Link } from 'wouter';

interface Produce {
  id: number;
  name: string;
  price: number;
  unit: string;
  category: string;
  farm: {
    id: number;
    name: string;
    rating: number;
  };
  image?: string;
}

interface ProduceListProps {
  category?: string;
  onAddToCart: (produce: Produce) => void;
}

export default function ProduceList({ category, onAddToCart }: ProduceListProps) {
  const [sortBy, setSortBy] = useState("nearest");
  const { toast } = useToast();
  
  const { data: allProduce, isLoading, error } = useQuery<Produce[]>({
    queryKey: ['/api/produce'],
  });

  // Filter produce by category
  const produce = allProduce?.filter((item: any) => {
    if (!category) return true;
    return item.category?.toLowerCase() === category.toLowerCase();
  }) || [];

  const handleAddToCart = (item: Produce) => {
    console.log('handleAddToCart called with item:', item);
    try {
      onAddToCart(item);
      toast({
        title: "Added to cart",
        description: `${item.name} added to your cart`,
      });
      console.log('Item successfully added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Available Produce</h2>
          <div className="text-sm flex items-center text-gray-600">
            <span className="mr-1">Sort by:</span>
            <select className="text-accent-500 bg-transparent border-none p-0 focus:outline-none focus:ring-0">
              <option>Nearest</option>
              <option>Price</option>
              <option>Rating</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow overflow-hidden flex">
              <Skeleton className="w-24 h-24" />
              <div className="p-3 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-16 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !produce) {
    return (
      <div className="bg-red-50 text-red-800 p-4 rounded-md">
        Failed to load produce
      </div>
    );
  }

  // Sort produce based on selected sorting option
  let sortedProduce = produce ? [...produce] : [];
  if (sortBy === "price") {
    sortedProduce.sort((a, b) => a.price - b.price);
  } else if (sortBy === "rating") {
    sortedProduce.sort((a, b) => b.farm.rating - a.farm.rating);
  }
  // "nearest" sorting would use geolocation in a real app

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">Available Produce</h2>
        <div className="text-sm flex items-center text-gray-600">
          <span className="mr-1">Sort by:</span>
          <select 
            className="text-accent-500 bg-transparent border-none p-0 focus:outline-none focus:ring-0"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="nearest">Nearest</option>
            <option value="price">Price</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {sortedProduce.length > 0 ? (
          sortedProduce.map((item) => (
            <Link key={item.id} href={`/product/${item.id}`}>
              <div className="bg-white rounded-lg shadow overflow-hidden flex cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="w-24 h-24 bg-gray-100 flex items-center justify-center">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full bg-primary-50 flex items-center justify-center text-primary-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-gray-500">{item.farm?.name || 'Farm Name'}</p>
                    </div>
                    <div className="text-primary-600 font-semibold">
                      ₦{item.price.toLocaleString()}/{item.unit}
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <svg 
                        className="w-3 h-3 text-yellow-400 mr-1" 
                        fill="currentColor" 
                        viewBox="0 0 20 20" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{item.farm?.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    <button 
                      className="bg-primary-500 text-white text-sm py-1 px-3 rounded-full flex items-center z-10 relative"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Button clicked!', item);
                        handleAddToCart(item);
                      }}
                      onTouchStart={(e) => {
                        console.log('Touch started on button');
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="bg-gray-50 p-4 text-center rounded-lg">
            <p className="text-gray-500">
              {category 
                ? `No ${category.toLowerCase()} available at the moment` 
                : "No produce available at the moment"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
