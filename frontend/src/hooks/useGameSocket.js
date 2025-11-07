import { useEffect, useState, useCallback } from 'react';

export function useGameSocket(url = 'ws://localhost:8000/ws/game') {
  const [gameState, setGameState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    console.log('🔌 Connecting to WebSocket:', url);
    const websocket = new WebSocket(url);

    websocket.onopen = () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setGameState(data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('🔌 WebSocket closed');
      setConnected(false);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [url]);

  const sendMessage = useCallback((message) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }, [ws]);

  const restart = useCallback(() => {
    sendMessage({ action: 'restart' });
  }, [sendMessage]);

  const boost = useCallback(() => {
    sendMessage({ action: 'boost' });
  }, [sendMessage]);

  return { gameState, connected, restart, boost };
}