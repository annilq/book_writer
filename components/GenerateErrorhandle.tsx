import { useErrorStore } from "@/store/error";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

export function ErrorMessage({ onRequestFix }: { onRequestFix: (e: string) => void }) {
  const { error } = useErrorStore();
  const [didCopy, setDidCopy] = useState(false);

  if (!error) return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/5 text-base backdrop-blur-sm">
      <div className="max-w-[400px] rounded-md bg-red-500 p-4 text-white shadow-xl shadow-black/20">
        <p className="text-lg font-medium">Error</p>

        <p className="mt-4 line-clamp-[10] overflow-x-auto whitespace-pre font-mono text-xs">
          {error}
        </p>

        <div className="mt-8 flex justify-between gap-4">
          <button
            onClick={async () => {
              if (!error) return;

              setDidCopy(true);
              await window.navigator.clipboard.writeText(
                error,
              );
              await new Promise((resolve) => setTimeout(resolve, 2000));
              setDidCopy(false);
            }}
            className="rounded border-red-300 px-2.5 py-1.5 text-sm font-semibold text-red-50"
          >
            {didCopy ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
          </button>
          <button
            onClick={() => {
              if (!error) return;
              onRequestFix(error);
            }}
            className="rounded bg-white px-2.5 py-1.5 text-sm font-medium text-black"
          >
            Try to fix
          </button>
        </div>
      </div>
    </div>
  );
}
