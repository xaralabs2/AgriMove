import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/authContext';
import { useLocation } from 'wouter';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import RoleSelector from '@/components/ui/role-selector';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import LocationPicker from '@/components/LocationPicker';
import NearbyUsers from '@/components/NearbyUsers';
import { UserLocation } from '@/utils/locationService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Buyer components
import CategorySelector from '@/components/buyer/CategorySelector';
import FeaturedFarms from '@/components/buyer/FeaturedFarms';
import ProduceList from '@/components/buyer/ProduceList';
import AIRecommendations from '@/components/buyer/AIRecommendations';

// Farmer components
import Dashboard from '@/components/farmer/Dashboard';
import ProduceItem from '@/components/farmer/ProduceItem';
import ProduceForm from '@/components/farmer/ProduceForm';
import OrderItem from '@/components/farmer/OrderItem';

// Driver components
import DriverDashboard from '@/components/driver/Dashboard';
import SimpleMapView from '@/components/driver/SimpleMapView';
import DriverOrderItem from '@/components/driver/OrderItem';

import { useQuery } from '@tanstack/react-query';
import { MapPin, Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddProduceForm, setShowAddProduceForm] = useState(false);
  const [location, setLocation] = useState('Ikeja, Lagos');
  const role = user?.role || 'buyer';
  
  // Cart state
  const [cart, setCart] = useState<any[]>([]);
  
  // Redirect authenticated users to appropriate page based on role
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'buyer') {
        // Stay on home page
      } else if (user?.role === 'farmer') {
        // Stay on home page (dashboard)
      } else if (user?.role === 'driver') {
        // Stay on home page (driver dashboard)
      }
    }
  }, [isAuthenticated, user, navigate]);
  
  // Fetch produce for buyer
  const { data: produce } = useQuery({
    queryKey: ['/api/produce', selectedCategory],
    enabled: role === 'buyer',
  });
  
  // Fetch farmer's produce
  const { data: farmerProduce } = useQuery({
    queryKey: ['/api/produce'],
    queryFn: async () => {
      // In a real app, fetch only the farmer's produce with filter
      const allProduce = await fetch('/api/produce').then(res => res.json());
      // Filter by current farmer ID
      return allProduce.filter((p: any) => p.farmerId === user?.id);
    },
    enabled: role === 'farmer',
  });
  
  // Fetch orders for farmer
  const { data: farmerOrders } = useQuery({
    queryKey: ['/api/orders'],
    enabled: role === 'farmer',
  });
  
  // Fetch deliveries for driver
  const { data: driverDeliveries } = useQuery({
    queryKey: ['/api/deliveries'],
    enabled: role === 'driver',
  });
  
  // Fetch available orders for driver
  const { data: availableOrders } = useQuery({
    queryKey: ['/api/available-orders'],
    enabled: role === 'driver',
  });
  
  // Fetch transporter's current deliveries
  const { data: transporterDeliveries } = useQuery({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      // In a real app, fetch the transporter's assigned orders
      return fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }).then(res => res.json());
    },
    enabled: role === 'driver',
  });
  
  const handleAddToCart = (item: any) => {
    // Check if item already in cart
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingItemIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    
    toast({
      title: "Added to cart",
      description: `${item.name} added to your cart`,
    });
  };
  
  const handleCategorySelect = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(undefined); // Toggle off if already selected
    } else {
      setSelectedCategory(category);
    }
  };
  
  // Filter products by search term and category
  const filteredProduce = Array.isArray(produce) 
    ? produce.filter((p: any) => {
        // First filter by search term
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.farm?.name && p.farm.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Then filter by category if one is selected
        const matchesCategory = !selectedCategory || 
          p.category.toLowerCase() === selectedCategory.toLowerCase();
        
        return matchesSearch && matchesCategory;
      })
    : [];

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-100 pb-16">
      <AppHeader />
      
      {!isAuthenticated && <RoleSelector />}
      
      <main className="flex-1 overflow-y-auto pb-16">
        {/* Buyer View */}
        {role === 'buyer' && (
          <div className="p-4">
            {/* Location Detection */}
            <div className="mb-4">
              <LocationPicker 
                className="mb-4"
                onLocationUpdate={(location) => {
                  // Update user location via API
                  console.log('Location updated:', location);
                }}
              />
            </div>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Input 
                type="text" 
                placeholder="Search for fruits, vegetables..." 
                className="w-full p-3 pl-10 bg-white rounded-lg shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            </div>

            {/* Category Selector */}
            <CategorySelector 
              onSelectCategory={handleCategorySelect} 
              selectedCategory={selectedCategory}
            />

            {/* AI Recommendations */}
            <AIRecommendations />

            {/* Featured Farms */}
            <FeaturedFarms />

            {/* Available Produce */}
            <ProduceList 
              category={selectedCategory} 
              onAddToCart={handleAddToCart} 
            />
          </div>
        )}
        
        {/* Farmer View */}
        {role === 'farmer' && (
          <div className="p-4">
            {/* Location Detection for Farmers */}
            <div className="mb-4">
              <LocationPicker 
                className="mb-4"
                onLocationUpdate={(location) => {
                  // Update farmer location via API
                  console.log('Farmer location updated:', location);
                }}
              />
            </div>
            
            {/* Farmer Dashboard Summary */}
            <Dashboard />
            
            {/* My Produce Section */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold">My Produce</h2>
                <Button 
                  onClick={() => setShowAddProduceForm(true)}
                  className="bg-primary-500 hover:bg-primary-600"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add New
                </Button>
              </div>
              
              {/* Produce List */}
              <div className="space-y-3">
                {Array.isArray(farmerProduce) && farmerProduce.map((produce: any) => (
                  <ProduceItem key={produce.id} produce={produce} />
                ))}
                
                {(!farmerProduce || !Array.isArray(farmerProduce) || farmerProduce.length === 0) && (
                  <div className="bg-gray-50 p-4 text-center rounded-lg">
                    <p className="text-gray-500">
                      You don't have any produce listed yet.
                    </p>
                    <Button 
                      onClick={() => setShowAddProduceForm(true)}
                      className="mt-2 bg-primary-500 hover:bg-primary-600"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Your First Produce
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Pending Orders Section */}
            <div>
              <h2 className="text-lg font-semibold mb-3">Pending Orders</h2>
              
              {/* Orders List */}
              <div className="space-y-3">
                {Array.isArray(farmerOrders) && farmerOrders
                  .filter((order: any) => order.status === 'pending')
                  .map((order: any) => (
                    <OrderItem key={order.id} order={order} />
                  ))
                }
                
                {(!farmerOrders || !Array.isArray(farmerOrders) || 
                  !farmerOrders.filter((order: any) => order.status === 'pending').length) && (
                  <div className="bg-gray-50 p-4 text-center rounded-lg">
                    <p className="text-gray-500">
                      No pending orders at the moment.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Add Produce Form */}
            <ProduceForm
              open={showAddProduceForm}
              onClose={() => setShowAddProduceForm(false)}
            />
          </div>
        )}
        
        {/* Driver View */}
        {role === 'driver' && (
          <div className="p-4">
            {/* Location Detection for Transporters */}
            <div className="mb-4">
              <LocationPicker 
                className="mb-4"
                onLocationUpdate={(location) => {
                  // Update transporter location via API
                  console.log('Transporter location updated:', location);
                }}
              />
            </div>
            
            {/* Transporter Dashboard Summary */}
            <DriverDashboard />
            
            {/* Map View Preview */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <h2 className="text-lg font-semibold mb-2">Delivery Map</h2>
              
              {Array.isArray(driverDeliveries) && driverDeliveries.some((d: any) => d.status === 'in_transit') ? (
                <SimpleMapView 
                  delivery={{
                    id: driverDeliveries.find((d: any) => d.status === 'in_transit')?.id || 0,
                    pickupLocation: "Multiple pickup locations",
                    deliveryLocation: driverDeliveries.find((d: any) => d.status === 'in_transit')?.deliveryAddress || ""
                  }}
                />
              ) : (
                <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-gray-600 text-center">
                    <MapPin className="h-8 w-8 mx-auto mb-2 text-primary-400" />
                    <div>No active deliveries</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Available Orders Section */}
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-3">Available Orders</h2>
              
              {/* Orders List */}
              <div className="space-y-3">
                {Array.isArray(availableOrders) && availableOrders.map((order: any) => (
                  <DriverOrderItem key={order.id} order={order} />
                ))}
                
                {(!availableOrders || !Array.isArray(availableOrders) || availableOrders.length === 0) && (
                  <div className="bg-gray-50 p-4 text-center rounded-lg">
                    <p className="text-gray-500">
                      No available orders at the moment.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Current Deliveries */}
            <div>
              <h2 className="text-lg font-semibold mb-3">My Current Deliveries</h2>
              
              <div className="space-y-3">
                {Array.isArray(driverDeliveries) && driverDeliveries
                  .filter((delivery: any) => delivery.status === 'in_transit')
                  .map((delivery: any) => (
                    <DriverOrderItem 
                      key={delivery.id} 
                      order={delivery} 
                      inProgress={true} 
                    />
                  ))}
                
                {(!driverDeliveries || !Array.isArray(driverDeliveries) || 
                  !driverDeliveries.filter((d: any) => d.status === 'in_transit').length) && (
                  <div className="bg-gray-50 p-4 text-center rounded-lg">
                    <p className="text-gray-500">
                      You don't have any active deliveries.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
      
      <BottomNavigation />
    </div>
  );
}
