# Prompt para o agente de IA do site Farol Amigo (Front-end e Web Dev)

> Cole tudo abaixo na IA que você usa no projeto, com a pasta do site aberta.
> Não cole o endereço do servidor, tokens nem senhas aqui: eles ficam só no `.env.local` e nas variáveis da Vercel.

---

## Papel

Você é um engenheiro de software sênior trabalhando no site do projeto **Farol Amigo** (Global Solution FIAP 2026.2, Time Humanly). O site é em **Next.js + Tailwind** e usa o **FIWARE Orion (NGSI v2)** como API real, chamado **só pelo servidor do Next** (rotas de API), nunca direto pelo navegador.

Trabalhe em etapas pequenas, sem quebrar o que já funciona. **Antes de mudar qualquer arquivo**, leia o projeto e me devolva um diagnóstico curto (etapa 0). Se algo deste prompt contradizer o código de um jeito que você não consegue resolver sozinho, pare e pergunte.

## Contexto do produto

O Farol Amigo é um semáforo que espera quem atravessa devagar. O site tem duas áreas:

1. **Área do cidadão (já existe):** a pessoa escolhe um cruzamento, vê o tempo do farol e faz o CRUD de um pedido de revisão do tempo (criar, ler, editar, cancelar), sem login. O acesso ao pedido é **só pelo protocolo**, sem cookie.
2. **Painel do operador (novo, protegido):** mostra o estado de cada cruzamento, os alertas e os pedidos, e deixa o operador responder.

## O que mudou no projeto (decisões do grupo de 13 e 14/11)

1. **Dois cartões, dois ritmos (RN04).** O farol agora diferencia quem atravessa pelo tipo de cartão:
   - Pessoa idosa, **Bilhete Único Sênior**: ritmo de **0,75 m/s** (média medida pela USP em idosos de SP).
   - Pessoa com deficiência, **Bilhete Único Especial**: ritmo de **0,6 m/s** (Decreto municipal 59.670/2020, art. 11, II, a).
   - Tempo garantido = **o maior** entre o verde de hoje do cruzamento e `largura ÷ ritmo`, arredondado para cima. Nunca diminui o verde de hoje (RN02).
   - Na Av. Paulista (C01, 30 m): **40 s** com o Sênior e **50 s** com o Especial.
2. **Falha do sensor (RN05):** o ciclo fixo passou de 40 s para **50 s** (ritmo da PcD), porque sem o sensor o farol não sabe quem está na faixa.
3. **O painel do operador fica dentro deste site**, numa área protegida.
4. **Cruzamentos novos na Paulista (C02 a C05)** já estão no Orion. **Só o C01 tem farol conectado.**
5. Os nomes "Sênior" e "Especial" **podem mudar** (os nomes oficiais da SPTrans são "Bilhete Único Especial da Pessoa Idosa" e "Bilhete Único da Pessoa com Deficiência"). Por isso, **todo texto com nome de cartão deve vir de uma constante única**, para a troca ser de uma linha.

## Contrato do FIWARE (não mude nomes nem tipos)

Cabeçalhos em toda chamada: `Fiware-Service: farolamigo`, `Fiware-ServicePath: /`, `Content-Type: application/json`. Sem token no Orion. O endereço vem de `ORION_URL` (variável **só do servidor**, nunca `NEXT_PUBLIC_`).

**Cruzamento** — id `urn:ngsi-ld:Cruzamento:{codigo}`, type `Cruzamento`

| Atributo | Tipo | Observação |
|---|---|---|
| codigo | Text | C01 a C05 |
| nome | Text | |
| largura_m | Number | |
| verde_atual_s | Number | |
| estado | Text | **Só existe nos cruzamentos com farol (hoje só o C01).** VERDE_CARROS, PEDIDO, VERDE_PEDESTRE, TEMPO_ESTENDIDO ou FALHA |
| extensao_s | Number | Só com farol. Múltiplo de 3, de 0 a 15 |
| leitura_valida | Boolean | Só com farol |

**PedidoRevisao** — id `urn:ngsi-ld:PedidoRevisao:{protocolo}`, type `PedidoRevisao`

| Atributo | Tipo | Regra |
|---|---|---|
| protocolo | Text | `FA-XXXX-XXXX`, 8 caracteres aleatórios sem 0/O/1/I, gerado no servidor |
| cruzamento_id | Text | Ex.: `C01` |
| motivo | Text | `tempo_curto`, `falta_som`, `botao_cartao` ou `outro` |
| **perfil** | Text | **NOVO.** `idoso`, `pcd` ou `outro`. Obrigatório nos pedidos novos. Pedido antigo sem o campo é lido como `outro` |
| comentario | Text | Opcional, até 280 caracteres |
| status | Text | `enviado`, `em_analise` ou `respondido` |
| resposta | Text | Escrita só pelo operador |
| criado_em, atualizado_em | DateTime | |

Regras: o cidadão só edita **motivo, perfil e comentário**, e só com status `enviado` ou `em_analise`. O Orion recusa os caracteres `< > " ' = ; ( )` em textos: valide no servidor e mostre uma mensagem clara antes de enviar. O Orion não tem esquema fixo, então **não precisa mudar nada no servidor**: o campo `perfil` passa a existir quando o site gravar.

