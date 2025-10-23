import { createContext, useContext } from "react";

export type SocketStatus =
  | "connecting"
  | "open"
  | "closing"
  | "closed"
  | "error";

export type SocketContextType = {
  send: (data: unknown) => void;
  lastMessage: MessageEvent | null;
  status: SocketStatus;
  socket: WebSocket | null;
};

export const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context)
    throw new Error("useSocket() must be used within a SocketProvider context");
  return context;
};
