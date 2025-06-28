import { Carrot, Apple, Wheat, Egg, Cherry } from 'lucide-react';

interface Category {
  name: string;
  icon: React.ReactNode;
}

interface CategorySelectorProps {
  onSelectCategory: (category: string) => void;
  selectedCategory?: string;
}

export default function CategorySelector({ onSelectCategory, selectedCategory }: CategorySelectorProps) {
  const categories: Category[] = [
    { name: "Vegetables", icon: <Carrot className="h-6 w-6" /> },
    { name: "Fruits", icon: <Apple className="h-6 w-6" /> },
    { name: "Grains", icon: <Wheat className="h-6 w-6" /> },
    { name: "Dairy", icon: <Egg className="h-6 w-6" /> },
    { name: "Spices", icon: <Cherry className="h-6 w-6" /> },
  ];

  return (
    <div className="mb-4 overflow-x-auto">
      <div className="flex space-x-3 pb-2">
        {categories.map((category, index) => (
          <div 
            key={index} 
            className="flex flex-col items-center cursor-pointer"
            onClick={() => onSelectCategory(category.name)}
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
              selectedCategory === category.name
                ? "bg-green-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
              {category.icon}
            </div>
            <span className="text-xs mt-1 text-center">{category.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
