"use client";

import { ReactNode } from "react";
import BookHeader from "./header";

export default function CodeViewerLayout({
  children,
  isShowing,
  onClose,
}: {
  children: ReactNode;
  isShowing: boolean;
  onClose: () => void;
}) {

  return (
    <div
      className={`w-2/3 h-full overflow-hidden transition-[width] lg:block bg-muted border-l`}
    >
      <BookHeader>
        <div className="flex items-center flex-1">
          prevrew
        </div>
        <div className="flex items-center">
          prevrew
        </div>
      </BookHeader>
      <div className="ml-4 flex h-full flex-col ">
        <div className="flex h-full flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
