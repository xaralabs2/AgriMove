import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserLocation } from '@/utils/locationService';
import { Users, MapPin, Phone, Star } from 'lucide-react';

interface NearbyUsersProps {
  users: UserLocation[];
  currentUserRole: string;
  onContactUser?: (userId: number) => void;
  onViewProfile?: (userId: number) => void;
}

export default function NearbyUsers({ 
  users, 
  currentUserRole, 
  onContactUser, 
  onViewProfile 
}: NearbyUsersProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'farmer': return 'bg-green-100 text-green-800';
      case 'buyer': return 'bg-blue-100 text-blue-800';
      case 'driver': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleRelevantInfo = (user: UserLocation) => {
    switch (user.role) {
      case 'farmer':
        return 'Fresh produce available';
      case 'buyer':
        return 'Looking for produce';
      case 'transporter':
        return 'Available for delivery';
      default:
        return '';
    }
  };

  if (users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Nearby Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No nearby users found</p>
            <p className="text-sm mt-1">Try expanding your search radius or check back later</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Nearby Users ({users.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {users.map((user) => (
            <div 
              key={user.userId}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{user.name}</h3>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                    <MapPin className="h-3 w-3" />
                    {user.distance ? `${user.distance.toFixed(1)} km away` : 'Distance unknown'}
                  </div>
                  
                  <p className="text-sm text-gray-500">
                    {getRoleRelevantInfo(user)}
                  </p>
                  
                  {user.role === 'farmer' && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-gray-600">4.5 rating</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  {onViewProfile && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewProfile(user.userId)}
                    >
                      View
                    </Button>
                  )}
                  {onContactUser && (
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={() => onContactUser(user.userId)}
                    >
                      <Phone className="h-3 w-3 mr-1" />
                      Contact
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Connect with nearby {
              currentUserRole === 'farmer' ? 'buyers and drivers' :
              currentUserRole === 'buyer' ? 'farmers and drivers' :
              'farmers and buyers'
            } to reduce delivery costs and support local agriculture.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}