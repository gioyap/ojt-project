"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface AdminGenerateReportButtonProps {
  traineeId: string;
  startDate: string | null;
}

export default function AdminGenerateReportButton({ traineeId, startDate }: AdminGenerateReportButtonProps) {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [weekRanges, setWeekRanges] = useState<{ week: number; start: Date; end: Date }[]>([]);

  useEffect(() => {
    if (!startDate) return;

    // Calculate Monday-to-Friday weeks
    const traineeStart = new Date(startDate);
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
  }, [startDate]);

  const handleGenerateReport = async () => {
    if (!selectedWeek) {
      alert("Please select a week.");
      return;
    }

    try {
      const response = await fetch(`/api/admin-generate-report?week=${selectedWeek}&traineeId=${traineeId}`, {
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
      link.download = `internship-report-week-${selectedWeek}-trainee-${traineeId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report. Please try again.");
    }
  };

  return (
    <div className="flex gap-4 items-center">
      <select
        title="Select Week"
        value={selectedWeek || ""}
        onChange={(e) => setSelectedWeek(parseInt(e.target.value) || null)}
        className="px-4 py-2 rounded-full text-sm font-medium border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 text-gray-700 hover:bg-gray-200"
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