"use client"; // Mark this as a Client Component

import { useState } from "react";
import { updateComment } from "@/app/actions"; // Import the server action from the app directory
import { toast } from "react-toastify"; // Import toast
import "react-toastify/dist/ReactToastify.css"; // Import Toastify styles

interface CommentTextareaProps {
  initialComment?: string;
  date: string;
  traineeId: string;
}

export function CommentTextarea({ initialComment, date, traineeId }: CommentTextareaProps) {
  const [comment, setComment] = useState(initialComment || "");
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(comment.length);
  const maxChars = 500; // Set a character limit

  // Format the date as "Monday, March 3, 2025"
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));

  // Handle saving the comment
  const handleSaveComment = async () => {
    setIsLoading(true);
    try {
      await updateComment(date, traineeId, comment);
      toast.success("Comment saved successfully!", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
      });
    } catch (error) {
      console.error("Failed to save comment:", error);
      toast.error("Failed to save comment. Please try again.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update character count
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
    setCharCount(e.target.value.length);
    e.target.style.height = "auto"; // Reset height
    e.target.style.height = `${e.target.scrollHeight}px`; // Set new height
  };

  return (
    <div className="w-full max-w-2xl bg-black-100 shadow-sm rounded-lg p-4 border border-gray-700">
      <h3 className="font-semibold text-lg mb-2">{formattedDate}</h3>
      <textarea
        value={comment}
        onChange={handleTextareaChange}
        className="w-full p-2 border rounded resize-none overflow-hidden bg-black-500"
        rows={4}
        placeholder="Add a comment..."
        maxLength={maxChars}
      />
      <div className="flex justify-between items-center mt-2">
        <div className="text-sm text-gray-500">
          {charCount}/{maxChars} characters
        </div>
        <button
          onClick={handleSaveComment}
          disabled={isLoading}
          className="px-4 py-2 bg-pink-900 text-white rounded hover:bg-pink-600 disabled:bg-blue-300"
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}