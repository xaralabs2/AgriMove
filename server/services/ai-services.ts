import OpenAI from "openai";
import { storage } from "../storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PriceOptimizationResult {
  currentPrice: number;
  suggestedPrice: number;
  reasoning: string;
  confidence: number;
  marketTrends: {
    demandLevel: 'low' | 'medium' | 'high';
    seasonality: string;
    competition: string;
  };
}

export interface RecommendationResult {
  type: 'product' | 'farm' | 'complementary';
  items: Array<{
    id: number;
    name: string;
    reason: string;
    confidence: number;
  }>;
}

export interface QualityAssessment {
  qualityScore: number; // 1-10
  freshness: 'poor' | 'fair' | 'good' | 'excellent';
  defects: string[];
  shelfLife: number; // estimated days
  recommendations: string[];
}

/**
 * AI-powered price optimization for farmers
 */
export async function optimizePrice(
  produceId: number,
  farmerId: number,
  currentPrice: number
): Promise<PriceOptimizationResult> {
  try {
    // Get historical sales data
    const salesHistory = await storage.getSalesHistoryByProduct(produceId, farmerId);
    const produce = await storage.getProduce(produceId);
    
    if (!produce) {
      throw new Error("Produce not found");
    }

    // Get market data (similar products from other farms)
    const marketProducts = await storage.getAllProduce(produce.category);
    const competitorPrices = marketProducts
      .filter(p => p.id !== produceId && p.name.toLowerCase().includes(produce.name.toLowerCase()))
      .map(p => p.price);

    const prompt = `As an agricultural pricing expert, analyze this produce pricing situation:

Product: ${produce.name}
Category: ${produce.category}
Current Price: $${currentPrice}
Available Quantity: ${produce.quantity} ${produce.unit}
Historical Sales: ${salesHistory.length} previous sales
Competitor Prices: ${competitorPrices.length > 0 ? competitorPrices.join(', ') : 'No competitors found'}
Average Competitor Price: ${competitorPrices.length > 0 ? (competitorPrices.reduce((a, b) => a + b, 0) / competitorPrices.length).toFixed(2) : 'N/A'}

Consider:
- Seasonal demand patterns for ${produce.category}
- Market competition
- Inventory levels
- Profit optimization
- Consumer price sensitivity

Provide a JSON response with pricing recommendations:
{
  "suggestedPrice": number,
  "reasoning": "detailed explanation",
  "confidence": number between 0-1,
  "demandLevel": "low|medium|high",
  "seasonality": "seasonal impact description",
  "competition": "competitive analysis"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      currentPrice,
      suggestedPrice: result.suggestedPrice || currentPrice,
      reasoning: result.reasoning || "Unable to generate recommendation",
      confidence: result.confidence || 0.5,
      marketTrends: {
        demandLevel: result.demandLevel || 'medium',
        seasonality: result.seasonality || 'Unknown seasonal pattern',
        competition: result.competition || 'Limited competitive analysis available'
      }
    };
  } catch (error) {
    console.error('Price optimization error:', error);
    throw new Error('Failed to generate price optimization');
  }
}

/**
 * AI-powered product recommendations for buyers
 */
export async function generateRecommendations(
  userId: number,
  context: 'browsing' | 'cart' | 'purchase'
): Promise<RecommendationResult[]> {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get user's order history
    const orderHistory = await storage.getOrdersByBuyer(userId);
    const allProduce = await storage.getAllProduce();

    // Extract frequently purchased items
    const purchaseFrequency: { [key: string]: number } = {};
    for (const order of orderHistory) {
      const orderItems = await storage.getOrderItemsByOrder(order.id);
      for (const item of orderItems) {
        const produce = await storage.getProduce(item.produceId);
        if (produce) {
          purchaseFrequency[produce.category] = (purchaseFrequency[produce.category] || 0) + 1;
        }
      }
    }

    const prompt = `As a smart agricultural marketplace AI, generate personalized recommendations:

User Profile:
- Location: ${user.address || 'Not specified'}
- Purchase History: ${orderHistory.length} previous orders
- Preferred Categories: ${Object.keys(purchaseFrequency).join(', ') || 'No history'}
- Context: ${context}

Available Products: ${allProduce.slice(0, 10).map(p => `${p.name} ($${p.price}/${p.unit})`).join(', ')}

Generate recommendations based on:
- Seasonal availability
- Complementary products (cooking combinations)
- Popular trending items
- User's purchase patterns
- Nutritional variety

Provide JSON response with different recommendation types:
{
  "productRecommendations": [
    {
      "id": number,
      "name": "product name",
      "reason": "why recommended",
      "confidence": number between 0-1
    }
  ],
  "complementaryItems": [
    {
      "id": number,
      "name": "product name", 
      "reason": "goes well with current selection",
      "confidence": number between 0-1
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    const recommendations: RecommendationResult[] = [];

    if (result.productRecommendations) {
      recommendations.push({
        type: 'product',
        items: result.productRecommendations
      });
    }

    if (result.complementaryItems) {
      recommendations.push({
        type: 'complementary',
        items: result.complementaryItems
      });
    }

    return recommendations;
  } catch (error) {
    console.error('Recommendation generation error:', error);
    
    // Return intelligent fallback recommendations based on available data
    const fallbackRecommendations: RecommendationResult[] = [];
    
    // Get available produce for fallback recommendations
    const availableProduce = await storage.getAllProduce();
    
    if (availableProduce.length > 0) {
      // Add popular items as fallback
      const popularItems = availableProduce
        .filter(p => p.quantity > 0)
        .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
        .slice(0, 3)
        .map(p => ({
          id: p.id,
          name: p.name,
          reason: 'Popular choice',
          confidence: 0.6
        }));
        
      if (popularItems.length > 0) {
        fallbackRecommendations.push({
          type: 'product',
          items: popularItems
        });
      }
    }
    
    return fallbackRecommendations;
  }
}

/**
 * AI-powered crop quality assessment from images
 */
export async function assessCropQuality(
  base64Image: string,
  cropType: string
): Promise<QualityAssessment> {
  try {
    const prompt = `As an agricultural quality expert, analyze this ${cropType} image for quality assessment.

Evaluate:
- Overall visual quality (1-10 scale)
- Freshness indicators
- Visible defects or damage
- Estimated shelf life
- Storage/handling recommendations

Provide detailed JSON assessment:
{
  "qualityScore": number 1-10,
  "freshness": "poor|fair|good|excellent",
  "defects": ["list of any visible issues"],
  "shelfLife": estimated days as number,
  "recommendations": ["storage and handling tips"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${base64Image}` }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      qualityScore: result.qualityScore || 5,
      freshness: result.freshness || 'fair',
      defects: result.defects || [],
      shelfLife: result.shelfLife || 7,
      recommendations: result.recommendations || []
    };
  } catch (error) {
    console.error('Quality assessment error:', error);
    throw new Error('Failed to assess crop quality');
  }
}

/**
 * AI-powered harvest timing optimization
 */
export async function optimizeHarvestTiming(
  produceId: number,
  farmerId: number,
  weatherForecast?: any
): Promise<{
  optimalHarvestDate: string;
  reasoning: string;
  marketWindow: string;
  confidence: number;
}> {
  try {
    const produce = await storage.getProduce(produceId);
    const demandForecasts = await storage.getDemandForecastsByProduct(produceId, farmerId);
    
    if (!produce) {
      throw new Error("Produce not found");
    }

    const prompt = `As an agricultural timing expert, optimize harvest timing for:

Crop: ${produce.name}
Category: ${produce.category}
Current Quantity: ${produce.quantity} ${produce.unit}
Demand Forecasts: ${demandForecasts.length} forecasts available
Weather Considerations: ${weatherForecast ? 'Weather data provided' : 'No weather data'}

Consider:
- Crop maturity and peak quality timing
- Market demand patterns
- Weather conditions
- Storage capabilities
- Seasonal price variations

Provide JSON recommendation:
{
  "optimalHarvestDate": "YYYY-MM-DD",
  "reasoning": "detailed explanation",
  "marketWindow": "best selling period description",
  "confidence": number between 0-1
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      optimalHarvestDate: result.optimalHarvestDate || new Date().toISOString().split('T')[0],
      reasoning: result.reasoning || "Based on standard harvest timing",
      marketWindow: result.marketWindow || "Market analysis not available",
      confidence: result.confidence || 0.5
    };
  } catch (error) {
    console.error('Harvest optimization error:', error);
    throw new Error('Failed to optimize harvest timing');
  }
}

/**
 * AI-powered delivery route optimization
 */
export async function optimizeDeliveryRoute(
  driverId: number,
  deliveryIds: number[]
): Promise<{
  optimizedRoute: Array<{
    deliveryId: number;
    order: number;
    estimatedTime: string;
    address: string;
  }>;
  totalDistance: number;
  estimatedDuration: string;
  fuelSavings: string;
}> {
  try {
    const deliveries = await Promise.all(
      deliveryIds.map(id => storage.getDelivery(id))
    );
    
    const validDeliveries = deliveries.filter(d => d !== undefined);

    const prompt = `As a logistics optimization expert, plan the most efficient delivery route:

Driver ID: ${driverId}
Number of Deliveries: ${validDeliveries.length}
Delivery Addresses: ${validDeliveries.map((d, i) => `${i + 1}. ${d!.deliveryLocation}`).join(', ')}

Optimize for:
- Shortest total distance
- Minimal fuel consumption
- Traffic patterns
- Delivery time windows
- Customer satisfaction

Provide JSON optimization:
{
  "optimizedRoute": [
    {
      "deliveryId": number,
      "order": sequence number,
      "estimatedTime": "HH:MM",
      "address": "delivery address"
    }
  ],
  "totalDistance": estimated km as number,
  "estimatedDuration": "human readable duration",
  "fuelSavings": "savings description"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      optimizedRoute: result.optimizedRoute || [],
      totalDistance: result.totalDistance || 0,
      estimatedDuration: result.estimatedDuration || "Unknown",
      fuelSavings: result.fuelSavings || "Optimization not available"
    };
  } catch (error) {
    console.error('Route optimization error:', error);
    throw new Error('Failed to optimize delivery route');
  }
}