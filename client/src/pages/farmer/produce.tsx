import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import ProduceItem from '@/components/farmer/ProduceItem';
import ProduceForm from '@/components/farmer/ProduceForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, FilterX } from 'lucide-react';

export default function FarmerProducePage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  
  // Fetch farmer's produce
  const { data: produce, isLoading, error } = useQuery({
    queryKey: ['/api/produce'],
    queryFn: async () => {
      // In a real app, fetch only the farmer's produce with filter
      const allProduce = await fetch('/api/produce').then(res => res.json());
      // Filter by current farmer ID (would use authentication user ID)
      return allProduce;
    },
  });
  
  const categories = produce 
    ? [...new Set(produce.map(p => p.category))]
    : [];
  
  // Filter by search term and category
  const filteredProduce = produce?.filter(p => {
    const matchesSearch = !searchTerm || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filter || p.category === filter;
    return matchesSearch && matchesCategory;
  });
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilter(null);
  };
  
  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-100 pb-16">
      <AppHeader title="My Produce" showBackButton={true} />
      
      <main className="flex-1 p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">My Produce</h1>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-primary-500 hover:bg-primary-600"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add New
          </Button>
        </div>
        
        <div className="flex space-x-2 mb-4">
          <div className="relative flex-1">
            <Input 
              type="text" 
              placeholder="Search produce..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          </div>
          
          {(searchTerm || filter) && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleClearFilters}
              title="Clear filters"
            >
              <FilterX className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {categories.length > 0 && (
          <div className="flex overflow-x-auto space-x-2 mb-4 pb-1">
            {categories.map(category => (
              <Button
                key={category}
                variant={filter === category ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filter === category ? null : category)}
                className={filter === category ? "bg-primary-500" : ""}
              >
                {category}
              </Button>
            ))}
          </div>
        )}
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="flex p-3 border-b border-gray-100">
                  <Skeleton className="w-16 h-16 rounded-md mr-3" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-4 w-24 mt-1" />
                    <Skeleton className="h-4 w-32 mt-1" />
                  </div>
                </div>
                <div className="p-2 bg-gray-50">
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-800 p-4 rounded-lg">
            Failed to load produce
          </div>
        ) : filteredProduce?.length ? (
          <div className="space-y-3">
            {filteredProduce.map((item) => (
              <ProduceItem key={item.id} produce={item} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            {searchTerm || filter ? (
              <>
                <h3 className="text-xl font-medium mb-2">No matches found</h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your search or filters
                </p>
                <Button onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-medium mb-2">No produce listed yet</h3>
                <p className="text-gray-500 mb-4">
                  Add your first product to start selling
                </p>
                <Button 
                  onClick={() => setShowAddForm(true)}
                  className="bg-primary-500 hover:bg-primary-600"
                >
                  Add New Produce
                </Button>
              </>
            )}
          </div>
        )}
      </main>
      
      <ProduceForm
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
      />
      
      <BottomNavigation />
    </div>
  );
}
