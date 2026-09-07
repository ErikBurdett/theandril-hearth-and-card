import { createContext, useContext } from "react";
export const CardInspectContext = createContext<((id: string) => void) | null>(
  null,
);
export const useCardInspect = () => useContext(CardInspectContext);
