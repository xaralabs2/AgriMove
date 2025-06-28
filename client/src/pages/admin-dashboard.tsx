import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Phone, 
  Users, 
  TrendingUp, 
  Settings, 
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';

interface MessagingStats {
  whatsappSessions: number;
  ussdSessions: number;
  totalMessages: number;
  activeUsers: number;
  completedOrders: number;
  errorRate: number;
}

interface UserSession {
  id: string;
  phoneNumber: string;
  channel: 'whatsapp' | 'ussd';
  role: 'farmer' | 'buyer' | 'driver';
  currentMenu: string;
  lastActivity: Date;
  status: 'active' | 'idle' | 'completed';
}

export default function AdminDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  // Mock data - replace with real API calls
  const stats: MessagingStats = {
    whatsappSessions: 247,
    ussdSessions: 156,
    totalMessages: 1834,
    activeUsers: 89,
    completedOrders: 45,
    errorRate: 2.3
  };

  const activeSessions: UserSession[] = [
    {
      id: '1',
      phoneNumber: '+234801234567',
      channel: 'whatsapp',
      role: 'buyer',
      currentMenu: 'browse_produce',
      lastActivity: new Date(Date.now() - 5 * 60 * 1000),
      status: 'active'
    },
    {
      id: '2',
      phoneNumber: '+234802345678',
      channel: 'ussd',
      role: 'farmer',
      currentMenu: 'add_produce',
      lastActivity: new Date(Date.now() - 2 * 60 * 1000),
      status: 'active'
    },
    {
      id: '3',
      phoneNumber: '+234803456789',
      channel: 'whatsapp',
      role: 'driver',
      currentMenu: 'accept_delivery',
      lastActivity: new Date(Date.now() - 15 * 60 * 1000),
      status: 'idle'
    }
  ];

  const recentOrders = [
    { id: 'ORD001', channel: 'whatsapp', user: '+234801234567', amount: 2500, status: 'completed' },
    { id: 'ORD002', channel: 'ussd', user: '+234802345678', amount: 1800, status: 'pending' },
    { id: 'ORD003', channel: 'whatsapp', user: '+234803456789', amount: 3200, status: 'completed' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp & USSD Admin</h1>
          <p className="text-gray-600">Monitor and manage offline access channels</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Export Data
          </Button>
          <Button size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">WhatsApp Sessions</p>
                <p className="text-2xl font-bold">{stats.whatsappSessions}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+12% from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">USSD Sessions</p>
                <p className="text-2xl font-bold">{stats.ussdSessions}</p>
              </div>
              <Phone className="h-8 w-8 text-blue-600" />
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">+8% from yesterday</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex items-center mt-2">
              <Clock className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-sm text-gray-500">Currently online</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Orders Today</p>
                <p className="text-2xl font-bold">{stats.completedOrders}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
            <div className="flex items-center mt-2">
              <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600">95% completion rate</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="orders">Recent Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active User Sessions</CardTitle>
              <CardDescription>
                Monitor real-time user activity across WhatsApp and USSD
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {session.channel === 'whatsapp' ? (
                          <MessageCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Phone className="h-5 w-5 text-blue-600" />
                        )}
                        <span className="font-medium">{session.phoneNumber}</span>
                      </div>
                      <Badge variant="secondary">{session.role}</Badge>
                      <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{session.currentMenu}</p>
                      <p className="text-xs text-gray-500">
                        Last activity: {session.lastActivity.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orders via Offline Channels</CardTitle>
              <CardDescription>
                Track orders placed through WhatsApp and USSD
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {order.channel === 'whatsapp' ? (
                          <MessageCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Phone className="h-5 w-5 text-blue-600" />
                        )}
                        <span className="font-medium">{order.id}</span>
                      </div>
                      <span className="text-sm text-gray-600">{order.user}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="font-medium">₦{order.amount}</span>
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>WhatsApp Completion Rate</span>
                    <span className="font-medium">94%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>USSD Completion Rate</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Farmers</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Buyers</span>
                    <span className="font-medium">35%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Drivers</span>
                    <span className="font-medium">20%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Twilio Configuration</CardTitle>
                <CardDescription>WhatsApp Business API settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Account Status</span>
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Messages Remaining</span>
                  <span>8,456</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Webhook Status</span>
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                <Button variant="outline" className="w-full">
                  Test Connection
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>USSD Configuration</CardTitle>
                <CardDescription>USSD service provider settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>USSD Code</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">*123*456#</code>
                </div>
                <div className="flex items-center justify-between">
                  <span>Provider Status</span>
                  <Badge variant="secondary">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Demo Mode
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Session Timeout</span>
                  <span>90 seconds</span>
                </div>
                <Button variant="outline" className="w-full">
                  Configure Provider
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}