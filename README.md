# Farol Amigo

Aplicação da **Global Solution 2026.2 — CitizenTech**, turma **1ESPI**, para as disciplinas de **Front-end Design e Web Development**.

## Ficha CitizenTech

- **Problema:** o tempo dos semáforos pode ser insuficiente para idosos e pessoas com deficiência ou mobilidade reduzida.
- **Solução:** consultar cruzamentos, simular a travessia e solicitar a revisão do tempo, acompanhando o pedido por protocolo.
- **Beneficiários:** pedestres, especialmente quem precisa de mais tempo ou de acessibilidade.
- **ODS e contribuição:** **11**, metas 11.2 e 11.7: mobilidade e espaços públicos acessíveis; **3**, meta 3.6: prevenção de mortes e ferimentos no trânsito; **10**, meta 10.2: inclusão de idosos e PcD.

Projeto acadêmico: não encaminha solicitações reais à CET nem controla semáforos físicos.

## Equipe Humanly

| Integrante | RM |
| --- | --- |
| Eduardo Bechara Medeiros Craveiro | 571081 |
| Gustavo Moita de Lima | 569180 |
| Bruno Carreiro dos Santos | 569423 |

## O que a aplicação faz

- Busca de cruzamentos por rua ou código, detalhes e mapas disponíveis.
- Comparação entre os cenários sem e com Farol Amigo, por perfil e forma de acionamento.
- CRUD de pedidos de revisão: criar, consultar, editar e cancelar, com confirmação, validação, carregamento e tratamento de erros (telas C3, C5, C6 e C7).
- Painel protegido do operador: acompanha estados, extensão e leitura dos sensores; destaca falhas e atende pedidos com análise e resposta. Atualiza os cruzamentos a cada cinco segundos na aba visível.
- Interface responsiva, fonte Atkinson Hyperlegible Next, navegação por teclado, foco visível e opção de letra maior.

## Tecnologias e organização

**React 19, Next.js 16 (App Router), TypeScript e Tailwind CSS.** O projeto utiliza mais de oito componentes reutilizáveis, `useState`, `useEffect` e os custom hooks `useCruzamentos`, `usePedido` e `useOperatorPanel`.

```text
React → rotas de API do Next.js → FIWARE Orion na Azure (NGSI-v2)
```

| Pasta | Responsabilidade |
| --- | --- |
| `src/app` | Páginas e rotas de API |
| `src/components` | Componentes visuais reutilizáveis |
| `src/hooks` | Estado, carregamento e ações das telas |
| `src/services` | Acesso à API e ao Orion |
| `src/lib` e `src/types` | Cálculos, validações e contratos TypeScript |
| `src/data` | Catálogo e exemplos identificados do modo demo |
| `tests` | Testes automatizados |

## Como executar

**Pré-requisitos:** Node.js 24 LTS, npm e acesso ao Orion do projeto. Não é necessário Docker local para usar o servidor da Azure.

Na pasta do projeto:

