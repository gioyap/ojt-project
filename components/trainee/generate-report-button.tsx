// components/trainee/generate-report-button.tsx
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

      // Calculate Monday-to-Friday weeks
      const traineeStart = new Date(internData.start_date);
      const today = new Date();
      const weeks = [];
      let weekStart = new Date(traineeStart);

      // Adjust weekStart to the previous Monday if not already a Monday
      const dayOfWeek = weekStart.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart.setDate(weekStart.getDate() - daysToMonday);
      weekStart.setHours(0, 0, 0, 0);

      let weekNumber = 1;
      while (weekStart <= today) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 4); // Friday (Monday + 4 days)

        // Only include weeks that overlap with or are after the trainee's start date
        if (weekEnd >= traineeStart) {
          const actualStart = weekNumber === 1 && traineeStart > weekStart ? traineeStart : weekStart;
          const actualEnd = weekEnd > today ? today : weekEnd;

          // Skip if the week ends before the start date (e.g., partial week with no valid days)
          if (actualStart <= actualEnd) {
            weeks.push({
              week: weekNumber++,
              start: new Date(actualStart),
              end: new Date(actualEnd),
            });
          }
        }

        weekStart.setDate(weekStart.getDate() + 7); // Move to next Monday
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
    <div className="flex gap-4 items-center">
      <select
      title="Select Week"
        value={selectedWeek || ""}
        onChange={(e) => setSelectedWeek(parseInt(e.target.value) || null)}
        className="p-2 border rounded"
      >
        <option value="">Select Week</option>
        {weekRanges.map(({ week, start, end }) => (
          <option key={week} value={week}>
            Week {week} ({start.toLocaleDateString()} - {end.toLocaleDateString()})
          </option>
        ))}
      </select>
      <Button onClick={handleGenerateReport} disabled={!selectedWeek}>
        Generate Report
      </Button>
    </div>
  );
}