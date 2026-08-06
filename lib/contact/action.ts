"use server";

import { headers } from "next/headers";
import { getContactForm } from "@/lib/content";
import { checkRateLimit, clientKey } from "./rate-limit";
import { LIMITS, validateContact } from "./validate";

/**
 * Envio do formulário de contato.
 *
 * Uma Server Action é um **endpoint público**: qualquer pessoa monta a
 * requisição, sem passar pelo formulário. Por isso a ordem aqui é a ordem do
 * custo — o que é barato de recusar, recusa-se primeiro:
 *
 *   1. Configuração ausente (nem chega a olhar a entrada).
 *   2. Limite por IP (antes de qualquer validação, é o que segura enxurrada).
 *   3. Validação, incluindo o campo-armadilha e o assunto contra a lista real.
 *   4. Só então a chamada externa, que é a única parte cara e a única que sai
 *      da máquina.
 *
 * O e-mail é enviado por HTTP direto à API do Resend, sem SDK: é um POST com
 * JSON, e o projeto não ganha nada carregando mais uma dependência para isso.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Mensagem única para tudo que dá errado do nosso lado. Distinguir "chave
 * inválida" de "serviço fora" para quem preenche o formulário não ajuda em nada
 * e conta ao mundo como o site é montado — o detalhe vai para o log. */
const GENERIC_ERROR = "Não foi possível enviar agora. Tente de novo em instantes.";

/**
 * Em erro, os valores voltam para o cliente repopular os campos.
 *
 * O React 19 **limpa o formulário** quando a ação termina, com sucesso ou não.
 * Sem devolver o que foi digitado, quem escreve uma mensagem longa e esbarra
 * num erro transitório perde tudo — e a segunda tentativa fica pior que a
 * primeira. Em sucesso não voltam: aí o formulário limpo é o certo.
 */
export type ContactValues = {
  name: string;
  org: string;
  email: string;
  subject: string;
  message: string;
};

export type ContactState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "error"; message: string; values: ContactValues };

/** Devolve no máximo o que os campos aceitam. Sem o corte, uma mensagem acima
 * do teto (que a validação recusa justamente por ser grande) voltaria inteira
 * no corpo da resposta. */
function echo(data: FormData): ContactValues {
  const read = (key: string, max: number) => {
    const value = data.get(key);
    return typeof value === "string" ? value.slice(0, max) : "";
  };

  return {
    name: read("name", LIMITS.name),
    org: read("org", LIMITS.org),
    email: read("email", LIMITS.email),
    subject: read("subject", 64),
    message: read("message", LIMITS.message),
  };
}

export async function sendContactMessage(
  _previous: ContactState,
  data: FormData
): Promise<ContactState> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    console.error(
      "Formulário de contato não configurado: faltam RESEND_API_KEY, " +
        "CONTACT_TO_EMAIL ou CONTACT_FROM_EMAIL. Ver .env.example."
    );
    return { status: "error", message: GENERIC_ERROR, values: echo(data) };
  }

  const limit = checkRateLimit(clientKey(await headers()));

  if (!limit.allowed) {
    const minutes = Math.ceil(limit.retryAfterSeconds / 60);
    return {
      status: "error",
      message: `Muitas mensagens em pouco tempo. Tente de novo em ${minutes} min.`,
      values: echo(data),
    };
  }

  // Os assuntos válidos são os que o CMS oferece hoje — a mesma fonte que
  // desenhou o `<select>`. Assim a lista não precisa ser repetida aqui e não
  // sai de sincronia quando alguém editar as opções no Studio.
  const form = await getContactForm();
  const allowedSubjects = form.subjectOptions.map((option) => option.value);

  const result = validateContact(data, allowedSubjects);

  if (!result.ok) {
    return { status: "error", message: result.error, values: echo(data) };
  }

  const { name, org, email, subject, message } = result.value;
  const subjectLabel =
    form.subjectOptions.find((option) => option.value === subject)?.label ?? "Contato";

  // Texto puro, sem HTML: não há o que escapar, e nada do que a pessoa escreveu
  // é interpretado como marcação na caixa de entrada de quem recebe.
  const body = [
    `Nome: ${name || "(não informado)"}`,
    `Instituição: ${org || "(não informada)"}`,
    `E-mail: ${email}`,
    `Assunto: ${subjectLabel}`,
    "",
    message,
  ].join("\n");

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        // Responder no cliente de e-mail vai direto para quem escreveu, sem
        // que o endereço dele possa se passar pelo remetente da mensagem.
        reply_to: email,
        subject: `[Site LEAR] ${subjectLabel}${name ? ` — ${name}` : ""}`,
        text: body,
      }),
      // O Resend responde em milissegundos; se travar, é melhor devolver erro
      // do que segurar a Server Action até o timeout da plataforma.
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(`Resend recusou o envio: ${response.status} ${await response.text()}`);
      return { status: "error", message: GENERIC_ERROR, values: echo(data) };
    }
  } catch (error) {
    console.error("Falha ao chamar o Resend:", error);
    return { status: "error", message: GENERIC_ERROR, values: echo(data) };
  }

  return { status: "sent" };
}
