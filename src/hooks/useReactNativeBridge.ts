import { useEffect, useState } from "react";

type RNMessageData = {
  startDate: string | Date;
  endDate: string | Date;
};

declare global {
  interface Window {
    receiveFromReactNative?: (data: RNMessageData) => void;
  }
}

export function useReactNativeBridge() {
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    window.receiveFromReactNative = (data: RNMessageData) => {
      console.log("Received from React Native:", data);

      // Convert to Date objects safely
      const newStart = new Date(data.startDate);
      const newEnd = new Date(data.endDate);

      if (!isNaN(newStart.getTime())) setStartDate(newStart);
      if (!isNaN(newEnd.getTime())) setEndDate(newEnd);
    };

    return () => {
      delete window.receiveFromReactNative;
    };
  }, []);

  return { startDate, endDate };
}
