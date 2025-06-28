import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Phone, Send, User, Bot, CheckCircle } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'system';
  content: string;
  timestamp: Date;
}

export default function WhatsAppDemoPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'system',
      content: 'Welcome to AgriMove! 🌾\n\nChoose your role:\n1 - I\'m a Buyer\n2 - I\'m a Farmer\n3 - I\'m a Driver',
      timestamp: new Date()
    }
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentMenu, setCurrentMenu] = useState('welcome');

  const handleSendMessage = () => {
    if (!currentInput.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      content: currentInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Process response based on current menu and input
    setTimeout(() => {
      const response = processUserInput(currentInput, currentMenu, userRole);
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        content: response.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, systemMessage]);
      setCurrentMenu(response.nextMenu);
      if (response.role) setUserRole(response.role);
    }, 1000);

    setCurrentInput('');
  };

  const processUserInput = (input: string, menu: string, role: string | null) => {
    switch (menu) {
      case 'welcome':
        if (input === '1') {
          return {
            message: 'Great! You\'re registered as a Buyer.\n\nMain Menu:\n1 - Browse Produce\n2 - My Orders\n3 - Account Info\n0 - Help',
            nextMenu: 'buyer_main',
            role: 'buyer'
          };
        } else if (input === '2') {
          return {
            message: 'Welcome Farmer! 🚜\n\nFarmer Menu:\n1 - Add Produce\n2 - View Orders\n3 - Update Prices\n4 - Farm Status\n0 - Help',
            nextMenu: 'farmer_main',
            role: 'farmer'
          };
        } else if (input === '3') {
          return {
            message: 'Welcome Driver! 🚛\n\nDriver Menu:\n1 - View Available Deliveries\n2 - My Active Deliveries\n3 - Update Location\n4 - Earnings\n0 - Help',
            nextMenu: 'driver_main',
            role: 'driver'
          };
        }
        break;

      case 'buyer_main':
        if (input === '1') {
          return {
            message: '🥬 Available Produce:\n\n1. Tomatoes - ₦500/kg (Mary\'s Farm)\n   Available: 50kg, Grade A\n\n2. Onions - ₦300/kg (David\'s Farm)\n   Available: 30kg, Fresh\n\n3. Lettuce - ₦400/kg (Mary\'s Farm)\n   Available: 20kg, Organic\n\nReply with number to order or 0 for menu',
            nextMenu: 'browse_produce'
          };
        } else if (input === '2') {
          return {
            message: '📦 Your Orders:\n\n#001 - Tomatoes 5kg - ₦2,500\nStatus: In Transit\nDelivery: Today 2PM\n\n#002 - Onions 3kg - ₦900\nStatus: Delivered ✅\n\nReply 0 for main menu',
            nextMenu: 'buyer_main'
          };
        }
        break;

      case 'browse_produce':
        if (input === '1') {
          return {
            message: '🍅 Tomatoes - ₦500/kg\nFrom: Mary\'s Farm, Lagos\nAvailable: 50kg\nQuality: Grade A\nFresh harvest today!\n\nHow many kg do you want?\nReply with number:',
            nextMenu: 'order_quantity'
          };
        }
        break;

      case 'order_quantity':
        const quantity = parseInt(input);
        if (quantity > 0) {
          const total = quantity * 500;
          return {
            message: `✅ Order Summary:\n${quantity}kg Tomatoes\nPrice: ₦${total}\nDelivery Fee: ₦200\nTotal: ₦${total + 200}\n\nConfirm order?\n1 - Yes, place order\n2 - No, go back`,
            nextMenu: 'confirm_order'
          };
        }
        break;

      case 'confirm_order':
        if (input === '1') {
          return {
            message: '🎉 Order Placed Successfully!\n\nOrder #003\nTomatoes 5kg - ₦2,700\nExpected delivery: Tomorrow 10AM\n\nYou\'ll receive delivery updates via WhatsApp.\n\nReply 0 for main menu',
            nextMenu: 'buyer_main'
          };
        }
        break;

      case 'farmer_main':
        if (input === '1') {
          return {
            message: '📝 Add New Produce:\n\nFormat: Product*Quantity*Price\nExample: Tomato*50*500\n\nEnter your produce details:',
            nextMenu: 'add_produce'
          };
        } else if (input === '2') {
          return {
            message: '📋 New Orders:\n\n#003 - 5kg Tomatoes\nBuyer: John (+234801234567)\nDelivery: Lagos, Ikeja\nAmount: ₦2,500\n\nReply:\n1 - Accept Order\n2 - Decline\n0 - Main Menu',
            nextMenu: 'farmer_orders'
          };
        }
        break;

      case 'add_produce':
        const parts = input.split('*');
        if (parts.length === 3) {
          return {
            message: `✅ Added Successfully!\n${parts[1]}kg ${parts[0]} at ₦${parts[2]}/kg\n\nYour produce is now live on AgriMove!\n\n1 - Add more produce\n2 - Main menu`,
            nextMenu: 'farmer_main'
          };
        }
        break;

      case 'driver_main':
        if (input === '1') {
          return {
            message: '🚛 Available Deliveries:\n\n#D001 - Lagos to Abuja\nDistance: 45km\nEarnings: ₦2,000\nPickup: Mary\'s Farm\n\n#D002 - Ikeja to Lekki\nDistance: 25km\nEarnings: ₦1,200\nPickup: David\'s Farm\n\nReply with delivery number to accept',
            nextMenu: 'accept_delivery'
          };
        } else if (input === '2') {
          return {
            message: '📍 Your Active Deliveries:\n\n#D001 - In Progress\nFrom: Mary\'s Farm\nTo: 123 Main St, Abuja\nStatus: Picked up ✅\nETA: 45 minutes\n\n1 - Update status\n2 - Navigation\n0 - Main menu',
            nextMenu: 'active_delivery'
          };
        }
        break;

      case 'accept_delivery':
        if (input === 'D001' || input === 'D002') {
          return {
            message: `✅ Delivery ${input} Accepted!\n\nPickup Details:\nLocation: Mary\'s Farm\nContact: +234801234567\nItems: 5kg Tomatoes\n\nStart pickup?\n1 - Yes, I\'m on my way\n2 - Cancel delivery`,
            nextMenu: 'start_delivery'
          };
        }
        break;
    }

    return {
      message: 'Sorry, I didn\'t understand that. Please try again or reply 0 for help.',
      nextMenu: menu
    };
  };

  const ussdDemo = `*123*456#

AgriMove USSD
Select:
1. Browse Produce
2. Place Order  
3. Check Orders
4. Farm Info
5. Driver Tasks

> 1

Available Produce:
1. Tomatoes ₦500/kg
2. Onions ₦300/kg
3. Lettuce ₦400/kg

> 1

Tomatoes - ₦500/kg
Mary's Farm
Available: 50kg

Enter quantity:
> 5

Order Summary:
5kg Tomatoes
Total: ₦2,700

Confirm?
1. Yes  2. No
> 1

✓ Order #003 placed
Delivery: Tomorrow 10AM
Thank you!`;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">WhatsApp & USSD Demo</h1>
        <p className="text-gray-600">See how farmers, buyers, and drivers use AgriMove offline</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp Demo */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              WhatsApp Business Chat
            </CardTitle>
            <CardDescription>
              Interactive demo - try different user flows
            </CardDescription>
            {userRole && (
              <Badge variant="secondary" className="w-fit">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>
            )}
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 bg-gray-50 p-3 rounded-lg">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[80%] ${
                    message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    <div className="flex-shrink-0">
                      {message.sender === 'user' ? (
                        <User className="h-6 w-6 text-blue-600" />
                      ) : (
                        <Bot className="h-6 w-6 text-green-600" />
                      )}
                    </div>
                    <div className={`rounded-lg p-3 ${
                      message.sender === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white border'
                    }`}>
                      <div className="whitespace-pre-line text-sm">
                        {message.content}
                      </div>
                      <div className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* USSD Demo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              USSD Session (*123*456#)
            </CardTitle>
            <CardDescription>
              Basic phone access for rural areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm whitespace-pre-line">
              {ussdDemo}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">For Buyers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Browse available produce</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Place orders via chat</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Track delivery status</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Receive updates</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">For Farmers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Add produce inventory</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Manage incoming orders</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Update prices instantly</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Check farm analytics</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">For Drivers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">View delivery jobs</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Accept/decline orders</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Update delivery status</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Track earnings</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}