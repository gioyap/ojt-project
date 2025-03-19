"use client";

import { useState } from "react";
import { CommentTextarea } from "@/components/trainee/comment-textarea";

interface TimeLog {
	date: string;
	comments?: string;
}

interface CommentsListProps {
	timeLogs: TimeLog[];
	traineeId: string;
}

export default function CommentsList({
	timeLogs,
	traineeId,
}: CommentsListProps) {
	const [currentPage, setCurrentPage] = useState(1);
	const entriesPerPage = 5;

	if (timeLogs.length === 0) {
		return (
			<p className="text-gray-400 text-lg text-center">
				No comments found yet.
			</p>
		);
	}

	const totalPages = Math.ceil(timeLogs.length / entriesPerPage);
	const startIndex = (currentPage - 1) * entriesPerPage;
	const endIndex = startIndex + entriesPerPage;
	const paginatedLogs = timeLogs.slice(startIndex, endIndex);

	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= totalPages) {
			setCurrentPage(page);
		}
	};

	return (
		<div className="w-full space-y-6">
			<div className="grid grid-cols-1 gap-6 w-full max-w-4xl text-left">
				{paginatedLogs.map((log) => (
					<CommentTextarea
						key={log.date}
						initialComment={log.comments}
						date={log.date}
						traineeId={traineeId}
					/>
				))}
			</div>

			{totalPages > 1 && (
				<div className="mt-6 flex justify-between items-center">
					<button
						onClick={() => handlePageChange(currentPage - 1)}
						disabled={currentPage === 1}
						className="px-4 py-2 bg-pink-200 text-black rounded-lg shadow-md hover:bg-pink-300 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
					>
						Previous
					</button>
					<div className="flex gap-2">
						{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
							<button
								key={page}
								onClick={() => handlePageChange(page)}
								className={`px-2 py-1 rounded-full text-xs font-light transition-colors ${
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
						className="px-4 py-2 bg-pink-200 text-black rounded-lg shadow-md hover:bg-pink-300 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all"
					>
						Next
					</button>
				</div>
			)}
		</div>
	);
}
