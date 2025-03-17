"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface TimeLogEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (timeIn: string, timeOut: string, totalHours: number) => void;
  initialTimeIn: string | null;
  initialTimeOut: string | null;
  date: string | null;
  timeId: number;
  isSaving?: boolean;
}

export function EditTimeLogModal({
  isOpen,
  onClose,
  onSave,
  initialTimeIn,
  initialTimeOut,
  date,
  timeId,
  isSaving = false,
}: TimeLogEditModalProps) {
  const [timeIn, setTimeIn] = useState<string>("");
  const [timeOut, setTimeOut] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setTimeIn(initialTimeIn || "");
      setTimeOut(initialTimeOut || "");
    }
  }, [isOpen, initialTimeIn, initialTimeOut]);

  if (!isOpen) return null;

  const calculateTotalHours = (timeIn: string, timeOut: string): number => {
    const [inHours] = timeIn.split(":").map(Number);
    let [outHours] = timeOut.split(":").map(Number);
    const workStartHour = 8;
    const breakStart = 12;
    const breakEnd = 13;
    const maxWorkEndHour = 18;

    let effectiveStartHour = inHours < workStartHour ? workStartHour : inHours;
    if (inHours >= breakStart && inHours < breakEnd) effectiveStartHour = breakEnd;
    let effectiveEndHour = outHours > maxWorkEndHour ? maxWorkEndHour : outHours;

    let totalHours = effectiveEndHour - effectiveStartHour;
    if (effectiveStartHour < breakStart && effectiveEndHour > breakStart) totalHours -= 1;

    return Math.max(0, totalHours);
  };

  const handleSave = () => {
    if (!timeIn || !timeOut) return; // Silent fail, API will handle feedback
    const totalHours = Math.round(calculateTotalHours(timeIn, timeOut));
    onSave(timeIn, timeOut, totalHours);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Time Log</h2>
        <div className="space-y-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Date</label>
            <div className="text-lg font-semibold text-gray-800">
              {date
                ? new Date(date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "N/A"}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Time In</label>
            <input
              title="Time In"
              type="time"
              value={timeIn}
              onChange={(e) => setTimeIn(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Time Out</label>
            <input
              title="Time Out"
              type="time"
              value={timeOut}
              onChange={(e) => setTimeOut(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <Button onClick={onClose} className="bg-gray-400 text-white hover:bg-gray-500">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-pink-500 text-white hover:bg-pink-600"
            disabled={!timeIn || !timeOut || isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}