```bash
npm ci
npm run setup:local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). As alterações no código aparecem durante o desenvolvimento; encerre com `Ctrl+C`. Após alterar `.env.local`, reinicie o servidor.

O comando `setup:local` cria `.env.local` somente se ele não existir, usando `.env.example` e gerando os segredos necessários. Não sobrescreve configurações existentes. Para executar a versão de produção, use `npm run build` e depois `npm start`.

### Configuração do FIWARE

O servidor existente usa Orion **3.10.1**, com estas configurações em `.env.local`:

```dotenv
CROSSINGS_SOURCE=orion
ORION_URL=http://farolamigo.northcentralus.cloudapp.azure.com:1026
ORION_FIWARE_SERVICE=farolamigo
ORION_FIWARE_SERVICEPATH=/
ORION_AUTH_TOKEN=
```

O servidor do Next envia `Fiware-Service: farolamigo` e `Fiware-ServicePath: /`; consultas usam `options=keyValues` e POST/PATCH usam JSON. O Orion não exige token. `ORION_URL` é lida apenas no servidor, sem prefixo `NEXT_PUBLIC_`.

O setup também gera `ADMIN_API_TOKEN` (acesso administrativo) e `REQUEST_PROTOCOL_SECRET` (geração de protocolos e idempotência). Mantenha os segredos privados e o segredo de protocolo estável entre deploys. Nunca envie `.env.local` ao GitHub ou ao ZIP.

**Painel do operador:** abra [http://localhost:3000/painel](http://localhost:3000/painel) ou o link no rodapé. No campo “Código de acesso”, informe apenas o valor de `ADMIN_API_TOKEN` do seu `.env.local`. A sessão usa cookie HttpOnly assinado, expira em oito horas e pode ser encerrada em “Sair”. O cidadão não precisa desse código.

## CRUD e regras de acesso

| Operação | Rota do Next | Operação no Orion |
| --- | --- | --- |
| Criar pedido | `POST /api/pedidos` | `POST /v2/entities` |
| Consultar protocolo | `GET /api/pedidos/{protocolo}` | `GET /v2/entities/{id}?options=keyValues` |
| Editar pedido | `PATCH /api/pedidos/{protocolo}` | `PATCH /v2/entities/{id}/attrs` |
| Cancelar pedido | `DELETE /api/pedidos/{protocolo}` | `DELETE /v2/entities/{id}` |
| Listar pedidos | `GET /api/pedidos` | Consulta paginada, protegida por sessão do operador ou Bearer administrativo |

- **Sem login ou cookie para o cidadão:** quem tem o protocolo consegue ver, editar e cancelar o pedido em qualquer navegador, enquanto o status permitir. O protocolo funciona como chave de acesso; não comprova identidade e não deve ser compartilhado.
- Protocolos `FA-XXXX-XXXX` são gerados no servidor com oito caracteres pseudoaleatórios criptográficos, sem `0`, `O`, `1` ou `I`, nunca por data ou sequência. A chave de idempotência evita duplicar o mesmo envio.
- O pedido começa em `enviado`. O cidadão edita apenas motivo/comentário e pode cancelar após confirmação, somente em `enviado` ou `em_analise`. Pedidos `respondido` ficam bloqueados para essas ações.
- O operador pode iniciar análise e responder; o cidadão não escolhe livremente `id`, `type` ou `status`.
- Não há campos para nome, CPF, telefone ou e-mail. Comentários têm até 280 caracteres e rejeitam `< > " ' = ; ( )` no cliente e no servidor. Não inclua dados pessoais no texto livre.

**Entidades:** `Cruzamento` (`urn:ngsi-ld:Cruzamento:{codigo}`) contém `codigo`, `nome`, `largura_m`, `verde_atual_s` e a telemetria `estado`, `extensao_s`, `leitura_valida`. No servidor compartilhado, o site só lê cruzamentos. O CRUD usa `PedidoRevisao` (`urn:ngsi-ld:PedidoRevisao:{protocolo}`), com `protocolo`, `cruzamento_id`, `motivo`, `comentario`, `status`, `resposta`, `criado_em` e `atualizado_em`. Os motivos são `tempo_curto`, `falta_som`, `botao_cartao` ou `outro`; datas são ISO 8601 geradas no servidor.

## Dados e simulação

Todos os cruzamentos abaixo ficam na Av. Paulista. O tempo atual inclui **verde + vermelho piscante**, armazenado em `verde_atual_s` por compatibilidade; não somar o piscante novamente.

| Código | Cruzamento | Largura | Atual | Com Farol Amigo: adulto / idoso / PcD |
| --- | --- | ---: | ---: | --- |
| C01 | Al. Joaquim Eugênio de Lima | 30 m | 20 s | 26 / 40 / 52 s |
| C02 | Rua da Consolação | 27,40 m | 35 s | 35 / 38 / 47 s |
| C03 | Av. Rebouças | 36,96 m | 47 s | 47 / 50 / 62 s |
| C04 | Av. Brigadeiro Luís Antônio | 19,5 m | 24 s | 24 / 27 / 33 s |
| C05 | Av. Bernardino de Campos | 27,82 m | 36 s | 36 / 39 / 48 s |

