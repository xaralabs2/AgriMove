import { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import ProduceForm from './ProduceForm';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProduceItemProps {
  produce: {
    id: number;
    name: string;
    price: number;
    unit: string;
    quantity: number;
    category: string;
    status: string;
    image?: string;
    description?: string;
  };
}

export default function ProduceItem({ produce }: ProduceItemProps) {
  const { toast } = useToast();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await apiRequest('DELETE', `/api/produce/${produce.id}`, {});
      
      queryClient.invalidateQueries({ queryKey: ['/api/produce'] });
      
      toast({
        title: "Success",
        description: "Produce deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete produce",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex p-3 border-b border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-md mr-3 flex items-center justify-center">
            {produce.image ? (
              <img 
                src={produce.image} 
                alt={produce.name} 
                className="w-full h-full object-cover rounded-md" 
              />
            ) : (
              <div className="w-full h-full bg-primary-50 flex items-center justify-center text-primary-500">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-8 w-8" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">{produce.name}</h3>
              <div className="flex items-center">
                <span 
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    produce.status === "active" ? "bg-green-100 text-green-800" :
                    produce.status === "out_of_stock" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                  )}
                >
                  {produce.status === "active" ? "Active" : 
                   produce.status === "out_of_stock" ? "Out of Stock" : 
                   "Inactive"}
                </span>
              </div>
            </div>
            <div className="text-primary-600 font-medium mt-1">
              ₦{produce.price.toLocaleString()}/{produce.unit}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Stock: {produce.quantity}{produce.unit}
            </div>
          </div>
        </div>
        <div className="flex justify-between p-2 bg-gray-50">
          <button 
            onClick={() => setShowEditForm(true)}
            className="text-accent-600 text-sm flex items-center"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </button>
          <button 
            onClick={() => setShowDeleteDialog(true)}
            className="text-gray-600 text-sm flex items-center"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remove
          </button>
        </div>
      </div>

      {/* Edit Form Dialog */}
      <ProduceForm
        open={showEditForm}
        onClose={() => setShowEditForm(false)}
        initialData={produce}
        editMode={true}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {produce.name} from your listings.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
