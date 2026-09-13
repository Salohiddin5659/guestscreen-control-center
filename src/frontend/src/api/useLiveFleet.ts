import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface DeploymentEvent {
  type: string;
  deploymentId?: string;
  batch_id?: string;
  job_id?: string;
  cashier_id?: string;
  step?: number;
  name?: string;
  status?: string;
  stepStatus?: string;
  details?: Record<string, any>;
  ip?: string;
  mode?: string;
  error?: string;
  timestamp?: string;
}

export function useLiveFleet() {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<DeploymentEvent | null>(null);
  const [eventsByDeployment, setEventsByDeployment] = useState<Record<string, DeploymentEvent>>({});
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  useEffect(() => {
    function connect() {
      // If deployed behind reverse proxy, WebSocket is optional
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
        };

        ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            if (data.type === 'UPDATE' || data.type === 'INIT') {
              queryClient.invalidateQueries({ queryKey: ['cashiers'] });
              queryClient.invalidateQueries({ queryKey: ['branches'] });
              queryClient.invalidateQueries({ queryKey: ['regions'] });
              queryClient.invalidateQueries({ queryKey: ['advertising-blocks'] });
            } else if (data.type === 'DEPLOYMENT_EVENT' || data.type === 'JOB_UPDATE') {
              const depEvent = data as DeploymentEvent;
              const depKey = depEvent.deploymentId || depEvent.batch_id || depEvent.ip || 'latest';
              setLastEvent(depEvent);
              setEventsByDeployment(prev => ({
                ...prev,
                [depKey]: depEvent,
                ...(depEvent.ip ? { [depEvent.ip]: depEvent } : {}),
                ...(depEvent.cashier_id ? { [depEvent.cashier_id]: depEvent } : {})
              }));
              queryClient.invalidateQueries({ queryKey: ['publications'] });
              queryClient.invalidateQueries({ queryKey: ['cashiers'] });
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        ws.onerror = () => {
          setIsConnected(false);
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        };
      } catch {
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connect, 10000);
      }
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [queryClient]);

  return {
    isConnected,
    lastEvent,
    eventsByDeployment,
  };
}
