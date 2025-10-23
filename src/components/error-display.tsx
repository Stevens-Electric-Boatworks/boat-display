import { useSocket } from "./socket-context";

export const ErrorDisplay = () => {
  const { status } = useSocket();

  return (
    <div className="w-full h-full flex items-center justify-center text-2xl">
      {status}
    </div>
  );
};
