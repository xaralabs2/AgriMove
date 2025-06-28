import { useLocation, Link } from 'wouter';
import { useAuth } from '@/auth/authContext';
import { 
  Home, 
  Search, 
  ShoppingBag, 
  ListOrdered, 
  User,
  Store,
  Route,
  BarChart3,
  Wallet
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

export default function BottomNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const role = user?.role || 'buyer';
  
  const cartItemsCount = 3; // This would come from a cart context/state
  
  const buyerNavItems: NavItem[] = [
    { label: 'Home', href: '/', icon: <Home className="h-6 w-6" /> },
    { label: 'Search', href: '/search', icon: <Search className="h-6 w-6" /> },
    { 
      label: 'Cart', 
      href: '/cart', 
      icon: <ShoppingBag className="h-6 w-6" />,
      badge: cartItemsCount
    },
    { label: 'Orders', href: '/orders', icon: <ListOrdered className="h-6 w-6" /> },
    { label: 'Profile', href: '/profile', icon: <User className="h-6 w-6" /> },
  ];
  
  const farmerNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: <Home className="h-6 w-6" /> },
    { label: 'Produce', href: '/farmer/produce', icon: <Store className="h-6 w-6" /> },
    { 
      label: 'Orders', 
      href: '/farmer/orders', 
      icon: <ListOrdered className="h-6 w-6" />,
      badge: 3
    },
    { label: 'Forecasts', href: '/farmer/forecasts', icon: <BarChart3 className="h-6 w-6" /> },
    { label: 'Profile', href: '/profile', icon: <User className="h-6 w-6" /> },
  ];
  
  const driverNavItems: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: <Home className="h-6 w-6" /> },
    { label: 'Orders', href: '/driver/orders', icon: <ListOrdered className="h-6 w-6" /> },
    { label: 'Routes', href: '/routes', icon: <Route className="h-6 w-6" /> },
    { label: 'Earnings', href: '/earnings', icon: <Wallet className="h-6 w-6" /> },
    { label: 'Profile', href: '/profile', icon: <User className="h-6 w-6" /> },
  ];
  
  const navItems = role === 'buyer' 
    ? buyerNavItems 
    : role === 'farmer' 
      ? farmerNavItems 
      : driverNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 max-w-md mx-auto">
      <div className="flex justify-around items-center">
        {navItems.map((item, index) => {
          const isActive = location === item.href;
          return (
            <button
              key={index}
              onClick={() => window.location.href = item.href}
              className={`flex flex-col items-center p-2 cursor-pointer ${isActive ? 'text-primary-500' : 'text-gray-500'}`}
            >
              <div className="relative">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1 -right-2 bg-primary-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
