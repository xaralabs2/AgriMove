import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  MinusCircle, 
  PlusCircle, 
  Trash2,
  ShoppingBag,
  CreditCard
} from 'lucide-react';

interface CartItem {
  id: number;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  farm: {
    id: number;
    name: string;
  };
  image?: string;
}

export default function BuyerCartPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Cart would normally be managed in a context/state management solution
  // For this demo, we'll use localStorage
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  
  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart data', e);
      }
    }
  }, []);
  
  // Save cart changes to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);
  
  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove item if quantity is 0 or less
      setCartItems(cartItems.filter(item => item.id !== itemId));
    } else {
      setCartItems(cartItems.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };
  
  const removeItem = (itemId: number) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
    toast({
      title: "Item removed",
      description: "Item has been removed from your cart",
    });
  };
  
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const calculateDeliveryFee = () => {
    // This would be calculated based on distance, weight, etc. in a real app
    return cartItems.length > 0 ? 1000 : 0;
  };
  
  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryFee();
  };
  
  const handlePlaceOrder = async () => {
    if (!deliveryAddress) {
      toast({
        title: "Delivery address required",
        description: "Please enter your delivery address",
        variant: "destructive",
      });
      return;
    }
    
    if (cartItems.length === 0) {
      toast({
        title: "Empty cart",
        description: "Your cart is empty",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsPlacingOrder(true);
      
      const orderData = {
        order: {
          total: calculateTotal(),
          deliveryFee: calculateDeliveryFee(),
          deliveryAddress,
          paymentMethod: 'paystack',
        },
        items: cartItems.map(item => ({
          produceId: item.id,
          quantity: item.quantity
        }))
      };
      
      const response = await apiRequest('POST', '/api/orders', orderData);
      const data = await response.json();
      
      // Clear cart after successful order
      setCartItems([]);
      localStorage.removeItem('cart');
      
      toast({
        title: "Order placed successfully",
        description: `Your order #${data.id} has been placed`,
      });
      
      // Redirect to payment page or orders page
      navigate('/orders');
    } catch (error) {
      toast({
        title: "Failed to place order",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-100 pb-16">
      <AppHeader title="My Cart" showBackButton={true} />
      
      <main className="flex-1 p-4">
        {cartItems.length > 0 ? (
          <>
            <div className="mb-4 space-y-3">
              {cartItems.map(item => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm p-3 flex">
                  <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center mr-3">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="w-full h-full object-cover rounded-md" 
                      />
                    ) : (
                      <ShoppingBag className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.farm.name}</p>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-primary-600 font-medium">
                        ₦{item.price.toLocaleString()}/{item.unit}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="text-gray-500"
                        >
                          <MinusCircle className="h-6 w-6" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="text-primary-500"
                        >
                          <PlusCircle className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <h3 className="font-medium mb-3">Delivery Details</h3>
              <Textarea
                placeholder="Enter your delivery address"
                className="mb-3"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
              />
              <p className="text-sm text-gray-500 mb-2">
                Estimated delivery time: 60-90 minutes
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <h3 className="font-medium mb-3">Order Summary</h3>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>₦{calculateSubtotal().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery Fee</span>
                  <span>₦{calculateDeliveryFee().toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-medium">
                  <span>Total</span>
                  <span>₦{calculateTotal().toLocaleString()}</span>
                </div>
              </div>
              
              <Button 
                className="w-full bg-primary-500 hover:bg-primary-600"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {isPlacingOrder ? "Processing..." : "Place Order"}
              </Button>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-4">
              Add some fresh produce to get started
            </p>
            <Button 
              onClick={() => navigate('/')}
              className="bg-primary-500 hover:bg-primary-600"
            >
              Continue Shopping
            </Button>
          </div>
        )}
      </main>
      
      <BottomNavigation />
    </div>
  );
}
