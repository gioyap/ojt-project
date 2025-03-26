"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function GenerateReportButton() {
  const [startDate, setStartDate] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [weekRanges, setWeekRanges] = useState<{ week: number; start: Date; end: Date }[]>([]);

  useEffect(() => {
    const fetchStartDate = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: internData, error } = await supabase
        .from("interns")
        .select("start_date")
        .eq("id", user.id)
        .single();

      if (error || !internData) {
        console.error("Error fetching start date:", error);
        return;
      }

      setStartDate(internData.start_date);

      const traineeStart = new Date(internData.start_date);
      const today = new Date();
      const weeks = [];
      let weekStart = new Date(traineeStart);

      const dayOfWeek = weekStart.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart.setDate(weekStart.getDate() - daysToMonday);
      weekStart.setHours(0, 0, 0, 0);

      let weekNumber = 1;
      while (weekStart <= today) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 4);

        if (weekEnd >= traineeStart) {
          const actualStart = weekNumber === 1 && traineeStart > weekStart ? traineeStart : weekStart;
          const actualEnd = weekEnd > today ? today : weekEnd;

          if (actualStart <= actualEnd) {
            weeks.push({
              week: weekNumber++,
              start: new Date(actualStart),
              end: new Date(actualEnd),
            });
          }
        }

        weekStart.setDate(weekStart.getDate() + 7);
      }

      setWeekRanges(weeks);
    };

    fetchStartDate();
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedWeek) {
      alert("Please select a week.");
      return;
    }

    try {
      const response = await fetch(`/api/generate-report?week=${selectedWeek}`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API response failed:", response.status, errorText);
        throw new Error("Failed to generate report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `internship-report-week-${selectedWeek}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating report:", error);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center w-full sm:w-auto">
      <select
        title="Select Week"
        value={selectedWeek || ""}
        onChange={(e) => setSelectedWeek(parseInt(e.target.value) || null)}
        className="w-full sm:w-64 p-2 sm:p-2.5 text-sm sm:text-base border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Select Week</option>
        {weekRanges.map(({ week, start, end }) => (
          <option key={week} value={week}>
            Week {week} ({start.toLocaleDateString()} - {end.toLocaleDateString()})
          </option>
        ))}
      </select>
      <Button
        onClick={handleGenerateReport}
        disabled={!selectedWeek}
        className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base"
      >
        Generate Report
      </Button>
    </div>
  );
}