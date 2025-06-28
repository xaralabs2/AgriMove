import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';

export default function CartPage() {
  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-100 pb-16">
      <AppHeader title="Shopping Cart" showBackButton={true} />
      
      <main className="p-4">
        <div className="bg-white rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Your Cart</h2>
          <p className="text-gray-500">Cart functionality coming soon!</p>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}