import { useEffect, useRef, useState } from "react";
import "./App.css";
import { useRos } from "./components/ros-context";
import { Topic } from "roslib";

function App() {
  const { ros, connected, error } = useRos();
  type MotorMessage = {
    current?: number | string;
    voltage?: number | string;
    rpm?: number | string;
    motor_temp?: number | string;
    // allow other fields but typed as unknown to avoid `any`
    [key: string]: unknown;
  };

  const [message, setMessage] = useState<MotorMessage | null>(null);

  const topicRef = useRef<Topic | null>(null);

  useEffect(() => {
    if (!ros) return;

    topicRef.current = new Topic({
      ros: ros,
      name: "/motors/can_motor_data",
      messageType: "boat_data_interfaces/msg/CANMotorData",
    });

    const isMotorMessage = (obj: unknown): obj is MotorMessage => {
      if (typeof obj !== "object" || obj === null) return false;
      const o = obj as Record<string, unknown>;
      // consider it a motor message if it has at least one of the expected keys
      return (
        "current" in o || "voltage" in o || "rpm" in o || "motor_temp" in o
      );
    };

    const onMessage = (msg: unknown) => {
      console.log("Message received:", msg);
      if (isMotorMessage(msg)) {
        setMessage(msg);
      } else {
        // keep previous behavior but avoid setting an untyped value
        console.warn("Received message with unexpected shape", msg);
      }
    };

    topicRef.current.subscribe(onMessage);

    // cleanup
    return () => {
      try {
        topicRef.current?.unsubscribe(onMessage);
      } catch {
        /* ignore */
      }
      topicRef.current = null;
    };
  }, [ros]);

  return (
    <div className="flex p-2 gap-2 h-screen pinstripe">
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex-1 border bg-white flex flex-col items-center justify-center">
          <div className="flex flex-col items-center">
            <p className="text-[100pt] leading-none">{message?.current}</p>
          </div>
          <p className="text-2xl">MOTOR AMPS</p>
        </div>
        <div className="flex-1 border bg-white flex flex-col items-center justify-center">
          <div className="flex items-center gap-4">
            <p className="text-[100pt] leading-none">{message?.voltage}</p>
          </div>
          <p className="text-2xl">MOTOR VOLTAGE</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex-1 border bg-white flex flex-col items-center justify-center">
          <div className="flex items-center gap-4">
            <p className="text-[100pt] leading-none">{message?.rpm}</p>
          </div>
          <p className="text-2xl">MOTOR RPM</p>
        </div>
        <div className="flex-1 border bg-white flex flex-col items-center justify-center">
          <div className="flex items-center gap-4">
            <p className="text-[100pt] leading-none">{message?.motor_temp}°</p>
          </div>
          <p className="text-2xl">MOTOR TEMP</p>
        </div>
      </div>
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <div className="p-4 border-4 bg-red-500 text-white border-red-700 text-4xl space-y-2">
            <p className="font-bold">ERROR</p>
            <p className="text-2xl">{error}</p>
          </div>
        </div>
      )}
      {!connected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/25">
          <div className="p-4 border-4 bg-red-500 text-white border-red-700 text-4xl space-y-2">
            <p className="font-bold">NOT CONNECTED</p>
            <p className="text-2xl">Rosbridge is not connected</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
