import React, { useEffect, useRef, useState } from "react";
import { SocketContext } from "./socket-context";
import type { SocketContextType, SocketStatus } from "./socket-context";

/**
 * SocketProvider
 * - Connects to a WebSocket URL (optionally from VITE_WS_URL or `url` prop)
 * - Exposes send(), lastMessage, status and the raw socket
 * - Reconnects automatically with exponential backoff while mounted
 */
export const SocketProvider = ({
  children,
  url,
}: {
  children: React.ReactNode;
  url?: string;
}) => {
  const wsRef = useRef<WebSocket | null>(null);
  const connectingRef = useRef(false);
  const reconnectAttempts = useRef(0);
  const shouldReconnect = useRef(true);

  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const [status, setStatus] = useState<SocketStatus>("closed");

  const getUrl = () => {
    // Prefer explicit prop, then Vite env, then fallback
    // Vite exposes env vars prefixed with VITE_ via import.meta.env
    // If your project doesn't define VITE_WS_URL, it'll use the fallback below.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env = (import.meta as any).env as Record<string, any> | undefined;
    return url ?? env?.VITE_WS_URL ?? "ws://192.168.1.144:8765";
  };

  const connect = () => {
    // Prevent creating a new socket if one is already open or in the process of connecting.
    const existing = wsRef.current;
    if (
      existing &&
      (existing.readyState === WebSocket.OPEN ||
        existing.readyState === WebSocket.CONNECTING ||
        connectingRef.current)
    ) {
      return;
    }

    connectingRef.current = true;

    const wsUrl = getUrl();
    setStatus("connecting");

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttempts.current = 0;
        setStatus("open");
        connectingRef.current = false;
        // send optional identification after open

        console.log(`WebSocket connected: ${wsUrl}`);
      };

      ws.onmessage = (ev) => {
        setLastMessage(ev);
      };

      ws.onerror = (err) => {
        console.error("WebSocket error", err);
        ws?.close();
        setStatus("error");
        connectingRef.current = false;
      };

      ws.onclose = () => {
        wsRef.current = null;
        connectingRef.current = false;
        setStatus("closed");
        if (shouldReconnect.current) {
          const timeout = Math.min(
            10000,
            1000 * 2 ** reconnectAttempts.current
          );
          reconnectAttempts.current += 1;
          console.log(`WebSocket closed, reconnecting in ${timeout}ms`);
          setTimeout(connect, timeout);
        } else {
          setStatus("closed");
        }
      };
    } catch (err) {
      console.error("WebSocket failed to construct", err);
      setStatus("error");
    }
  };

  useEffect(() => {
    shouldReconnect.current = true;
    connect();

    return () => {
      shouldReconnect.current = false;
      const ws = wsRef.current;
      if (ws) {
        setStatus("closing");
        ws.close();
      }
    };
    // Intentionally run only once on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = (data: unknown) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket is not open. Dropping message.", data);
      return;
    }
    try {
      const payload =
        typeof data === "string" ? data : JSON.stringify(data as unknown);
      ws.send(payload);
    } catch (err) {
      console.error("Failed to send WebSocket message", err);
    }
  };

  const value: SocketContextType = {
    send,
    lastMessage,
    status,
    socket: wsRef.current,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
