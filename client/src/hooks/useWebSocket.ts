import { useState, useEffect, useRef, useCallback } from 'react';

type WebSocketStatus = 'connecting' | 'open' | 'closed' | 'error';
type MessageHandler = (data: any) => void;

interface UseWebSocketOptions {
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  reconnectInterval?: number;
  reconnectAttempts?: number;
  automaticOpen?: boolean;
}

/**
 * Hook for WebSocket connection management
 * 
 * @param token The authentication token
 * @param options Configuration options for the WebSocket
 * @returns WebSocket utilities and state
 */
export function useWebSocket(token: string | null, options?: UseWebSocketOptions) {
  const [status, setStatus] = useState<WebSocketStatus>('closed');
  const [lastMessage, setLastMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const messageHandlersRef = useRef<Map<string, MessageHandler[]>>(new Map());
  const reconnectAttemptsRef = useRef(0);
  
  const defaultOptions = {
    reconnectInterval: 3000,
    reconnectAttempts: 5,
    automaticOpen: true
  };
  
  const opts = { ...defaultOptions, ...options };

  // Setup WebSocket connection
  const setupWebSocket = useCallback(() => {
    if (!token) return;
    
    try {
      // Determine the correct protocol based on the current page
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      
      // Create websocket URL
      const wsUrl = `${protocol}//${host}/ws?token=${token}`;
      
      // Close existing connection if any
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      
      // Create new WebSocket
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      setStatus('connecting');
      
      // Set up event handlers
      ws.onopen = (event) => {
        setStatus('open');
        reconnectAttemptsRef.current = 0;
        
        if (opts.onOpen) {
          opts.onOpen(event);
        }
      };
      
      ws.onclose = (event) => {
        setStatus('closed');
        
        if (opts.onClose) {
          opts.onClose(event);
        }
        
        // Attempt to reconnect if not closed cleanly and we haven't exceeded attempts
        if (event.code !== 1000 && reconnectAttemptsRef.current < opts.reconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = window.setTimeout(() => {
            setupWebSocket();
          }, opts.reconnectInterval);
        }
      };
      
      ws.onerror = (event) => {
        setStatus('error');
        
        if (opts.onError) {
          opts.onError(event);
        }
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          
          // Call all registered handlers for this event type
          if (data.type && messageHandlersRef.current.has(data.type)) {
            const handlers = messageHandlersRef.current.get(data.type) || [];
            handlers.forEach(handler => handler(data));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    } catch (error) {
      setStatus('error');
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [token, opts]);

  // Register a message handler for a specific message type
  const addMessageHandler = useCallback((type: string, handler: MessageHandler) => {
    if (!messageHandlersRef.current.has(type)) {
      messageHandlersRef.current.set(type, []);
    }
    
    const handlers = messageHandlersRef.current.get(type) || [];
    handlers.push(handler);
    messageHandlersRef.current.set(type, handlers);
    
    // Return function to remove this handler
    return () => {
      const currentHandlers = messageHandlersRef.current.get(type) || [];
      messageHandlersRef.current.set(
        type,
        currentHandlers.filter(h => h !== handler)
      );
    };
  }, []);

  // Send a message through the WebSocket
  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof message === 'string' ? message : JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Connect to WebSocket manually
  const connect = useCallback(() => {
    if (status !== 'open') {
      setupWebSocket();
    }
  }, [status, setupWebSocket]);

  // Disconnect from WebSocket manually
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Initial setup
  useEffect(() => {
    if (opts.automaticOpen && token) {
      setupWebSocket();
    }
    
    return disconnect;
  }, [token, opts.automaticOpen, setupWebSocket, disconnect]);

  return {
    status,
    lastMessage,
    sendMessage,
    addMessageHandler,
    connect,
    disconnect
  };
}

export default useWebSocket;