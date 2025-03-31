"use client";

import { useState } from "react";
import { updateComment } from "@/app/actions";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface CommentTextareaProps {
  initialComment?: string;
  date: string;
  traineeId: string;
}

export function CommentTextarea({ initialComment, date, traineeId }: CommentTextareaProps) {
  const [comment, setComment] = useState(initialComment || "");
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(comment.length);
  const maxChars = 150;

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));

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

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
    setCharCount(e.target.value.length);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="w-full bg-white shadow-md rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200">
      <h3 className="font-semibold text-lg mb-3 text-gray-800">{formattedDate}</h3>
      <textarea
        value={comment}
        onChange={handleTextareaChange}
        className="w-full p-3 border border-blue-300 rounded-lg resize-none overflow-hidden text-gray-800 bg-white focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
        rows={4}
        placeholder="Add a comment..."
        maxLength={maxChars}
      />
      <div className="flex justify-between items-center mt-3">
        <div className="text-sm text-gray-600">
          {charCount}/{maxChars} characters
        </div>
        <button
          onClick={handleSaveComment}
          disabled={isLoading}
          className="px-4 py-2 bg-pink-600 text-white rounded-lg shadow-md hover:from-blue-800 hover:to-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}