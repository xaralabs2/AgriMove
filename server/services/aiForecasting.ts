import OpenAI from "openai";
import { storage } from "../storage";
import { SalesHistory, DemandForecast, InsertDemandForecast, Produce } from "@shared/schema";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface ForecastRequest {
  produceId: number;
  farmerId: number;
  forecastStartDate: string; // ISO date string
  forecastEndDate: string; // ISO date string
  daysInterval: number; // e.g., 7 = weekly forecasts
}

interface ForecastResponse {
  forecasts: DemandForecast[];
  factorsConsidered: string[];
  summary: string;
}

interface ForecastPrediction {
  date: string;
  estimatedDemand: number;
  confidenceScore: number;
  factors: Record<string, any>;
}

// Get the sales history for a specific product and farmer
async function getSalesHistory(produceId: number, farmerId: number): Promise<SalesHistory[]> {
  try {
    // This would be replaced with actual DB query using Drizzle
    const history = await storage.getSalesHistoryByProduct(produceId, farmerId);
    return history;
  } catch (error) {
    console.error('Error fetching sales history:', error);
    return [];
  }
}

// Format sales history for AI analysis
function formatSalesHistoryForAI(history: SalesHistory[], produce: Produce): string {
  if (history.length === 0) {
    return "No sales history available for this product.";
  }

  const formattedHistory = history.map(item => {
    // Handle date conversion safely
    let dateStr;
    try {
      // Safe method to convert any date format to string
      const dateObj = item.date ? new Date(item.date as any) : new Date();
      dateStr = dateObj.toISOString().split('T')[0];
    } catch (e) {
      dateStr = new Date().toISOString().split('T')[0]; // Fallback to current date
    }
    
    return `Date: ${dateStr}, Product: ${produce.name}, Quantity: ${item.quantity} ${produce.unit}, Unit Price: $${item.unitPrice}, Total: $${item.totalAmount}, Season: ${item.seasonality || 'Not specified'}`;
  }).join('\n');

  return formattedHistory;
}

// Generate demand forecast using OpenAI
export async function generateDemandForecast(request: ForecastRequest): Promise<ForecastResponse> {
  try {
    const { produceId, farmerId, forecastStartDate, forecastEndDate, daysInterval } = request;
    
    // Get historical sales data
    const salesHistory = await getSalesHistory(produceId, farmerId);
    
    // Get product information
    const produce = await storage.getProduce(produceId);
    if (!produce) {
      throw new Error('Product not found');
    }

    // Format data for AI
    const formattedHistory = formatSalesHistoryForAI(salesHistory, produce);
    
    // Current date for context
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Prepare the prompt
    const prompt = `
      You are an agricultural demand forecasting expert. Based on the historical sales data provided below, generate a demand forecast for "${produce.name}" (${produce.unit}) from ${forecastStartDate} to ${forecastEndDate}, with data points every ${daysInterval} days.

      Today's date: ${currentDate}
      Product: ${produce.name}
      Category: ${produce.category}
      Unit: ${produce.unit}
      Current Price: $${produce.price}

      Historical Sales Data:
      ${formattedHistory}

      Please analyze this data and provide:
      1. A forecast for each interval within the specified date range
      2. Confidence score for each prediction (0-100%)
      3. Key factors influencing each prediction
      4. A brief summary of the overall trend and recommendations

      Format your response as a JSON object with this structure:
      {
        "forecasts": [
          {
            "date": "YYYY-MM-DD",
            "estimatedDemand": number,
            "confidenceScore": number,
            "factors": {
              "seasonality": string,
              "priceImpact": string,
              "trend": string,
              "otherFactors": string[]
            }
          }
        ],
        "summary": "Brief explanation of overall trends and recommendations"
      }
    `;

    // Get forecast from OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an agricultural demand forecasting expert with deep knowledge of market trends, seasonality, and pricing factors in agricultural markets." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });

    // Parse AI response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('Failed to get a valid response from AI');
    }

    const aiResponse = JSON.parse(content);
    
    // Convert AI response to our format
    const forecasts: DemandForecast[] = [];
    const factorsConsidered: string[] = [];
    
    // Process each forecast
    for (const forecast of aiResponse.forecasts) {
      const forecastDate = new Date(forecast.date);
      
      // Prepare factors for database
      const factors = forecast.factors;
      if (factors.seasonality && !factorsConsidered.includes('Seasonality')) {
        factorsConsidered.push('Seasonality');
      }
      if (factors.priceImpact && !factorsConsidered.includes('Price Impact')) {
        factorsConsidered.push('Price Impact');
      }
      if (factors.trend && !factorsConsidered.includes('Market Trend')) {
        factorsConsidered.push('Market Trend');
      }
      if (factors.otherFactors) {
        for (const factor of factors.otherFactors) {
          if (!factorsConsidered.includes(factor)) {
            factorsConsidered.push(factor);
          }
        }
      }
      
      // Create the forecast entry
      const demandForecast: InsertDemandForecast = {
        produceId,
        farmerId,
        forecastDate: forecastDate.toISOString(), // Convert Date to string ISO format
        estimatedDemand: forecast.estimatedDemand,
        confidenceScore: forecast.confidenceScore,
        factors: forecast.factors,
        model: "GPT-4o"
      };
      
      // Save to database
      const savedForecast = await storage.createDemandForecast(demandForecast);
      forecasts.push(savedForecast);
    }
    
    return {
      forecasts,
      factorsConsidered,
      summary: aiResponse.summary
    };
    
  } catch (error: any) {
    console.error('Error generating forecast:', error);
    throw new Error(`Failed to generate forecast: ${error?.message || 'Unknown error'}`);
  }
}

// Get the latest forecasts for a farmer
export async function getLatestForecasts(farmerId: number, limit: number = 10): Promise<DemandForecast[]> {
  try {
    return await storage.getLatestDemandForecasts(farmerId, limit);
  } catch (error: any) {
    console.error('Error fetching forecasts:', error);
    return [];
  }
}

// Get forecasts for a specific product
export async function getProductForecasts(produceId: number, farmerId: number): Promise<DemandForecast[]> {
  try {
    return await storage.getDemandForecastsByProduct(produceId, farmerId);
  } catch (error: any) {
    console.error('Error fetching product forecasts:', error);
    return [];
  }
}