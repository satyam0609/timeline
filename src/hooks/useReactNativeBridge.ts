import { useEffect, useState } from "react";

type RNMessageData = {
  startDate: string | Date;
  endDate: string | Date;
};

declare global {
  interface Window {
    receiveFromReactNative?: (data: RNMessageData) => void;
    initialDates?: { startDate: string; endDate: string };
  }
}

export function useReactNativeBridge() {
  // ✅ Initialize state from injected initialDates if available
  const initialStart = window.initialDates?.startDate
    ? new Date(window.initialDates.startDate)
    : new Date();
  const initialEnd = window.initialDates?.endDate
    ? new Date(window.initialDates.endDate)
    : new Date();

  const [startDate, setStartDate] = useState<Date>(initialStart);
  const [endDate, setEndDate] = useState<Date>(initialEnd);

  useEffect(() => {
    console.log("🟡 React Native Bridge mounted");

    window.receiveFromReactNative = (data: RNMessageData) => {
      console.log("✅ Received from React Native:", data);

      const newStart = new Date(data.startDate);
      const newEnd = new Date(data.endDate);

      if (!isNaN(newStart.getTime())) setStartDate(newStart);
      if (!isNaN(newEnd.getTime())) setEndDate(newEnd);
    };

    return () => {
      console.log("🔴 Cleaning up React Native Bridge listener");
      delete window.receiveFromReactNative;
    };
  }, []);

  // Optional: watch for state changes
  useEffect(() => {
    console.log("🔁 Timeline state updated:", { startDate, endDate });
  }, [startDate, endDate]);

  return { startDate, endDate };
}
