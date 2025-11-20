"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  children,
  title,
}: BottomSheetProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => onOpenChange(false)}
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 rounded-t-2xl",
          "max-h-[85vh] flex flex-col",
          "animate-in slide-in-from-bottom duration-300"
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X size={20} className="text-zinc-400" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </>
  );
}
