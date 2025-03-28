"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { jsPDF } from "jspdf";

export default function GenerateReportButton() {
  const [startDate, setStartDate] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [weekRanges, setWeekRanges] = useState<{ week: number; start: Date; end: Date }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

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

  // Define the type for the timelog entries
  interface Timelog {
    date: string;
    time_in: string | undefined;
    time_out: string | undefined;
    total_dayhours: number | undefined;
    status_logs: string | undefined;
    comments: string | undefined;
  }
  
    const handleGenerateReport = async () => {
    if (!selectedWeek) {
      alert("Please select a week.");
      return;
    }

    setIsLoading(true);
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

      const { internData, week, supervisorName, logoUrl } = await response.json();

      const logoResponse = await fetch(logoUrl);
      if (!logoResponse.ok) throw new Error("Failed to fetch logo");
      const logoArrayBuffer = await logoResponse.arrayBuffer();
      const logoBase64 = Buffer.from(logoArrayBuffer).toString("base64");
      const logoDataUrl = `data:image/png;base64,${logoBase64}`;

      const doc = new jsPDF();

      let fixedWidth, fixedHeight, xPos, yPos;
      switch (internData.hostCompany) {
        case "Flawless":
          fixedWidth = 40; fixedHeight = 15; xPos = 85; yPos = 10; break;
        case "Beauty and Butter":
          fixedWidth = 40; fixedHeight = 15; xPos = 85; yPos = 5; break;
        case "FINA":
          fixedWidth = 45; fixedHeight = 15; xPos = 85; yPos = 8; break;
        case "MTSI":
          fixedWidth = 35; fixedHeight = 25; xPos = 85; yPos = 3; break;
        default:
          fixedWidth = 40; fixedHeight = 15; xPos = 85; yPos = 10; break;
      }
      doc.addImage(logoDataUrl, "PNG", xPos, yPos, fixedWidth, fixedHeight);

      const companyTitle = `${internData.hostCompany} Internship - Week ${week}` || `RSC GROUP INTERNSHIP - Week ${week}`;
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 25, 210, 10, "F");
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(companyTitle.toUpperCase(), 105, 30, { align: "center" });

      doc.setFillColor(245, 245, 245);
      doc.roundedRect(10, 40, 190, 44, 5, 5, "F");
      doc.setFontSize(10);
      doc.setTextColor(33, 150, 243);
      doc.setFont("helvetica", "bold");
      doc.text("INTERN DETAILS", 15, 47);

      const details = [
        { label: "Name", value: internData.fullName },
        { label: "University", value: internData.university },
        { label: "Start Date", value: internData.startDate },
        { label: "Hours to Render", value: `${internData.hoursToRender} hours` },
        { label: "Department", value: internData.deptName },
        { label: "Program", value: internData.program },
        { label: "Year Level", value: internData.yearLevel + "th" },
        { label: "Section", value: internData.section },
        { label: "Schedule", value: internData.schedule },
      ];

      let yPosition = 55;
      const column1X = 15;
      const column2X = 110;
      const maxTextWidth = 60;
      const fontSize = 8;
      const midPoint = Math.ceil(details.length / 2);
      const column1Details = details.slice(0, midPoint);
      const column2Details = details.slice(midPoint);

      for (let i = 0; i < midPoint; i++) {
        if (column1Details[i]) {
          const item = column1Details[i];
          doc.setFont("helvetica", "bold");
          doc.setFontSize(fontSize);
          doc.setTextColor(50, 50, 50);
          doc.text(`${item.label}:`, column1X, yPosition);
          doc.setFont("helvetica", "normal");
          const splitText = doc.splitTextToSize(item.value, maxTextWidth);
          doc.text(splitText, column1X + 30, yPosition);
        }
        if (column2Details[i]) {
          const item = column2Details[i];
          doc.setFont("helvetica", "bold");
          doc.setFontSize(fontSize);
          doc.setTextColor(50, 50, 50);
          doc.text(`${item.label}:`, column2X, yPosition);
          doc.setFont("helvetica", "normal");
          const splitText = doc.splitTextToSize(item.value, maxTextWidth);
          doc.text(splitText, column2X + 25, yPosition);
        }
        yPosition += 6;
      }

      const tableStartY = 105;
      const tableX = 15;
      const cardWidth = 190;
      const cardPadding = 5;
      const tableWidth = cardWidth - 2 * cardPadding;
      const columnWidths = [35, 20, 20, 20, 20, tableWidth - (35 + 20 + 20 + 20 + 20)];
      const headers = ["DATE", "TIME IN", "TIME OUT", "TOTAL HOURS", "STATUS", "COMMENTS"];
      const lineHeight = 4;
      const cellPadding = 2;
      const titleHeight = 10;
      const titlePadding = 5;
      const headerHeight = 8;

      const formatTimeTo12Hour = (time: string | undefined) => {
        if (!time || time === "N/A") return "N/A";
        const [hoursStr, minutes] = time.split(":");
        let hours = parseInt(hoursStr, 10);
        const period = hours >= 12 ? "PM" : "AM";
        hours = hours % 12 || 12;
        return `${hours}:${minutes} ${period}`;
      };
      const formatDateToMonthDayYear = (dateStr: string | undefined) => {
        if (!dateStr || dateStr === "N/A") return "N/A";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "N/A";
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
      };

      const minRowHeight = 1 * lineHeight + 2 * cellPadding;
      const rowDataArray = internData.timelogs.map((log: Timelog) => [
        formatDateToMonthDayYear(log.date),
        formatTimeTo12Hour(log.time_in),
        formatTimeTo12Hour(log.time_out),
        log.total_dayhours ? `${log.total_dayhours} Hours` : "N/A",
        log.status_logs || "N/A",
        log.comments || "N/A",
      ]);

      const rowHeights = rowDataArray.map((row: string[]) => {
        let maxLines = 1;
        row.forEach((cell, index) => {
          const splitText = doc.splitTextToSize(cell, columnWidths[index] - 2 * cellPadding);
          maxLines = Math.max(maxLines, splitText.length);
        });
        return Math.max(maxLines * lineHeight + 2 * cellPadding, minRowHeight);
      });

      const totalRowsHeight = rowHeights.reduce((sum: number, height: number) => sum + height, 0);
      const totalSpacingBetweenRows = (rowDataArray.length - 1) * 1;
      const totalTableHeight = titleHeight + titlePadding + headerHeight + totalRowsHeight + totalSpacingBetweenRows + 5;

      doc.setFillColor(245, 245, 245);
      doc.roundedRect(10, 90, cardWidth, totalTableHeight, 5, 5, "F");
      doc.setFontSize(10);
      doc.setTextColor(33, 150, 243);
      doc.setFont("helvetica", "bold");
      doc.text("TIMELOGS", tableX, 97);

      doc.setFillColor(200, 200, 200);
      doc.rect(tableX, tableStartY - 4, tableWidth, headerHeight, "F");
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "bold");
      let currentX = tableX;
      headers.forEach((header, index) => {
        const splitHeader = doc.splitTextToSize(header, columnWidths[index] - 2 * cellPadding);
        doc.text(splitHeader, currentX + cellPadding, tableStartY);
        currentX += columnWidths[index];
      });

      doc.setFont("helvetica", "normal");
      let rowY = tableStartY + headerHeight;
      rowDataArray.forEach((row: string[], rowIndex: number) => {
        currentX = tableX;
        const rowHeight = rowHeights[rowIndex];
        row.forEach((cell, index) => {
          const splitText = doc.splitTextToSize(cell, columnWidths[index] - 2 * cellPadding);
          doc.text(splitText, currentX + cellPadding, rowY + cellPadding);
          currentX += columnWidths[index];
        });
        rowY += rowHeight + 1;
      });

      const signatureY = 260;
      const internSignatureX = 15;
      const supervisorSignatureX = 145;
      const signatureLineLength = 50;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const internNameWidth = doc.getTextWidth(internData.fullName);
      doc.setFont("helvetica", "bold");
      const internTitleWidth = doc.getTextWidth("INTERN SIGNATURE");
      const internMaxWidth = Math.max(internNameWidth, internTitleWidth, signatureLineLength);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      const internNameX = internSignatureX + (internMaxWidth - internNameWidth) / 2;
      doc.text(internData.fullName, internNameX, signatureY);

      const internLineY = signatureY + 2;
      const internLineStartX = internSignatureX + (internMaxWidth - signatureLineLength) / 2;
      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 0, 0);
      doc.line(internLineStartX, internLineY, internLineStartX + signatureLineLength, internLineY);

      doc.setFont("helvetica", "bold");
      const internTitleY = internLineY + 4;
      const internTitleX = internSignatureX + (internMaxWidth - internTitleWidth) / 2;
      doc.text("INTERN SIGNATURE", internTitleX, internTitleY);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const supervisorNameWidth = doc.getTextWidth(supervisorName);
      doc.setFont("helvetica", "bold");
      const supervisorTitleWidth = doc.getTextWidth("SUPERVISOR SIGNATURE");
      const supervisorMaxWidth = Math.max(supervisorNameWidth, supervisorTitleWidth, signatureLineLength);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      const supervisorNameX = supervisorSignatureX + (supervisorMaxWidth - supervisorNameWidth) / 2;
      doc.text(supervisorName, supervisorNameX, signatureY);

      const supervisorLineY = signatureY + 2;
      const supervisorLineStartX = supervisorSignatureX + (supervisorMaxWidth - signatureLineLength) / 2;
      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 0, 0);
      doc.line(supervisorLineStartX, supervisorLineY, supervisorLineStartX + signatureLineLength, supervisorLineY);

      doc.setFont("helvetica", "bold");
      const supervisorTitleY = supervisorLineY + 4;
      const supervisorTitleX = supervisorSignatureX + (supervisorMaxWidth - supervisorTitleWidth) / 2;
      doc.text("SUPERVISOR SIGNATURE", supervisorTitleX, supervisorTitleY);

      doc.save(`internship-report-week-${selectedWeek}.pdf`);
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsLoading(false);
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
      <Button onClick={handleGenerateReport} disabled={!selectedWeek || isLoading}>
        {isLoading ? "Generating..." : "Generate Report"}
      </Button>
    </div>
  );
}