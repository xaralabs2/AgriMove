import twilio from 'twilio';
import { Produce, Farm, Order, User } from '@shared/schema';
import { storage } from './storage';

// Only create the client if valid credentials are available
let client: twilio.Twilio | null = null;
let twilioCredentialsChecked = false;

// Helper function to initialize the Twilio client
function getTwilioClient(): twilio.Twilio | null {
  // Get the latest credentials from environment variables
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  // Check if we have already attempted to initialize the client
  if (client === null && !twilioCredentialsChecked) {
    twilioCredentialsChecked = true;
    
    // Check for valid credentials
    if (accountSid && authToken) {
      try {
        // In development, we support placeholder credentials
        if (process.env.NODE_ENV === 'development' && 
            (accountSid === 'placeholder' || !accountSid.startsWith('AC'))) {
          console.log('Using placeholder Twilio credentials. Messages will be logged but not sent.');
          return null;
        }
        
        // Create actual Twilio client with real credentials
        client = twilio(accountSid, authToken);
        console.log('Twilio client initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Twilio client:', error);
      }
    } else {
      // Log only once when the function is first called
      console.log('Twilio credentials not provided. Running in demo mode.');
    }
  }
  return client;
}

export enum MessageType {
  WELCOME = 'welcome',
  MENU = 'menu',
  PRODUCE_LIST = 'produce_list',
  ORDER_STATUS = 'order_status',
  FARM_INFO = 'farm_info',
  PLACE_ORDER = 'place_order',
  CONFIRM_ORDER = 'confirm_order',
  ORDER_PLACED = 'order_placed',
  ERROR = 'error'
}

export interface USSDSession {
  phoneNumber: string;
  sessionId: string;
  currentMenu: MessageType;
  userData: {
    role?: 'buyer' | 'farmer' | 'driver';
    userId?: number;
    selectedFarm?: number;
    selectedProduce?: number[];
    quantities?: { [produceId: number]: number };
    cart?: { produceId: number; quantity: number; price: number }[];
    tempOrder?: {
      items: Array<{ produceId: number; quantity: number; farmerId: number; unitPrice: number }>;
      total: number;
      deliveryAddress: string;
    };
  };
  lastMessageTimestamp: number;
}

// Store active USSD sessions in memory
// In a production environment, these would be stored in Redis or another database
const activeSessions: { [sessionId: string]: USSDSession } = {};

// Session timeout in milliseconds (5 minutes)
const SESSION_TIMEOUT = 5 * 60 * 1000;

/**
 * Clean up expired sessions
 */
function cleanupSessions() {
  const now = Date.now();
  Object.keys(activeSessions).forEach(sessionId => {
    if (now - activeSessions[sessionId].lastMessageTimestamp > SESSION_TIMEOUT) {
      delete activeSessions[sessionId];
    }
  });
}

// Run cleanup every minute
setInterval(cleanupSessions, 60 * 1000);

/**
 * Get or create a session for the user
 */
export function getOrCreateSession(phoneNumber: string, sessionId: string): USSDSession {
  if (!activeSessions[sessionId]) {
    activeSessions[sessionId] = {
      phoneNumber,
      sessionId,
      currentMenu: MessageType.WELCOME,
      userData: {},
      lastMessageTimestamp: Date.now()
    };
  } else {
    // Update timestamp
    activeSessions[sessionId].lastMessageTimestamp = Date.now();
  }
  
  return activeSessions[sessionId];
}

/**
 * End a USSD session
 */
export function endSession(sessionId: string) {
  if (activeSessions[sessionId]) {
    delete activeSessions[sessionId];
  }
}

/**
 * Process USSD requests
 */
export async function processUSSDRequest(
  text: string,
  phoneNumber: string, 
  sessionId: string
): Promise<string> {
  const session = getOrCreateSession(phoneNumber, sessionId);
  
  // If this is a new session or no text
  if (session.currentMenu === MessageType.WELCOME || !text) {
    return await handleWelcomeMenu(session);
  }
  
  // Process input based on current menu
  switch (session.currentMenu) {
    case MessageType.MENU:
      return await handleMainMenu(session, text);
    case MessageType.PRODUCE_LIST:
      return await handleProduceList(session, text);
    case MessageType.ORDER_STATUS:
      return await handleOrderStatus(session, text);
    case MessageType.FARM_INFO:
      return await handleFarmInfo(session, text);
    case MessageType.PLACE_ORDER:
      return await handlePlaceOrder(session, text);
    case MessageType.CONFIRM_ORDER:
      return await handleConfirmOrder(session, text);
    default:
      // Go back to main menu for any unexpected state
      session.currentMenu = MessageType.MENU;
      return await handleMainMenu(session, '');
  }
}

