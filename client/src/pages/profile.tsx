import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/auth/authContext';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import AppHeader from '@/components/AppHeader';
import BottomNavigation from '@/components/BottomNavigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Star, 
  Wallet, 
  Loader, 
  LogOut,
  CreditCard 
} from 'lucide-react';

// Form schema for profile updates
const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  phone: z.string().min(10, { message: "Phone number must be at least 10 characters." }),
  location: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Vehicle form schema for drivers
const vehicleFormSchema = z.object({
  type: z.string().min(1, { message: "Vehicle type is required." }),
  licensePlate: z.string().min(1, { message: "License plate is required." }),
  capacity: z.coerce.number().min(1, { message: "Capacity must be at least 1kg." }),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

// Farm form schema for farmers
const farmFormSchema = z.object({
  name: z.string().min(2, { message: "Farm name must be at least 2 characters." }),
  description: z.string().optional(),
  address: z.string().min(5, { message: "Farm address is required." }),
});

type FarmFormValues = z.infer<typeof farmFormSchema>;

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch user profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['/api/users/me'],
    queryFn: async () => {
      const res = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch profile');
      }
      return res.json();
    },
    retry: false,
  });

  // Fetch vehicle data for drivers
  const { data: vehicleData } = useQuery({
    queryKey: ['/api/vehicles/driver', user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles/driver/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) {
        return null;
      }
      return res.json();
    },
    enabled: !!user && user.role === 'driver',
  });

  // Fetch farm data for farmers
  const { data: farmData } = useQuery({
    queryKey: ['/api/farms/farmer', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/farms`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) {
        return null;
      }
      const farms = await res.json();
      return farms.find(farm => farm.farmerId === user.id) || null;
    },
    enabled: !!user && user.role === 'farmer',
  });

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profileData?.name || '',
      email: profileData?.email || '',
      phone: profileData?.phone || '',
      location: profileData?.location || '',
    },
  });

  // Vehicle form for drivers
  const vehicleForm = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      type: vehicleData?.type || '',
      licensePlate: vehicleData?.licensePlate || '',
      capacity: vehicleData?.capacity || 50,
    },
  });

  // Farm form for farmers
  const farmForm = useForm<FarmFormValues>({
    resolver: zodResolver(farmFormSchema),
    defaultValues: {
      name: farmData?.name || '',
      description: farmData?.description || '',
      address: farmData?.address || '',
    },
  });

  // Update profile form values when data is loaded
  if (profileData && !profileForm.formState.isDirty) {
    profileForm.reset({
      name: profileData.name || '',
      email: profileData.email || '',
      phone: profileData.phone || '',
      location: profileData.location || '',
    });
  }

  // Update vehicle form values when data is loaded
  if (vehicleData && !vehicleForm.formState.isDirty) {
    vehicleForm.reset({
      type: vehicleData.type || '',
      licensePlate: vehicleData.licensePlate || '',
      capacity: vehicleData.capacity || 50,
    });
  }

  // Update farm form values when data is loaded
  if (farmData && !farmForm.formState.isDirty) {
    farmForm.reset({
      name: farmData.name || '',
      description: farmData.description || '',
      address: farmData.address || '',
    });
  }

  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      setIsUpdating(true);
      await apiRequest('PUT', '/api/users/me', {
        updates: data
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error.message || "Could not update profile",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const onVehicleSubmit = async (data: VehicleFormValues) => {
    try {
      setIsUpdating(true);
      if (vehicleData) {
        // Update existing vehicle
        await apiRequest('PUT', `/api/vehicles/${vehicleData.id}`, {
          updates: data
        });
      } else {
        // Create new vehicle
        await apiRequest('POST', '/api/vehicles', {
          vehicle: data
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles/driver', user?.id] });
      toast({
        title: "Vehicle updated",
        description: "Your vehicle details have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error.message || "Could not update vehicle details",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const onFarmSubmit = async (data: FarmFormValues) => {
    try {
      setIsUpdating(true);
      if (farmData) {
        // Update existing farm
        await apiRequest('PUT', `/api/farms/${farmData.id}`, {
          updates: data
        });
      } else {
        // Create new farm
        await apiRequest('POST', '/api/farms', {
          farm: data
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/farms/farmer', user?.id] });
      toast({
        title: "Farm updated",
        description: "Your farm details have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error.message || "Could not update farm details",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen max-w-md mx-auto bg-gray-100 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-md mx-auto bg-gray-100 pb-16">
      <AppHeader title="My Profile" showBackButton={true} />
      
      <main className="p-4">
        {/* Profile Summary */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-500 flex items-center justify-center mr-4">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{profileData?.name}</h2>
                <p className="text-sm text-gray-500 capitalize">{profileData?.role}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-600 text-sm">Wallet Balance</div>
                <div className="text-xl font-semibold text-primary-600 flex items-center">
                  <Wallet className="h-4 w-4 mr-1" />
                  ₦{profileData?.wallet?.toLocaleString() || '0'}
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-gray-600 text-sm">Rating</div>
                <div className="text-xl font-semibold text-gray-600 flex items-center">
                  <Star className="h-4 w-4 mr-1 text-yellow-400" />
                  {profileData?.rating || '0'}/5
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...profileForm}>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input placeholder="Your full name" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input placeholder="Your phone number" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input placeholder="Your email address" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={profileForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input placeholder="Your location" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary-500 hover:bg-primary-600"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Updating..." : "Update Profile"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Driver's Vehicle Form */}
        {user?.role === 'driver' && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
              <CardDescription>Update your vehicle details</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...vehicleForm}>
                <form onSubmit={vehicleForm.handleSubmit(onVehicleSubmit)} className="space-y-4">
                  <FormField
                    control={vehicleForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Motorcycle, Tricycle, Van" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={vehicleForm.control}
                    name="licensePlate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Plate</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. ABC-123-XY" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={vehicleForm.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity (kg)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Maximum weight in kg" 
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum weight your vehicle can carry in kilograms
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary-500 hover:bg-primary-600"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Update Vehicle"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Farmer's Farm Form */}
        {user?.role === 'farmer' && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Farm Information</CardTitle>
              <CardDescription>Update your farm details</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...farmForm}>
                <form onSubmit={farmForm.handleSubmit(onFarmSubmit)} className="space-y-4">
                  <FormField
                    control={farmForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Farm Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Green Valley Farm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={farmForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Tell buyers about your farm" 
                            className="resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={farmForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Farm Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Full address of your farm" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary-500 hover:bg-primary-600"
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Updating..." : "Update Farm"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Payment Methods - For buyers */}
        {user?.role === 'buyer' && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-3 text-primary-500" />
                  <div>
                    <p className="font-medium">Paystack</p>
                    <p className="text-sm text-gray-500">Default payment method</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-4"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Logout Button */}
        <div className="mt-6">
          <Separator className="mb-6" />
          <Button 
            variant="destructive" 
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </main>
      
      <BottomNavigation />
    </div>
  );
}
