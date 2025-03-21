import { jsPDF } from "jspdf";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  try {
    console.log("Starting PDF generation with jspdf...");

    const { searchParams } = new URL(request.url);
    const week = parseInt(searchParams.get("week") || "0");
    if (!week) throw new Error("Week parameter is required");

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Auth error:", userError?.message || "No user found");
      throw new Error("User not authenticated");
    }

    // Fetch intern data
    const { data: internData, error: internError } = await supabase
      .from("interns")
      .select(
        "first_name, last_name, university, start_date, hours_to_render, dept_id, program, year_level, section, schedule, host_company"
      )
      .eq("id", user.id)
      .single();

    if (internError || !internData) {
      console.error(
        "Intern fetch error:",
        internError?.message || "No intern data"
      );
      throw new Error("Failed to fetch intern data");
    }

    // Log the dept_id to debug
    console.log("Trainee dept_id:", internData.dept_id);

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
    let supervisorName = "Supervisor Name"; // Default placeholder
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

    // Adjust weekStart to the previous Monday if not already a Monday
    const dayOfWeek = weekStart.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart.setDate(weekStart.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // Calculate the start and end dates for the selected week
    const selectedWeekStart = new Date(weekStart);
    selectedWeekStart.setDate(selectedWeekStart.getDate() + (week - 1) * 7);
    const selectedWeekEnd = new Date(selectedWeekStart);
    selectedWeekEnd.setDate(selectedWeekEnd.getDate() + 4); // Friday (Monday + 4 days)

    // Adjust the start date if the intern's start_date is after the week's Monday
    const actualStart = traineeStart > selectedWeekStart ? traineeStart : selectedWeekStart;
    const actualEnd = selectedWeekEnd;

    // Fetch timelogs data for the intern within the selected week
    const { data: timelogsData, error: timelogsError } = await supabase
      .from("timelogs")
      .select("date, time_in, time_out, total_dayhours, status_logs, comments")
      .eq("trainee_id", user.id)
      .gte("date", actualStart.toISOString().split("T")[0]) // Greater than or equal to start date
      .lte("date", actualEnd.toISOString().split("T")[0]) // Less than or equal to end date
      .order("date", { ascending: true });

    if (timelogsError) {
      console.error("Timelogs fetch error:", timelogsError?.message);
      throw new Error("Failed to fetch timelogs data");
    }

    // Prepare data
    const fullName = `${internData.first_name} ${internData.last_name}`;
    const companyTitle =
      `${internData.host_company} Internship - Week ${week}` ||
      `RSC GROUP INTERNSHIP - Week ${week}`;
    const university = internData.university || "N/A";
    const hoursToRender = internData.hours_to_render || 0;
    const program = internData.program || "N/A";
    const yearLevel = internData.year_level || "N/A";
    const section = internData.section || "N/A";
    const schedule = internData.schedule || "N/A";

    // Determine the logo URL based on host_company
    const companyLogos = {
      "Beauty and Butter": "https://dgqbospvmigwtrtfkvor.supabase.co/storage/v1/object/public/companies/logos/bbIcon.png",
      "FINA": "https://dgqbospvmigwtrtfkvor.supabase.co/storage/v1/object/public/companies/logos/finaIcon.png",
      "Flawless": "https://dgqbospvmigwtrtfkvor.supabase.co/storage/v1/object/public/companies/logos/flawlessIcon.png",
      "MTSI": "https://dgqbospvmigwtrtfkvor.supabase.co/storage/v1/object/public/companies/logos/mtsilogo.png",
    };

    const imageUrl = companyLogos[internData.host_company as keyof typeof companyLogos] || companyLogos["Flawless"]; // Default to Flawless logo if company not found
    console.log("Selected logo URL for company", internData.host_company, ":", imageUrl);

    // Generate PDF
    const doc = new jsPDF();

    // Fetch and add image
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${imageUrl}`);
    const imageBuffer = await response.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString("base64");
    const imageDataUrl = `data:image/png;base64,${imageBase64}`;
    doc.addImage(imageDataUrl, "PNG", 85, 10, 40, 10);

    // Header
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 25, 210, 10, "F");
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(companyTitle.toUpperCase(), 105, 30, { align: "center" });

    // Intern Details Card
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(10, 40, 190, 44, 5, 5, "F");
    doc.setFontSize(10);
    doc.setTextColor(33, 150, 243);
    doc.setFont("helvetica", "bold");
    doc.text("INTERN DETAILS", 15, 47);

    const details = [
      { label: "Name", value: fullName },
      { label: "University", value: university },
      { label: "Start Date", value: internData.start_date || "N/A" },
      { label: "Hours to Render", value: `${hoursToRender} hours` },
      { label: "Department", value: deptName },
      { label: "Program", value: program },
      { label: "Year Level", value: yearLevel.toString() + "th" },
      { label: "Section", value: section },
      { label: "Schedule", value: schedule },
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

    // Timelogs Table
    const tableStartY = 105;
    const tableX = 15;
    const cardWidth = 190; // Width of the card (from x=10 to x=200)
    const cardPadding = 5; // Padding inside the card on each side
    const tableWidth = cardWidth - 2 * cardPadding; // Effective table width inside the card
    const columnWidths = [35, 20, 20, 20, 20, tableWidth - (35 + 20 + 20 + 20 + 20)]; // Increased DATE column width to 35
    const headers = ["DATE", "TIME IN", "TIME OUT", "TOTAL HOURS", "STATUS", "COMMENTS"];
    const lineHeight = 4; // Height per line of text at fontSize 8
    const cellPadding = 2; // Padding within each cell
    const titleHeight = 10; // Height of the "TIMELOGS" title
    const titlePadding = 5; // Padding below the title
    const headerHeight = 8; // Height of the header row

    // Debug column widths
    console.log("Column Widths:", columnWidths);
    console.log("Total Column Width:", columnWidths.reduce((sum, width) => sum + width, 0));
    console.log("Table Width:", tableWidth);

    // Function to convert 24-hour time to 12-hour AM/PM format
    const formatTimeTo12Hour = (time: string | null): string => {
      if (!time || time === "N/A") return "N/A";

      // Parse the time (expected format: "HH:mm:ss")
      const [hoursStr, minutes] = time.split(":");
      let hours = parseInt(hoursStr, 10);
      const period = hours >= 12 ? "PM" : "AM";

      // Convert to 12-hour format
      hours = hours % 12;
      if (hours === 0) hours = 12; // Handle midnight (0:00) and noon (12:00)

      return `${hours}:${minutes} ${period}`;
    };

    // Function to format date as "Month Name, Day, Year"
    const formatDateToMonthDayYear = (dateStr: string | null): string => {
      if (!dateStr || dateStr === "N/A") return "N/A";

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A"; // Handle invalid dates

      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const month = monthNames[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();

      return `${month} ${day}, ${year}`;
    };

    // Calculate the minimum row height for a single line of text
    const minRowHeight = 1 * lineHeight + 2 * cellPadding; // 1 line of text + padding

    // Calculate the height of each row based on the wrapped text, with a minimum height
    const rowDataArray = timelogsData.map((log) => [
      formatDateToMonthDayYear(log.date), // Format date as "Month Name, Day, Year"
      formatTimeTo12Hour(log.time_in), // Convert time_in to AM/PM
      formatTimeTo12Hour(log.time_out), // Convert time_out to AM/PM
      log.total_dayhours ? `${log.total_dayhours} Hours` : "N/A",
      log.status_logs || "N/A",
      log.comments || "N/A",
    ]);

    const rowHeights = rowDataArray.map((row) => {
      let maxLines = 1;
      row.forEach((cell, index) => {
        const splitText = doc.splitTextToSize(cell, columnWidths[index] - 2 * cellPadding);
        maxLines = Math.max(maxLines, splitText.length);
      });
      const calculatedHeight = maxLines * lineHeight + 2 * cellPadding;
      return Math.max(calculatedHeight, minRowHeight); // Ensure at least the minimum height
    });

    // Calculate total table height including title, header, rows, and spacing
    const totalRowsHeight = rowHeights.reduce((sum, height) => sum + height, 0);
    const totalSpacingBetweenRows = (rowDataArray.length - 1) * 1; // 1 unit spacing between rows
    const totalTableHeight = titleHeight + titlePadding + headerHeight + totalRowsHeight + totalSpacingBetweenRows + 5; // 5 for bottom padding

    // Draw the table background (card)
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(10, 90, cardWidth, totalTableHeight, 5, 5, "F");

    // Table Title
    doc.setFontSize(10);
    doc.setTextColor(33, 150, 243);
    doc.setFont("helvetica", "bold");
    doc.text("TIMELOGS", tableX, 97);

    // Table Headers
    doc.setFillColor(200, 200, 200); // Light gray background for header
    doc.rect(tableX, tableStartY - 4, tableWidth, headerHeight, "F"); // Header width matches table width
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "bold");
    let currentX = tableX;
    headers.forEach((header, index) => {
      const splitHeader = doc.splitTextToSize(header, columnWidths[index] - 2 * cellPadding);
      doc.text(splitHeader, currentX + cellPadding, tableStartY);
      currentX += columnWidths[index];
    });

    // Table Rows
    doc.setFont("helvetica", "normal");
    let rowY = tableStartY + headerHeight;
    rowDataArray.forEach((row, rowIndex) => {
      currentX = tableX;
      const rowHeight = rowHeights[rowIndex];
      row.forEach((cell, index) => {
        const splitText = doc.splitTextToSize(cell, columnWidths[index] - 2 * cellPadding);
        doc.text(splitText, currentX + cellPadding, rowY + cellPadding);
        currentX += columnWidths[index];
      });
      rowY += rowHeight + 1; // Add 1 unit of spacing between rows
    });

    // Signature Sections
    const signatureY = 260; // Starting position at the bottom of the page
    const internSignatureX = 15; // Left side for intern
    const supervisorSignatureX = 145; // Right side for supervisor (A4 width is 210mm, so 145mm leaves enough space)
    const signatureLineLength = 50; // Length of the signature line

    // --- Intern Signature Section ---
    // Calculate the width of the intern's name and title to center the signature line
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const internNameWidth = doc.getTextWidth(fullName);
    doc.setFont("helvetica", "bold");
    const internTitleWidth = doc.getTextWidth("INTERN SIGNATURE");
    const internMaxWidth = Math.max(internNameWidth, internTitleWidth, signatureLineLength);

    // Intern Name
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    const internNameX = internSignatureX + (internMaxWidth - internNameWidth) / 2;
    doc.text(fullName, internNameX, signatureY);

    // Intern Signature Line
    const internLineY = signatureY + 2;
    const internLineStartX = internSignatureX + (internMaxWidth - signatureLineLength) / 2;
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(internLineStartX, internLineY, internLineStartX + signatureLineLength, internLineY);

    // Intern Title
    doc.setFont("helvetica", "bold");
    const internTitleY = internLineY + 4;
    const internTitleX = internSignatureX + (internMaxWidth - internTitleWidth) / 2;
    doc.text("INTERN SIGNATURE", internTitleX, internTitleY);

    // --- Supervisor Signature Section ---
    // Calculate the width of the supervisor's name and title to center the signature line
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const supervisorNameWidth = doc.getTextWidth(supervisorName);
    doc.setFont("helvetica", "bold");
    const supervisorTitleWidth = doc.getTextWidth("SUPERVISOR SIGNATURE");
    const supervisorMaxWidth = Math.max(supervisorNameWidth, supervisorTitleWidth, signatureLineLength);

    // Supervisor Name
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    const supervisorNameX = supervisorSignatureX + (supervisorMaxWidth - supervisorNameWidth) / 2;
    doc.text(supervisorName, supervisorNameX, signatureY);

    // Supervisor Signature Line
    const supervisorLineY = signatureY + 2;
    const supervisorLineStartX = supervisorSignatureX + (supervisorMaxWidth - signatureLineLength) / 2;
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(supervisorLineStartX, supervisorLineY, supervisorLineStartX + signatureLineLength, supervisorLineY);

    // Supervisor Title
    doc.setFont("helvetica", "bold");
    const supervisorTitleY = supervisorLineY + 4;
    const supervisorTitleX = supervisorSignatureX + (supervisorMaxWidth - supervisorTitleWidth) / 2;
    doc.text("SUPERVISOR SIGNATURE", supervisorTitleX, supervisorTitleY);

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    console.log("PDF generated successfully, buffer length:", pdfBuffer.length);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="internship-report-week-${week}.pdf"`,
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