"use client";

import { useState } from "react";
import type { ContactForm as ContactFormContent } from "@/lib/content/types";

export function ContactForm({ content }: { content: ContactFormContent }) {
  const [sent, setSent] = useState(false);

  return (
    <form
      className="form-card"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <div className="form-head">
        <h4>{content.heading}</h4>
        <div className="doodle">✱</div>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="name">{content.nameLabel}</label>
          <input id="name" type="text" placeholder={content.namePlaceholder} />
        </div>
        <div className="field">
          <label htmlFor="org">{content.orgLabel}</label>
          <input id="org" type="text" placeholder={content.orgPlaceholder} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="email">{content.emailLabel}</label>
        <input id="email" type="email" placeholder={content.emailPlaceholder} required />
      </div>

      <div className="field">
        <label htmlFor="subject">{content.subjectLabel}</label>
        <select id="subject" defaultValue={content.subjectOptions[0]?.value}>
          {content.subjectOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="message">{content.messageLabel}</label>
        <textarea id="message" placeholder={content.messagePlaceholder} />
      </div>

      <div className="form-foot">
        <div className="note">{content.note}</div>
        <button type="submit" className={sent ? "sent" : undefined}>
          {sent ? content.sentLabel : content.submitLabel}
        </button>
      </div>
    </form>
  );
}
