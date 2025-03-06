"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function TimeLogForm({ traineeId }: { traineeId: string }) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeIn, setTimeIn] = useState<string>("");
  const [timeOut, setTimeOut] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !timeIn || !timeOut) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (timeIn >= timeOut) {
      toast.error("Time in must be before time out.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate.getTime() === today.getTime()) {
      toast.error("Time logging for today's date is not allowed.");
      return;
    }

    setIsSubmitting(true);
    const formattedDate = date.toLocaleDateString("en-CA");
    const supabase = createClient();

    const { data: existingLog, error: fetchError } = await supabase
      .from("timelogs")
      .select("time_id")
      .eq("trainee_id", traineeId)
      .eq("date", formattedDate)
      .maybeSingle();

    if (fetchError) {
      toast.error("Error checking existing time log.");
      setIsSubmitting(false);
      return;
    }

    if (existingLog) {
      toast.error("Time log for this date already exists.");
      setIsSubmitting(false);
      return;
    }

    const status = calculateStatus(timeIn);

    const { error } = await supabase.from("timelogs").insert([
      {
        trainee_id: traineeId,
        date: formattedDate,
        time_in: timeIn,
        time_out: timeOut,
        total_dayhours: calculateTotalHours(timeIn, timeOut),
        status_logs: status,
      },
    ]);

    setIsSubmitting(false);

    if (error) {
      toast.error("Error logging time. Please try again.");
      console.error("Error logging time:", error);
    } else {
      toast.success("Time logged successfully!");
      setTimeIn("");
      setTimeOut("");
    }
  };

  const calculateTotalHours = (timeIn: string, timeOut: string): number => {
    const [inHours, inMinutes] = timeIn.split(":").map(Number);
    let [outHours, outMinutes] = timeOut.split(":").map(Number);

    const workStartHour = 8;
    const breakStart = 12;
    const breakEnd = 13;
    const maxWorkEndHour = 18; // 6:00 PM limit

    const effectiveStartHour = inHours < workStartHour ? workStartHour : inHours;

    // Cap the time out to 6:00 PM if exceeded
    if (outHours > maxWorkEndHour || (outHours === maxWorkEndHour && outMinutes > 0)) {
      outHours = maxWorkEndHour;
      outMinutes = 0;
    }

    let totalHours = Math.max(0, outHours - effectiveStartHour);

    // Deduct break time if applicable
    if (effectiveStartHour < breakStart && outHours > breakStart) {
      totalHours -= 1;
    }

    return totalHours;
  };

  const calculateStatus = (timeIn: string): string => {
    const [hours, minutes] = timeIn.split(":").map(Number);
    const expectedHour = 8;
    const expectedMinute = 0;
    const timeInMinutes = hours * 60 + minutes;
    const expectedTimeMinutes = expectedHour * 60 + expectedMinute;
    const lateThresholdMinutes = expectedTimeMinutes + 10;
    return timeInMinutes <= lateThresholdMinutes ? "Present" : "Late";
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <div>
        <Label htmlFor="date">Date</Label>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate && selectedDate < today) {
              setDate(selectedDate);
            }
          }}
          disabled={(date) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const formattedDate = new Date(date);
            formattedDate.setHours(0, 0, 0, 0);
            return formattedDate >= today;
          }}
          className="rounded-md border"
        />
      </div>
      <div>
        <Label htmlFor="timeIn">Time In</Label>
        <Input
          id="timeIn"
          type="time"
          value={timeIn}
          onChange={(e) => setTimeIn(e.target.value)}
          required
        />
      </div>
      <div>
        <Label htmlFor="timeOut">Time Out</Label>
        <Input
          id="timeOut"
          type="time"
          value={timeOut}
          onChange={(e) => setTimeOut(e.target.value)}
          required
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging..." : "Log Time"}
      </Button>
    </form>
  );
}
