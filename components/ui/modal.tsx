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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="flex justify-end gap-4">
          <Button
            onClick={onClose}
            className="bg-gray-400 text-white hover:bg-gray-500"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-pink-500 text-white hover:bg-pink-600"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}