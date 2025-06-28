import { useLocation, Link } from 'wouter';
import { useAuth } from '@/auth/authContext';
import { 
  User, 
  ArrowLeft
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import WebSocketNotifications from './WebSocketNotifications';

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export default function AppHeader({ title = "AgriMove", showBackButton = false }: AppHeaderProps) {
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  
  const handleGoBack = () => {
    // Use string-based navigation with wouter
    // Navigate to the previous page in history
    window.history.back();
  };

  return (
    <header className="sticky top-0 bg-primary-500 text-white p-4 flex items-center justify-between z-10">
      <div className="flex items-center">
        {showBackButton && (
          <button onClick={handleGoBack} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <WebSocketNotifications />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button>
              <User className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {user ? (
              <>
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/">Login</Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
