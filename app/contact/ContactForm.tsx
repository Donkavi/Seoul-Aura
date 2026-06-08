"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface ContactFormProps {
  recipientEmail: string;
}

export default function ContactForm({ recipientEmail }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Message from ${name} via Seoul Aura`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
    const to = recipientEmail || "hello@seoulaura.lk";
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-ink-700 mb-1.5">
          Your Name
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Kavindu Perera"
          className="w-full border border-ink-200 rounded-sm px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-rose-400 transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-700 mb-1.5">
          Email Address
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border border-ink-200 rounded-sm px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-rose-400 transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-ink-700 mb-1.5">
          Message
        </label>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help you?"
          className="w-full border border-ink-200 rounded-sm px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:outline-none focus:border-rose-400 transition-colors resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full inline-flex items-center justify-center gap-2 bg-rose-600 text-white py-3 text-sm font-medium hover:bg-rose-700 transition-colors rounded-sm"
      >
        <Send size={14} />
        Send Message
      </button>

      <p className="text-[11px] text-ink-400 text-center">
        This will open your email client to send the message.
      </p>
    </form>
  );
}
