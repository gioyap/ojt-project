"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface TimeLogEditModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSave: (timeIn: string, timeOut: string, totalHours: number) => void;
	initialTimeIn: string | null;
	initialTimeOut: string | null;
	date: string | null;
	timeId: number;
	isSaving?: boolean;
	editCount?: number; // Added editCount prop
}

export function EditTimeLogModal({
	isOpen,
	onClose,
	onSave,
	initialTimeIn,
	initialTimeOut,
	date,
	timeId,
	isSaving = false,
	editCount = 0,
}: TimeLogEditModalProps) {
	const [timeIn, setTimeIn] = useState<string>("");
	const [timeOut, setTimeOut] = useState<string>("");

	useEffect(() => {
		if (isOpen) {
			setTimeIn(initialTimeIn || "");
			setTimeOut(initialTimeOut || "");
		}
	}, [isOpen, initialTimeIn, initialTimeOut]);

	if (!isOpen) return null;

	const calculateTotalHours = (timeIn: string, timeOut: string): number => {
		const [inHours] = timeIn.split(":").map(Number);
		let [outHours] = timeOut.split(":").map(Number);
		const workStartHour = 8;
		const breakStart = 12;
		const breakEnd = 13;
		const maxWorkEndHour = 18;

		let effectiveStartHour = inHours < workStartHour ? workStartHour : inHours;
		if (inHours >= breakStart && inHours < breakEnd)
			effectiveStartHour = breakEnd;
		let effectiveEndHour =
			outHours > maxWorkEndHour ? maxWorkEndHour : outHours;

		let totalHours = effectiveEndHour - effectiveStartHour;
		if (effectiveStartHour < breakStart && effectiveEndHour > breakStart)
			totalHours -= 1;

		return Math.max(0, totalHours);
	};

	const handleSave = () => {
		if (!timeIn || !timeOut) return; // Silent fail, API will handle feedback
		const totalHours = Math.round(calculateTotalHours(timeIn, timeOut));
		onSave(timeIn, timeOut, totalHours);
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4">
			<div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-sm sm:max-w-md">
				<h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
					Edit Time Log
				</h2>
				<div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">
					<div>
						<label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
							Date
						</label>
						<div className="text-base sm:text-lg font-semibold text-gray-800">
							{date
								? new Date(date).toLocaleDateString("en-US", {
										weekday: "short",
										month: "long",
										day: "numeric",
										year: "numeric",
									})
								: "N/A"}
						</div>
					</div>
					<div>
						<label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
							Time In
						</label>
						<input
							title="Time In"
							type="time"
							value={timeIn}
							onChange={(e) => setTimeIn(e.target.value)}
							className="w-full p-2 text-xs sm:text-sm border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
						/>
					</div>
					<div>
						<label className="block text-xs sm:text-sm font-medium text-gray-600 mb-1">
							Time Out
						</label>
						<input
							title="Time Out"
							type="time"
							value={timeOut}
							onChange={(e) => setTimeOut(e.target.value)}
							className="w-full p-2 text-xs sm:text-sm border rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
						/>
					</div>
					<div>
						<p className="text-xs sm:text-sm text-gray-600">
							Edit Count: {editCount}/3
						</p>
					</div>
				</div>
				<div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
					<Button
						onClick={onClose}
						className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-gray-400 text-white hover:bg-gray-500"
					>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-pink-500 text-white hover:bg-pink-600"
						disabled={!timeIn || !timeOut || isSaving}
					>
						{isSaving ? "Saving..." : "Save"}
					</Button>
				</div>
			</div>
		</div>
	);
}
