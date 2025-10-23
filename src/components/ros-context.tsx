import { createContext, useContext } from "react";
import { Ros } from "roslib";

export type RosContextType = {
  ros: Ros | null;
  connected: boolean;
  error: string | null;
};

export const RosContext = createContext<RosContextType | undefined>(undefined);

export const useRos = () => {
  const context = useContext(RosContext);
  if (!context)
    throw new Error("useRos() must be used within a RosContext element");
  return context;
};
