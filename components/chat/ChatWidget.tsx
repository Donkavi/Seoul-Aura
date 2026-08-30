"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Sparkles,
  X,
  Send,
  ImagePlus,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  Minus,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ChatProductCard from "./ChatProductCard";
import ProductRequestCard from "./ProductRequestCard";
import type { ChatBlock, ChatMessage, ChatTurn, Product } from "@/types";

const STORAGE_KEY = "sa-aura-chat";
const LAYOUT_KEY = "sa-aura-layout";
const MAX_IMAGE_DIMENSION = 1024;

const DEFAULT_SIDEBAR_WIDTH = 520;
const MIN_SIDEBAR_WIDTH = 380;
const MAX_SIDEBAR_WIDTH = 900;
/** Past this the panel is roomy enough to show product cards two-up. */
const WIDE_LAYOUT_AT = 560;

function clampWidth(px: number): number {
  const ceiling = Math.min(MAX_SIDEBAR_WIDTH, Math.round(window.innerWidth * 0.95));
  return Math.max(MIN_SIDEBAR_WIDTH, Math.min(px, ceiling));
}

const GREETING =
  "Hi, I'm Aura — Seoul Aura's beauty concierge.\n\nTell me what your skin or hair is doing lately, or send a photo, and I'll find what suits you from our shelves.";

/**
 * Shown under the greeting rather than inside it — shoppers who read English fine
 * can skip past it, while those who would rather type in Sinhala or Tamil find out
 * that they can before they start composing in a language they are less sure of.
 */
const LANGUAGE_NOTE = {
  native: "සිංහලෙන් හෝ ඔබට පහසු ඕනෑම භාෂාවකින් අහන්න",
  english: "Ask in Sinhala, Tamil, English — whichever you prefer.",
};

const STARTERS = [
  "My skin is oily and breaking out",
  "Dry, flaky skin — what helps?",
  "Build me a simple K-beauty routine",
  "Something for dark spots",
];

/** Shown one after another while a reply is being composed. */
const THINKING_STATES = [
  "Reading your concern",
  "Searching the shelves",
  "Picking your matches",
];

interface ChatApiResponse {
  text?: string;
  blocks?: ChatBlock[];
  products?: Record<string, Product>;
  error?: string;
}

let messageSeq = 0;
function nextId(): string {
  messageSeq += 1;
  return `m${Date.now().toString(36)}${messageSeq}`;
}

/**
 * Downscale in the browser before upload — a modern phone photo is 4-8 MB, and
 * the model reads a 1024px edge just as well for skin texture.
 */
