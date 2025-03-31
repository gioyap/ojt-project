"use client";

import { useState } from "react";
import { EditTimeLogModal } from "./edit-time-log-modal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface TimeLog {
	time_id: number;
	date: string;
	time_in: string | null;
	time_out: string | null;
	total_dayhours: number;
	status_logs: string;
	editcount: number; // Added editcount
}

export function TimeLogsList({ timeLogs }: { timeLogs: TimeLog[] }) {
	const [currentPage, setCurrentPage] = useState(1);
	const [editingLog, setEditingLog] = useState<TimeLog | null>(null);
	const [updatedLogs, setUpdatedLogs] = useState<TimeLog[]>(timeLogs);
	const [isSaving, setIsSaving] = useState(false);
	const entriesPerPage = 3;
	const MAX_EDITS = 3;

	if (updatedLogs.length === 0) {
		return (
			<p className="text-gray-400 text-base sm:text-lg text-center p-4">
				No time logs found yet.
			</p>
		);
	}

	const formatTime = (time: string | null) => {
		if (!time) return "N/A";
		const [hours, minutes] = time.split(":").map(Number);
		const period = hours >= 12 ? "PM" : "AM";
		const formattedHours = hours % 12 || 12;
		return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
	};

	const canEditLog = (log: TimeLog) => {
		return (log.editcount || 0) < MAX_EDITS;
	};

	const handleEditClick = (log: TimeLog) => {
		if (!canEditLog(log)) {
			toast.error("Maximum edit limit (3) reached for this time log.");
			return;
		}
		console.log("Selected Log for Edit:", log);
		setEditingLog(log);
	};

	const handleSaveEdit = async (
		timeIn: string,
		timeOut: string,
		totalHours: number
	) => {
		if (!editingLog || isSaving) return;

		setIsSaving(true);
		const callId = Date.now();
		console.log(`handleSaveEdit called [${callId}] with:`, {
			time_id: editingLog.time_id,
			time_in: timeIn,
			time_out: timeOut,
		});

		try {
			const response = await fetch("/api/update-timelog", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					time_id: editingLog.time_id,
					time_in: timeIn,
					time_out: timeOut,
					editcount: (editingLog.editcount || 0) + 1, // Increment edit count
				}),
			});

			const responseData = await response.json();

			if (response.ok) {
				const updatedTotalHours = responseData.total_dayhours;
				const updatedStatus = responseData.status_logs;

				setUpdatedLogs((prevLogs) =>
					prevLogs.map((log) =>
						log.time_id === editingLog.time_id
							? {
									...log,
									time_in: timeIn,
									time_out: timeOut,
									total_dayhours: updatedTotalHours,
									status_logs: updatedStatus,
									editcount: (log.editcount || 0) + 1,
								}
							: log
					)
				);
				console.log(`Triggering success toast [${callId}]`);
				toast.success("Time log updated successfully!");
				setEditingLog(null);
			} else {
				console.error(`Update failed [${callId}]:`, responseData.error);
				console.log(`Triggering error toast [${callId}]`);
				toast.error(
					responseData.error || "Failed to update time log. Please try again."
				);
			}
		} catch (error) {
			console.error(`Network error [${callId}]:`, error);
			toast.error("Network error occurred. Please try again.");
		} finally {
			setIsSaving(false);
		}
	};

	const totalPages = Math.ceil(updatedLogs.length / entriesPerPage);
	const startIndex = (currentPage - 1) * entriesPerPage;
	const endIndex = startIndex + entriesPerPage;
	const paginatedLogs = updatedLogs.slice(startIndex, endIndex);

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			setCurrentPage(page);
		}
	};

	return (
		<div className="w-full max-w-4xl space-y-4 p-2 sm:p-4 md:p-6 bg-white/70 md:rounded-xl md:shadow-lg md:border md:border-gray-200">
			<h3 className="text-lg sm:text-xl font-semibold text-primary text-center md:text-left">
				Your Recent Time Logs
			</h3>
			<div className="space-y-3 sm:space-y-4">
				{paginatedLogs.map((log) => (
					<div
						key={log.time_id}
						className="bg-white p-3 sm:p-4 md:p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 flex flex-col gap-3 sm:flex-row sm:items-center justify-between cursor-pointer"
						onClick={() => handleEditClick(log)}
					>
						<div className="space-y-1">
							<p className="text-base sm:text-lg font-medium text-gray-800 break-words">
								{new Date(log.date).toLocaleDateString("en-US", {
									weekday: "short",
									month: "long",
									day: "numeric",
									year: "numeric",
								})}
							</p>
							<p className="text-xs sm:text-sm text-gray-600 break-words">
								<span className="font-medium">In:</span>{" "}
								{formatTime(log.time_in)} |{" "}
								<span className="font-medium">Out:</span>{" "}
								{formatTime(log.time_out)}
							</p>
							<p className="text-xs sm:text-sm text-gray-600">
								<span className="font-medium">Edits:</span> {log.editcount || 0}
								/{MAX_EDITS}
							</p>
						</div>
						<div className="flex items-center gap-3 sm:gap-4 md:gap-6 shrink-0">
							<div className="text-center">
								<p className="text-xs sm:text-sm text-gray-600">Hours</p>
								<p className="text-base sm:text-lg font-semibold text-blue-600">
									{log.total_dayhours}
								</p>
							</div>
							<div className="text-center">
								<p className="text-xs sm:text-sm text-gray-600">Status</p>
								<p
									className={`text-base sm:text-lg font-semibold ${
										log.status_logs === "Present"
											? "text-green-600"
											: "text-red-600"
									}`}
								>
									{log.status_logs}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>

			{totalPages > 1 && (
				<div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
					<button
						onClick={() => handlePageChange(currentPage - 1)}
						disabled={currentPage === 1}
						className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 bg-pink-400 text-black rounded-lg shadow-md hover:bg-pink-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
					>
						Previous
					</button>
					<div className="flex gap-1 sm:gap-2 flex-wrap justify-center">
						{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
							<button
								key={page}
								onClick={() => handlePageChange(page)}
								className={`px-2 py-1 rounded-full text-xs sm:text-sm font-light transition-colors ${
									currentPage === page
										? "bg-yellow-600 text-black"
										: "bg-gray-200 text-gray-800 hover:bg-gray-300"
								}`}
							>
								{page}
							</button>
						))}
					</div>
					<button
						onClick={() => handlePageChange(currentPage + 1)}
						disabled={currentPage === totalPages}
						className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 bg-pink-400 text-black rounded-lg shadow-md hover:bg-pink-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all text-sm sm:text-base"
					>
						Next
					</button>
				</div>
			)}

			<EditTimeLogModal
				isOpen={!!editingLog}
				onClose={() => setEditingLog(null)}
				onSave={handleSaveEdit}
				initialTimeIn={editingLog?.time_in || null}
				initialTimeOut={editingLog?.time_out || null}
				date={editingLog?.date || null}
				timeId={editingLog?.time_id || 0}
				isSaving={isSaving}
				editCount={editingLog?.editcount || 0} // Pass edit count to modal
			/>
			<ToastContainer position="top-right" autoClose={3000} />
		</div>
	);
}
