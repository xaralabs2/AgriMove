import { db } from "./db";
import {
  users, produce, farms, vehicles,
  insertUserSchema, insertProduceSchema, insertFarmSchema, insertVehicleSchema
} from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  // First check if we already have data
  const existingUsers = await db.select().from(users);
  if (existingUsers.length > 0) {
    console.log("Database already has data, skipping seed");
    return;
  }

  // Create users
  const [buyer1] = await db.insert(users).values({
    username: "buyer1",
    password: "password123", // In production, use hashed passwords!
    role: "buyer",
    name: "John Buyer",
    phone: "+15551234567"
  }).returning();

  const [buyer2] = await db.insert(users).values({
    username: "buyer2",
    password: "password123",
    role: "buyer",
    name: "Sarah Consumer",
    phone: "+15552345678"
  }).returning();

  const [farmer1] = await db.insert(users).values({
    username: "farmer1",
    password: "password123",
    role: "farmer",
    name: "Tom Farmer",
    phone: "+15553456789"
  }).returning();

  const [farmer2] = await db.insert(users).values({
    username: "farmer2",
    password: "password123",
    role: "farmer",
    name: "Emily Grower",
    phone: "+15554567890"
  }).returning();

  const [driver1] = await db.insert(users).values({
    username: "driver1",
    password: "password123",
    role: "driver",
    name: "Mike Driver",
    phone: "+15555678901"
  }).returning();

  const [driver2] = await db.insert(users).values({
    username: "driver2",
    password: "password123",
    role: "driver",
    name: "Lisa Delivery",
    phone: "+15556789012"
  }).returning();

  // Create farms
  const [farm1] = await db.insert(farms).values({
    name: "Green Valley Farm",
    farmerId: farmer1.id,
    address: "123 Green Valley Rd",
    description: "Organic produce from our family farm",
    image: "https://images.unsplash.com/photo-1500076656116-558758c991c1?w=500",
    rating: 4.8,
    featured: true
  }).returning();

  const [farm2] = await db.insert(farms).values({
    name: "Sunshine Orchards",
    farmerId: farmer2.id,
    address: "456 Sunshine Lane",
    description: "Specialty fruits and vegetables",
    image: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=500",
    rating: 4.6,
    featured: true
  }).returning();

  // Create produce
  await db.insert(produce).values([
    {
      name: "Organic Apples",
      farmerId: farmer1.id,
      category: "fruits",
      price: 2.99,
      unit: "lb",
      quantity: 100,
      status: "active",
      image: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=500",
      description: "Fresh organic apples"
    },
    {
      name: "Fresh Carrots",
      farmerId: farmer1.id,
      category: "vegetables",
      price: 1.49,
      unit: "bunch",
      quantity: 75,
      status: "active",
      image: "https://images.unsplash.com/photo-1598170845052-52113cf16005?w=500",
      description: "Farm-fresh organic carrots"
    },
    {
      name: "Strawberries",
      farmerId: farmer2.id,
      category: "fruits",
      price: 3.99,
      unit: "pint",
      quantity: 50,
      status: "active",
      image: "https://images.unsplash.com/photo-1543158181-e6f9f6712055?w=500",
      description: "Sweet, juicy strawberries"
    },
    {
      name: "Leafy Greens Mix",
      farmerId: farmer2.id,
      category: "vegetables",
      price: 4.99,
      unit: "bag",
      quantity: 40,
      status: "active",
      image: "https://images.unsplash.com/photo-1540420828642-fca2c5c18abe?w=500",
      description: "Mix of fresh organic greens"
    }
  ]);

  // Create vehicles
  await db.insert(vehicles).values([
    {
      driverId: driver1.id,
      type: "pickup",
      licensePlate: "AGM-1234",
      capacity: 1000,
      status: "available",
      location: "Central District"
    },
    {
      driverId: driver2.id,
      type: "van",
      licensePlate: "AGM-5678",
      capacity: 2000,
      status: "available",
      location: "North District"
    }
  ]);

  console.log("Database seeded successfully!");
}

// Run the seed function
seed()
  .then(() => console.log("Seeding completed"))
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  });

export default seed;