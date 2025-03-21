import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    padding: 30,
    backgroundColor: "#FFFFFF",
  },
  logo: {
    width: 40,
    height: 10,
    alignSelf: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20,
    color: "#1E3A8A",
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
  },
  section: {
    marginBottom: 30,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 15,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1E3A8A",
    marginBottom: 10,
    fontFamily: "Helvetica-Bold",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1E3A8A",
    fontFamily: "Helvetica-Bold",
  },
  detailValue: {
    fontSize: 10,
    color: "#374151",
    fontFamily: "Helvetica",
  },
  table: {
    display: "flex",
    width: "100%", // Ensure table takes full width of the section (minus padding)
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    alignItems: "flex-start", // Align content to the top
    paddingVertical: 2, // Add vertical padding between rows
    minHeight: 20, // Minimum height for a single line of text (fontSize 8 + padding)
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#E5E7EB", // Light gray background for header
    borderBottomWidth: 2, // Thicker border for header
    borderBottomColor: "#D1D5DB",
  },
  tableHeader: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1E3A8A",
    padding: 5,
    fontFamily: "Helvetica-Bold",
    textAlign: "left",
    flexWrap: "wrap", // Ensure header text wraps
  },
  tableCell: {
    fontSize: 8,
    color: "#374151",
    padding: 5, // Consistent padding inside cells
    fontFamily: "Helvetica",
    textAlign: "left",
    flexWrap: "wrap", // Ensure text wraps
  },
  signatureContainer: {
    position: "absolute",
    bottom: 30, // Position at the bottom of the page (accounting for page padding)
    flexDirection: "row", // Align signatures side by side
    justifyContent: "space-between", // Space between intern and supervisor signatures
    width: "100%", // Use full width to position signatures
  },
  internSignatureSection: {
    flexDirection: "column", // Stack elements vertically
    alignItems: "center", // Center elements horizontally within the section
    width: 100, // Fixed width to control centering
  },
  supervisorSignatureSection: {
    flexDirection: "column", // Stack elements vertically
    alignItems: "center", // Center elements horizontally within the section
    width: 100, // Fixed width to control centering
  },
  signatureName: {
    fontSize: 10,
    color: "#374151",
    fontFamily: "Helvetica",
    marginBottom: 2, // Spacing between name and line
    textAlign: "center", // Center the text
  },
  signatureLine: {
    width: 50, // Length of the signature line
    height: 1,
    backgroundColor: "#000000", // Black line
    marginBottom: 0, // Remove margin-bottom to control spacing with marginTop on the title
  },
  signatureTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
    fontFamily: "Helvetica-Bold",
    textAlign: "center", // Center the text
    marginTop: 4, // Margin-top to prevent overlap
  },
});

// Define interfaces for the data
interface Timelog {
  date: string;
  time_in: string;
  time_out: string;
  total_dayhours: number;
  status_logs: string;
  comments: string;
}

interface InternData {
  fullName: string;
  university: string;
  startDate: string;
  hoursToRender: number;
  deptName: string;
  program: string;
  yearLevel: string;
  section: string;
  schedule: string;
  timelogs: Timelog[];
}

interface ReportPDFProps {
  internData: InternData;
  week: number;
  supervisorName: string;
  logoDataUrl: string; // Add logoDataUrl prop for the image
}

// Main ReportPDF component
const ReportPDF = ({ internData, week, supervisorName, logoDataUrl }: ReportPDFProps) => {
  // Prepare intern details for display
  const details = [
    { label: "Full Name", value: internData.fullName },
    { label: "University", value: internData.university },
    { label: "Start Date", value: internData.startDate },
    { label: "Hours to Render", value: `${internData.hoursToRender} hours` },
    { label: "Department", value: internData.deptName },
    { label: "Program", value: internData.program },
    { label: "Year Level", value: internData.yearLevel },
    { label: "Section", value: internData.section },
    { label: "Schedule", value: internData.schedule },
  ];

  const timelogs = internData.timelogs || [];

  // Define column widths for the timelogs table
  const columnWidths = {
    date: "12%",
    timeIn: "10%",
    timeOut: "10%",
    totalHours: "12%",
    status: "12%",
    comments: "44%",
  };

  // Debug column widths
  console.log("Column Widths in report-pdf.tsx:", columnWidths);

  return (
    <Document>
      <Page size="LEGAL" style={styles.page} wrap>
        {/* Logo */}
        {logoDataUrl && <Image style={styles.logo} src={logoDataUrl} />}

        {/* Title */}
        <Text style={styles.title}>RSC GROUP INTERNSHIP - Week {week}</Text>

        {/* Intern Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Intern Details</Text>
          {details.map((item, index) => (
            <View key={index} style={styles.detailRow}>
              <Text style={styles.detailLabel}>{item.label}:</Text>
              <Text style={styles.detailValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Timelogs Table Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Timelogs</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeader, { width: columnWidths.date }]}>DATE</Text>
              <Text style={[styles.tableHeader, { width: columnWidths.timeIn }]}>TIME IN</Text>
              <Text style={[styles.tableHeader, { width: columnWidths.timeOut }]}>TIME OUT</Text>
              <Text style={[styles.tableHeader, { width: columnWidths.totalHours }]}>TOTAL HOURS</Text>
              <Text style={[styles.tableHeader, { width: columnWidths.status }]}>STATUS</Text>
              <Text style={[styles.tableHeader, { width: columnWidths.comments }]}>COMMENTS</Text>
            </View>
            {/* Table Rows */}
            {timelogs.length > 0 ? (
              timelogs.map((log, index) => (
                <View key={index} style={styles.tableRow} wrap>
                  <Text style={[styles.tableCell, { width: columnWidths.date }]}>{log.date || "N/A"}</Text>
                  <Text style={[styles.tableCell, { width: columnWidths.timeIn }]}>{log.time_in || "N/A"}</Text>
                  <Text style={[styles.tableCell, { width: columnWidths.timeOut }]}>{log.time_out || "N/A"}</Text>
                  <Text style={[styles.tableCell, { width: columnWidths.totalHours }]}>
                    {log.total_dayhours ? `${log.total_dayhours} Hours` : "N/A"}
                  </Text>
                  <Text style={[styles.tableCell, { width: columnWidths.status }]}>{log.status_logs || "N/A"}</Text>
                  <Text style={[styles.tableCell, { width: columnWidths.comments }]}>{log.comments || "N/A"}</Text>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: "100%", textAlign: "center" }]}>
                  No timelogs available for this week.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Signature Sections */}
        <View style={styles.signatureContainer}>
          {/* Intern Signature Section */}
          <View style={styles.internSignatureSection}>
            <Text style={styles.signatureName}>{internData.fullName}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureTitle}>INTERN SIGNATURE</Text>
          </View>

          {/* Supervisor Signature Section */}
          <View style={styles.supervisorSignatureSection}>
            <Text style={styles.signatureName}>{supervisorName}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureTitle}>SUPERVISOR SIGNATURE</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ReportPDF;