/**
 * Handle welcome menu
 */
async function handleWelcomeMenu(session: USSDSession): Promise<string> {
  // Try to identify user by phone number
  const user = await storage.getUserByPhone(session.phoneNumber);
  
  if (user) {
    // User found, store their role and ID
    session.userData.role = user.role as any;
    session.userData.userId = user.id;
    
    // Move to main menu
    session.currentMenu = MessageType.MENU;
    return await handleMainMenu(session, '');
  } else {
    // User not found, show registration options
    session.currentMenu = MessageType.MENU; // Set to MENU so the next input will be processed by handleMainMenu
    return `Welcome to AgriMove!
    
Your phone number is not registered. Please register on our app first or contact support for assistance.
    
For a demo, enter:
1. Continue as Buyer
2. Continue as Farmer
3. Continue as Driver
4. Exit`;
  }
}

/**
 * Handle main menu selection
 */
async function handleMainMenu(session: USSDSession, text: string): Promise<string> {
  // Process demo mode selection if we have input
  if (text) {
    // If role not set yet, process role selection
    if (!session.userData.role) {
      if (text === '1') {
        session.userData.role = 'buyer';
        return `AgriMove - Buyer Menu

1. Browse Products
2. My Orders
3. Nearby Farms
4. Place an Order
5. Exit`;
      } else if (text === '2') {
        session.userData.role = 'farmer';
        return `AgriMove - Farmer Menu

1. My Products
2. Pending Orders
3. Update Inventory
4. Sales Report
5. Exit`;
      } else if (text === '3') {
        session.userData.role = 'driver';
        return `AgriMove - Driver Menu

1. Available Deliveries
2. My Current Deliveries
3. Update Delivery Status
4. Earnings Report
5. Exit`;
      } else if (text === '4') {
        endSession(session.sessionId);
        return 'Thank you for using AgriMove. Goodbye!';
      }
    } else {
      // Role is set, process menu selection
      if (session.userData.role === 'buyer') {
        if (text === '1') {
          session.currentMenu = MessageType.PRODUCE_LIST;
          return await handleProduceList(session, '');
        } else if (text === '2') {
          session.currentMenu = MessageType.ORDER_STATUS;
          return await handleOrderStatus(session, '');
        } else if (text === '3') {
          session.currentMenu = MessageType.FARM_INFO;
          return await handleFarmInfo(session, '');
        } else if (text === '4') {
          session.currentMenu = MessageType.PLACE_ORDER;
          return await handlePlaceOrder(session, '');
        } else if (text === '5') {
          endSession(session.sessionId);
          return 'Thank you for using AgriMove. Goodbye!';
        }
      } else if (session.userData.role === 'farmer' || session.userData.role === 'driver') {
        // Simplified for now
        return 'This feature will be available soon. Thank you for your patience.';
      }
    }
  }
  
  // No text or role not set yet - show initial menu
  if (!session.userData.role) {
    return `Welcome to AgriMove!
    
Please select an option:
1. Continue as Buyer
2. Continue as Farmer
3. Continue as Driver
4. Exit`;
  }
  
  // Show appropriate menu based on role
  if (session.userData.role === 'buyer') {
    return `AgriMove - Buyer Menu

1. Browse Products
2. My Orders
3. Nearby Farms
4. Place an Order
5. Exit`;
  } else if (session.userData.role === 'farmer') {
    return `AgriMove - Farmer Menu

1. My Products
2. Pending Orders
3. Update Inventory
4. Sales Report
5. Exit`;
  } else if (session.userData.role === 'driver') {
    return `AgriMove - Driver Menu

1. Available Deliveries
2. My Current Deliveries
3. Update Delivery Status
4. Earnings Report
5. Exit`;
  }
  
  // Default return if nothing else matched
  return 'Invalid selection. Please try again.';
}

/**
 * Handle product listing
 */
