import {
  users, produce, farms, vehicles, orders, orderItems, deliveries,
  salesHistory, demandForecasts,
  User, InsertUser, Produce, InsertProduce, Farm, InsertFarm,
  Vehicle, InsertVehicle, Order, InsertOrder, OrderItem, InsertOrderItem,
  Delivery, InsertDelivery, SalesHistory, InsertSalesHistory,
  DemandForecast, InsertDemandForecast
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ne, isNotNull } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserLocation(id: number, location: { latitude: number; longitude: number; address?: string }): Promise<User | undefined>;
  getNearbyUsers(userLocation: { latitude: number; longitude: number }, radius?: number, excludeUserId?: number): Promise<User[]>;
  
  // Produce operations
  getProduce(id: number): Promise<Produce | undefined>;
  getProduceByFarmer(farmerId: number): Promise<Produce[]>;
  getAllProduce(category?: string): Promise<Produce[]>;
  createProduce(produce: InsertProduce): Promise<Produce>;
  updateProduce(id: number, updates: Partial<Produce>): Promise<Produce | undefined>;
  deleteProduce(id: number): Promise<boolean>;
  
  // Farm operations
  getFarm(id: number): Promise<Farm | undefined>;
  getFarmByFarmer(farmerId: number): Promise<Farm | undefined>;
  getAllFarms(featured?: boolean): Promise<Farm[]>;
  createFarm(farm: InsertFarm): Promise<Farm>;
  updateFarm(id: number, updates: Partial<Farm>): Promise<Farm | undefined>;
  
  // Vehicle operations
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehicleByDriver(driverId: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, updates: Partial<Vehicle>): Promise<Vehicle | undefined>;
  
  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersByBuyer(buyerId: number): Promise<Order[]>;
  getOrdersByDriver(driverId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined>;
  
  // Order Item operations
  getOrderItem(id: number): Promise<OrderItem | undefined>;
  getOrderItemsByOrder(orderId: number): Promise<OrderItem[]>;
  getOrderItemsByFarmer(farmerId: number): Promise<OrderItem[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, updates: Partial<OrderItem>): Promise<OrderItem | undefined>;
  
  // Delivery operations
  getDelivery(id: number): Promise<Delivery | undefined>;
  getDeliveryByOrder(orderId: number): Promise<Delivery | undefined>;
  getDeliveriesByDriver(driverId: number): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDelivery(id: number, updates: Partial<Delivery>): Promise<Delivery | undefined>;
  
  // Sales History operations
  getSalesHistory(id: number): Promise<SalesHistory | undefined>;
  getSalesHistoryByProduct(produceId: number, farmerId: number): Promise<SalesHistory[]>;
  getSalesHistoryByFarmer(farmerId: number): Promise<SalesHistory[]>;
  createSalesHistory(salesHistory: InsertSalesHistory): Promise<SalesHistory>;
  
  // Demand Forecast operations
  getDemandForecast(id: number): Promise<DemandForecast | undefined>;
  getDemandForecastsByProduct(produceId: number, farmerId: number): Promise<DemandForecast[]>;
  getLatestDemandForecasts(farmerId: number, limit?: number): Promise<DemandForecast[]>;
  createDemandForecast(forecast: InsertDemandForecast): Promise<DemandForecast>;
  
  // Custom operations
  getAvailableOrders(): Promise<Order[]>;
  getFeaturedFarms(): Promise<Farm[]>;
  getProduceWithFarmInfo(): Promise<any[]>;
}

// In-memory storage implementation (for reference and fallback)
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private produce: Map<number, Produce>;
  private farms: Map<number, Farm>;
  private vehicles: Map<number, Vehicle>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private deliveries: Map<number, Delivery>;
  
  private userIdCounter: number;
  private produceIdCounter: number;
  private farmIdCounter: number;
  private vehicleIdCounter: number;
  private orderIdCounter: number;
  private orderItemIdCounter: number;
  private deliveryIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.produce = new Map();
    this.farms = new Map();
    this.vehicles = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.deliveries = new Map();
    
    this.userIdCounter = 1;
    this.produceIdCounter = 1;
    this.farmIdCounter = 1;
    this.vehicleIdCounter = 1;
    this.orderIdCounter = 1;
    this.orderItemIdCounter = 1;
    this.deliveryIdCounter = 1;
    
    this.initializeDemoData();
  }
  
  // Methods from the original MemStorage implementation...
  // (Shortened for brevity)
  
  private initializeDemoData() {
    // Initialize with demo data for development
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  // Other methods...
  
  async getProduceWithFarmInfo(): Promise<any[]> {
    const result = [];
    
    for (const [_, produceItem] of this.produce) {
      const farm = this.farms.get(produceItem.farmerId);
      result.push({
        ...produceItem,
        farm
      });
    }
    
    return result;
  }
}