async function prepareImage(file: File): Promise<{ mimeType: string; data: string; preview: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("decode failed"));
    el.src = dataUrl;
  });

  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return { mimeType: file.type, data: dataUrl, preview: dataUrl };
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const resized = canvas.toDataURL("image/jpeg", 0.85);
  return { mimeType: "image/jpeg", data: resized, preview: resized };
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<{ mimeType: string; data: string; preview: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [hasOpened, setHasOpened] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  // "docked" is the small bubble above the launcher; "sidebar" is a full-height
  // panel pinned to the right edge, which a long routine needs room to breathe in.
  const [mode, setMode] = useState<"docked" | "sidebar">("docked");
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [dragging, setDragging] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: session, status: sessionStatus } = useSession();
  // Tracks who the on-screen conversation belongs to, to detect account changes.
  const lastIdentity = useRef<string | null>(null);
  const restoreAttempted = useRef(false);

  /* ---------------- persistence ---------------- */

  // A conversation belongs to whoever was signed in when it happened. Shoppers
  // describe skin conditions and send photos of their faces here, so it must never
  // survive into the next person's session on a shared or handed-over device.
  const identity = sessionStatus === "authenticated" ? session?.user?.email ?? "user" : "guest";
  const sessionReady = sessionStatus !== "loading";

  useEffect(() => {
    if (!sessionReady || restoreAttempted.current) return;
    restoreAttempted.current = true;
    lastIdentity.current = identity;

    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved) as {
        owner?: string;
        messages?: ChatMessage[];
        products?: Record<string, Product>;
      };

      // Someone else's conversation (or one saved before this rule existed).
      if (parsed.owner !== identity) {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }

      if (Array.isArray(parsed.messages) && parsed.messages.length) {
        setMessages(parsed.messages);
        setProducts(parsed.products ?? {});
        setHasOpened(true);
      }
    } catch {
      /* a corrupt draft is not worth surfacing — start fresh */
    }
  }, [sessionReady, identity]);

  // Signing out, or a different account signing in, ends the conversation.
  useEffect(() => {
    if (!sessionReady || !restoreAttempted.current) return;
    const previous = lastIdentity.current;
    if (previous === identity) return;
    lastIdentity.current = identity;

    // Guest → signed in is the same person finishing what they started, so their
    // conversation carries over and is simply re-owned. Every other change of
    // identity means a different person is at the keyboard.
    if (previous === "guest" && identity !== "guest") return;

    setMessages([]);
    setProducts({});
    setInput("");
    setPending(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing more we can do; in-memory state is already cleared */
    }
  }, [identity, sessionReady]);

  useEffect(() => {
    // Waiting for the session avoids stamping a conversation as "guest" during the
    // brief moment before the signed-in user is known.
    if (!sessionReady || !messages.length) return;
    try {
      // Image previews are large data URLs; drop them from the saved copy.
      const slim = messages.map(({ imagePreview, ...rest }) => {
        void imagePreview;
        return rest;
      });
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ owner: identity, messages: slim, products })
      );
    } catch {
      /* quota exceeded — the live conversation still works */
    }
  }, [messages, products, identity, sessionReady]);

  /* ---------------- effects ---------------- */

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (!busy) {
      setThinkingStep(0);
      return;
    }
    const timer = setInterval(
      () => setThinkingStep((s) => Math.min(s + 1, THINKING_STATES.length - 1)),
      2200
    );
    return () => clearInterval(timer);
  }, [busy]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      setHasOpened(true);
      window.setTimeout(() => inputRef.current?.focus(), 260);
    }
  }, [open]);

  // The panel is a full-screen sheet on phones, so stop the page scrolling behind it.
  useEffect(() => {
    if (!open) return;
    const isSmall = window.matchMedia("(max-width: 639px)").matches;
    if (!isSmall) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // The nudge has said its piece after a few seconds; leaving it up is nagging.
  useEffect(() => {
    if (hasOpened) return;
    const timer = window.setTimeout(() => setNudgeDismissed(true), 12000);
    return () => window.clearTimeout(timer);
  }, [hasOpened]);

  /* ---------------- layout: docked vs sidebar ---------------- */

  // Panel size is a lasting preference, so it outlives the conversation.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAYOUT_KEY);
      if (!saved) return;
      const { mode: savedMode, width } = JSON.parse(saved) as {
        mode?: string;
        width?: number;
      };
      if (savedMode === "sidebar" || savedMode === "docked") setMode(savedMode);
      if (typeof width === "number") setSidebarWidth(clampWidth(width));
    } catch {
      /* fall back to the default docked bubble */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify({ mode, width: sidebarWidth }));
    } catch {
      /* preference is a nicety, never worth breaking the chat over */
    }
  }, [mode, sidebarWidth]);

  // Drag the panel's left edge to resize. Listeners live on the window so the
  // pointer can leave the 6px handle mid-drag without the resize stopping.
  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: PointerEvent) => setSidebarWidth(clampWidth(window.innerWidth - e.clientX));
    const onUp = () => setDragging(false);

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    const previousSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.body.style.userSelect = previousSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [dragging]);

  // A window narrowed after the fact should not leave the panel wider than the screen.
  useEffect(() => {
    const onResize = () => setSidebarWidth((w) => clampWidth(w));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isSidebar = mode === "sidebar";
  // Only a genuinely wide panel has room for two cards abreast.
  const wideCards = isSidebar && sidebarWidth >= WIDE_LAYOUT_AT;

  /* ---------------- sending ---------------- */

  const send = useCallback(
    async (rawText: string, image?: { mimeType: string; data: string; preview: string } | null) => {
      const text = rawText.trim();
      if ((!text && !image) || busy) return;

      const userMessage: ChatMessage = {
        id: nextId(),
        role: "user",
        text: text || "Here is a photo of my concern.",
        imagePreview: image?.preview,
      };

      // Only real exchanges go back to the model — error bubbles would just
      // teach it to apologise for things that never happened.
      const history: ChatTurn[] = messages
        .filter((m) => !m.error)
        .map((m) => ({ role: m.role, text: m.text }));

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setPending(null);
      setBusy(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            image: image ? { mimeType: image.mimeType, data: image.data } : undefined,
            history,
          }),
        });

        const data = (await res.json()) as ChatApiResponse;

        if (!res.ok || data.error) {
          setMessages((prev) => [
            ...prev,
            {
              id: nextId(),
              role: "assistant",
              text: data.error ?? "Something went wrong. Please try again.",
              error: true,
            },
          ]);
          return;
        }

        if (data.products) setProducts((prev) => ({ ...prev, ...data.products }));
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            text: data.text ?? "",
            blocks: data.blocks?.length ? data.blocks : undefined,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            text: "I could not reach the shop just now. Check your connection and try again.",
            error: true,
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [busy, messages]
  );

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    try {
      setPending(await prepareImage(file));
      inputRef.current?.focus();
    } catch {
      /* unreadable file — the shopper can just try another */
    }
  };

  const reset = () => {
    setMessages([]);
    setProducts({});
    setInput("");
    setPending(null);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.text;

  /* ---------------- render ---------------- */

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close beauty assistant" : "Open beauty assistant"}
        className={cn(
          "group fixed bottom-5 right-5 z-40 flex items-center gap-2.5 h-14 rounded-full shadow-rose transition-all duration-500",
          "bg-gradient-to-br from-rose-500 to-rose-700 text-white hover:shadow-card-hover",
          open ? "w-14 justify-center" : "w-14 sm:hover:w-[188px] justify-center sm:hover:justify-start sm:hover:pl-4"
        )}
      >
        <span className="relative flex items-center justify-center flex-shrink-0">
          {!open && (
            <span className="absolute inline-flex h-9 w-9 rounded-full bg-rose-400/40 animate-ping" />
          )}
          {open ? (
            <X size={20} strokeWidth={1.75} />
          ) : (
            <Sparkles size={20} strokeWidth={1.75} className="relative" />
          )}
        </span>
        {!open && (
          <span className="hidden sm:block overflow-hidden whitespace-nowrap max-w-0 sm:group-hover:max-w-[130px] transition-all duration-500 text-[10px] uppercase tracking-[0.18em] font-semibold">
            Ask Aura
          </span>
        )}
      </button>

      {/* Panel */}
      <div
        style={isSidebar ? { width: `${sidebarWidth}px` } : undefined}
        className={cn(
          "fixed z-[60] flex flex-col bg-white shadow-card-hover origin-bottom-right",
          // Skip the transition mid-drag or the panel lags behind the pointer.
          dragging ? "transition-none" : "transition-all duration-300",
          "inset-0",
          isSidebar
            ? "sm:inset-y-0 sm:right-0 sm:left-auto sm:h-full sm:max-w-[95vw] sm:rounded-none sm:border-l sm:border-ink-100"
            : "sm:inset-auto sm:bottom-24 sm:right-5 sm:w-[404px] sm:h-[min(660px,calc(100vh-8rem))] sm:rounded-sm sm:border sm:border-ink-100",
          open
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
            : "opacity-0 translate-y-4 scale-95 pointer-events-none invisible"
        )}
        role="dialog"
        aria-label="Aura beauty assistant"
        aria-hidden={!open}
      >
        {/* Resize handle — sidebar only, and pointless on a touch-sized screen */}
        {isSidebar && (
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDoubleClick={() => setSidebarWidth(clampWidth(DEFAULT_SIDEBAR_WIDTH))}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize the assistant panel"
            className="hidden sm:block absolute left-0 inset-y-0 w-1.5 -ml-0.5 cursor-ew-resize z-10 group/handle"
          >
            <span
              className={cn(
                "absolute inset-y-0 left-0 w-0.5 transition-colors duration-200",
                dragging ? "bg-rose-500" : "bg-transparent group-hover/handle:bg-rose-300"
              )}
            />
          </div>
        )}

        {/* Header */}
        <header
          className={cn(
            "flex items-center gap-3 px-4 py-3.5 bg-ink-900 text-white flex-shrink-0",
            !isSidebar && "sm:rounded-t-sm"
          )}
        >
          <span className="relative w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-rose-700 flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} strokeWidth={1.75} />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-ink-900" />
          </span>

          <div className="flex-1 min-w-0">
            <p className="font-display text-lg leading-none tracking-wide">Aura</p>
            <p className="text-[9px] uppercase tracking-[0.22em] text-ink-400 mt-1">
              Beauty Concierge
            </p>
          </div>

          {messages.length > 0 && (
            <button
              onClick={reset}
              aria-label="Start a new conversation"
              className="text-ink-400 hover:text-white transition-colors p-1"
            >
              <RotateCcw size={15} strokeWidth={1.75} />
            </button>
          )}

          {/* Full-screen on a phone already, so this only earns its place on desktop */}
          <button
            onClick={() => setMode((m) => (m === "sidebar" ? "docked" : "sidebar"))}
            aria-label={isSidebar ? "Shrink to a corner panel" : "Expand to a full-height sidebar"}
            title={isSidebar ? "Shrink to corner" : "Expand to sidebar"}
            className="hidden sm:block text-ink-400 hover:text-white transition-colors p-1"
          >
            {isSidebar ? (
              <Minimize2 size={15} strokeWidth={1.75} />
            ) : (
              <Maximize2 size={15} strokeWidth={1.75} />
            )}
          </button>

          <button
            onClick={() => setOpen(false)}
            aria-label="Close assistant"
            className="text-ink-400 hover:text-white transition-colors p-1"
          >
            <span className="hidden sm:block">
              <Minus size={17} strokeWidth={2} />
            </span>
            <span className="sm:hidden">
              <X size={19} strokeWidth={1.75} />
            </span>
          </button>
        </header>

        {/* Messages */}
        <div
          ref={scrollRef}
          className={cn(
            "flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-rose-25 scroll-smooth",
            isSidebar && "sm:px-5"
          )}
        >
          <Bubble role="assistant">
            <MessageText text={GREETING} />
            <span className="mt-2.5 pt-2.5 border-t border-ink-100 flex flex-col gap-0.5">
              <span lang="si" className="text-[12px] text-ink-700 leading-relaxed">
                {LANGUAGE_NOTE.native}
              </span>
              <span className="text-[11px] text-ink-400 leading-relaxed">
                {LANGUAGE_NOTE.english}
              </span>
            </span>
          </Bubble>

          {messages.length === 0 && (
            <div className="flex flex-wrap gap-1.5 pl-1 animate-fade-in">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] leading-tight text-left bg-white border border-rose-100 text-ink-700 hover:border-rose-400 hover:text-rose-600 px-2.5 py-1.5 rounded-full transition-colors duration-200"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {messages.map((m) => (
            <div key={m.id} className="space-y-2.5">
              <Bubble role={m.role} error={m.error}>
                {m.imagePreview && (
                  <span className="block mb-2 overflow-hidden rounded-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.imagePreview}
                      alt="Photo you shared"
                      className="max-h-40 w-auto rounded-sm"
                    />
                  </span>
                )}
                {m.error && (
                  <AlertCircle size={13} className="inline-block mr-1.5 -mt-0.5 text-rose-600" />
                )}
                <MessageText text={m.text} />
              </Bubble>

              {m.blocks?.map((block, i) => (
                <BlockView
                  key={`${m.id}-${i}`}
                  block={block}
                  products={products}
                  lastUserMessage={lastUserMessage}
                  onNavigate={() => setOpen(false)}
                  wideCards={wideCards}
                />
              ))}
            </div>
          ))}

          {busy && (
            <Bubble role="assistant">
              <span className="flex items-center gap-2 text-ink-400">
                <span className="flex gap-1">
                  <Dot delay="0ms" />
                  <Dot delay="160ms" />
                  <Dot delay="320ms" />
                </span>
                <span className="text-[11px] italic">{THINKING_STATES[thinkingStep]}…</span>
              </span>
            </Bubble>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-ink-100 bg-white flex-shrink-0">
          {pending && (
            <div className="px-4 pt-3 flex items-center gap-2.5">
              <span className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pending.preview}
                  alt="Attached"
                  className="w-12 h-12 object-cover rounded-sm border border-ink-200"
                />
                <button
                  onClick={() => setPending(null)}
                  aria-label="Remove photo"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink-900 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                >
                  <X size={10} strokeWidth={3} />
                </button>
              </span>
              <p className="text-[11px] text-ink-500 leading-snug">
                Photo attached — add a note about your concern, or just send it.
              </p>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input, pending);
            }}
            className="flex items-end gap-2 px-3 py-3"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Attach a photo"
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-sm text-ink-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <ImagePlus size={18} strokeWidth={1.75} />
            </button>

            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input, pending);
                }
              }}
              placeholder="Describe your skin or hair concern…"
              className="flex-1 resize-none border border-ink-200 rounded-sm px-3 py-2 text-[13px] leading-relaxed max-h-24 focus:outline-none focus:border-rose-400 transition-colors placeholder:text-ink-400"
            />

            <button
              type="submit"
              disabled={busy || (!input.trim() && !pending)}
              aria-label="Send message"
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-sm bg-rose-600 text-white hover:bg-rose-700 disabled:bg-ink-200 disabled:text-ink-400 transition-colors"
            >
              <Send size={15} strokeWidth={2} />
            </button>
          </form>

          <p className="px-4 pb-2.5 text-[9px] text-ink-400 leading-relaxed">
            Aura gives cosmetic guidance only, not medical advice. For persistent or painful
            concerns, please see a dermatologist.
          </p>
        </div>
      </div>

      {/* Mobile backdrop keeps the page behind from scrolling under the sheet */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink-900/20 backdrop-blur-[2px] sm:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Nudge the first-time visitor once, then never again this session */}
      {!open && !hasOpened && !nudgeDismissed && (
        <div className="hidden md:block fixed bottom-[86px] right-5 z-40 max-w-[212px] bg-white border border-rose-100 shadow-card rounded-sm p-3 animate-fade-up">
          <p className="text-[11px] leading-relaxed text-ink-700">
            <span className="font-medium text-rose-600">Not sure what to buy?</span> Tell Aura your
            skin concern — or send a photo.
          </p>
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Presentational pieces                                              */
/* ------------------------------------------------------------------ */

function Bubble({
  role,
  error,
  children,
}: {
  role: "user" | "assistant";
  error?: boolean;
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex animate-fade-up", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[86%] px-3.5 py-2.5 text-[13px] leading-relaxed",
          isUser
            ? "bg-rose-600 text-white rounded-lg rounded-br-none"
            : error
              ? "bg-white text-ink-700 border border-rose-200 rounded-lg rounded-bl-none"
              : "bg-white text-ink-800 border border-ink-100 rounded-lg rounded-bl-none shadow-card"
        )}
      >
        {children}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse-soft"
      style={{ animationDelay: delay }}
    />
  );
}