async function handleProduceList(session: USSDSession, text: string): Promise<string> {
  if (!text) {
    const allProduce = await storage.getAllProduce();
    
    if (allProduce.length === 0) {
      session.currentMenu = MessageType.MENU;
      return 'No products available at the moment. Return to main menu...';
    }
    
    // Return a paginated list (simplified for demo)
    let response = 'Available Products:\n';
    allProduce.slice(0, 5).forEach((item, index) => {
      response += `${index + 1}. ${item.name} - ${item.price}/${item.unit}\n`;
    });
    
    response += '\nEnter product number for details or 0 to return to main menu.';
    return response;
  }
  
  if (text === '0') {
    session.currentMenu = MessageType.MENU;
    return await handleMainMenu(session, '');
  }
  
  const selection = parseInt(text);
  if (isNaN(selection) || selection < 1) {
    return 'Invalid selection. Please try again.';
  }
  
  const allProduce = await storage.getAllProduce();
  const selectedProduce = allProduce[selection - 1];
  
  if (!selectedProduce) {
    return 'Invalid selection. Please try again.';
  }
  
  // Show detailed product information
  const farm = await storage.getFarm(selectedProduce.farmerId);
  let response = `Product Details:
  
Name: ${selectedProduce.name}
Price: ${selectedProduce.price}/${selectedProduce.unit}
Farm: ${farm?.name || 'Unknown farm'}
Description: ${selectedProduce.description || 'No description'}
  
Enter:
1. Add to cart
0. Back to product list`;
  
  return response;
}

/**
 * Handle order status
 */
async function handleOrderStatus(session: USSDSession, text: string): Promise<string> {
  // If user is not authenticated, redirect to main menu
  if (!session.userData.userId) {
    session.currentMenu = MessageType.MENU;
    return 'You need to be logged in to view orders. Returning to main menu...';
  }
  
  // Show recent orders for the buyer
  const orders = await storage.getOrdersByBuyer(session.userData.userId);
  
  if (orders.length === 0) {
    session.currentMenu = MessageType.MENU;
    return 'You have no orders yet. Returning to main menu...';
  }
  
  // Display recent orders
  let response = 'Your Recent Orders:\n';
  orders.slice(0, 5).forEach((order, index) => {
    response += `${index + 1}. Order #${order.id} - ${order.status} - $${order.total}\n`;
  });
  
  response += '\nEnter order number for details or 0 for main menu.';
  return response;
}

/**
 * Handle farm information
 */
async function handleFarmInfo(session: USSDSession, text: string): Promise<string> {
  if (!text) {
    const farms = await storage.getAllFarms();
    
    if (farms.length === 0) {
      session.currentMenu = MessageType.MENU;
      return 'No farms available at the moment. Return to main menu...';
    }
    
    // Display farms
    let response = 'Farms:\n';
    farms.forEach((farm, index) => {
      response += `${index + 1}. ${farm.name} (Rating: ${farm.rating})\n`;
    });
    
    response += '\nEnter farm number for details or 0 for main menu.';
    return response;
  }
  
  if (text === '0') {
    session.currentMenu = MessageType.MENU;
    return await handleMainMenu(session, '');
  }
  
  const selection = parseInt(text);
  if (isNaN(selection) || selection < 1) {
    return 'Invalid selection. Please try again.';
  }
  
  const farms = await storage.getAllFarms();
  const selectedFarm = farms[selection - 1];
  
  if (!selectedFarm) {
    return 'Invalid selection. Please try again.';
  }
  
  // Show detailed farm information
  const produceItems = await storage.getProduceByFarmer(selectedFarm.farmerId);
  
  let response = `Farm Details:
  
Name: ${selectedFarm.name}
Rating: ${selectedFarm.rating}/5
Location: ${selectedFarm.address}
Description: ${selectedFarm.description || 'No description'}

Products (${produceItems.length}):`;

  produceItems.slice(0, 3).forEach((item, index) => {
    response += `\n- ${item.name}: ${item.price}/${item.unit}`;
  });
  
  if (produceItems.length > 3) {
    response += '\n- ... and more';
  }
  
  response += '\n\nEnter 0 to go back.';
  return response;
}

/**
 * Handle place order
 */