## Tarefas

### Etapa 0 · Diagnóstico (sem alterar nada)

Leia a pasta do projeto e me responda, em até 15 linhas:
- onde está hoje o cálculo do tempo (procure `0.75`, `Math.ceil`, `40`);
- quais telas e rotas de API existem e onde ficam o `.env.local` e o `.gitignore`;
- o que já existe do painel do operador e do `ADMIN_API_TOKEN`;
- para que serve o `REQUEST_PROTOCOL_SECRET`. Se ele criar um cookie de acesso ao pedido, isso contradiz a regra "só o protocolo" e precisa sair.

### Etapa 1 · Regras num lugar só

Crie um módulo único de regras (por exemplo `lib/regras.ts`), sem dependência de tela, com:

```ts
export const CARTOES = {
  senior:   { perfil: "idoso", ritmo: 0.75, rotulo: "Bilhete Único Sênior",   publico: "Pessoa idosa" },
  especial: { perfil: "pcd",   ritmo: 0.6,  rotulo: "Bilhete Único Especial", publico: "Pessoa com deficiência" },
} as const;

export const PASSO_EXTENSAO_S = 3;
export const TETO_EXTENSAO_S = 15;
export const ESPERA_MAXIMA_S = 90;

// toFixed(6) evita o erro de ponto flutuante: 27.6 / 0.6 = 46.00000000000001 viraria 47 s.
export function tempoNecessario(largura: number, ritmo: number): number {
  return Math.ceil(Number((largura / ritmo).toFixed(6)));
}
export function tempoGarantido(largura: number, verdeAtual: number, tipo: keyof typeof CARTOES): number {
  return Math.max(verdeAtual, tempoNecessario(largura, CARTOES[tipo].ritmo));
}
export function tempoFalhaSensor(largura: number, verdeAtual: number): number {
  return tempoGarantido(largura, verdeAtual, "especial");
}
export function ondeParaNoFimDoVerde(largura: number, verdeAtual: number, ritmo: number): number {
  return Math.min(largura, ritmo * verdeAtual);
}
```

Troque **todo** cálculo espalhado pelo site (incluindo o `Math.ceil(largura_m / 0.75)` antigo) por essas funções.

### Etapa 2 · Escolha de quem vai atravessar (área do cidadão)

No detalhe do cruzamento (tela C2), coloque uma escolha com duas opções: **"Pessoa idosa"** e **"Pessoa com deficiência"**.
- Use um grupo de botões de opção (radiogroup), com rótulo visível, foco de teclado visível e área de toque de no mínimo 44 × 44 px. Comece com "Pessoa idosa" marcada.
- Ao trocar a opção, atualize na hora:
  - o cartão de tempo: "Com o Bilhete Único Sênior, você tem **40 s**." / "Com o Bilhete Único Especial, você tem **50 s**." (os nomes vêm de `CARTOES`);
  - a ilustração da travessia: onde a pessoa está no fim do verde (`ondeParaNoFimDoVerde`). No C01: idoso 15 m (canteiro), PcD 12 m;
  - um texto para leitor de tela, com `aria-live="polite"`, anunciando o novo tempo.
- No fluxo do pedido (tela C3), o **perfil já vem preenchido** com a escolha da C2, e a pessoa pode mudar. O pedido é gravado com `perfil` = `idoso` ou `pcd`. A opção "Prefiro não dizer" grava `outro`.
- Nas telas de acompanhar (C5) e editar (C6), mostre e permita editar o perfil, com as mesmas regras de status do motivo.

### Etapa 3 · Painel do operador (área protegida)

- Rota separada (por exemplo `/painel`). O operador digita um **código de acesso**, e uma rota de API confere o código com `ADMIN_API_TOKEN` **no servidor**. Se der certo, a sessão do operador fica num cookie `httpOnly`, `secure` e `sameSite=strict`. Esse cookie é só do operador: o cidadão continua sem login.
- Toda rota de API do painel confere a sessão no servidor. Sem sessão, responde 401.
- **Cruzamentos:** liste os 5, com nome, largura e verde de hoje, atualizando a cada 5 s.
  - Se o cruzamento **tem** `estado`: mostre o estado com texto e cor (Verde dos carros, Pedido, Verde do pedestre, Tempo estendido, Falha), a extensão e se a leitura do sensor é válida.
  - Se **não tem** `estado`: mostre **"Sem farol conectado"** e não gere alerta. Não invente valores para esses campos e não grave nada no Orion para "preencher".
- **Alertas:** `estado = FALHA` → "Sensor com leitura impossível. Ciclo fixo de 50 s ativo." `extensao_s = 15` → "Tempo extra chegou ao teto de 15 s." Os alertas não podem depender só da cor: use texto e ícone.
- **Pedidos:** liste todos, com protocolo, cruzamento, perfil, motivo e status. O operador muda o status para `em_analise` ou `respondido` e escreve a `resposta` (valide os caracteres proibidos). Depois de `respondido`, a área do cidadão mostra a resposta e não deixa mais editar.