/** Inline **bold**, which the model reaches for even when told to keep it plain. */
function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
    chunk.startsWith("**") && chunk.endsWith("**") ? (
      <strong key={i} className="font-semibold">
        {chunk.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{chunk}</span>
    )
  );
}

const BULLET = /^\s*[-*•]\s+/;
const NUMBERED = /^\s*(\d+)[.)]\s+/;

/**
 * Renders the small subset of markdown the assistant actually produces —
 * paragraphs, bold, and bullet or numbered lists. Anything unhandled would
 * otherwise surface to the shopper as raw asterisks or a run-on paragraph.
 *
 * Each source line becomes its own block: the model writes one thought per line
 * rather than hard-wrapping prose, so joining lines would merge separate steps.
 */
function MessageText({ text }: { text: string }) {
  if (!text) return null;

  const nodes: React.ReactNode[] = [];
  let list: Array<{ marker: string; body: string }> = [];

  const flushList = () => {
    if (!list.length) return;
    const items = list;
    list = [];
    nodes.push(
      <ul key={`l${nodes.length}`} className={cn("space-y-1.5", nodes.length ? "mt-2" : undefined)}>
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-rose-500 font-medium flex-shrink-0">{item.marker}</span>
            <span className="min-w-0">{inline(item.body)}</span>
          </li>
        ))}
      </ul>
    );
  };

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    const numbered = trimmed.match(NUMBERED);
    if (numbered) {
      list.push({ marker: `${numbered[1]}.`, body: trimmed.replace(NUMBERED, "") });
      continue;
    }
    if (BULLET.test(trimmed)) {
      list.push({ marker: "·", body: trimmed.replace(BULLET, "") });
      continue;
    }

    flushList();
    nodes.push(
      <p key={`p${nodes.length}`} className={nodes.length ? "mt-2" : undefined}>
        {/* Strip any markdown heading the model slipped in; it has no place in a bubble. */}
        {inline(trimmed.replace(/^#{1,6}\s+/, ""))}
      </p>
    );
  }
  flushList();

  return <>{nodes}</>;
}

function BlockView({
  block,
  products,
  lastUserMessage,
  onNavigate,
  wideCards,
}: {
  block: ChatBlock;
  products: Record<string, Product>;
  lastUserMessage?: string;
  onNavigate: () => void;
  wideCards?: boolean;
}) {
  if (block.kind === "products") {
    const found = block.productIds.map((id) => products[id]).filter(Boolean);
    if (!found.length) return null;
    return (
      <div className="animate-fade-up">
        {block.reason && (
          <p className="text-[9px] uppercase tracking-[0.18em] text-rose-600 font-semibold pl-1 mb-2">
            {block.reason}
          </p>
        )}
        {/* A widened sidebar has room to sit cards side by side. */}
        <div className={cn("gap-2", wideCards ? "grid grid-cols-2" : "flex flex-col")}>
          {found.map((p) => (
            <ChatProductCard key={p._id} product={p} />
          ))}
        </div>
      </div>
    );
  }

  if (block.kind === "request") {
    return (
      <div className="animate-fade-up">
        <ProductRequestCard block={block} lastUserMessage={lastUserMessage} />
      </div>
    );
  }

  return (
    <Link
      href={block.path}
      onClick={onNavigate}
      className="group inline-flex items-center gap-2 bg-white border border-ink-200 hover:border-rose-400 hover:text-rose-600 text-ink-800 text-[11px] uppercase tracking-[0.14em] font-semibold px-3.5 py-2.5 rounded-sm transition-colors duration-300 animate-fade-up"
    >
      {block.label}
      <ArrowRight
        size={13}
        className="transition-transform duration-300 group-hover:translate-x-0.5"
      />
    </Link>
  );
}

