import { jsPDF } from "jspdf";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  try {
    console.log("Starting PDF generation with jspdf for admin...");

    const { searchParams } = new URL(request.url);
    const week = parseInt(searchParams.get("week") || "0");
    const traineeId = searchParams.get("traineeId");

    if (!week) throw new Error("Week parameter is required");
    if (!traineeId) throw new Error("Trainee ID parameter is required");

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Auth error:", userError?.message || "No user found");
      throw new Error("User not authenticated");
    }

    // Verify that the user is an admin (supervisor)
    const { data: supervisorData, error: supervisorError } = await supabase
      .from("supervisors")
      .select("id")
      .eq("id", user.id)
      .single();

    if (supervisorError || !supervisorData) {
      console.error("Supervisor check error:", supervisorError?.message);
      throw new Error("User is not authorized to generate reports");
    }

    // Fetch intern data for the specified trainee
    const { data: internData, error: internError } = await supabase
      .from("interns")
      .select(
        "first_name, last_name, university, start_date, hours_to_render, dept_id, program, year_level, section, schedule, host_company"
      )
      .eq("id", traineeId)
      .single();

    if (internError || !internData) {
      console.error(
        "Intern fetch error:",
        internError?.message || "No intern data"
      );
      throw new Error("Failed to fetch intern data");
    }

    // Fetch department data (optional)
    let deptName = "N/A";
    if (internData.dept_id) {
      const { data: deptData, error: deptError } = await supabase
        .from("department")
        .select("dept_name")
        .eq("dept_id", internData.dept_id)
        .single();

      if (deptError || !deptData) {
        console.error("Department fetch error:", deptError?.message);
      } else {
        deptName = deptData.dept_name;
      }
    }

    // Fetch supervisor data based on dept_id
    let supervisorName = "Supervisor Name";
    if (internData.dept_id) {
      const { data: supervisorData, error: supervisorError } = await supabase
        .from("supervisors")
        .select("first_name, last_name")
        .eq("dept_id", internData.dept_id)
        .limit(1)
        .maybeSingle();

      if (supervisorError) {
        console.error("Supervisor fetch error:", supervisorError.message);
      } else if (!supervisorData) {
        console.log("No supervisor found for dept_id:", internData.dept_id);
      } else {
        supervisorName = `${supervisorData.first_name} ${supervisorData.last_name}`;
        console.log("Supervisor found:", supervisorName);
      }
    } else {
      console.log("Trainee has no dept_id, cannot fetch supervisor.");
    }

    // Calculate the date range for the selected week
    const traineeStart = new Date(internData.start_date);
    let weekStart = new Date(traineeStart);

    const dayOfWeek = weekStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const selectedWeekStart = new Date(weekStart);
    selectedWeekStart.setDate(selectedWeekStart.getDate() + (week - 1) * 7);
    selectedWeekStart.setHours(0, 0, 0, 0);

    const selectedWeekEnd = new Date(selectedWeekStart);
    selectedWeekEnd.setDate(selectedWeekEnd.getDate() + 4);
    selectedWeekEnd.setHours(23, 59, 59, 999);

    const actualStart = traineeStart > selectedWeekStart ? traineeStart : selectedWeekStart;
    const actualEnd = selectedWeekEnd;

    // Fetch timelogs data for the trainee within the selected week
    const { data: timelogsData, error: timelogsError } = await supabase
      .from("timelogs")
      .select("date, time_in, time_out, total_dayhours, status_logs, comments")
      .eq("trainee_id", traineeId)
      .gte("date", actualStart.toISOString().split("T")[0])
      .lte("date", actualEnd.toISOString().split("T")[0])
      .order("date", { ascending: true });

    if (timelogsError) {
      console.error("Timelogs fetch error:", timelogsError?.message);
      throw new Error("Failed to fetch timelogs data");
    }

    const filteredTimelogsData = timelogsData.filter((log) => {
      const logDate = new Date(log.date);
      const dayOfWeek = logDate.getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    });

    // Fetch all timelogs up to the current week to calculate total accumulated hours
    const { data: allTimelogsData, error: allTimelogsError } = await supabase
      .from("timelogs")
      .select("total_dayhours")
      .eq("trainee_id", traineeId)
      .lte("date", selectedWeekEnd.toISOString().split("T")[0]);
    if (allTimelogsError) throw new Error("Failed to fetch all timelogs");

    // Calculate timelog summary
    const hoursToRender = internData.hours_to_render || 0;
    const accumulatedHoursThisWeek = filteredTimelogsData.reduce((sum, log) => sum + (log.total_dayhours || 0), 0);
    const totalAccumulatedHours = allTimelogsData.reduce((sum, log) => sum + (log.total_dayhours || 0), 0);
    const totalRemainingHours = Math.max(hoursToRender - totalAccumulatedHours, 0);

    // Prepare data
    const fullName = `${internData.first_name} ${internData.last_name}`;
    const companyTitle =
      `${internData.host_company} Internship - Week ${week}` ||
      `RSC GROUP INTERNSHIP - Week ${week}`;
    const university = internData.university || "N/A";
    const program = internData.program || "N/A";
    const yearLevel = internData.year_level || "N/A";
    const section = internData.section || "N/A";
    const schedule = internData.schedule || "N/A";

    // Sanitize the first and last names for the filename
    const sanitizedFirstName = internData.first_name
      .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .toLowerCase(); // Convert to lowercase for consistency

    const sanitizedLastName = internData.last_name
      .replace(/[^a-zA-Z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .toLowerCase(); // Convert to lowercase for consistency

    // Combine the sanitized first and last names for the filename
    const sanitizedTraineeNameForFilename = `${sanitizedFirstName}-${sanitizedLastName}`;

    // Determine the logo URL based on host_company
    const companyLogos = {
      "Beauty and Butter": "https://dgqbospvmigwtrtfkvor.supabase.co/storage/v1/object/public/companies/logos/bbIcon.png",
      "FINA": "https://dgqbospvmigwtrtfkvor.supabase.co/storage/v1/object/public/companies/logos/finaIcon.png",
      "Flawless": "https://dgqbospvmigwtrtfkvor.supabase.co/storage/v1/object/public/companies/logos/flawlessIcon.png",
      "MTSI": "https://dgqbospvmigwtrtfkvor.supabase.co/storage/v1/object/public/companies/logos/mtsilogo.png",
    };
    const imageUrl = companyLogos[internData.host_company as keyof typeof companyLogos] || companyLogos["Flawless"];

    // Generate PDF
    const doc = new jsPDF();

    // Fetch the image and process it
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${imageUrl}`);
    const imageBuffer = await response.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");
    const imageDataUrl = `data:image/png;base64,${imageBase64}`;

    // Define spacing constants
    const pageMargin = 10;
    const cardWidth = 210 - 2 * pageMargin;
    const columnWidth = (cardWidth - 30) / 2;
    const fontSize = 8;
    const lineHeight = 3.5;
    const cardPaddingTop = 2;
    const titleHeight = 5;
    const contentPaddingTop = 5;
    const cardPaddingBottom = 2;
    const gapBetweenCards = 3.5;
    const summaryTableGap = 5;

    // Define footer constants
    const pageHeight = doc.internal.pageSize.height;
    const footerHeight = 20;
    const footerMargin = 10;
    const maxContentY = pageHeight - footerHeight - footerMargin;

    // Function to render the footer (signature section) on the current page
    const renderFooter = () => {
      const signatureY = pageHeight - footerHeight - 5;
      const internSignatureX = pageMargin + 5;
      const supervisorSignatureX = 145;
      const signatureLineLength = 50;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const internNameWidth = doc.getTextWidth(fullName);
      doc.setFont("helvetica", "bold");
      const internTitleWidth = doc.getTextWidth("INTERN SIGNATURE");
      const internMaxWidth = Math.max(internNameWidth, internTitleWidth, signatureLineLength);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      const internNameX = internSignatureX + (internMaxWidth - internNameWidth) / 2;
      doc.text(fullName, internNameX, signatureY);

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
    };

    // Function to check if we need a new page and render the footer
    const checkPageBreak = (currentY: number, requiredHeight: number) => {
      if (currentY + requiredHeight > maxContentY) {
        doc.addPage();
        renderFooter();
        return 10;
      }
      return currentY;
    };

    // Custom handling for each logo
    let fixedWidth, fixedHeight, xPos, yPos;
    switch (internData.host_company) {
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
    doc.addImage(imageDataUrl, "PNG", xPos, yPos, fixedWidth, fixedHeight);

    // Header
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 25, 210, 10, "F");
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(companyTitle.toUpperCase(), 105, 30, { align: "center" });

    // Intern Details Card
    let currentY = 40;
    currentY = checkPageBreak(currentY, 0);
    const internCardY = currentY;
    let leftYPosition = internCardY + cardPaddingTop + titleHeight + contentPaddingTop;
    let rightYPosition = internCardY + cardPaddingTop + titleHeight + contentPaddingTop;
    const leftLabelX = pageMargin + 5;
    const rightLabelX = pageMargin + 5 + columnWidth + 10;

    const leftColumnDetails = [
      { label: "Name: ", value: fullName },
      { label: "University: ", value: university },
      { label: "Start Date: ", value: internData.start_date || "N/A" },
    ];

    const rightColumnDetails = [
      { label: "Program: ", value: program },
      { label1: "Year Level: ", value1: yearLevel + "th", label2: "Section: ", value2: section },
      { label: "Department: ", value: deptName },
    ];

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

    const leftColumnTotalHeight = leftColumnHeights.reduce((sum, height) => sum + height, 0);
    const rightColumnTotalHeight = rightColumnHeights.reduce((sum, height) => sum + height, 0);
    const contentHeight = Math.max(leftColumnTotalHeight, rightColumnTotalHeight);
    const internCardHeight = cardPaddingTop + titleHeight + contentPaddingTop + contentHeight + cardPaddingBottom;

    currentY = checkPageBreak(currentY, internCardHeight);
    const adjustedInternCardY = currentY;

    doc.setFillColor(240, 240, 240);
    doc.roundedRect(pageMargin, adjustedInternCardY, cardWidth, internCardHeight, 5, 5, "F");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("INTERN DETAILS", pageMargin + 5, adjustedInternCardY + cardPaddingTop + 4);

    leftYPosition = adjustedInternCardY + cardPaddingTop + titleHeight + contentPaddingTop;
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

    rightYPosition = adjustedInternCardY + cardPaddingTop + titleHeight + contentPaddingTop;
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

    const internCardBottomY = adjustedInternCardY + internCardHeight;
    currentY = internCardBottomY + gapBetweenCards;

    // Unified Timelogs Card (Timelog Summary and Timelogs Table)
    currentY = checkPageBreak(currentY, 0);
    const timelogsCardY = currentY;
    let timelogLeftYPosition = timelogsCardY + cardPaddingTop + titleHeight + contentPaddingTop;
    let timelogRightYPosition = timelogsCardY + cardPaddingTop + titleHeight + contentPaddingTop;
    const timelogLeftLabelX = pageMargin + 5;
    const timelogRightLabelX = pageMargin + 5 + columnWidth + 10;

    const timelogLeftColumnDetails = [
      { label: "Hours to Render: ", value: `${hoursToRender} Hours` },
      { label: "Total Remaining: ", value: `${totalRemainingHours} Hours` },
    ];

    const timelogRightColumnDetails = [
      { label: `Accumulated Hours (Week #${week}): `, value: `${accumulatedHoursThisWeek} Hours` },
      { label: "Total Accumulated Hours: ", value: `${totalAccumulatedHours} Hours` },
    ];

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

    const timelogLeftColumnTotalHeight = timelogLeftColumnHeights.reduce((sum, height) => sum + height, 0);
    const timelogRightColumnTotalHeight = timelogRightColumnHeights.reduce((sum, height) => sum + height, 0);
    const timelogSummaryContentHeight = Math.max(timelogLeftColumnTotalHeight, timelogRightColumnTotalHeight);

    // Timelogs Table
    let tableStartY = timelogsCardY + cardPaddingTop + titleHeight + contentPaddingTop + timelogSummaryContentHeight + summaryTableGap;
    const tableX = pageMargin + 5;
    const cardPadding = 5;
    const tableWidth = cardWidth - 2 * cardPadding;
    const columnWidths = [40, 25, 25, 25, tableWidth - (40 + 25 + 25 + 25)];
    const headers = ["Date", "Time In", "Time Out", "Total Hours", "Comments"];
    const tableLineHeight = 4;
    const cellPadding = 2;
    const headerHeight = 8;

    const formatTimeTo12Hour = (time: string | null): string => {
      if (!time || time === "N/A") return "N/A";
      const [hoursStr, minutes] = time.split(":");
      let hours = parseInt(hoursStr, 10);
      const period = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${period}`;
    };

    const formatDateToMonthDayYear = (dateStr: string | null): string => {
      if (!dateStr || dateStr === "N/A") return "N/A";
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      return `${monthNames[date.getMonth()]}, ${date.getDate()}, ${date.getFullYear()}`;
    };

    const minRowHeight = 1 * tableLineHeight + 2 * cellPadding;
    const rowDataArray = filteredTimelogsData.map((log) => [
      formatDateToMonthDayYear(log.date),
      formatTimeTo12Hour(log.time_in),
      formatTimeTo12Hour(log.time_out),
      log.total_dayhours ? `${log.total_dayhours} Hours` : "N/A",
      log.comments || "N/A",
    ]);

    const rowHeights = rowDataArray.map((row) => {
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

    const timelogsCardHeight = cardPaddingTop + titleHeight + contentPaddingTop + timelogSummaryContentHeight + summaryTableGap + totalTableHeight + cardPaddingBottom;

    currentY = checkPageBreak(currentY, timelogsCardHeight);
    const adjustedTimelogsCardY = currentY;

    doc.setFillColor(240, 240, 240);
    doc.roundedRect(pageMargin, adjustedTimelogsCardY, cardWidth, timelogsCardHeight, 5, 5, "F");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("TIMELOGS", pageMargin + 5, adjustedTimelogsCardY + cardPaddingTop + 4);

    timelogLeftYPosition = adjustedTimelogsCardY + cardPaddingTop + titleHeight + contentPaddingTop;
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

    timelogRightYPosition = adjustedTimelogsCardY + cardPaddingTop + titleHeight + contentPaddingTop;
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
    tableStartY = adjustedTimelogsCardY + cardPaddingTop + titleHeight + contentPaddingTop + timelogSummaryContentHeight + summaryTableGap;
    let rowY = tableStartY + headerHeight;

    doc.setFillColor(200, 200, 200);
    doc.rect(tableX, tableStartY, tableWidth, headerHeight, "F");

    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.2);
    let currentX = tableX;
    for (let i = 0; i <= columnWidths.length; i++) {
      doc.line(currentX, tableStartY, currentX, tableStartY + headerHeight);
      if (i < columnWidths.length) currentX += columnWidths[i];
    }
    doc.line(tableX, tableStartY + headerHeight, tableX + tableWidth, tableStartY + headerHeight);

    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    currentX = tableX;
    headers.forEach((header, index) => {
      const splitHeader = doc.splitTextToSize(header, columnWidths[index] - 2 * cellPadding);
      doc.text(splitHeader, currentX + cellPadding, tableStartY + 4);
      currentX += columnWidths[index];
    });

    doc.setFont("helvetica", "normal");
    rowDataArray.forEach((row: string[], rowIndex: number) => {
      const rowHeight = rowHeights[rowIndex];
      tableStartY = checkPageBreak(tableStartY, rowHeight + (rowIndex === 0 ? headerHeight : 0));
      if (rowIndex === 0) {
        doc.setFillColor(200, 200, 200);
        doc.rect(tableX, tableStartY, tableWidth, headerHeight, "F");
        currentX = tableX;
        for (let i = 0; i <= columnWidths.length; i++) {
          doc.line(currentX, tableStartY, currentX, tableStartY + headerHeight);
          if (i < columnWidths.length) currentX += columnWidths[i];
        }
        doc.line(tableX, tableStartY + headerHeight, tableX + tableWidth, tableStartY + headerHeight);
        doc.setFontSize(8);
        doc.setTextColor(50, 50, 50);
        doc.setFont("helvetica", "bold");
        currentX = tableX;
        headers.forEach((header, index) => {
          const splitHeader = doc.splitTextToSize(header, columnWidths[index] - 2 * cellPadding);
          doc.text(splitHeader, currentX + cellPadding, tableStartY + 4);
          currentX += columnWidths[index];
        });
        rowY = tableStartY + headerHeight;
      }

      currentX = tableX;
      for (let i = 0; i <= columnWidths.length; i++) {
        doc.line(currentX, rowY, currentX, rowY + rowHeight);
        if (i < columnWidths.length) currentX += columnWidths[i];
      }
      doc.line(tableX, rowY + rowHeight, tableX + tableWidth, rowY + rowHeight);

      currentX = tableX;
      row.forEach((cell, index) => {
        const splitText = doc.splitTextToSize(cell, columnWidths[index] - 2 * cellPadding);
        doc.text(splitText, currentX + cellPadding, rowY + cellPadding + 2);
        currentX += columnWidths[index];
      });

      rowY += rowHeight;
      tableStartY = rowY;
    });

    // Supervisor Comments Card
    currentY = adjustedTimelogsCardY + timelogsCardHeight + gapBetweenCards;
    currentY = checkPageBreak(currentY, 0);
    const supervisorCommentsCardY = currentY;
    const supervisorCommentsCardHeight = cardPaddingTop + titleHeight + cardPaddingBottom + 15;

    currentY = checkPageBreak(currentY, supervisorCommentsCardHeight);
    const adjustedSupervisorCommentsCardY = currentY;

    doc.setFillColor(240, 240, 240);
    doc.roundedRect(pageMargin, adjustedSupervisorCommentsCardY, cardWidth, supervisorCommentsCardHeight, 5, 5, "F");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("SUPERVISOR COMMENTS", pageMargin + 5, adjustedSupervisorCommentsCardY + cardPaddingTop + 4);

    // Render the footer on the first page
    renderFooter();

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    console.log("PDF generated successfully, buffer length:", pdfBuffer.length);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="internship-report-week-${week}-${sanitizedFirstName}-${sanitizedLastName}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        "Detailed error generating PDF:",
        error.message,
        error.stack
      );
    } else {
      console.error("Detailed error generating PDF:", error);
    }
    return new NextResponse(
      JSON.stringify({
        error: "Failed to generate PDF",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}