// Database Storage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updatedUser;
  }

  async updateUserLocation(id: number, location: { latitude: number; longitude: number; address?: string }): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address,
        locationUpdatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getNearbyUsers(userLocation: { latitude: number; longitude: number }, radius: number = 50, excludeUserId?: number): Promise<User[]> {
    const nearbyUsers = await db
      .select()
      .from(users)
      .where(
        and(
          isNotNull(users.latitude),
          isNotNull(users.longitude),
          excludeUserId ? ne(users.id, excludeUserId) : undefined
        )
      );

    // Filter by distance using Haversine formula
    return nearbyUsers.filter(user => {
      if (!user.latitude || !user.longitude) return false;
      
      const distance = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        user.latitude,
        user.longitude
      );
      
      return distance <= radius;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async getProduce(id: number): Promise<Produce | undefined> {
    const [item] = await db.select().from(produce).where(eq(produce.id, id));
    return item;
  }

  async getProduceByFarmer(farmerId: number): Promise<Produce[]> {
    return await db.select().from(produce).where(eq(produce.farmerId, farmerId));
  }

  async getAllProduce(category?: string): Promise<Produce[]> {
    if (category) {
      return await db.select().from(produce).where(eq(produce.category, category));
    }
    return await db.select().from(produce);
  }

  async createProduce(item: InsertProduce): Promise<Produce> {
    const [newProduce] = await db.insert(produce).values(item).returning();
    return newProduce;
  }

  async updateProduce(id: number, updates: Partial<Produce>): Promise<Produce | undefined> {
    const [updatedProduce] = await db.update(produce).set(updates).where(eq(produce.id, id)).returning();
    return updatedProduce;
  }

  async deleteProduce(id: number): Promise<boolean> {
    const result = await db.delete(produce).where(eq(produce.id, id));
    return true; // Neon serverless doesn't return count, so we assume success
  }

  async getFarm(id: number): Promise<Farm | undefined> {
    const [farm] = await db.select().from(farms).where(eq(farms.id, id));
    return farm;
  }

  async getFarmByFarmer(farmerId: number): Promise<Farm | undefined> {
    const [farm] = await db.select().from(farms).where(eq(farms.farmerId, farmerId));
    return farm;
  }

  async getAllFarms(featured?: boolean): Promise<Farm[]> {
    if (featured) {
      return await db.select().from(farms).where(eq(farms.featured, true));
    }
    return await db.select().from(farms);
  }

  async createFarm(farm: InsertFarm): Promise<Farm> {
    const [newFarm] = await db.insert(farms).values(farm).returning();
    return newFarm;
  }

  async updateFarm(id: number, updates: Partial<Farm>): Promise<Farm | undefined> {
    const [updatedFarm] = await db.update(farms).set(updates).where(eq(farms.id, id)).returning();
    return updatedFarm;
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async getVehicleByDriver(driverId: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.driverId, driverId));
    return vehicle;
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const [newVehicle] = await db.insert(vehicles).values(vehicle).returning();
    return newVehicle;
  }

  async updateVehicle(id: number, updates: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const [updatedVehicle] = await db.update(vehicles).set(updates).where(eq(vehicles.id, id)).returning();
    return updatedVehicle;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrdersByBuyer(buyerId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.buyerId, buyerId));
  }

  async getOrdersByDriver(driverId: number): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.driverId, driverId));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async updateOrder(id: number, updates: Partial<Order>): Promise<Order | undefined> {
    const [updatedOrder] = await db.update(orders).set(updates).where(eq(orders.id, id)).returning();
    return updatedOrder;
  }

  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    const [item] = await db.select().from(orderItems).where(eq(orderItems.id, id));
    return item;
  }

  async getOrderItemsByOrder(orderId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async getOrderItemsByFarmer(farmerId: number): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.farmerId, farmerId));
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await db.insert(orderItems).values(orderItem).returning();
    return newItem;
  }

  async updateOrderItem(id: number, updates: Partial<OrderItem>): Promise<OrderItem | undefined> {
    const [updatedItem] = await db.update(orderItems).set(updates).where(eq(orderItems.id, id)).returning();
    return updatedItem;
  }

  async getDelivery(id: number): Promise<Delivery | undefined> {
    const [delivery] = await db.select().from(deliveries).where(eq(deliveries.id, id));
    return delivery;
  }

  async getDeliveryByOrder(orderId: number): Promise<Delivery | undefined> {
    const [delivery] = await db.select().from(deliveries).where(eq(deliveries.orderId, orderId));
    return delivery;
  }

  async getDeliveriesByDriver(driverId: number): Promise<Delivery[]> {
    return await db.select().from(deliveries).where(eq(deliveries.driverId, driverId));
  }

  async createDelivery(delivery: InsertDelivery): Promise<Delivery> {
    const [newDelivery] = await db.insert(deliveries).values(delivery).returning();
    return newDelivery;
  }

  async updateDelivery(id: number, updates: Partial<Delivery>): Promise<Delivery | undefined> {
    const [updatedDelivery] = await db.update(deliveries).set(updates).where(eq(deliveries.id, id)).returning();
    return updatedDelivery;
  }

  // Sales History operations
  async getSalesHistory(id: number): Promise<SalesHistory | undefined> {
    const [record] = await db.select().from(salesHistory).where(eq(salesHistory.id, id));
    return record;
  }

  async getSalesHistoryByProduct(produceId: number, farmerId: number): Promise<SalesHistory[]> {
    return await db.select()
      .from(salesHistory)
      .where(
        eq(salesHistory.produceId, produceId) && 
        eq(salesHistory.farmerId, farmerId)
      );
  }

  async getSalesHistoryByFarmer(farmerId: number): Promise<SalesHistory[]> {
    return await db.select()
      .from(salesHistory)
      .where(eq(salesHistory.farmerId, farmerId));
  }

  async createSalesHistory(history: InsertSalesHistory): Promise<SalesHistory> {
    const [record] = await db.insert(salesHistory).values(history).returning();
    return record;
  }

  // Demand Forecast operations
  async getDemandForecast(id: number): Promise<DemandForecast | undefined> {
    const [forecast] = await db.select().from(demandForecasts).where(eq(demandForecasts.id, id));
    return forecast;
  }

  async getDemandForecastsByProduct(produceId: number, farmerId: number): Promise<DemandForecast[]> {
    return await db.select()
      .from(demandForecasts)
      .where(
        eq(demandForecasts.produceId, produceId) && 
        eq(demandForecasts.farmerId, farmerId)
      );
  }

  async getLatestDemandForecasts(farmerId: number, limit: number = 10): Promise<DemandForecast[]> {
    const query = db.select()
      .from(demandForecasts)
      .where(eq(demandForecasts.farmerId, farmerId));
      
    // Apply ordering and limit after the where clause
    return query
      .orderBy(desc(demandForecasts.createdAt))
      .limit(limit);
  }

  async createDemandForecast(forecast: InsertDemandForecast): Promise<DemandForecast> {
    const [record] = await db.insert(demandForecasts).values(forecast).returning();
    return record;
  }

  // Custom operations
  async getAvailableOrders(): Promise<Order[]> {
    return await db.select()
      .from(orders)
      .where(eq(orders.status, 'pending'));
  }

  async getFeaturedFarms(): Promise<Farm[]> {
    return await db.select()
      .from(farms)
      .where(eq(farms.featured, true));
  }

  async getProduceWithFarmInfo(): Promise<any[]> {
    // This is a complex join query, simplified for now
    const result = await db.select()
      .from(produce)
      .leftJoin(farms, eq(produce.farmerId, farms.id));
    
    return result.map(row => ({
      ...row.produce,
      farm: row.farms
    }));
  }
}

// Export an instance of the database storage
export const storage = new DatabaseStorage();