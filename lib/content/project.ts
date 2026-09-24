import type { Project, ProjectCard } from "./types";

/**
 * O que se deriva de um Projeto para exibir.
 *
 * Funções puras, fora do adaptador: o CMS guarda bioma, responsável, período e
 * financiador como campos separados — o formato em que eles aparecem é decisão
 * de apresentação, e muda conforme a tela (etiquetas no cartão, ficha na
 * página).
 */

export type ProjectPin = { label: string; warm?: boolean };

/**
 * O período em uma linha. `2019—2025` quando terminou, `2024 →` enquanto
 * corre — a mesma forma que as etiquetas antigas traziam escrita à mão, agora
 * derivada de dois campos.
 */
export function projectPeriod(project: Pick<Project, "periodoInicio" | "periodoFim">): string | undefined {
  const { periodoInicio: inicio, periodoFim: fim } = project;

  if (inicio && fim) return `${inicio}—${fim}`;
  if (inicio) return `${inicio} →`;
  if (fim) return `até ${fim}`;
  return undefined;
}

/**
 * As etiquetas do cartão, na ordem em que sempre estiveram: bioma em destaque,
 * responsável, período, financiador. Campo vazio não vira etiqueta vazia — some.
 */
export function projectPins(project: ProjectCard | Project): ProjectPin[] {
  return [
    { label: project.bioma, warm: true },
    { label: project.responsavel },
    { label: projectPeriod(project) },
    { label: project.financiador },
  ].filter((pin): pin is ProjectPin => Boolean(pin.label));
}
