import { createContext, useContext } from "react";
import useBLE from "@/hooks/useBLE";

const BLEContext = createContext<ReturnType<typeof useBLE> | null>(null);

export const BLEProvider = ({ children }: { children: React.ReactNode }) => {
  const ble = useBLE();
  return <BLEContext.Provider value={ble}>{children}</BLEContext.Provider>;
};

export const useBLEContext = () => {
  const context = useContext(BLEContext);
  if (!context) throw new Error("useBLEContext must be used within BLEProvider");
  return context;
};
