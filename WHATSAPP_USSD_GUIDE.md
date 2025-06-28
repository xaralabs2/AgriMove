# WhatsApp & USSD Access Guide for AgriMove

## Overview
AgriMove provides offline-friendly access through WhatsApp messaging and USSD (Unstructured Supplementary Service Data) for users with basic phones or limited internet connectivity. This ensures farmers, buyers, and drivers can access the platform even in rural areas with poor internet.

## User Guide: How to Use WhatsApp & USSD

### WhatsApp Access

#### Getting Started
1. **Save AgriMove Number**: Add the AgriMove WhatsApp business number to your contacts
2. **Send "Start"**: Send any message to begin your session
3. **Choose Your Role**: Reply with your role (farmer, buyer, or driver)

#### Main Menu Options
After starting, you'll see a menu with options:
- **1** - View available produce (for buyers)
- **2** - Check my orders
- **3** - Update farm information (for farmers)
- **4** - View delivery assignments (for drivers)
- **5** - Get help

#### Sample WhatsApp Conversation (Buyer)
```
You: Hi
AgriMove: Welcome to AgriMove! 🌾
Reply with:
1 - I'm a Buyer
2 - I'm a Farmer  
3 - I'm a Driver

You: 1
AgriMove: Great! You're registered as a Buyer.
Main Menu:
1 - Browse Produce
2 - My Orders
3 - Account Info
0 - Help

You: 1
AgriMove: 🥬 Available Produce:
1. Tomatoes - ₦500/kg (Mary's Farm)
2. Onions - ₦300/kg (David's Farm)
3. Lettuce - ₦400/kg (Mary's Farm)

Reply with number to order or 0 for menu

You: 1
AgriMove: Tomatoes - ₦500/kg
From: Mary's Farm, Lagos
Available: 50kg
Quality: Grade A

How many kg? Reply with number:
```

### USSD Access

#### Dialing Instructions
1. **Dial USSD Code**: Dial `*123*456#` (example code)
2. **Follow Menu**: Navigate using number keys
3. **Session Timeout**: Sessions last 90 seconds

#### USSD Menu Structure
```
*123*456#
AgriMove Main Menu
1. Browse Produce
2. Place Order
3. Check Orders
4. Farm Info
5. Driver Tasks
```

#### Sample USSD Session (Farmer)
```
Dial: *123*456#

AgriMove
Who are you?
1. Buyer
2. Farmer
3. Driver

Reply: 2

Farmer Menu
1. Add Produce
2. View Orders
3. Update Prices
4. Farm Status

Reply: 1

Add New Produce
Enter details:
Product*Quantity*Price
Example: Tomato*50*500

Reply: Onion*30*300

✓ Added: 30kg Onions at ₦300/kg
1. Add More
2. Main Menu
0. Exit
```

## Platform Owner & Admin Guide

### Setting Up WhatsApp Business API

#### Prerequisites
1. **Twilio Account**: Sign up at twilio.com
2. **WhatsApp Business API**: Apply for WhatsApp Business API access
3. **Phone Number**: Get a dedicated business phone number

#### Configuration Steps
1. **Get Twilio Credentials**:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

2. **Set Environment Variables** in Replit:
   - Go to Secrets tab
   - Add the Twilio credentials above

3. **Webhook Setup**:
   - Twilio webhook URL: `https://your-app.replit.app/api/whatsapp`
   - Set HTTP method to POST

### Setting Up USSD

#### USSD Provider Setup
1. **Choose Provider**: 
   - Africa's Talking (for African markets)
   - Nexmo/Vonage
   - Local telecom partnerships

2. **USSD Code Registration**:
   - Apply for dedicated USSD code (e.g., `*123*456#`)
   - Configure webhook endpoint: `https://your-app.replit.app/api/ussd`

3. **Testing USSD**:
   - Use provider's simulator
   - Test with real devices in target regions

### Monitoring & Analytics

#### Key Metrics to Track
1. **Usage Statistics**:
   - Daily active users per channel (WhatsApp/USSD)
   - Most popular features
   - Session completion rates

2. **Performance Metrics**:
   - Response time
   - Error rates
   - Session timeout rates

3. **Business Metrics**:
   - Orders placed via offline channels
   - User retention
   - Feature adoption

#### Monitoring Setup
```javascript
// Add to your analytics dashboard
const trackUsage = {
  whatsappSessions: 0,
  ussdSessions: 0,
  completedOrders: 0,
  userTypes: {
    farmers: 0,
    buyers: 0,
    drivers: 0
  }
};
```

### Managing User Sessions

#### Session Management
- **WhatsApp**: Sessions persist for 24 hours
- **USSD**: Sessions timeout after 90 seconds
- **Data Sync**: All offline actions sync with main database

#### User Support
1. **Common Issues**:
   - Session timeouts
   - Incorrect menu navigation
   - Order confirmation delays

2. **Support Responses**:
   - Automated help messages
   - Escalation to human support
   - FAQ integration

### Content Management

#### Message Templates
Create templates for common responses:

```javascript
const messageTemplates = {
  welcome: "Welcome to AgriMove! 🌾\nChoose your role:\n1 - Buyer\n2 - Farmer\n3 - Driver",
  
  orderConfirmation: "✅ Order confirmed!\nOrder #{{orderNumber}}\nTotal: ₦{{total}}\nDelivery: {{deliveryTime}}",
  
  lowStock: "⚠️ Low stock alert!\n{{productName}} only {{quantity}} left\nUpdate inventory?",
  
  paymentReminder: "💰 Payment due\nOrder #{{orderNumber}}\nAmount: ₦{{amount}}\nPay via: {{paymentLink}}"
};
```

### Compliance & Security

#### WhatsApp Compliance
1. **Message Templates**: Pre-approve all business message templates
2. **Opt-in**: Ensure users consent to receive messages
3. **Rate Limits**: Respect WhatsApp's messaging limits

#### USSD Security
1. **Session Encryption**: Secure sensitive data in transit
2. **Rate Limiting**: Prevent abuse with request limits
3. **Data Validation**: Validate all user inputs

#### Privacy Considerations
1. **Data Retention**: Limit message storage duration
2. **User Consent**: Clear privacy policy for offline services
3. **Data Anonymization**: Remove personal identifiers when possible

### Scaling Considerations

#### High Volume Handling
1. **Message Queuing**: Implement Redis/RabbitMQ for message processing
2. **Load Balancing**: Distribute USSD requests across servers
3. **Database Optimization**: Index frequently accessed offline data

#### Regional Expansion
1. **Language Support**: Add local language options
2. **Currency Handling**: Support local currencies
3. **Cultural Adaptation**: Customize messages for local markets

### Troubleshooting Common Issues

#### WhatsApp Issues
- **Messages Not Delivering**: Check Twilio account status and credits
- **Slow Responses**: Optimize webhook processing time
- **Template Rejection**: Review WhatsApp business policy compliance

#### USSD Issues
- **Code Not Working**: Verify USSD code registration with telecom
- **Session Drops**: Reduce menu depth and response time
- **Character Limits**: Keep messages under 160 characters

### Cost Management

#### Pricing Structure
- **WhatsApp**: $0.005 - $0.009 per message (varies by country)
- **USSD**: $0.001 - $0.005 per session
- **SMS Fallback**: $0.01 - $0.05 per message

#### Cost Optimization
1. **Message Efficiency**: Combine information in single messages
2. **Smart Routing**: Use cheapest available channel
3. **User Preferences**: Let users choose preferred communication method

This guide provides comprehensive coverage for both users and administrators to effectively utilize and manage the WhatsApp & USSD functionality in AgriMove.