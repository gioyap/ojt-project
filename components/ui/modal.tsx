"use client";

import { Button } from "@/components/ui/button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
}

export function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-2 sm:p-4">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-sm sm:max-w-md">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
          {description}
        </p>
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
          <Button
            onClick={onClose}
            className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-gray-400 text-white hover:bg-gray-500"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className="w-full sm:w-auto px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-pink-500 text-white hover:bg-pink-600"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}