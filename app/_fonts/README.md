# Fontes do card social

Arquivos usados **só** pelos `opengraph-image.tsx` — o `ImageResponse` do
`next/og` desenha a imagem no servidor e precisa dos bytes da fonte na mão. As
páginas do site não leem daqui: elas usam `next/font/google` em
`app/layout.tsx`, que é outro caminho.

**Por que estão commitados** em vez de buscados do Google em tempo de execução:
gerar o card passaria a depender de uma requisição externa a cada build ou a
cada primeira visita de uma notícia. É o risco registrado no ADR 0005 e no
plano — e a CSP do site tem `font-src 'self'`, coerente com a mesma ideia.

A pasta começa com `_` porque o App Router trata pastas assim como privadas:
nada aqui vira rota.

| Arquivo | Origem |
|---|---|
| `Fraunces-Regular.ttf` | Google Fonts, Fraunces v38, `opsz 144`, peso 400 |
| `Fraunces-SemiBold.ttf` | Google Fonts, Fraunces v38, `opsz 144`, peso 600 |
| `JetBrainsMono-Regular.ttf` | Google Fonts, JetBrains Mono v24, peso 400 |

São instâncias estáticas (não os arquivos variáveis): o `satori`, que é quem
converte o JSX em imagem, usa a instância padrão de uma fonte variável e
ignoraria os eixos — `opsz 144` é justamente o que dá à Fraunces o desenho de
display que o site usa nos títulos.

Ambas as famílias são SIL Open Font License 1.1.
