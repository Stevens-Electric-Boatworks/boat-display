import type React from "react";
import { RosContext, type RosContextType } from "./ros-context";
import { useEffect, useRef, useState } from "react";
import { Ros } from "roslib";

export const RosProvider = ({ children }: { children: React.ReactNode }) => {
  const rosRef = useRef<Ros | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const isUnmountedRef = useRef(false);

  useEffect(() => {
    isUnmountedRef.current = false;
    const baseDelay = 1000;
    const maxDelay = 3000;

    const connect = () => {
      const rosConnection = new Ros({
        url: "ws://localhost:9090",
      });

      const clearPendingReconnect = () => {
        if (reconnectTimerRef.current !== null) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      };

      rosConnection.on("connection", () => {
        console.log("Connected to rosbridge server.");
        rosRef.current = rosConnection;
        setConnected(true);
        setError(null);
        reconnectAttemptRef.current = 0;
        clearPendingReconnect();
      });

      rosConnection.on("error", (err) => {
        console.error("Error connecting to rosbridge", err);
        // schedule a reconnect
        rosRef.current = null;
        setConnected(false);
        setError(String(err));
        scheduleReconnect();
      });

      rosConnection.on("close", () => {
        console.log("Rosbridge connection closed.");
        rosRef.current = null;
        setConnected(false);
        setError("Connection closed");
        scheduleReconnect();
      });
    };

    const scheduleReconnect = () => {
      if (isUnmountedRef.current) return;
      reconnectAttemptRef.current += 1;
      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(maxDelay, baseDelay * 2 ** (attempt - 1));
      console.log(
        `Reconnecting to rosbridge in ${delay}ms (attempt ${attempt})`
      );
      // clear any existing timer just in case
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
      }
      reconnectTimerRef.current = window.setTimeout(() => {
        // attempt to connect again
        connect();
      }, delay);
    };

    // start first connection
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (rosRef.current) {
        try {
          rosRef.current.close();
        } catch {
          /* ignore */
        }
        rosRef.current = null;
      }
    };
    // keep deps empty on purpose (connect only once)
  }, []);

  const value: RosContextType = {
    ros: rosRef.current,
    connected,
    error,
  };

  return <RosContext.Provider value={value}>{children}</RosContext.Provider>;
};
