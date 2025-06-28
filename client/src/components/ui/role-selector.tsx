import { useState } from 'react';
import { useAuth } from '@/auth/authContext';

interface RoleSelectorProps {
  onRoleChange?: (role: "buyer" | "farmer" | "driver") => void;
}

export default function RoleSelector({ onRoleChange }: RoleSelectorProps) {
  const { user, setRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<"buyer" | "farmer" | "driver">(user?.role || "buyer");

  const handleRoleClick = (role: "buyer" | "farmer" | "driver") => {
    setSelectedRole(role);
    setRole(role);
    if (onRoleChange) {
      onRoleChange(role);
    }
  };

  return (
    <div className="p-4 bg-gray-100">
      <div className="text-sm text-gray-600 mb-2 font-semibold">Select Your Role:</div>
      <div className="flex space-x-2">
        <button 
          onClick={() => handleRoleClick("buyer")}
          className={`flex-1 py-2 px-4 rounded-md shadow ${
            selectedRole === "buyer" 
              ? "bg-primary-500 text-white" 
              : "bg-gray-200 text-gray-800"
          }`}
        >
          Buyer
        </button>
        <button 
          onClick={() => handleRoleClick("farmer")}
          className={`flex-1 py-2 px-4 rounded-md shadow ${
            selectedRole === "farmer" 
              ? "bg-primary-500 text-white" 
              : "bg-gray-200 text-gray-800"
          }`}
        >
          Farmer
        </button>
        <button 
          onClick={() => handleRoleClick("driver")}
          className={`flex-1 py-2 px-4 rounded-md shadow ${
            selectedRole === "driver" 
              ? "bg-primary-500 text-white" 
              : "bg-gray-200 text-gray-800"
          }`}
        >
          Driver
        </button>
      </div>
    </div>
  );
}
