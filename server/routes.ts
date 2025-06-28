import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketManager } from "./websocket";
import { loginSchema, insertUserSchema, insertProduceSchema, 
  insertOrderSchema, insertOrderItemSchema, phoneVerificationSchema,
  insertVehicleSchema, insertFarmSchema } from "@shared/schema";
import { z } from "zod";
import { 
  initMessaging, 
  processUSSDRequest, 
  processWhatsAppRequest, 
  sendOrderUpdate,
  sendWhatsAppMessage
} from "./messaging";
import { 
  generateDemandForecast,
  getLatestForecasts,
  getProductForecasts
} from "./services/aiForecasting";
import { 
  optimizePrice, 
  generateRecommendations, 
  assessCropQuality, 
  optimizeHarvestTiming, 
  optimizeDeliveryRoute 
} from "./services/ai-services";

// Basic authentication middleware
const authenticate = async (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  // In a real implementation, validate JWT token
  // For demo, we'll just check if token is a valid user ID
  try {
    const userId = parseInt(token);
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.body.userId = userId;
    req.body.userRole = user.role;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wsManager = new WebSocketManager(httpServer);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy' });
  });

  // Initialize messaging system
  initMessaging();

  // WhatsApp/USSD integration routes
  app.post("/api/ussd", async (req, res) => {
    try {
      const { sessionId, serviceCode, phoneNumber, text } = req.body;

      if (!sessionId || !phoneNumber) {
        return res.status(400).send("END Missing required parameters");
      }

      const response = await processUSSDRequest(text || "", phoneNumber, sessionId);

      // USSD responses need to be prefixed with either "CON " for continued sessions
      // or "END " for ended sessions
      if (response.includes("Goodbye") || response.includes("Thank you")) {
        return res.send(`END ${response}`);
      } else {
        return res.send(`CON ${response}`);
      }
    } catch (error) {
      console.error("USSD error:", error);
      res.send("END An error occurred. Please try again later.");
    }
  });

  app.post("/api/whatsapp", async (req, res) => {
    try {
      const { Body, From } = req.body;

      if (!Body || !From) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const response = await processWhatsAppRequest(Body, From);

      // Return TwiML response
      res.type('text/xml');
      res.send(`
        <Response>
          <Message>${response}</Message>
        </Response>
      `);
    } catch (error) {
      console.error("WhatsApp error:", error);
      res.type('text/xml');
      res.send(`
        <Response>
          <Message>An error occurred. Please try again later.</Message>
        </Response>
      `);
    }
  });

  // Direct WhatsApp message sending endpoint
  app.post("/api/whatsapp/send", async (req, res) => {
    try {
      const { to, message } = req.body;

      if (!to || !message) {
        return res.status(400).json({ message: "Recipient phone number and message are required" });
      }

      const result = await sendWhatsAppMessage(to, message);

      res.json({ 
        success: true, 
        message: result ? 
          "Message sent successfully" : 
          "Message logged (using placeholder credentials)" 
      });
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Order notification webhook
  app.post("/api/orders/:id/notify", authenticate, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      // Update the order in the database
      const updatedOrder = await storage.updateOrder(orderId, { status });

      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Send notification via WhatsApp
      await sendOrderUpdate(orderId, status);

      res.json({ message: "Order updated and notification sent", order: updatedOrder });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Auth endpoints
  app.post('/api/auth/login', async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(credentials.username);

      if (!user || user.password !== credentials.password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // In a real implementation, generate and return JWT token
      // For demo, we'll just return the user ID as token
      res.json({ 
        token: user.id.toString(),
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          name: user.name,
          phone: user.phone,
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }

      // Check if phone already exists
      const existingPhone = await storage.getUserByPhone(userData.phone);
      if (existingPhone) {
        return res.status(400).json({ message: 'Phone number already registered' });
      }

      const newUser = await storage.createUser(userData);

      // If user is a farmer, create farm
      if (userData.role === 'farmer' && req.body.farm) {
        const farmData = {
          farmerId: newUser.id,
          name: req.body.farm.name || `${newUser.name}'s Farm`,
          description: req.body.farm.description || '',
          address: req.body.farm.address || userData.location || '',
          image: req.body.farm.image || '',
        };

        await storage.createFarm(farmData);
      }

      // If user is a driver, create vehicle
      if (userData.role === 'driver' && req.body.vehicle) {
        const vehicleData = {
          driverId: newUser.id,
          type: req.body.vehicle.type || 'Motorcycle',
          licensePlate: req.body.vehicle.licensePlate || '',
          capacity: req.body.vehicle.capacity || 50,
          location: userData.location || '',
        };

        await storage.createVehicle(vehicleData);
      }

      // Return token and user data
      res.status(201).json({ 
        token: newUser.id.toString(),
        user: {
          id: newUser.id,
          username: newUser.username,
          role: newUser.role,
          name: newUser.name,
          phone: newUser.phone,
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
      const userId = req.body.userId;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        phone: user.phone,
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/verify-phone', async (req, res) => {
    try {
      const data = phoneVerificationSchema.parse(req.body);

      // In a real implementation, validate OTP
      // For demo, we'll just verify if OTP is "123456"
      if (data.otp !== "123456") {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      const user = await storage.getUserByPhone(data.phone);
      if (user) {
        await storage.updateUser(user.id, { verified: true });
        res.json({ message: 'Phone verified successfully' });
      } else {
        res.status(404).json({ message: 'User not found' });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // User endpoints
  app.get('/api/users/me', authenticate, async (req, res) => {
    try {
      const userId = req.body.userId;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Don't return sensitive data
      const { password, ...userData } = user;
      res.json(userData);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/users/me', authenticate, async (req, res) => {
    try {
      const userId = req.body.userId;
      const updates = req.body.updates;

      // Don't allow updating sensitive fields
      const { id, password, role, ...allowedUpdates } = updates;

      const updatedUser = await storage.updateUser(userId, allowedUpdates);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Don't return sensitive data
      const { password: _, ...userData } = updatedUser;
      res.json(userData);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Location endpoints
  app.put('/api/users/me/location', authenticate, async (req, res) => {
    try {
      const userId = req.body.userId;
      const { latitude, longitude, address } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
      }

      const updatedUser = await storage.updateUserLocation(userId, {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address
      });

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Don't return sensitive data
      const { password: _, ...userData } = updatedUser;
      res.json(userData);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/users/nearby', authenticate, async (req, res) => {
    try {
      const userId = req.body.userId;
      const { radius = 50 } = req.query;

      const user = await storage.getUser(userId);
      if (!user || !user.latitude || !user.longitude) {
        return res.status(400).json({ message: 'User location not set' });
      }

      const nearbyUsers = await storage.getNearbyUsers(
        { latitude: user.latitude, longitude: user.longitude },
        parseInt(radius as string),
        userId
      );

      // Don't return sensitive data
      const safeUsers = nearbyUsers.map(user => {
        const { password, ...userData } = user;
        return userData;
      });

      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Produce endpoints
  app.get('/api/produce', async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const produceList = await storage.getProduceWithFarmInfo();

      if (category) {
        const filtered = produceList.filter(p => p.category === category);
        return res.json(filtered);
      }

      res.json(produceList);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/produce/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const produce = await storage.getProduce(id);

      if (!produce) {
        return res.status(404).json({ message: 'Produce not found' });
      }

      const farm = await storage.getFarmByFarmer(produce.farmerId);
      const farmer = await storage.getUser(produce.farmerId);

      res.json({
        ...produce,
        farm: farm ? {
          id: farm.id,
          name: farm.name,
          rating: farm.rating,
        } : null,
        farmer: farmer ? {
          id: farmer.id,
          name: farmer.name,
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/produce', authenticate, async (req, res) => {
    try {
      // Only farmers can create produce
      if (req.body.userRole !== 'farmer') {
        return res.status(403).json({ message: 'Only farmers can create produce' });
      }

      const produceData = insertProduceSchema.parse({
        ...req.body.produce,
        farmerId: req.body.userId
      });

      const newProduce = await storage.createProduce(produceData);
      res.status(201).json(newProduce);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/produce/:id', authenticate, async (req, res) => {
    try {
      // Only farmers can update produce
      if (req.body.userRole !== 'farmer') {
        return res.status(403).json({ message: 'Only farmers can update produce' });
      }

      const id = parseInt(req.params.id);
      const produce = await storage.getProduce(id);

      if (!produce) {
        return res.status(404).json({ message: 'Produce not found' });
      }

      // Farmers can only update their own produce
      if (produce.farmerId !== req.body.userId) {
        return res.status(403).json({ message: 'You can only update your own produce' });
      }

      const updates = req.body.updates;
      const updatedProduce = await storage.updateProduce(id, updates);

      res.json(updatedProduce);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/produce/:id', authenticate, async (req, res) => {
    try {
      // Only farmers can delete produce
      if (req.body.userRole !== 'farmer') {
        return res.status(403).json({ message: 'Only farmers can delete produce' });
      }

      const id = parseInt(req.params.id);
      const produce = await storage.getProduce(id);

      if (!produce) {
        return res.status(404).json({ message: 'Produce not found' });
      }

      // Farmers can only delete their own produce
      if (produce.farmerId !== req.body.userId) {
        return res.status(403).json({ message: 'You can only delete your own produce' });
      }

      await storage.deleteProduce(id);
      res.json({ message: 'Produce deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Farm endpoints
  app.get('/api/farms', async (req, res) => {
    try {
      const featured = req.query.featured === 'true';
      const farms = await storage.getAllFarms(featured);

      res.json(farms);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/farms/featured', async (req, res) => {
    try {
      const featuredFarms = await storage.getFeaturedFarms();
      res.json(featuredFarms);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/farms/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const farm = await storage.getFarm(id);

      if (!farm) {
        return res.status(404).json({ message: 'Farm not found' });
      }

      const farmer = await storage.getUser(farm.farmerId);
      const produce = await storage.getProduceByFarmer(farm.farmerId);

      res.json({
        ...farm,
        farmer: farmer ? {
          id: farmer.id,
          name: farmer.name,
        } : null,
        produce
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/farms', authenticate, async (req, res) => {
    try {
      // Only farmers can create farms
      if (req.body.userRole !== 'farmer') {
        return res.status(403).json({ message: 'Only farmers can create farms' });
      }

      // Check if farmer already has a farm
      const existingFarm = await storage.getFarmByFarmer(req.body.userId);
      if (existingFarm) {
        return res.status(400).json({ message: 'You already have a farm' });
      }

      const farmData = insertFarmSchema.parse({
        ...req.body.farm,
        farmerId: req.body.userId
      });

      const newFarm = await storage.createFarm(farmData);
      res.status(201).json(newFarm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/farms/:id', authenticate, async (req, res) => {
    try {
      // Only farmers can update farms
      if (req.body.userRole !== 'farmer') {
        return res.status(403).json({ message: 'Only farmers can update farms' });
      }

      const id = parseInt(req.params.id);
      const farm = await storage.getFarm(id);

      if (!farm) {
        return res.status(404).json({ message: 'Farm not found' });
      }

      // Farmers can only update their own farm
      if (farm.farmerId !== req.body.userId) {
        return res.status(403).json({ message: 'You can only update your own farm' });
      }

      const updates = req.body.updates;
      const updatedFarm = await storage.updateFarm(id, updates);

      res.json(updatedFarm);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // AI Forecasting endpoints
  app.post('/api/forecasts/generate', authenticate, async (req, res) => {
    try {
      // Only farmers can generate forecasts
      if (req.body.userRole !== 'farmer') {
        return res.status(403).json({ message: 'Only farmers can generate forecasts' });
      }

      const { produceId, forecastStartDate, forecastEndDate, daysInterval } = req.body;
      
      if (!produceId || !forecastStartDate || !forecastEndDate || !daysInterval) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      // Verify that produce belongs to the farmer
      const produce = await storage.getProduce(produceId);
      if (!produce) {
        return res.status(404).json({ message: 'Produce not found' });
      }
      
      if (produce.farmerId !== req.body.userId) {
        return res.status(403).json({ message: 'You can only generate forecasts for your own produce' });
      }

      // Check if we have the OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: 'OpenAI API key is not configured' });
      }

      const forecast = await generateDemandForecast({
        produceId,
        farmerId: req.body.userId,
        forecastStartDate,
        forecastEndDate,
        daysInterval
      });

      res.json(forecast);
    } catch (error: any) {
      console.error('Error generating forecast:', error);
      res.status(500).json({ 
        message: 'Error generating forecast', 
        error: error.message || 'Unknown error'
      });
    }
  });

  app.get('/api/forecasts/latest', authenticate, async (req, res) => {
    try {
      // Only farmers can view forecasts
      if (req.body.userRole !== 'farmer') {
        return res.status(403).json({ message: 'Only farmers can view forecasts' });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const forecasts = await getLatestForecasts(req.body.userId, limit);

      res.json(forecasts);
    } catch (error: any) {
      console.error('Error fetching forecasts:', error);
      res.status(500).json({ 
        message: 'Error fetching forecasts', 
        error: error.message || 'Unknown error'
      });
    }
  });

  app.get('/api/forecasts/product/:id', authenticate, async (req, res) => {
    try {
      // Only farmers can view forecasts
      if (req.body.userRole !== 'farmer') {
        return res.status(403).json({ message: 'Only farmers can view forecasts' });
      }

      const produceId = parseInt(req.params.id);
      
      // Verify that produce belongs to the farmer
      const produce = await storage.getProduce(produceId);
      if (!produce) {
        return res.status(404).json({ message: 'Produce not found' });
      }
      
      if (produce.farmerId !== req.body.userId) {
        return res.status(403).json({ message: 'You can only view forecasts for your own produce' });
      }

      const forecasts = await getProductForecasts(produceId, req.body.userId);

      res.json(forecasts);
    } catch (error: any) {
      console.error('Error fetching product forecasts:', error);
      res.status(500).json({ 
        message: 'Error fetching product forecasts', 
        error: error.message || 'Unknown error'
      });
    }
  });

  // AI-Enhanced Features
  app.post('/api/ai/price-optimize', authenticate, async (req, res) => {
    try {
      if (req.body.userRole !== 'farmer') {
        return res.status(403).json({ message: 'Only farmers can optimize pricing' });
      }

      const { produceId, currentPrice } = req.body;
      
      if (!produceId || !currentPrice) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: 'AI service not configured' });
      }

      const optimization = await optimizePrice(produceId, req.body.userId, currentPrice);
      res.json(optimization);
    } catch (error: any) {
      console.error('Price optimization error:', error);
      res.status(500).json({ 
        message: 'Failed to optimize price', 
        error: error.message 
      });
    }
  });

  app.get('/api/ai/recommendations/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const context = req.query.context as 'browsing' | 'cart' | 'purchase' || 'browsing';

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: 'AI service not configured' });
      }

      const recommendations = await generateRecommendations(userId, context);
      res.json(recommendations);
    } catch (error: any) {
      console.error('Recommendations error:', error);
      res.status(500).json({ 
        message: 'Failed to generate recommendations', 
        error: error.message 
      });
    }
  });

  app.post('/api/ai/assess-quality', authenticate, async (req, res) => {
    try {
      if (req.body.userRole !== 'farmer') {
        return res.status(403).json({ message: 'Only farmers can assess crop quality' });
      }

      const { base64Image, cropType } = req.body;
      
      if (!base64Image || !cropType) {
        return res.status(400).json({ message: 'Missing image or crop type' });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: 'AI service not configured' });
      }

      const assessment = await assessCropQuality(base64Image, cropType);
      res.json(assessment);
    } catch (error: any) {
      console.error('Quality assessment error:', error);
      res.status(500).json({ 
        message: 'Failed to assess quality', 
        error: error.message 
      });
    }
  });

  app.post('/api/ai/optimize-harvest', authenticate, async (req, res) => {
    try {
      if (req.body.userRole !== 'farmer') {
        return res.status(403).json({ message: 'Only farmers can optimize harvest timing' });
      }

      const { produceId } = req.body;
      
      if (!produceId) {
        return res.status(400).json({ message: 'Missing produce ID' });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: 'AI service not configured' });
      }

      const optimization = await optimizeHarvestTiming(produceId, req.body.userId);
      res.json(optimization);
    } catch (error: any) {
      console.error('Harvest optimization error:', error);
      res.status(500).json({ 
        message: 'Failed to optimize harvest timing', 
        error: error.message 
      });
    }
  });

  app.post('/api/ai/optimize-route', authenticate, async (req, res) => {
    try {
      if (req.body.userRole !== 'driver') {
        return res.status(403).json({ message: 'Only drivers can optimize routes' });
      }

      const { deliveryIds } = req.body;
      
      if (!deliveryIds || !Array.isArray(deliveryIds)) {
        return res.status(400).json({ message: 'Missing delivery IDs array' });
      }

      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: 'AI service not configured' });
      }

      const optimization = await optimizeDeliveryRoute(req.body.userId, deliveryIds);
      res.json(optimization);
    } catch (error: any) {
      console.error('Route optimization error:', error);
      res.status(500).json({ 
        message: 'Failed to optimize route', 
        error: error.message 
      });
    }
  });

  // Vehicle endpoints
  app.get('/api/vehicles/driver/:driverId', async (req, res) => {
    try {
      const driverId = parseInt(req.params.driverId);
      const vehicle = await storage.getVehicleByDriver(driverId);

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/vehicles', authenticate, async (req, res) => {
    try {
      // Only drivers can create vehicles
      if (req.body.userRole !== 'driver') {
        return res.status(403).json({ message: 'Only drivers can register vehicles' });
      }

      // Check if driver already has a vehicle
      const existingVehicle = await storage.getVehicleByDriver(req.body.userId);
      if (existingVehicle) {
        return res.status(400).json({ message: 'You already have a registered vehicle' });
      }

      const vehicleData = insertVehicleSchema.parse({
        ...req.body.vehicle,
        driverId: req.body.userId
      });

      const newVehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(newVehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/vehicles/:id', authenticate, async (req, res) => {
    try {
      // Only drivers can update vehicles
      if (req.body.userRole !== 'driver') {
        return res.status(403).json({ message: 'Only drivers can update vehicles' });
      }

      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(id);

      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }

      // Drivers can only update their own vehicle
      if (vehicle.driverId !== req.body.userId) {
        return res.status(403).json({ message: 'You can only update your own vehicle' });
      }

      const updates = req.body.updates;
      const updatedVehicle = await storage.updateVehicle(id, updates);

      res.json(updatedVehicle);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Order endpoints
  app.get('/api/orders', authenticate, async (req, res) => {
    try {
      let orders = [];

      // Buyers see their orders
      if (req.body.userRole === 'buyer') {
        orders = await storage.getOrdersByBuyer(req.body.userId);
      } 
      // Drivers see their assigned orders
      else if (req.body.userRole === 'driver') {
        orders = await storage.getOrdersByDriver(req.body.userId);
      }
      // Farmers see orders containing their produce
      else if (req.body.userRole === 'farmer') {
        const orderItems = await storage.getOrderItemsByFarmer(req.body.userId);
        const orderIds = [...new Set(orderItems.map(item => item.orderId))];
        orders = await Promise.all(orderIds.map(id => storage.getOrder(id)));
        orders = orders.filter(order => order !== undefined);
      }

      // Enrich orders with items
      const enrichedOrders = await Promise.all(orders.map(async (order) => {
        const items = await storage.getOrderItemsByOrder(order.id);
        return { ...order, items };
      }));

      res.json(enrichedOrders);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/orders/:id', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Access control check
      if (
        req.body.userRole === 'buyer' && order.buyerId !== req.body.userId ||
        req.body.userRole === 'driver' && order.driverId !== req.body.userId
      ) {
        return res.status(403).json({ message: 'You do not have access to this order' });
      }

      // If farmer, check if they have items in this order
      if (req.body.userRole === 'farmer') {
        const orderItems = await storage.getOrderItemsByOrder(id);
        const hasItemsFromFarmer = orderItems.some(item => item.farmerId === req.body.userId);

        if (!hasItemsFromFarmer) {
          return res.status(403).json({ message: 'You do not have access to this order' });
        }
      }

      // Get order items
      const items = await storage.getOrderItemsByOrder(id);

      // Get delivery if exists
      const delivery = await storage.getDeliveryByOrder(id);

      res.json({
        ...order,
        items,
        delivery
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/orders', authenticate, async (req, res) => {
    try {
      // Only buyers can create orders
      if (req.body.userRole !== 'buyer') {
        return res.status(403).json({ message: 'Only buyers can create orders' });
      }

      const orderData = insertOrderSchema.parse({
        ...req.body.order,
        buyerId: req.body.userId
      });

      // Create the order
      const newOrder = await storage.createOrder(orderData);

      // Create order items
      const orderItems = req.body.items;
      if (!Array.isArray(orderItems) || orderItems.length === 0) {
        await storage.updateOrder(newOrder.id, { status: 'cancelled' });
        return res.status(400).json({ message: 'Order must have at least one item' });
      }

      // Create each order item
      const createdItems = [];
      for (const item of orderItems) {
        const produce = await storage.getProduce(item.produceId);
        if (!produce) {
          continue;
        }

        const orderItemData = insertOrderItemSchema.parse({
          orderId: newOrder.id,
          produceId: item.produceId,
          farmerId: produce.farmerId,
          quantity: item.quantity,
          unitPrice: produce.price
        });

        const newOrderItem = await storage.createOrderItem(orderItemData);
        createdItems.push(newOrderItem);

        // Update produce quantity
        const newQuantity = produce.quantity - item.quantity;
        await storage.updateProduce(produce.id, { 
          quantity: newQuantity,
          status: newQuantity <= 0 ? 'out_of_stock' : 'active'
        });
      }

      // Notify farmers
      const farmerIds = [...new Set(createdItems.map(item => item.farmerId))];
      farmerIds.forEach(farmerId => {
        wsManager.notifyUser(farmerId, {
          type: 'newOrder',
          data: {
            orderId: newOrder.id,
            message: 'You have a new order'
          }
        });
      });

      res.status(201).json({
        ...newOrder,
        items: createdItems
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/orders/:id', authenticate, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const order = await storage.getOrder(id);

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      let finalUpdates = { ...req.body.updates };

      // Access control and validation based on role
      if (req.body.userRole === 'buyer') {
        // Buyers can only update their own orders and only certain fields
        if (order.buyerId !== req.body.userId) {
          return res.status(403).json({ message: 'You can only update your own orders' });
        }

        // Buyers can only cancel orders if they're still pending
        if (finalUpdates.status === 'cancelled' && order.status === 'pending') {
          // Allow cancellation
        } else {
          // Restrict other updates
          const { deliveryAddress } = finalUpdates;
          finalUpdates = { deliveryAddress };
          return await storage.updateOrder(id, finalUpdates);
        }
      } 
      else if (req.body.userRole === 'driver') {
        // Drivers can only update orders assigned to them
        if (order.driverId !== req.body.userId) {
          return res.status(403).json({ message: 'You can only update orders assigned to you' });
        }

        // Drivers can only update status and estimatedDeliveryTime
        const { status, estimatedDeliveryTime, ...restrictedUpdates } = updates;
        const allowedUpdates = { status, estimatedDeliveryTime };
        return await storage.updateOrder(id, allowedUpdates);
      }
      else if (req.body.userRole === 'farmer') {
        // For farmers, we need to check if they have items in this order
        const orderItems = await storage.getOrderItemsByOrder(id);
        const farmerItems = orderItems.filter(item => item.farmerId === req.body.userId);

        if (farmerItems.length === 0) {
          return res.status(403).json({ message: 'You do not have items in this order' });
        }

        // Farmers can only confirm or reject their own items
        // We'll handle this separately
        return res.status(403).json({ message: 'Farmers should update order items directly' });
      }

      const updatedOrder = await storage.updateOrder(id, updates);

      // Send notification about order update
      wsManager.broadcastOrderUpdate(id, updatedOrder.status);

      // Notify specific users
      if (updatedOrder.status === 'confirmed') {
        // Notify drivers about new available orders
        wsManager.notifyByRole('driver', {
          type: 'availableOrder',
          data: {
            orderId: id,
            message: 'New order available for delivery'
          }
        });
      }

      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Order Items endpoints for farmers
  app.put('/api/order-items/:id', authenticate, async (req, res) => {
    try {
      // Only farmers can update order items
      if (req.body.userRole !== 'farmer') {
        return res.status(403).json({ message: 'Only farmers can update order items' });
      }

      const id = parseInt(req.params.id);
      const orderItem = await storage.getOrderItem(id);

      if (!orderItem) {
        return res.status(404).json({ message: 'Order item not found' });
      }

      // Farmers can only update their own items
      if (orderItem.farmerId !== req.body.userId) {
        return res.status(403).json({ message: 'You can only update your own order items' });
      }

      const updates = req.body.updates;

      // Farmers can only update status
      const { status, ...restrictedUpdates } = updates;
      const allowedUpdates = { status };

      const updatedOrderItem = await storage.updateOrderItem(id, allowedUpdates);

      // Get all items for this order
      const allOrderItems = await storage.getOrderItemsByOrder(orderItem.orderId);

      // If all items are confirmed, update order status
      if (allOrderItems.every(item => item.status === 'confirmed')) {
        await storage.updateOrder(orderItem.orderId, { status: 'confirmed' });

        // Notify drivers
        wsManager.notifyByRole('driver', {
          type: 'availableOrder',
          data: {
            orderId: orderItem.orderId,
            message: 'New order available for delivery'
          }
        });
      }

      // If any item is rejected, update order message
      if (updatedOrderItem.status === 'rejected') {
        // Notify buyer
        const order = await storage.getOrder(orderItem.orderId);
        if (order) {
          wsManager.notifyUser(order.buyerId, {
            type: 'orderItemRejected',
            data: {
              orderId: orderItem.orderId,
              itemId: id,
              message: 'An item in your order was rejected by the farmer'
            }
          });
        }
      }

      res.json(updatedOrderItem);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Driver-specific endpoints
  app.get('/api/available-orders', authenticate, async (req, res) => {
    try {
      // Only drivers can see available orders
      if (req.body.userRole !== 'driver') {
        return res.status(403).json({ message: 'Only drivers can view available orders' });
      }

      const availableOrders = await storage.getAvailableOrders();

      // Enrich orders with items and pickup locations
      const enrichedOrders = await Promise.all(availableOrders.map(async (order) => {
        const items = await storage.getOrderItemsByOrder(order.id);
        const farmerIds = [...new Set(items.map(item => item.farmerId))];

        const farms = await Promise.all(
          farmerIds.map(async (farmerId) => storage.getFarmByFarmer(farmerId))
        );

        return { 
          ...order, 
          items,
          pickupLocations: farms
            .filter(farm => farm !== undefined)
            .map(farm => ({
              id: farm.id,
              name: farm.name,
              address: farm.address
            }))
        };
      }));

      res.json(enrichedOrders);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/deliveries', authenticate, async (req, res) => {
    try {
      // Only drivers can create deliveries
      if (req.body.userRole !== 'driver') {
        return res.status(403).json({ message: 'Only drivers can create deliveries' });
      }

      const { orderId } = req.body;
      if (!orderId) {
        return res.status(400).json({ message: 'Order ID is required' });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Check if order is available
      if (order.status !== 'confirmed' || order.driverId) {
        return res.status(400).json({ message: 'Order is not available for delivery' });
      }

      // Get order items to determine pickup locations
      const items = await storage.getOrderItemsByOrder(orderId);
      const farmerIds = [...new Set(items.map(item => item.farmerId))];

      // Get pickup locations (farms)
      const farms = await Promise.all(
        farmerIds.map(async (farmerId) => storage.getFarmByFarmer(farmerId))
      );

      // Create pickup locations string
      const pickupLocations = farms
        .filter(farm => farm !== undefined)
        .map(farm => farm.address)
        .join('; ');

      // Update order with driver ID and status
      await storage.updateOrder(orderId, {
        driverId: req.body.userId,
        status: 'in_transit',
        estimatedDeliveryTime: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      });

      // Create delivery record
      const deliveryData = {
        orderId,
        driverId: req.body.userId,
        pickupLocation: pickupLocations,
        deliveryLocation: order.deliveryAddress,
        distance: req.body.distance || 10, // default to 10km if not provided
        route: req.body.route || null
      };

      const newDelivery = await storage.createDelivery(deliveryData);

      // Notify buyer
      wsManager.notifyUser(order.buyerId, {
        type: 'deliveryCreated',
        data: {
          orderId,
          deliveryId: newDelivery.id,
          message: 'Your order is now in transit'
        }
      });

      res.status(201).json(newDelivery);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/deliveries/:id', authenticate, async (req, res) => {
    try {
      // Only drivers can update deliveries
      if (req.body.userRole !== 'driver') {
        return res.status(403).json({ message: 'Only drivers can update deliveries' });
      }

      const id = parseInt(req.params.id);
      const delivery = await storage.getDelivery(id);

      if (!delivery) {
        return res.status(404).json({ message: 'Delivery not found' });
      }

      // Drivers can only update their own deliveries
      if (delivery.driverId !== req.body.userId) {
        return res.status(403).json({ message: 'You can only update your own deliveries' });
      }

      const updates = req.body.updates;
      const updatedDelivery = await storage.updateDelivery(id, updates);

      // If delivery is completed, update order status
      if (updates.status === 'completed') {
        await storage.updateOrder(delivery.orderId, {
          status: 'delivered',
          actualDeliveryTime: new Date()
        });

        // Notify buyer
        const order = await storage.getOrder(delivery.orderId);
        if (order) {
          wsManager.notifyUser(order.buyerId, {
            type: 'deliveryCompleted',
            data: {
              orderId: delivery.orderId,
              deliveryId: id,
              message: 'Your order has been delivered'
            }
          });
        }
      }

      // Broadcast delivery update
      wsManager.broadcastDeliveryUpdate(
        id, 
        updatedDelivery.status, 
        req.body.currentLocation
      );

      res.json(updatedDelivery);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Payment integration (mock)
  app.post('/api/payments/initialize', authenticate, async (req, res) => {
    try {
      const { orderId, amount, paymentMethod } = req.body;

      if (!orderId || !amount || !paymentMethod) {
        return res.status(400).json({ message: 'Order ID, amount, and payment method are required' });
      }

      const order = await storage.getOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // In a real implementation, we would call payment gateway API
      // For demo, we'll simulate a successful payment

      // Update order payment status
      await storage.updateOrder(orderId, {
        paymentStatus: 'paid',
        paymentMethod
      });

      res.json({
        success: true,
        reference: `PAY-${Date.now()}`,
        message: 'Payment successful'
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Route optimization endpoint (mock)
  app.post('/api/route/optimize', authenticate, async (req, res) => {
    try {
      const { origins, destination } = req.body;

      if (!origins || !Array.isArray(origins) || !destination) {
        return res.status(400).json({ message: 'Origins array and destination are required' });
      }

      // In a real implementation, we would call Google Maps API
      // For demo, we'll return a mock route

      // Calculate a mock ETA (5-15 minutes per stop)
      const stops = origins.length;
      const etaMinutes = 5 + (stops * 10);
      const eta = new Date(Date.now() + etaMinutes * 60 * 1000);

      // Calculate mock distance (2-5km per stop)
      const distance = 2 + (stops * 3);

      res.json({
        success: true,
        route: {
          origins,
          destination,
          waypoints: origins.map((origin, index) => ({
            location: origin,
            stopOrder: index + 1
          })),
          eta,
          distance,
          duration: etaMinutes,
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // USSD and WhatsApp integration
  app.post('/api/ussd', async (req, res) => {
    try {
      const { sessionId, phoneNumber, text } = req.body;

      if (!sessionId || !phoneNumber) {
        return res.status(400).json({ message: 'Session ID and phone number are required' });
      }

      const response = await processUSSDRequest(text || '', phoneNumber, sessionId);

      // USSD responses are returned as CON (to continue) or END (to end session)
      const responseType = text && text.toLowerCase() === 'exit' ? 'END' : 'CON';
      res.send(`${responseType} ${response}`);
    } catch (error) {
      console.error('Error handling USSD request:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // WhatsApp webhook endpoint
  app.post('/api/whatsapp/webhook', async (req, res) => {
    try {
      const { Body, From } = req.body;

      if (!Body || !From) {
        return res.status(400).json({ message: 'Message body and sender are required' });
      }

      const response = await processWhatsAppRequest(Body, From);

      // Return response in TwiML format
      res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${response}</Message></Response>`);
    } catch (error) {
      console.error('Error handling WhatsApp webhook:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // WhatsApp direct message sending endpoint
  app.post('/api/whatsapp/send', async (req, res) => {
    try {
      const { to, message } = req.body;

      if (!to || !message) {
        return res.status(400).json({ message: 'Recipient phone number and message are required' });
      }

      const success = await sendWhatsAppMessage(to, message);

      if (success) {
        res.json({ success: true, message: 'Message sent successfully' });
      } else {
        // This is not an error state, it's just that the message was logged but not actually sent
        // because we're using placeholder credentials
        res.json({ success: true, message: 'Message logged (using placeholder credentials)' });
      }
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Forecast endpoints
  app.post('/api/forecasts/generate', authenticate, async (req, res) => {
    try {
      // Only farmers can generate forecasts
      if (req.body.userRole !== 'farmer') {
        return res.status(403).json({ 
          message: 'Only farmers can generate demand forecasts' 
        });
      }

      const { produceId, forecastStartDate, forecastEndDate, daysInterval } = req.body;
      
      if (!produceId || !forecastStartDate || !forecastEndDate || !daysInterval) {
        return res.status(400).json({ 
          message: 'Missing required parameters for forecast generation' 
        });
      }

      // Verify the produce belongs to the farmer
      const produce = await storage.getProduce(produceId);
      if (!produce) {
        return res.status(404).json({ message: 'Produce not found' });
      }
      
      if (produce.farmerId !== req.body.userId) {
        return res.status(403).json({ 
          message: 'You can only generate forecasts for your own produce' 
        });
      }

      const forecastRequest = {
        produceId,
        farmerId: req.body.userId,
        forecastStartDate,
        forecastEndDate,
        daysInterval
      };

      const forecast = await generateDemandForecast(forecastRequest);
      res.json(forecast);
    } catch (error) {
      console.error('Error generating forecast:', error);
      res.status(500).json({ 
        message: 'Error generating forecast', 
        error: error.message 
      });
    }
  });

  app.get('/api/forecasts/latest', authenticate, async (req, res) => {
    try {
      // Only farmers can view forecasts
      if (req.body.userRole !== 'farmer') {
        return res.status(403).json({ 
          message: 'Only farmers can view demand forecasts' 
        });
      }

      const farmerId = req.body.userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const forecasts = await getLatestForecasts(farmerId, limit);
      res.json(forecasts);
    } catch (error) {
      console.error('Error retrieving forecasts:', error);
      res.status(500).json({ 
        message: 'Error retrieving forecasts', 
        error: error.message 
      });
    }
  });

  app.get('/api/forecasts/product/:id', authenticate, async (req, res) => {
    try {
      // Only farmers can view forecasts
      if (req.body.userRole !== 'farmer') {
        return res.status(403).json({ 
          message: 'Only farmers can view demand forecasts' 
        });
      }

      const produceId = parseInt(req.params.id);
      const farmerId = req.body.userId;
      
      if (isNaN(produceId)) {
        return res.status(400).json({ message: 'Invalid produce ID' });
      }

      // Verify the produce belongs to the farmer
      const produce = await storage.getProduce(produceId);
      if (!produce) {
        return res.status(404).json({ message: 'Produce not found' });
      }
      
      if (produce.farmerId !== farmerId) {
        return res.status(403).json({ 
          message: 'You can only view forecasts for your own produce' 
        });
      }

      const forecasts = await getProductForecasts(produceId, farmerId);
      res.json(forecasts);
    } catch (error) {
      console.error('Error retrieving product forecasts:', error);
      res.status(500).json({ 
        message: 'Error retrieving product forecasts', 
        error: error.message 
      });
    }
  });

  return httpServer;
}