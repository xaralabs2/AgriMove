import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';

interface ClientConnection {
  userId?: number;
  role?: string;
  ws: WebSocket;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, ClientConnection> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('Client connected to WebSocket');
      this.clients.set(ws, { ws });

      ws.on('message', async (message: string) => {
        try {
          const data = JSON.parse(message);
          
          // Handle authentication
          if (data.type === 'auth') {
            const { userId, role } = data;
            if (userId && role) {
              this.clients.set(ws, { userId, role, ws });
              console.log(`User ${userId} authenticated as ${role}`);
            }
          } 
          // Handle order status updates
          else if (data.type === 'orderUpdate') {
            const { orderId, status } = data;
            if (orderId && status) {
              const order = await storage.getOrder(orderId);
              if (order) {
                await storage.updateOrder(orderId, { status });
                this.broadcastOrderUpdate(orderId, status);
              }
            }
          }
          // Handle delivery status updates
          else if (data.type === 'deliveryUpdate') {
            const { deliveryId, status, location } = data;
            if (deliveryId && status) {
              const delivery = await storage.getDelivery(deliveryId);
              if (delivery) {
                const updates: any = { status };
                if (location) {
                  updates.currentLocation = location;
                }
                
                // Update delivery timestamps based on status
                if (status === 'in_progress' && !delivery.startTime) {
                  updates.startTime = new Date();
                } else if (status === 'completed' && !delivery.endTime) {
                  updates.endTime = new Date();
                }
                
                await storage.updateDelivery(deliveryId, updates);
                this.broadcastDeliveryUpdate(deliveryId, status, location);
              }
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected from WebSocket');
        this.clients.delete(ws);
      });
    });
  }

  public broadcastOrderUpdate(orderId: number, status: string) {
    const order = { orderId, status, timestamp: new Date().toISOString() };
    
    this.clients.forEach((client, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'orderUpdate',
          data: order
        }));
      }
    });
  }
  
  public broadcastDeliveryUpdate(deliveryId: number, status: string, location?: string) {
    const delivery = { 
      deliveryId, 
      status, 
      location, 
      timestamp: new Date().toISOString() 
    };
    
    this.clients.forEach((client, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'deliveryUpdate',
          data: delivery
        }));
      }
    });
  }
  
  public notifyUser(userId: number, message: any) {
    this.clients.forEach((client, ws) => {
      if (client.userId === userId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
  
  public notifyByRole(role: string, message: any) {
    this.clients.forEach((client, ws) => {
      if (client.role === role && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}