async function handlePlaceOrder(session: USSDSession, text: string): Promise<string> {
  // Initialize cart if it doesn't exist
  if (!session.userData.cart) {
    session.userData.cart = [];
  }
  
  if (!text) {
    const allProduce = await storage.getAllProduce();
    
    if (allProduce.length === 0) {
      session.currentMenu = MessageType.MENU;
      return 'No products available for order. Returning to main menu...';
    }
    
    // Display product options
    let response = 'Select a product to add to your order:\n';
    allProduce.slice(0, 5).forEach((item, index) => {
      response += `${index + 1}. ${item.name} - ${item.price}/${item.unit}\n`;
    });
    
    if (session.userData.cart.length > 0) {
      response += `\nYour cart has ${session.userData.cart.length} items.`;
      response += '\nEnter product number or:';
      response += '\nC. View Cart';
      response += '\nF. Finish Order';
    } else {
      response += '\nEnter product number or 0 for main menu.';
    }
    
    return response;
  }
  
  // Handle special commands
  if (text.toUpperCase() === 'C') {
    // View cart
    if (session.userData.cart.length === 0) {
      return 'Your cart is empty. Select products to add.';
    }
    
    let total = 0;
    let response = 'Your Cart:\n';
    
    // Fetch produce details to display cart
    const produceDetails: {[id: number]: Produce} = {};
    for (const item of session.userData.cart) {
      if (!produceDetails[item.produceId]) {
        const produce = await storage.getProduce(item.produceId);
        if (produce) {
          produceDetails[item.produceId] = produce;
        }
      }
    }
    
    session.userData.cart.forEach((item, index) => {
      const produce = produceDetails[item.produceId];
      const itemTotal = item.quantity * item.price;
      total += itemTotal;
      
      response += `${index + 1}. ${produce?.name || 'Unknown'} x${item.quantity} = $${itemTotal.toFixed(2)}\n`;
    });
    
    response += `\nTotal: $${total.toFixed(2)}`;
    response += '\n\nEnter:';
    response += '\nF. Finish Order';
    response += '\nR. Remove Item';
    response += '\n0. Back to Products';
    
    return response;
  } else if (text.toUpperCase() === 'F') {
    // Finish order
    if (session.userData.cart.length === 0) {
      return 'Your cart is empty. Select products to add.';
    }
    
    // Prepare for checkout
    session.currentMenu = MessageType.CONFIRM_ORDER;
    return await handleConfirmOrder(session, '');
  } else if (text.toUpperCase() === 'R') {
    // Handle remove item in another menu state
    return 'Enter the item number to remove:';
  } else if (text === '0') {
    session.currentMenu = MessageType.MENU;
    return await handleMainMenu(session, '');
  }
  
  // Add item to cart
  const selection = parseInt(text);
  if (isNaN(selection) || selection < 1) {
    return 'Invalid selection. Please try again.';
  }
  
  const allProduce = await storage.getAllProduce();
  const selectedProduce = allProduce[selection - 1];
  
  if (!selectedProduce) {
    return 'Invalid selection. Please try again.';
  }
  
  // Now ask for quantity
  return `You selected: ${selectedProduce.name}
Price: ${selectedProduce.price}/${selectedProduce.unit}

Enter quantity to add to cart:`;
}

/**
 * Handle order confirmation
 */
async function handleConfirmOrder(session: USSDSession, text: string): Promise<string> {
  if (!session.userData.cart || session.userData.cart.length === 0) {
    session.currentMenu = MessageType.MENU;
    return 'Your cart is empty. Returning to main menu...';
  }
  
  if (!text) {
    // Calculate total
    let total = session.userData.cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    // Create temporary order
    session.userData.tempOrder = {
      items: await Promise.all(session.userData.cart.map(async item => {
        const produce = await storage.getProduce(item.produceId);
        return {
          produceId: item.produceId,
          quantity: item.quantity,
          farmerId: produce?.farmerId || 0,
          unitPrice: item.price
        };
      })),
      total,
      deliveryAddress: '' // Will be collected in this step
    };
    
    return `Order Summary:
Total: $${total.toFixed(2)}
Items: ${session.userData.cart.length}

Enter your delivery address to continue:`;
  }
  
  // Save delivery address
  if (session.userData.tempOrder) {
    session.userData.tempOrder.deliveryAddress = text;
    
    return `Confirm your order:
Total: $${session.userData.tempOrder.total.toFixed(2)}
Delivery to: ${session.userData.tempOrder.deliveryAddress}

Enter:
1. Confirm Order
2. Cancel`;
  } else {
    session.currentMenu = MessageType.MENU;
    return 'Error processing your order. Please try again.';
  }
}

