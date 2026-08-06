"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { sendContactMessage, type ContactState } from "@/lib/contact/action";
import { LIMITS } from "@/lib/contact/validate";
import type { ContactForm as ContactFormContent } from "@/lib/content/types";

/**
 * O envio acontece em `lib/contact/action.ts` (Server Action). Os `maxLength`
 * daqui espelham os tetos que o servidor aplica: o navegador ajuda quem
 * preenche, o servidor é quem decide.
 *
 * Os campos são **controlados** por um motivo concreto: o React 19 chama
 * `form.reset()` quando a ação termina, com sucesso ou não. Com campos
 * descontrolados, um erro transitório apagava a mensagem inteira — e, pior, o
 * `required` do navegador passava a barrar a segunda tentativa em silêncio, sem
 * nada acontecer ao clicar. `defaultValue` não resolve: repor o *atributo* não
 * muda o valor de um campo que a pessoa já editou.
 */

const initialState: ContactState = { status: "idle" };

const EMPTY = { name: "", org: "", email: "", subject: "", message: "" };

/** Fica em componente próprio porque `useFormStatus` só enxerga o `<form>`
 * acima dele — dentro do mesmo componente que renderiza o form, `pending` nunca
 * mudaria. */
function SubmitButton({ content, sent }: { content: ContactFormContent; sent: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className={sent ? "sent" : undefined} disabled={pending}>
      {pending ? content.sendingLabel : sent ? content.sentLabel : content.submitLabel}
    </button>
  );
}

export function ContactForm({ content }: { content: ContactFormContent }) {
  const [state, formAction] = useActionState(sendContactMessage, initialState);

  // O inicializador cobre o caminho **sem JavaScript**: ali não há estado de
  // cliente sobrevivendo ao POST, e a página é renderizada de novo já com o
  // resultado da ação — então os valores que a ação devolve são a única forma
  // de o formulário voltar preenchido. Com JS, este ramo nunca é usado (na
  // montagem ainda não houve envio) e quem preserva o texto é o `useState`.
  const [values, setValues] = useState(() =>
    state.status === "error"
      ? state.values
      : { ...EMPTY, subject: content.subjectOptions[0]?.value ?? "" }
  );

  const sent = state.status === "sent";

  /**
   * Contador que remonta os campos a cada resultado da ação.
   *
   * O `form.reset()` que o React 19 dispara ao final da ação esvazia o DOM.
   * Campo controlado sozinho não basta: o React só reescreve o DOM quando o
   * valor renderizado muda, e aqui ele não muda — o estado continua o mesmo, só
   * o DOM foi zerado por baixo. Trocar a `key` obriga uma montagem nova, e aí o
   * valor do estado volta para a tela. Verificado no navegador.
   */
  const [fieldsKey, setFieldsKey] = useState(0);

  useEffect(() => {
    if (state.status === "idle") return;
    // Em erro, os valores vêm do **eco da ação**, e não do estado local: o
    // `form.reset()` do React já zerou o DOM, e o servidor é quem tem, com
    // certeza, o que foi submetido.
    if (state.status === "error") setValues(state.values);
    setFieldsKey((n) => n + 1);
  }, [state]);

  // Enviou: aí sim o formulário esvazia — é a única vez em que perder o texto é
  // o comportamento desejado.
  useEffect(() => {
    if (sent) setValues({ ...EMPTY, subject: content.subjectOptions[0]?.value ?? "" });
  }, [sent, content.subjectOptions]);

  const set = (field: keyof typeof EMPTY) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  return (
    <form className="form-card" action={formAction}>
      <div className="form-head">
        <h4>{content.heading}</h4>
        <div className="doodle">✱</div>
      </div>

      {/* Campo-armadilha: invisível e fora da ordem de tabulação, então pessoa
          nenhuma o encontra. Robô de spam preenche todo campo que acha, e o
          servidor recusa quando este vier preenchido. `aria-hidden` mantém o
          leitor de tela longe dele. */}
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor="website">Não preencha este campo</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="field-row" key={`row-${fieldsKey}`}>
        <div className="field">
          <label htmlFor="name">{content.nameLabel}</label>
          <input
            id="name"
            name="name"
            type="text"
            value={values.name}
            onChange={set("name")}
            maxLength={LIMITS.name}
            placeholder={content.namePlaceholder}
          />
        </div>
        <div className="field">
          <label htmlFor="org">{content.orgLabel}</label>
          <input
            id="org"
            name="org"
            type="text"
            value={values.org}
            onChange={set("org")}
            maxLength={LIMITS.org}
            placeholder={content.orgPlaceholder}
          />
        </div>
      </div>

      <div className="field" key={`email-${fieldsKey}`}>
        <label htmlFor="email">{content.emailLabel}</label>
        <input
          id="email"
          name="email"
          type="email"
          value={values.email}
          onChange={set("email")}
          maxLength={LIMITS.email}
          placeholder={content.emailPlaceholder}
          required
        />
      </div>

      <div className="field" key={`subject-${fieldsKey}`}>
        <label htmlFor="subject">{content.subjectLabel}</label>
        <select id="subject" name="subject" value={values.subject} onChange={set("subject")}>
          {content.subjectOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field" key={`message-${fieldsKey}`}>
        <label htmlFor="message">{content.messageLabel}</label>
        <textarea
          id="message"
          name="message"
          value={values.message}
          onChange={set("message")}
          maxLength={LIMITS.message}
          placeholder={content.messagePlaceholder}
          required
        />
      </div>

      {/* `role="status"` para o leitor de tela anunciar o resultado — sem isso,
          quem não enxerga o botão não fica sabendo o que aconteceu. */}
      <div className="form-feedback" role="status" aria-live="polite">
        {state.status === "error" ? (
          <span className="form-error">{state.message}</span>
        ) : sent ? (
          <span className="form-sent">{content.sentMessage}</span>
        ) : null}
      </div>

      <div className="form-foot">
        <div className="note">{content.note}</div>
        <SubmitButton content={content} sent={sent} />
      </div>
    </form>
  );
}