C01 mantém os dados do Bruno e C04 mantém o cadastro anterior. As larguras de C02/C03/C05 foram medidas no Google Earth pelo grupo; seus tempos são **estimativas de simulação, não oficiais da CET**. C02–C05 são identificados como simulados. As referências dos marcadores estão em `src/data/crossingCatalog.ts`; C03 representa o braço da Rebouças no entroncamento Paulista/Consolação.

**Regra atual da simulação, após os ajustes solicitados pela equipe:**

1. Velocidades constantes: adulto `1,2 m/s`, idoso `0,75 m/s`, PcD/mobilidade reduzida `0,6 m/s`. Tempo necessário = `largura / velocidade`.
2. Botão, sensor e cartão usam o mesmo tempo para o perfil escolhido. A base é o tempo atual; no piloto C01, idoso e PcD têm base acessível de `max(tempo atual, ceil(largura / 0,75))`, hoje 40 s.
3. Falta = `max(0, tempo necessário - base)`. Extensão = `min(15, 3 * ceil(falta / 3))`. Total proposto = `base + extensão`. A base acessível do C01 é separada do teto de 15 s adicionais.
4. Distância = `min(largura, velocidade * tempo disponível)`. Se o total ainda não bastar, mostrar alerta simulado; usar os 15 s completos e concluir não gera alerta de insuficiência.

A simulação não mede pessoas, não grava extensões no Orion e não envia comandos nem alertas reais. O painel mostra apenas a telemetria recebida, sem inventar estados ou histórico. As velocidades são parâmetros do modelo, não garantias sobre o ritmo de uma pessoa real.

## Verificação

```bash
npm run lint
npm run build
npm run typecheck
npm run test:calculo
npm run test:http
npm run test:pedidos
npm run test:painel
node tests/orion.integration.mjs
```

Os testes cobrem cálculos, contrato NGSI-v2, CRUD, protocolos, acesso ao painel, status, paginação e falhas HTTP, usando dados isolados e broker em memória, sem escrever na Azure. Os testes opcionais `test:orion:local` e `test:pedidos:local` fazem escritas apenas em Orion local. O CRUD com escritas reais na Azure ainda depende de autorização e validação; dispositivos físicos e leitores de tela não foram testados.

## Publicação e entrega

**Publicação na Vercel pendente:** configurar as variáveis acima, `ADMIN_API_TOKEN` e `REQUEST_PROTOCOL_SECRET` no servidor da Vercel e realizar o deploy. O trecho Next → Orion continua em HTTP público e sem autenticação; HTTPS e restrição do acesso direto ao broker dependem da configuração do Bruno. A proteção do painel não protege o Orion diretamente.

Antes da entrega, conferir:

- Repositório **privado**, com pelo menos **15 commits significativos**, link correto e acesso de **escrita para os dois professores**.
- Link do site publicado e funcionando, além de README e [AI.md](AI.md) na raiz. Conferir o AI.md com a seção 3 do edital, não presente nos prints disponíveis.
- ZIP atualizado com os arquivos necessários; excluir `.git`, `.env.local`, `node_modules`, `.next`, caches e temporários.
- Envio da **mesma aplicação separadamente nas duas disciplinas**, no Microsoft Teams, incluindo link do repositório, ZIP e link do deploy.

## Referências

- [Protótipo Figma](https://www.figma.com/design/nHm3SZXp7YdzztSLdtm543)
- [Tutorial de CRUD FIWARE](https://fiware-tutorials.readthedocs.io/en/latest/crud-operations.html)
- DOCX do projeto, PDF atualizado do site e prints dos requisitos fornecidos pelo grupo; contrato oficial do Orion definido por Bruno.
- Parâmetros de velocidade fornecidos pela equipe: Duim, Lebrão e Antunes (2017) e Decreto municipal 59.670/2020. As atribuições bibliográficas/legais precisam ser conferidas nas fontes originais antes de serem usadas como fundamento.