/**
 * Send WhatsApp message
 */
export async function sendWhatsAppMessage(to: string, message: string) {
  // Get the Twilio client if available
  const twilioClient = getTwilioClient();
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  
  // If no client or no phone number, log and return false
  if (!twilioClient || !twilioPhoneNumber) {
    console.log('WhatsApp message would be sent:', { to, message });
    console.log('Twilio credentials not properly configured.');
    return false;
  }
  
  try {
    await twilioClient.messages.create({
      body: message,
      from: `whatsapp:${twilioPhoneNumber}`,
      to: `whatsapp:${to}`
    });
    
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

/**
 * Format order details for messaging
 */
export function formatOrderDetails(order: Order, items: any[]): string {
  let message = `Order #${order.id} Details\n`;
  message += `Status: ${order.status}\n`;
  message += `Total: $${order.total.toFixed(2)}\n`;
  message += `Payment status: ${order.paymentStatus}\n\n`;
  
  message += 'Items:\n';
  items.forEach((item, index) => {
    message += `${index + 1}. ${item.produceName} x${item.quantity} - $${(item.unitPrice * item.quantity).toFixed(2)}\n`;
  });
  
  message += `\nDelivery Address: ${order.deliveryAddress}`;
  
  if (order.status === 'in_transit' && order.estimatedDeliveryTime) {
    const eta = new Date(order.estimatedDeliveryTime);
    message += `\nEstimated delivery: ${eta.toLocaleString()}`;
  }
  
  return message;
}

/**
 * Send order updates via WhatsApp
 */
export async function sendOrderUpdate(orderId: number, status: string) {
  try {
    const order = await storage.getOrder(orderId);
    if (!order) return false;
    
    const buyer = await storage.getUser(order.buyerId);
    if (!buyer || !buyer.phone) return false;
    
    const orderItems = await storage.getOrderItemsByOrder(orderId);
    
    // Get product details for each item
    const itemsWithDetails = await Promise.all(orderItems.map(async item => {
      const produce = await storage.getProduce(item.produceId);
      return {
        ...item,
        produceName: produce?.name || 'Unknown product'
      };
    }));
    
    const message = `AgriMove: Your order #${order.id} status has been updated to ${status}.
    
${formatOrderDetails(order, itemsWithDetails)}

Reply with "status ${order.id}" for the latest updates.`;
    
    // Check if we have Twilio configured
    if (!getTwilioClient()) {
      console.log('Order update notification would be sent:', { phone: buyer.phone, message });
      console.log('Twilio credentials not properly configured.');
      return true; // Return true to avoid disrupting the flow
    }
    
    return await sendWhatsAppMessage(buyer.phone, message);
  } catch (error) {
    console.error('Error sending order update:', error);
    return false;
  }
}

/**
 * Process WhatsApp request
 */
export async function processWhatsAppRequest(message: string, from: string): Promise<string> {
  try {
    // Extract phone number from WhatsApp format (whatsapp:+1234567890)
    const phoneNumber = from.replace('whatsapp:', '');
    
    // Create a session ID from phone number (simplified)
    const sessionId = `wa_${phoneNumber}_${Date.now()}`;
    
    // Process the message similar to USSD
    return await processUSSDRequest(message, phoneNumber, sessionId);
  } catch (error) {
    console.error('Error processing WhatsApp request:', error);
    return 'Sorry, an error occurred. Please try again later.';
  }
}

/**
 * Initialize the messaging system
 */
export function initMessaging() {
  // Check Twilio credentials availability
  const twilioClient = getTwilioClient();
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (twilioClient) {
    console.log('Messaging system initialized with Twilio integration');
  } else if (accountSid && authToken) {
    console.log('Messaging system initialized with placeholder credentials (demo mode)');
    console.log('To use real Twilio services, please provide valid Twilio credentials');
  } else {
    console.log('Messaging system initialized in demo mode (no Twilio credentials provided)');
  }
  
  // Start the session cleanup interval
  setInterval(cleanupSessions, 60 * 1000);
}