### Etapa 4 · Textos e consistência

Procure e troque no site inteiro:
- "Bilhete Único Especial/Sênior" e "Especial ou Sênior" → textos montados a partir de `CARTOES`;
- "40 s" fixo → valor calculado por cruzamento e cartão;
- ciclo fixo de 40 s → 50 s.

O tom é calmo, acolhedor e direto, com "você", frases curtas, sem pressa e sem termos técnicos na área do cidadão. Exemplos:

| Lugar | Texto |
|---|---|
| Título da escolha | Quem vai atravessar? |
| Opções | Pessoa idosa · Pessoa com deficiência |
| Opção extra no pedido | Prefiro não dizer |
| Cartão de tempo | Com o Bilhete Único Sênior, você tem 40 s para atravessar. |
| Ajuda | É só encostar o cartão no poste antes de atravessar. |
| Painel, sem farol | Sem farol conectado |
| Painel, código errado | Código de acesso incorreto. Confira e tente de novo. |
| Erro de caractere | O comentário não pode ter estes símbolos: < > " ' = ; ( ) |

### Etapa 5 · Testes (obrigatórios antes de dizer que terminou)

**Testes de unidade das regras.** Todos precisam passar:

| Função | Entrada | Esperado |
|---|---|---|
| tempoNecessario | 30 m, 0,75 | 40 |
| tempoNecessario | 30 m, 0,6 | 50 |
| tempoNecessario | 27,6 m, 0,6 | **46** (sem o `toFixed`, dá 47) |
| tempoNecessario | 36,96 m, 0,6 | 62 |
| tempoGarantido | C01: 30 m, verde 20 | Sênior 40, Especial 50 |
| tempoGarantido | C02 Consolação: 27,4 m, verde 35 | Sênior 37, Especial 46 |
| tempoGarantido | C03 Rebouças: 36,96 m, verde 47 | Sênior 50, Especial 62 |
| tempoGarantido | C04 Brigadeiro: 19,5 m, verde 24 | Sênior 26, Especial 33 |
| tempoGarantido | C05 Bernardino: 27,82 m, verde 36 | Sênior 38, Especial 47 |
| tempoGarantido | 10 m, verde 30 | 30 nos dois (nunca diminui o verde) |
| tempoFalhaSensor | C01 | 50 |
| ondeParaNoFimDoVerde | C01, 0,75 / 0,6 | 15 / 12 |

**Testes das rotas de API (integração com o Orion local em Docker):**
- criar pedido com `perfil: "pcd"` grava o campo e o lê de volta;
- criar sem `perfil`, ou com valor fora da lista, devolve 400;
- ler um pedido antigo sem `perfil` devolve `outro`;
- editar o perfil com status `respondido` devolve 409 (ou o código que o projeto já usa para essa regra);
- rotas do painel sem sessão devolvem 401, e com código errado não criam sessão;
- comentário com `<` devolve 400 com a mensagem clara.

**Testes de tela e acessibilidade:**
- trocar entre "Pessoa idosa" e "Pessoa com deficiência" muda o tempo de 40 para 50 s no C01, só com o teclado;
- o painel mostra "Sem farol conectado" no C02 a C05, não mostra "undefined" e não quebra;
- contraste mínimo de 4,5:1 nos textos, foco visível e o botão "A+" continuam funcionando.

**Teste manual de ponta a ponta (com o servidor do Bruno):** criar um pedido PcD no site → conferir no Orion que `perfil = "pcd"` → responder pelo painel → ver a resposta na área do cidadão numa janela anônima, só com o protocolo.

### Etapa 6 · Documentação

- **README:** acrescente a regra dos dois cartões, com as fontes (USP, 0,75 m/s; Decreto 59.670/2020, art. 11, II, 0,6 m/s), o campo `perfil`, o painel protegido e de onde vêm a largura e o verde de cada cruzamento (C02 a C05).
- **AI.md:** registre este prompt e o que a IA fez, sugeriu ou mudou, e como o grupo testou.
- Confira que `.env.local` está no `.gitignore` e que nenhum segredo aparece no código, nos commits ou no README.

## Restrições

- Não mude nomes de entidades, atributos, cabeçalhos nem o formato do protocolo.
- Não chame o Orion pelo navegador. Não use `NEXT_PUBLIC_` para `ORION_URL`, `ADMIN_API_TOKEN` ou `REQUEST_PROTOCOL_SECRET`.
- Não adicione bibliotecas pesadas: o que o projeto já usa é suficiente.
- Não crie login nem cadastro para o cidadão. Não grave nome, CPF, telefone ou e-mail.
- Não apague nem reescreva dados de outros cruzamentos ou pedidos no Orion. Para testar, use o Orion local.

## O que me entregar no fim

1. Lista dos arquivos alterados, com uma linha sobre cada mudança.
2. Resultado dos testes (quantos passaram).
3. O que ficou pendente ou depende de decisão do grupo.
4. Os passos para eu testar sozinho em 5 minutos.
