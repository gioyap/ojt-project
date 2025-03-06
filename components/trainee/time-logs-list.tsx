"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TimeLog {
  time_id: number;
  date: string;
  time_in: string;
  time_out: string;
  total_dayhours: number;
  status_logs: string;
}

export function TimeLogsList({ timeLogs }: { timeLogs: TimeLog[] }) {
  if (timeLogs.length === 0) {
    return <p className="text-gray-500">No time logs found.</p>;
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12; // Convert 0 to 12 for AM
    return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  return (
    <div className="w-full max-w-4xl">
      <h3 className="font-semibold text-lg mb-4">Your Time Logs</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Time In</TableHead>
            <TableHead>Time Out</TableHead>
            <TableHead>Total Hours</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {timeLogs.map((log) => (
            <TableRow key={log.time_id}>
              <TableCell>{log.date}</TableCell>
              <TableCell>{formatTime(log.time_in)}</TableCell>
              <TableCell>{formatTime(log.time_out)}</TableCell>
              <TableCell>{log.total_dayhours} hours</TableCell>
              <TableCell>{log.status_logs}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
