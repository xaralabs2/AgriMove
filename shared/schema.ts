import { pgTable, text, serial, integer, boolean, jsonb, timestamp, real, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("buyer"), // buyer, farmer, transporter
  phone: text("phone").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  location: text("location"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  address: text("address"),
  locationUpdatedAt: timestamp("location_updated_at"),
  profilePicture: text("profile_picture"),
  rating: real("rating").default(0),
  totalRatings: integer("total_ratings").default(0),
  wallet: real("wallet").default(0),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  rating: true,
  totalRatings: true,
  wallet: true,
  verified: true,
  createdAt: true,
});

export const produce = pgTable("produce", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  unit: text("unit").notNull(), // kg, box, piece, etc.
  quantity: real("quantity").notNull(),
  category: text("category").notNull(),
  image: text("image"),
  status: text("status").notNull().default("active"), // active, out_of_stock, inactive
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertProduceSchema = createInsertSchema(produce).omit({
  id: true,
  createdAt: true,
});

export const farms = pgTable("farms", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  image: text("image"),
  rating: real("rating").default(0),
  totalRatings: integer("total_ratings").default(0),
  featured: boolean("featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFarmSchema = createInsertSchema(farms).omit({
  id: true,
  rating: true,
  totalRatings: true,
  featured: true,
  createdAt: true,
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id").notNull(),
  type: text("type").notNull(), // bike, tricycle, van, etc.
  licensePlate: text("license_plate").notNull(),
  capacity: real("capacity").notNull(), // in kg
  status: text("status").notNull().default("available"), // available, busy, offline
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  status: true,
  createdAt: true,
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull(),
  total: real("total").notNull(),
  deliveryFee: real("delivery_fee").default(0),
  status: text("status").notNull().default("pending"), // pending, confirmed, in_transit, delivered, cancelled
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, failed
  paymentMethod: text("payment_method"),
  deliveryAddress: text("delivery_address").notNull(),
  driverId: integer("driver_id"),
  estimatedDeliveryTime: timestamp("estimated_delivery_time"),
  actualDeliveryTime: timestamp("actual_delivery_time"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  status: true,
  paymentStatus: true,
  driverId: true,
  estimatedDeliveryTime: true,
  actualDeliveryTime: true,
  createdAt: true,
  updatedAt: true,
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  produceId: integer("produce_id").notNull(),
  farmerId: integer("farmer_id").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  status: true,
  createdAt: true,
});

export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().unique(),
  driverId: integer("driver_id").notNull(),
  pickupLocation: text("pickup_location").notNull(),
  deliveryLocation: text("delivery_location").notNull(),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  route: jsonb("route"), // JSON containing route details
  distance: real("distance"), // in km
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  status: true,
  startTime: true,
  endTime: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Produce = typeof produce.$inferSelect;
export type InsertProduce = z.infer<typeof insertProduceSchema>;

export type Farm = typeof farms.$inferSelect;
export type InsertFarm = z.infer<typeof insertFarmSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;

// Utility schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const phoneVerificationSchema = z.object({
  phone: z.string().min(10, "Valid phone number is required"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

// Sales history and demand forecasting
export const salesHistory = pgTable("sales_history", {
  id: serial("id").primaryKey(),
  produceId: integer("produce_id").notNull(),
  farmerId: integer("farmer_id").notNull(),
  date: date("date").notNull(),
  quantity: real("quantity").notNull(),
  totalAmount: real("total_amount").notNull(),
  unitPrice: real("unit_price").notNull(),
  seasonality: text("seasonality"), // rainy, dry, harvest, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSalesHistorySchema = createInsertSchema(salesHistory).omit({
  id: true,
  createdAt: true,
});

export const demandForecasts = pgTable("demand_forecasts", {
  id: serial("id").primaryKey(),
  produceId: integer("produce_id").notNull(),
  farmerId: integer("farmer_id").notNull(),
  forecastDate: date("forecast_date").notNull(),
  estimatedDemand: real("estimated_demand").notNull(), // estimated quantity
  confidenceScore: real("confidence_score").notNull(), // 0-100%
  factors: jsonb("factors"), // JSON containing factors that influenced prediction
  model: text("model").notNull(), // model used for prediction
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertDemandForecastSchema = createInsertSchema(demandForecasts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SalesHistory = typeof salesHistory.$inferSelect;
export type InsertSalesHistory = z.infer<typeof insertSalesHistorySchema>;

export type DemandForecast = typeof demandForecasts.$inferSelect;
export type InsertDemandForecast = z.infer<typeof insertDemandForecastSchema>;

export type LoginPayload = z.infer<typeof loginSchema>;
export type PhoneVerificationPayload = z.infer<typeof phoneVerificationSchema>;
