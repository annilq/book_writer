"use client";

import Spinner from "@/components/spinner";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { CreateMessage } from "ai";
import { ArrowRight } from "lucide-react";

export default function ChatBox({
  onNewStreamPromise,
  isStreaming,
}: {
  onNewStreamPromise: (v: CreateMessage) => void;
  isStreaming: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const disabled = isPending || isStreaming;
  const didFocusOnce = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState("");
  const textareaResizePrompt = prompt
    .split("\n")
    .map((text) => (text === "" ? "a" : text))
    .join("\n");

  useEffect(() => {
    if (!textareaRef.current) return;

    if (!disabled && !didFocusOnce.current) {
      textareaRef.current.focus();
      didFocusOnce.current = true;
    } else {
      didFocusOnce.current = false;
    }
  }, [disabled]);

  return (
    <div className="mb-4 flex shrink-0 px-2">
      <form
        className="relative flex w-full"
        action={async () => {
          startTransition(async () => {
            onNewStreamPromise({ content: prompt, role: "user" });
            startTransition(() => {
              router.refresh();
              setPrompt("");
            });
          });
        }}
      >
        <div className="relative w-full flex rounded overflow-hidden border border-gray-300 bg-white">
          <div className="relative w-full">
            <div className="w-full p-2">
              <p className="invisible min-h-[48px] w-full whitespace-pre-wrap">
                {textareaResizePrompt}
              </p>
            </div>
            <textarea
              ref={textareaRef}
              placeholder="Follow up"
              autoFocus={!disabled}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              required
              name="prompt"
              className="peer absolute inset-0 w-full resize-none bg-transparent p-2 placeholder-gray-500 focus:outline-none disabled:opacity-50"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  const target = event.target;
                  if (!(target instanceof HTMLTextAreaElement)) return;
                  target.closest("form")?.requestSubmit();
                }
              }}
            />
          </div>
          <div className="absolute bottom-1.5 right-1.5 flex has-[:disabled]:opacity-50">
            <div className="pointer-events-none absolute inset-0 -bottom-[1px] rounded bg-blue-700" />
            <button
              className="relative w-full inline-flex size-6 items-center justify-center rounded bg-blue-500 font-medium text-white shadow-lg outline-blue-300 hover:bg-blue-500/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              type="submit"
            >
              {disabled ? <Spinner /> : <ArrowRight />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
