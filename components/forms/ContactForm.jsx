"use client";
import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setSuccess(false);

    if (!name.trim() || !email.trim() || !message.trim()) {
      return setErr("Please fill all required fields.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setErr("Please enter a valid email address.");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });
      const data = await res.json();
      setLoading(false);
      if (data.ok) {
        setSuccess(true);
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
      } else {
        setErr(data.error || "An error occurred. Please try again.");
      }
    } catch (e) {
      setLoading(false);
      setErr("Failed to send message. Please check your connection.");
    }
  }

  return (
    <form onSubmit={submit} noValidate className="bg-white rounded-[18px] border border-[rgba(111,115,132,0.18)] p-6 lg:p-8 space-y-4">
      <h2 className="text-[20px] font-extrabold text-[#0e1b4d] mb-2">Send us a message</h2>
      
      {err && <div className="p-3 bg-red-50 text-red-600 rounded-[10px] text-[13px] font-semibold">{err}</div>}
      {success && <div className="p-3 bg-green-50 text-green-600 rounded-[10px] text-[13px] font-semibold">Message sent successfully! Thank you.</div>}

      <div>
        <label className="block text-[13px] font-semibold text-[#0e1b4d] mb-1">Full Name *</label>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-[44px] px-4 rounded-[12px] border border-[rgba(111,115,132,0.4)] text-[14px] outline-none focus:border-[#3056D3]"
          required
        />
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-[#0e1b4d] mb-1">Email *</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-[44px] px-4 rounded-[12px] border border-[rgba(111,115,132,0.4)] text-[14px] outline-none focus:border-[#3056D3]"
          required
        />
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-[#0e1b4d] mb-1">Phone</label>
        <input
          type="tel"
          placeholder="+91 ..."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full h-[44px] px-4 rounded-[12px] border border-[rgba(111,115,132,0.4)] text-[14px] outline-none focus:border-[#3056D3]"
        />
      </div>

      <div>
        <label className="block text-[13px] font-semibold text-[#0e1b4d] mb-1">Message *</label>
        <textarea
          rows={4}
          placeholder="How can we help?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-4 py-3 rounded-[12px] border border-[rgba(111,115,132,0.4)] text-[14px] outline-none focus:border-[#3056D3]"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-[46px] rounded-full bg-[#3056D3] text-white text-[15px] font-bold disabled:opacity-60"
      >
        {loading ? "Sending..." : "Send Message"}
      </button>
      
      <p className="text-[12px] text-[#9ca3af] text-center">
        We typically respond within one business day.
      </p>
    </form>
  );
}
