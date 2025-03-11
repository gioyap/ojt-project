"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function TimeLogForm({ traineeId }: { traineeId: string }) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeIn, setTimeIn] = useState<string>("");
  const [timeOut, setTimeOut] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());
  const [currentDate, setCurrentDate] = useState<string>(
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  );

  // Update the clock and date every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      );
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(timer);
  }, []);

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

    const totalHours = calculateTotalHours(timeIn, timeOut);
    const status = calculateStatus(timeIn);

    const { error: insertError } = await supabase.from("timelogs").insert([
      {
        trainee_id: traineeId,
        date: formattedDate,
        time_in: timeIn,
        time_out: timeOut,
        total_dayhours: totalHours,
        status_logs: status,
      },
    ]);

    if (insertError) {
      toast.error("Error logging time. Please try again.");
      console.error("Error logging time:", insertError);
      setIsSubmitting(false);
      return;
    }

    const { data: summary, error: summaryError } = await supabase
      .from("attendancesummary")
      .select("accomplished_hours, remaining_hours, days_present, days_late")
      .eq("trainee_id", traineeId)
      .maybeSingle();

    if (summaryError || !summary) {
      const { data: internData, error: internError } = await supabase
        .from("interns")
        .select("hours_to_render")
        .eq("id", traineeId)
        .single();

      if (internError || !internData) {
        toast.error("Error fetching intern details.");
        setIsSubmitting(false);
        return;
      }

      const { error: createSummaryError } = await supabase
        .from("attendancesummary")
        .insert([
          {
            trainee_id: traineeId,
            accomplished_hours: totalHours,
            remaining_hours: internData.hours_to_render - totalHours,
            days_present: status === "Present" ? 1 : 0,
            days_late: status === "Late" ? 1 : 0,
            days_absent: 0,
          },
        ]);

      if (createSummaryError) {
        toast.error("Error creating attendance summary.");
        setIsSubmitting(false);
        return;
      }
    } else {
      const updatedAccomplishedHours = summary.accomplished_hours + totalHours;
      const updatedRemainingHours = summary.remaining_hours - totalHours;

      const { error: updateSummaryError } = await supabase
        .from("attendancesummary")
        .update({
          accomplished_hours: updatedAccomplishedHours,
          remaining_hours: updatedRemainingHours,
          days_present: status === "Present" ? summary.days_present + 1 : summary.days_present,
          days_late: status === "Late" ? summary.days_late + 1 : summary.days_late,
        })
        .eq("trainee_id", traineeId);

      if (updateSummaryError) {
        toast.error("Error updating attendance summary.");
        setIsSubmitting(false);
        return;
      }

      if (updatedRemainingHours <= 0) {
        await supabase
          .from("interns")
          .update({ status: "Completed" })
          .eq("id", traineeId);
      }
    }

    setIsSubmitting(false);
    toast.success("Time logged successfully!");
    setTimeIn("");
    setTimeOut("");
  };

  const calculateTotalHours = (timeIn: string, timeOut: string): number => {
    const [inHours, inMinutes] = timeIn.split(":").map(Number);
    let [outHours, outMinutes] = timeOut.split(":").map(Number);

    const workStartHour = 8;
    const breakStart = 12;
    const breakEnd = 13;
    const maxWorkEndHour = 18;

    const effectiveStartHour = inHours < workStartHour ? workStartHour : inHours;

    if (outHours > maxWorkEndHour || (outHours === maxWorkEndHour && outMinutes > 0)) {
      outHours = maxWorkEndHour;
      outMinutes = 0;
    }

    let totalHours = Math.max(0, outHours - effectiveStartHour);

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
    const lateThresholdMinutes = expectedTimeMinutes + 15;
    return timeInMinutes <= lateThresholdMinutes ? "Present" : "Late";
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl bg-white p-6 rounded-xl shadow-lg border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">Log Your Time</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Calendar */}
        <div className="space-y-2">
          <Label htmlFor="date" className="text-sm font-medium text-gray-700">Select Date</Label>
          <div className="bg-white p-4 rounded-lg border border-blue-300 shadow-sm">
            <DayPicker
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
              className="w-full text-gray-800"
              styles={{
                caption: { color: "#1f2937" }, // gray-800
                head: { color: "#1f2937" },
                day: { color: "#1f2937" },
                day_selected: { backgroundColor: "#7c3aed", color: "#fff" }, // Purple selection
                day_today: { backgroundColor: "#e5e7eb" }, // gray-200
              }}
            />
          </div>
        </div>

        {/* Right Column: Time In, Time Out, Button, Clock & Date */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="timeIn" className="text-sm font-medium text-gray-700">Time In</Label>
            <Input
              id="timeIn"
              type="time"
              value={timeIn}
              onChange={(e) => setTimeIn(e.target.value)}
              required
              className="bg-white text-gray-800 border-blue-300 focus:ring-2 focus:ring-purple-500 rounded-lg placeholder-gray-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeOut" className="text-sm font-medium text-gray-700">Time Out</Label>
            <Input
              id="timeOut"
              type="time"
              value={timeOut}
              onChange={(e) => setTimeOut(e.target.value)}
              required
              className="bg-white text-gray-800 border-blue-300 focus:ring-2 focus:ring-purple-500 rounded-lg placeholder-gray-400"
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-pink-500 text-white font-semibold py-2 rounded-lg shadow-md hover:bg-pink-600 transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Logging..." : "Log Time"}
          </Button>
          <div className="text-center bg-gradient-to-r from-blue-200 to-purple-200 text-white p-2 rounded-lg shadow-md">
            <p className="text-sm text-gray-800">{currentDate}</p>
            <p className="text-3xl font-semibold text-gray-800">{currentTime}</p>
          </div>
        </div>
      </div>
    </form>
  );
}