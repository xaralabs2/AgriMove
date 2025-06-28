import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, TrendingUp, Star } from 'lucide-react';
import { useAuth } from '@/auth/authContext';

interface RecommendationItem {
  id: number;
  name: string;
  reason: string;
  confidence: number;
}

interface RecommendationResult {
  type: 'product' | 'farm' | 'complementary';
  items: RecommendationItem[];
}

export default function AIRecommendations() {
  const { user } = useAuth();

  const { data: recommendations, isLoading, error } = useQuery<RecommendationResult[]>({
    queryKey: [`/api/ai/recommendations/${user?.id}`, { context: 'browsing' }],
    enabled: !!user?.id,
  });

  if (!user || user.role !== 'buyer') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <Brain className="h-5 w-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold">AI Recommendations</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-3 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !recommendations || recommendations.length === 0) {
    // Show AI features demo when API is not available
    const demoRecommendations = [
      {
        type: 'product' as const,
        items: [
          { id: 1, name: 'Organic Apples', reason: 'Based on your previous purchases of fruits', confidence: 0.89 },
          { id: 2, name: 'Fresh Carrots', reason: 'Complements your vegetable preferences', confidence: 0.76 }
        ]
      },
      {
        type: 'complementary' as const,
        items: [
          { id: 3, name: 'Organic Bananas', reason: 'Perfect for fruit smoothies with apples', confidence: 0.82 }
        ]
      }
    ];

    return (
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <Brain className="h-5 w-5 text-primary-600 mr-2" />
          <h2 className="text-lg font-semibold">AI Recommendations</h2>
          <div className="ml-2 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full">
            AI
          </div>
        </div>

        <div className="space-y-4">
          {demoRecommendations.map((recommendation, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-800 flex items-center">
                    {recommendation.type === 'product' && (
                      <>
                        <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                        Trending for You
                      </>
                    )}
                    {recommendation.type === 'complementary' && (
                      <>
                        <Star className="h-4 w-4 mr-2 text-purple-600" />
                        Perfect Combinations
                      </>
                    )}
                  </h3>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                    AI Demo
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                {recommendation.items.map((item) => (
                  <Link key={item.id} href={`/product/${item.id}`}>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800 mb-1">{item.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{item.reason}</p>
                        <div className="flex items-center">
                          <div className="flex items-center bg-white px-2 py-1 rounded-full">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                            <span className="text-xs text-gray-600">
                              {Math.round(item.confidence * 100)}% match
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center mb-2">
            <Brain className="h-4 w-4 text-purple-600 mr-2" />
            <span className="text-sm font-medium text-purple-800">AI-Powered Features Available</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center text-purple-700">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></div>
              Smart Pricing
            </div>
            <div className="flex items-center text-purple-700">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></div>
              Quality Assessment
            </div>
            <div className="flex items-center text-purple-700">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></div>
              Harvest Timing
            </div>
            <div className="flex items-center text-purple-700">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></div>
              Route Optimization
            </div>
          </div>
          <div className="mt-2 text-xs text-purple-600">
            Configure OpenAI API key to enable full AI capabilities
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center mb-3">
        <Brain className="h-5 w-5 text-primary-600 mr-2" />
        <h2 className="text-lg font-semibold">AI Recommendations</h2>
        <div className="ml-2 px-2 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full">
          AI
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((recommendation, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-800 flex items-center">
                  {recommendation.type === 'product' && (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                      Trending for You
                    </>
                  )}
                  {recommendation.type === 'complementary' && (
                    <>
                      <Star className="h-4 w-4 mr-2 text-purple-600" />
                      Perfect Combinations
                    </>
                  )}
                  {recommendation.type === 'farm' && (
                    <>
                      <Brain className="h-4 w-4 mr-2 text-green-600" />
                      Recommended Farms
                    </>
                  )}
                </h3>
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                  AI Powered
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {recommendation.items.slice(0, 3).map((item) => (
                <Link key={item.id} href={`/product/${item.id}`}>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 mb-1">{item.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{item.reason}</p>
                      <div className="flex items-center">
                        <div className="flex items-center bg-white px-2 py-1 rounded-full">
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                          <span className="text-xs text-gray-600">
                            {Math.round(item.confidence * 100)}% match
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {recommendation.items.length > 3 && (
                <div className="text-center pt-2">
                  <button className="text-primary-600 text-sm font-medium hover:text-primary-700">
                    View {recommendation.items.length - 3} more recommendations
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* AI Features Showcase */}
      <div className="mt-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center mb-2">
          <Brain className="h-4 w-4 text-purple-600 mr-2" />
          <span className="text-sm font-medium text-purple-800">AI-Powered Features</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center text-purple-700">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></div>
            Smart Pricing
          </div>
          <div className="flex items-center text-purple-700">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></div>
            Quality Assessment
          </div>
          <div className="flex items-center text-purple-700">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></div>
            Harvest Timing
          </div>
          <div className="flex items-center text-purple-700">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></div>
            Route Optimization
          </div>
        </div>
      </div>
    </div>
  );
}