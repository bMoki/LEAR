/**
 * Validação da mensagem de contato — pura, sem I/O, para poder ser exercitada
 * sozinha.
 *
 * Roda no **servidor**. O `required` do HTML e o `type="email"` do input são
 * conveniência para quem preenche, não garantia: a Server Action é um endpoint
 * público como qualquer outro, e recebe o que mandarem.
 */

/** Tetos de tamanho. Existem para o corpo da requisição não virar um vetor de
 * memória — a Server Action aceita `FormData` de terceiro, e nada além disto
 * limita o quanto uma pessoa escreve num `<textarea>`. */
export const LIMITS = {
  name: 120,
  org: 160,
  /** Máximo de um endereço de e-mail pela RFC 5321. */
  email: 254,
  message: 5000,
} as const;

/**
 * E-mail: deliberadamente mais estrito que a RFC. O endereço vai para o
 * `reply_to` da mensagem, então o que importa aqui não é aceitar todo endereço
 * legal do mundo — é recusar tudo que possa ser interpretado como outra coisa.
 * Sem espaço, sem vírgula, sem `<`, sem `>`, exatamente um `@`.
 */
const EMAIL = /^[^\s@,<>]+@[^\s@,<>.]+(\.[^\s@,<>.]+)+$/;

export type ContactInput = {
  name: string;
  org: string;
  email: string;
  subject: string;
  message: string;
};

export type ValidationResult =
  | { ok: true; value: ContactInput }
  | { ok: false; error: string };

/**
 * Remove quebras de linha e caracteres de controle.
 *
 * O nome e o assunto entram na **linha de assunto** do e-mail. Um `\r\n` ali é
 * injeção de cabeçalho de e-mail clássica: fecha o `Subject:` e abre um `Bcc:`
 * escolhido por quem preencheu o formulário. A API do Resend recebe JSON e
 * provavelmente já se defende, mas quem sanitiza o que entra no cabeçalho é
 * quem monta o cabeçalho.
 */
function singleLine(value: string): string {
  // Quebras de linha, tabulação, caracteres de controle C0 e DEL — escritos
  // como escapes para o próprio arquivo continuar legível.
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
}

function field(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === "string" ? value : "";
}

/**
 * @param allowedSubjects Valores de assunto que o CMS oferece hoje. Validar
 *   contra a lista real impede que o assunto vire texto livre de terceiro na
 *   linha de assunto do e-mail.
 */
export function validateContact(data: FormData, allowedSubjects: string[]): ValidationResult {
  // Campo-armadilha: invisível no formulário, então pessoa nenhuma preenche.
  // Robô de spam preenche tudo que encontra. Recusa silenciosa — devolver
  // "spam detectado" só ensinaria o robô a não cair de novo.
  if (field(data, "website").trim() !== "") {
    return { ok: false, error: "Não foi possível enviar sua mensagem." };
  }

  const name = singleLine(field(data, "name"));
  const org = singleLine(field(data, "org"));
  const email = singleLine(field(data, "email"));
  const subject = singleLine(field(data, "subject"));
  const message = field(data, "message").trim();

  if (!email) return { ok: false, error: "Informe seu e-mail." };
  if (email.length > LIMITS.email || !EMAIL.test(email)) {
    return { ok: false, error: "Esse e-mail não parece válido." };
  }

  if (!message) return { ok: false, error: "Escreva sua mensagem." };
  if (message.length > LIMITS.message) {
    return { ok: false, error: `A mensagem passa de ${LIMITS.message} caracteres.` };
  }

  if (name.length > LIMITS.name) return { ok: false, error: "O nome é longo demais." };
  if (org.length > LIMITS.org) return { ok: false, error: "A instituição é longa demais." };

  // Assunto ausente é aceitável (o `select` sempre manda um, mas um cliente
  // qualquer pode omitir); assunto **inventado**, não.
  if (subject && !allowedSubjects.includes(subject)) {
    return { ok: false, error: "Assunto inválido." };
  }

  return { ok: true, value: { name, org, email, subject, message } };
}
