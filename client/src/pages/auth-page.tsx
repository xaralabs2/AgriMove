import React, { useState } from "react";
import { useAuth } from "@/auth/authContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function AuthPage() {
  const { login, register, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // If already authenticated, redirect to home
  React.useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);
  
  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Left side - Auth forms */}
      <div className="w-full md:w-1/2 p-4 md:p-10 flex items-center justify-center">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")} className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <LoginForm onLogin={login} isLoading={isLoading} onSwitchToRegister={() => setActiveTab("register")} />
          </TabsContent>
          
          <TabsContent value="register">
            <RegisterForm onRegister={register} isLoading={isLoading} onSwitchToLogin={() => setActiveTab("login")} />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Right side - Hero section */}
      <div className="w-full md:w-1/2 bg-primary p-10 flex items-center justify-center text-primary-foreground">
        <div className="max-w-lg">
          <h1 className="text-4xl font-bold mb-4">Welcome to AgriMove</h1>
          <p className="text-xl mb-6">
            Connecting farmers, buyers, and drivers for efficient agricultural logistics
          </p>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="bg-primary-foreground text-primary rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">1</div>
              <div>
                <h3 className="font-medium">For Farmers</h3>
                <p className="opacity-90">Sell your produce directly to buyers and get fair prices</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-primary-foreground text-primary rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">2</div>
              <div>
                <h3 className="font-medium">For Buyers</h3>
                <p className="opacity-90">Source fresh produce directly from farms with full transparency</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-primary-foreground text-primary rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">3</div>
              <div>
                <h3 className="font-medium">For Drivers</h3>
                <p className="opacity-90">Find delivery opportunities and earn money transporting produce</p>
              </div>
            </div>
            <div className="mt-8 p-4 bg-primary-foreground/10 rounded-lg">
              <h3 className="text-lg font-medium mb-2 text-primary-foreground">WhatsApp & USSD Access</h3>
              <p className="text-primary-foreground/90">
                Use our platform even without internet! Access through WhatsApp or USSD by dialing *123#
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<void>;
  isLoading: boolean;
  onSwitchToRegister: () => void;
}

function LoginForm({ onLogin, isLoading, onSwitchToRegister }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await onLogin(username, password);
    } catch (error) {
      // Error is handled by the auth context
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {/* Demo credentials info */}
          <div className="p-3 bg-blue-50 rounded-lg text-sm">
            <p className="font-medium text-blue-900 mb-2">Quick Demo Login:</p>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setUsername("buyer1");
                  setPassword("password123");
                }}
                className="text-xs"
              >
                Buyer Demo
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setUsername("farmer1");
                  setPassword("password123");
                }}
                className="text-xs"
              >
                Farmer Demo
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setUsername("driver1");
                  setPassword("password123");
                }}
                className="text-xs"
              >
                Driver Demo
              </Button>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Button 
            variant="link" 
            className="h-auto p-0 text-primary" 
            onClick={onSwitchToRegister}
          >
            Switch to Register
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}

interface RegisterFormProps {
  onRegister: (userData: any) => Promise<void>;
  isLoading: boolean;
  onSwitchToLogin: () => void;
}

function RegisterForm({ onRegister, isLoading, onSwitchToLogin }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"buyer" | "farmer" | "driver">("buyer");
  const [location, setLocation] = useState("");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password || !phone || !role) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await onRegister({
        name,
        username,
        password,
        phone,
        role,
        location,
      });
      
      // Clear the form on success
      setName("");
      setUsername("");
      setPassword("");
      setPhone("");
      setRole("buyer");
      setLocation("");
      
    } catch (error) {
      // Error is handled by the auth context
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an Account</CardTitle>
        <CardDescription>
          Register to start using AgriMove
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Choose a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="Your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>I am a</Label>
            <RadioGroup value={role} onValueChange={(value) => setRole(value as any)} className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="buyer" id="buyer" />
                <Label htmlFor="buyer">Buyer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="farmer" id="farmer" />
                <Label htmlFor="farmer">Farmer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="driver" id="driver" />
                <Label htmlFor="driver">Driver</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Your location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-4">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Button 
            variant="link" 
            className="h-auto p-0 text-primary" 
            onClick={onSwitchToLogin}
          >
            Switch to Login
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}