"use client";

import { useState } from "react";

export type CallbackLabels = {
  heading: string;
  body: string;
  name: string;
  phone: string;
  topicBuy: string;
  topicRepair: string;
  topicFirmware: string;
  topicHotel: string;
  comment: string;
  submit: string;
  success: string;
};

// Callback request form. There is no order/lead backend yet, so on submit we
// only show a success state (stub, mirroring the refresh design demo) and reset
// after a short delay. The single real ask is a phone number to call back.
// Labels arrive as props so the heavy `contact` namespace stays off the client
// i18n payload (see CLIENT_NAMESPACES in the locale layout).
export default function CallbackForm({ labels }: { labels: CallbackLabels }) {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
    const form = e.currentTarget;
    setTimeout(() => {
      setSent(false);
      form.reset();
    }, 2200);
  }

  return (
    <section className="glass !rounded-2xl p-8 relative">
      <div className="grid-tex" />
      <div className="relative z-10">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-1">{labels.heading}</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mb-7">{labels.body}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input className="field" placeholder={labels.name} required />
            <input className="field" type="tel" placeholder={labels.phone} required />
          </div>
          <select className="field cursor-pointer" defaultValue="buy">
            <option value="buy">{labels.topicBuy}</option>
            <option value="repair">{labels.topicRepair}</option>
            <option value="firmware">{labels.topicFirmware}</option>
            <option value="hotel">{labels.topicHotel}</option>
          </select>
          <textarea className="field resize-none" rows={4} placeholder={labels.comment} />
          <button
            type="submit"
            className="btn-primary w-full py-4 flex items-center justify-center gap-2 font-label-caps text-label-caps uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-[18px]">{sent ? "check" : "call"}</span>
            {sent ? labels.success : labels.submit}
          </button>
        </form>
      </div>
    </section>
  );
}
