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
import { Modal } from "@/components/ui/modal";

export function TimeLogForm({ traineeId }: { traineeId: string }) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeIn, setTimeIn] = useState<string>("");
  const [timeOut, setTimeOut] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    title: "",
    description: "",
    onConfirm: () => {},
  });

  useEffect(() => {
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

    return () => clearInterval(timer);
  }, []);

  // Helper function to convert 24-hour time to 12-hour AM/PM format
  const formatTimeTo12Hour = (time: string): string => {
    if (!time) return "";
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const adjustedHours = hours % 12 || 12; // Convert 0 or 12 to 12
    return `${adjustedHours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

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

    // Use the helper function to format timeIn and timeOut
    const formattedTimeIn = formatTimeTo12Hour(timeIn);
    const formattedTimeOut = formatTimeTo12Hour(timeOut);

    setModalConfig({
      title: "Confirm Time Log",
      description: `Are you sure you want to log your time for ${selectedDate.toLocaleDateString()} with Time In: ${formattedTimeIn} and Time Out: ${formattedTimeOut}?`,
      onConfirm: () => submitTimeLog(),
    });
    setIsModalOpen(true);
  };

  const submitTimeLog = async () => {
    setIsSubmitting(true);
    const formattedDate = date!.toLocaleDateString("en-CA");
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

    const { error: insertError } = await supabase.from("timelogs").insert([
      {
        trainee_id: traineeId,
        date: formattedDate,
        time_in: timeIn,
        time_out: timeOut,
        total_dayhours: totalHours,
        status_logs: "Present",
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
      .select("accomplished_hours, remaining_hours, days_present, days_absent")
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
            days_present: 1,
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
          days_present: summary.days_present + 1,
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
    setIsModalOpen(false);
  };

  const handleMarkAbsent = async () => {
    if (!date) {
      toast.error("Please select a date.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate.getTime() === today.getTime()) {
      toast.error("Marking absent for today's date is not allowed.");
      return;
    }

    setModalConfig({
      title: "Confirm Absence",
      description: `Are you sure you want to mark yourself as absent for ${selectedDate.toLocaleDateString()}?`,
      onConfirm: () => submitAbsent(),
    });
    setIsModalOpen(true);
  };

  const submitAbsent = async () => {
    setIsSubmitting(true);
    const formattedDate = date!.toLocaleDateString("en-CA");
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

    const { error: insertError } = await supabase.from("timelogs").insert([
      {
        trainee_id: traineeId,
        date: formattedDate,
        time_in: null,
        time_out: null,
        total_dayhours: 0,
        status_logs: "Absent",
      },
    ]);

    if (insertError) {
      toast.error("Error marking absent. Please try again.");
      console.error("Error marking absent:", insertError);
      setIsSubmitting(false);
      return;
    }

    const { data: summary, error: summaryError } = await supabase
      .from("attendancesummary")
      .select("accomplished_hours, remaining_hours, days_present, days_absent")
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
            accomplished_hours: 0,
            remaining_hours: internData.hours_to_render,
            days_present: 0,
            days_absent: 1,
          },
        ]);

      if (createSummaryError) {
        toast.error("Error creating attendance summary.");
        setIsSubmitting(false);
        return;
      }
    } else {
      const { error: updateSummaryError } = await supabase
        .from("attendancesummary")
        .update({
          days_absent: summary.days_absent + 1,
        })
        .eq("trainee_id", traineeId);

      if (updateSummaryError) {
        toast.error("Error updating attendance summary.");
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(false);
    toast.success("Marked as absent successfully!");
    setIsModalOpen(false);
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

  const calculateStatus = (): string => "Present";

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-4xl bg-white p-6 rounded-xl shadow-lg border border-gray-200"
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-6">Log Your Time</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium text-gray-700">
              Select Date
            </Label>
            <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
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
                  caption: { color: "#1f2937" },
                  head: { color: "#1f2937" },
                  day: { color: "#1f2937" },
                  day_selected: { backgroundColor: "#7c3aed", color: "#fff" },
                  day_today: { backgroundColor: "#e5e7eb" },
                }}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="timeIn" className="text-sm font-medium text-gray-700">
                Time In
              </Label>
              <Input
                id="timeIn"
                type="time"
                value={timeIn}
                onChange={(e) => setTimeIn(e.target.value)}
                required
                className="bg-white text-gray-800 border-blue-300 focus:ring-2 focus:ring-purple-500 rounded-lg placeholder-gray-400 time-picker-gray"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeOut" className="text-sm font-medium text-gray-700">
                Time Out
              </Label>
              <Input
                id="timeOut"
                type="time"
                value={timeOut}
                onChange={(e) => setTimeOut(e.target.value)}
                required
                className="bg-white text-gray-800 border-blue-300 focus:ring-2 focus:ring-purple-500 rounded-lg placeholder-gray-400 time-picker-gray"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-pink-500 text-white font-semibold py-2 rounded-lg shadow-md hover:bg-pink-600 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Logging..." : "Log Time"}
              </Button>
              <Button
                type="button"
                onClick={handleMarkAbsent}
                disabled={isSubmitting}
                className="w-full bg-gray-400 text-white font-semibold py-2 rounded-lg shadow-md hover:bg-red-500 transition-all disabled:opacity-50"
              >
                {isSubmitting ? "Marking..." : "Mark Absent"}
              </Button>
            </div>
            <div className="text-center bg-gradient-to-r from-blue-200 to-purple-200 text-white p-2 rounded-lg shadow-md">
              <p className="text-sm font-semibold text-gray-800">
                {currentDate || "Loading..."}
              </p>
              <p className="text-3xl font-semibold text-gray-800">
                {currentTime || "Loading..."}
              </p>
            </div>
          </div>
        </div>
      </form>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={modalConfig.onConfirm}
        title={modalConfig.title}
        description={modalConfig.description}
      />
    </>
  );
}