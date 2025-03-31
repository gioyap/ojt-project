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
  
      const { internData, timelogSummary, week, supervisorName, logoUrl } = await response.json();
  
      const logoResponse = await fetch(logoUrl);
      if (!logoResponse.ok) throw new Error("Failed to fetch logo");
      const logoArrayBuffer = await logoResponse.arrayBuffer();
      const logoBase64 = Buffer.from(logoArrayBuffer).toString("base64");
      const logoDataUrl = `data:image/png;base64,${logoBase64}`;
  
      const doc = new jsPDF();
  
      // Define spacing constants
      const pageMargin = 10; // Margin on left and right
      const cardWidth = 210 - 2 * pageMargin; // Full width minus margins
      const columnWidth = (cardWidth - 30) / 2; // Two columns with padding (10 left, 10 right, 10 middle)
      const fontSize = 8;
      const lineHeight = 3.5; // Spacing between content lines
      const cardPaddingTop = 2; // Padding between card top and title
      const titleHeight = 5; // Height of the title area
      const contentPaddingTop = 5; // Padding between title and content
      const cardPaddingBottom = 2; // Padding at the bottom of the card
      const gapBetweenCards = 3.5; // Gap between cards
      const summaryTableGap = 5; // Gap between timelog summary content and timelogs table within the Timelogs card
  
      // Logo
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
  
      // Header
      const companyTitle = `${internData.hostCompany} Internship - Week ${week}` || `RSC GROUP INTERNSHIP - Week ${week}`;
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 25, 210, 10, "F");
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(companyTitle.toUpperCase(), 105, 30, { align: "center" });
  
      // Intern Details Card
      const internCardY = 40; // Starting Y position of the card
      let leftYPosition = internCardY + cardPaddingTop + titleHeight + contentPaddingTop;
      let rightYPosition = internCardY + cardPaddingTop + titleHeight + contentPaddingTop;
      const leftLabelX = pageMargin + 5; // 5 units padding inside the card
      const rightLabelX = pageMargin + 5 + columnWidth + 10; // Middle padding of 10
  
      // Split intern details into two columns
      const leftColumnDetails = [
        { label: "Name: ", value: internData.fullName },
        { label: "University: ", value: internData.university },
        { label: "Start Date: ", value: internData.startDate },
      ];
  
      const rightColumnDetails = [
        { label: "Program: ", value: internData.program },
        {
          label1: "Year Level: ",
          value1: internData.yearLevel + "th",
          label2: "Section: ",
          value2: internData.section,
        },
        { label: "Department: ", value: internData.deptName },
      ];
  
      // Calculate heights for left column
      const leftColumnHeights: number[] = [];
      leftColumnDetails.forEach((item) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(fontSize);
        const labelWidth = doc.getTextWidth(item.label ?? "");
        doc.setFont("helvetica", "normal");
        const maxTextWidth = columnWidth - labelWidth - 5;
        const splitText = doc.splitTextToSize(item.value, maxTextWidth);
        const height = lineHeight * splitText.length;
        leftColumnHeights.push(height);
      });
  
      // Calculate heights for right column
      const rightColumnHeights: number[] = [];
      rightColumnDetails.forEach((item, index) => {
        if (index === 1) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(fontSize);
          const label1Width = doc.getTextWidth(item.label1 ?? "");
          doc.setFont("helvetica", "normal");
          const maxTextWidth1 = (columnWidth / 2) - label1Width - 2;
          const splitText1 = doc.splitTextToSize(item.value1 ?? "", maxTextWidth1);
  
          doc.setFont("helvetica", "bold");
          const label2Width = doc.getTextWidth(item.label2 ?? "");
          doc.setFont("helvetica", "normal");
          const maxTextWidth2 = (columnWidth / 2) - label2Width - 2;
          const splitText2 = doc.splitTextToSize(item.value2, maxTextWidth2);
  
          const maxLines = Math.max(splitText1.length, splitText2.length);
          const height = lineHeight * maxLines;
          rightColumnHeights.push(height);
        } else {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(fontSize);
          const labelWidth = doc.getTextWidth(item.label ?? "");
          doc.setFont("helvetica", "normal");
          const maxTextWidth = columnWidth - labelWidth - 5;
          const splitText = doc.splitTextToSize(item.value, maxTextWidth);
          const height = lineHeight * splitText.length;
          rightColumnHeights.push(height);
        }
      });
  
      // Calculate total content height for each column
      const leftColumnTotalHeight = leftColumnHeights.reduce((sum, height) => sum + height, 0);
      const rightColumnTotalHeight = rightColumnHeights.reduce((sum, height) => sum + height, 0);
      const contentHeight = Math.max(leftColumnTotalHeight, rightColumnTotalHeight);
      const internCardHeight = cardPaddingTop + titleHeight + contentPaddingTop + contentHeight + cardPaddingBottom;
  
      // Draw the Intern Details card
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(pageMargin, internCardY, cardWidth, internCardHeight, 5, 5, "F");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("INTERN DETAILS", pageMargin + 5, internCardY + cardPaddingTop + 4);
  
      // Render Left Column
      leftYPosition = internCardY + cardPaddingTop + titleHeight + contentPaddingTop;
      leftColumnDetails.forEach((item) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(fontSize);
        doc.setTextColor(50, 50, 50);
        const labelWidth = doc.getTextWidth(item.label ?? "");
        doc.text(item.label, leftLabelX, leftYPosition);
  
        doc.setFont("helvetica", "normal");
        const valueX = leftLabelX + labelWidth;
        const maxTextWidth = columnWidth - labelWidth - 5;
        const splitText = doc.splitTextToSize(item.value, maxTextWidth);
        doc.text(splitText, valueX, leftYPosition);
        leftYPosition += lineHeight * splitText.length;
      });
  
      // Render Right Column
      rightYPosition = internCardY + cardPaddingTop + titleHeight + contentPaddingTop;
      rightColumnDetails.forEach((item, index) => {
        if (index === 1) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(fontSize);
          doc.setTextColor(50, 50, 50);
  
          const label1Width = doc.getTextWidth(item.label1 ?? "");
          doc.text(item.label1 ?? "", rightLabelX, rightYPosition);
  
          doc.setFont("helvetica", "normal");
          const value1X = rightLabelX + label1Width;
          const maxTextWidth1 = (columnWidth / 2) - label1Width - 2;
          const splitText1 = doc.splitTextToSize(item.value1 ?? "", maxTextWidth1);
          doc.text(splitText1, value1X, rightYPosition);
  
          doc.setFont("helvetica", "bold");
          const label2X = rightLabelX + (columnWidth / 2) + 5;
          const label2Width = doc.getTextWidth(item.label2 ?? "");
          doc.text(item.label2 ?? "", label2X, rightYPosition);
  
          doc.setFont("helvetica", "normal");
          const value2X = label2X + label2Width;
          const maxTextWidth2 = (columnWidth / 2) - label2Width - 2;
          const splitText2 = doc.splitTextToSize(item.value2, maxTextWidth2);
          doc.text(splitText2, value2X, rightYPosition);
  
          const maxLines = Math.max(splitText1.length, splitText2.length);
          rightYPosition += lineHeight * maxLines;
        } else {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(fontSize);
          doc.setTextColor(50, 50, 50);
          const labelWidth = doc.getTextWidth(item.label ?? "");
          doc.text(item.label ?? "", rightLabelX, rightYPosition);
  
          doc.setFont("helvetica", "normal");
          const valueX = rightLabelX + labelWidth;
          const maxTextWidth = columnWidth - labelWidth - 5;
          const splitText = doc.splitTextToSize(item.value, maxTextWidth);
          doc.text(splitText, valueX, rightYPosition);
          rightYPosition += lineHeight * splitText.length;
        }
      });
  
      // Calculate the bottom of the Intern Details card
      const internCardBottomY = internCardY + internCardHeight;
  
      // Unified Timelogs Card (combining Timelog Summary and Timelogs Table)
      const timelogsCardY = internCardBottomY + gapBetweenCards;
      let timelogLeftYPosition = timelogsCardY + cardPaddingTop + titleHeight + contentPaddingTop;
      let timelogRightYPosition = timelogsCardY + cardPaddingTop + titleHeight + contentPaddingTop;
      const timelogLeftLabelX = pageMargin + 5;
      const timelogRightLabelX = pageMargin + 5 + columnWidth + 10;
  
      // Timelog Summary content (to be placed at the top of the Timelogs card)
      const timelogLeftColumnDetails = [
        { label: "Hours to Render: ", value: `${timelogSummary.hoursToRender}` + " Hours" },
        { label: "Total Remaining: ", value: `${timelogSummary.totalRemainingHours}` + " Hours" },
      ];
  
      const timelogRightColumnDetails = [
        { label: `Accumulated Hours (Week #${week}): `, value: `${timelogSummary.accumulatedHoursThisWeek}` + " Hours" },
        { label: "Total Accumulated Hours: ", value: `${timelogSummary.totalAccumulatedHours}` + " Hours" },
      ];
  
      // Calculate heights for timelog summary left column
      const timelogLeftColumnHeights: number[] = [];
      timelogLeftColumnDetails.forEach((item) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(fontSize);
        const labelWidth = doc.getTextWidth(item.label);
        const splitLabel = doc.splitTextToSize(item.label, columnWidth - 20);
        doc.setFont("helvetica", "normal");
        const maxTextWidth = columnWidth - labelWidth - 5;
        const splitValue = doc.splitTextToSize(item.value, maxTextWidth);
        const maxLines = Math.max(splitLabel.length, splitValue.length);
        const height = lineHeight * maxLines;
        timelogLeftColumnHeights.push(height);
      });
  
      // Calculate heights for timelog summary right column
      const timelogRightColumnHeights: number[] = [];
      timelogRightColumnDetails.forEach((item) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(fontSize);
        const labelWidth = doc.getTextWidth(item.label);
        const splitLabel = doc.splitTextToSize(item.label, columnWidth - 20);
        doc.setFont("helvetica", "normal");
        const maxTextWidth = columnWidth - labelWidth - 5;
        const splitValue = doc.splitTextToSize(item.value, maxTextWidth);
        const maxLines = Math.max(splitLabel.length, splitValue.length);
        const height = lineHeight * maxLines;
        timelogRightColumnHeights.push(height);
      });
  
      // Calculate total content height for timelog summary section
      const timelogLeftColumnTotalHeight = timelogLeftColumnHeights.reduce((sum, height) => sum + height, 0);
      const timelogRightColumnTotalHeight = timelogRightColumnHeights.reduce((sum, height) => sum + height, 0);
      const timelogSummaryContentHeight = Math.max(timelogLeftColumnTotalHeight, timelogRightColumnTotalHeight);
  
      // Timelogs Table (to be placed below the summary content within the same card)
      const tableStartY = timelogsCardY + cardPaddingTop + titleHeight + contentPaddingTop + timelogSummaryContentHeight + summaryTableGap;
      const tableX = pageMargin + 5;
      const cardPadding = 5;
      const tableWidth = cardWidth - 2 * cardPadding;
      const columnWidths = [40, 25, 25, 25, tableWidth - (40 + 25 + 25 + 25)]; // Date: 40, Time In: 25, Time Out: 25, Total Hours: 25, Comments: remaining
      const headers = ["Date", "Time In", "Time Out", "Total Hours", "Comments"];
      const tableLineHeight = 4;
      const cellPadding = 2;
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
        return `${monthNames[date.getMonth()]}, ${date.getDate()}, ${date.getFullYear()}`;
      };
  
      const minRowHeight = 1 * tableLineHeight + 2 * cellPadding;
      const rowDataArray = internData.timelogs.map((log: Timelog) => [
        formatDateToMonthDayYear(log.date),
        formatTimeTo12Hour(log.time_in),
        formatTimeTo12Hour(log.time_out),
        log.total_dayhours ? `${log.total_dayhours} Hours` : "N/A",
        log.comments || "N/A",
      ]);
  
      const rowHeights = rowDataArray.map((row: string[]) => {
        let maxLines = 1;
        row.forEach((cell, index) => {
          const splitText = doc.splitTextToSize(cell, columnWidths[index] - 2 * cellPadding);
          maxLines = Math.max(maxLines, splitText.length);
        });
        return Math.max(maxLines * tableLineHeight + 2 * cellPadding, minRowHeight);
      });
  
      const totalRowsHeight = rowHeights.reduce((sum: number, height: number) => sum + height, 0);
      const totalSpacingBetweenRows = (rowDataArray.length - 1) * tableLineHeight;
      const totalTableHeight = headerHeight + totalRowsHeight + totalSpacingBetweenRows;
  
      // Calculate the total height of the Timelogs card
      const timelogsCardHeight = cardPaddingTop + titleHeight + contentPaddingTop + timelogSummaryContentHeight + summaryTableGap + totalTableHeight + cardPaddingBottom;
  
      // Draw the Timelogs card
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(pageMargin, timelogsCardY, cardWidth, timelogsCardHeight, 5, 5, "F");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("TIMELOGS", pageMargin + 5, timelogsCardY + cardPaddingTop + 4);
  
      // Render Timelog Summary Content - Left Column
      timelogLeftYPosition = timelogsCardY + cardPaddingTop + titleHeight + contentPaddingTop;
      timelogLeftColumnDetails.forEach((item) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(fontSize);
        doc.setTextColor(50, 50, 50);
        const labelWidth = doc.getTextWidth(item.label);
        const splitLabel = doc.splitTextToSize(item.label, columnWidth - 20);
        doc.text(splitLabel, timelogLeftLabelX, timelogLeftYPosition);
  
        doc.setFont("helvetica", "normal");
        const valueX = timelogLeftLabelX + labelWidth;
        const maxTextWidth = columnWidth - labelWidth - 5;
        const splitValue = doc.splitTextToSize(item.value, maxTextWidth);
        doc.text(splitValue, valueX, timelogLeftYPosition);
        timelogLeftYPosition += lineHeight * Math.max(splitLabel.length, splitValue.length);
      });
  
      // Render Timelog Summary Content - Right Column
      timelogRightYPosition = timelogsCardY + cardPaddingTop + titleHeight + contentPaddingTop;
      timelogRightColumnDetails.forEach((item) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(fontSize);
        doc.setTextColor(50, 50, 50);
        const labelWidth = doc.getTextWidth(item.label);
        const splitLabel = doc.splitTextToSize(item.label, columnWidth - 20);
        doc.text(splitLabel, timelogRightLabelX, timelogRightYPosition);
  
        doc.setFont("helvetica", "normal");
        const valueX = timelogRightLabelX + labelWidth;
        const maxTextWidth = columnWidth - labelWidth - 5;
        const splitValue = doc.splitTextToSize(item.value, maxTextWidth);
        doc.text(splitValue, valueX, timelogRightYPosition);
        timelogRightYPosition += lineHeight * Math.max(splitLabel.length, splitValue.length);
      });
  
      // Render Timelogs Table
      // Draw the table header background
      doc.setFillColor(200, 200, 200);
      doc.rect(tableX, tableStartY, tableWidth, headerHeight, "F");
  
      // Draw vertical lines for the header
      doc.setDrawColor(150, 150, 150); // Gray color for lines
      doc.setLineWidth(0.2);
      let currentX = tableX;
      for (let i = 0; i <= columnWidths.length; i++) {
        doc.line(currentX, tableStartY, currentX, tableStartY + headerHeight);
        if (i < columnWidths.length) currentX += columnWidths[i];
      }
  
      // Draw horizontal line at the bottom of the header
      doc.line(tableX, tableStartY + headerHeight, tableX + tableWidth, tableStartY + headerHeight);
  
      // Render table headers
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "bold");
      currentX = tableX;
      headers.forEach((header, index) => {
        const splitHeader = doc.splitTextToSize(header, columnWidths[index] - 2 * cellPadding);
        doc.text(splitHeader, currentX + cellPadding, tableStartY + 4);
        currentX += columnWidths[index];
      });
  
      // Render table rows with grid lines
      doc.setFont("helvetica", "normal");
      let rowY = tableStartY + headerHeight;
      rowDataArray.forEach((row: string[], rowIndex: number) => {
        currentX = tableX;
        const rowHeight = rowHeights[rowIndex];
  
        // Draw vertical lines for the row
        for (let i = 0; i <= columnWidths.length; i++) {
          doc.line(currentX, rowY, currentX, rowY + rowHeight);
          if (i < columnWidths.length) currentX += columnWidths[i];
        }
  
        // Draw horizontal line at the bottom of the row
        doc.line(tableX, rowY + rowHeight, tableX + tableWidth, rowY + rowHeight);
  
        // Render row data
        currentX = tableX;
        row.forEach((cell, index) => {
          const splitText = doc.splitTextToSize(cell, columnWidths[index] - 2 * cellPadding);
          doc.text(splitText, currentX + cellPadding, rowY + cellPadding + 2);
          currentX += columnWidths[index];
        });
  
        rowY += rowHeight;
      });
  
      // Supervisor Comments Card
      const supervisorCommentsCardY = timelogsCardY + timelogsCardHeight + gapBetweenCards;
      const supervisorCommentsCardHeight = cardPaddingTop + titleHeight + cardPaddingBottom + 15; // Fixed height: 2 + 5 + 2 + 15 = 24mm (15mm for comment space)
  
      // Check if the card will overlap with the footer
      const footerY = 260; // Fixed footer position
      const footerMargin = 5; // Margin before the footer
      const supervisorCommentsCardBottomY = supervisorCommentsCardY + supervisorCommentsCardHeight;
      if (supervisorCommentsCardBottomY > footerY - footerMargin) {
        console.warn(
          `Supervisor Comments card (bottom Y: ${supervisorCommentsCardBottomY}) is too close to the footer (Y: ${footerY}). Consider adding pagination or reducing the timelogs table height.`
        );
        // Optionally, add a page break here if needed (pagination logic can be added)
      }
  
      // Draw the Supervisor Comments card
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(pageMargin, supervisorCommentsCardY, cardWidth, supervisorCommentsCardHeight, 5, 5, "F");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("SUPERVISOR COMMENTS", pageMargin + 5, supervisorCommentsCardY + cardPaddingTop + 4);
  
      // Signature Section as Footer
      const internSignatureX = pageMargin + 5;
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
      doc.text(internData.fullName, internNameX, footerY);
  
      const internLineY = footerY + 2;
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
      doc.text(supervisorName, supervisorNameX, footerY);
  
      const supervisorLineY = footerY + 2;
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