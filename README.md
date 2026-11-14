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
- Escolha de quem vai atravessar, com tempo garantido por cartão e ilustração da posição no fim do tempo atual.
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

Configure o Orion NGSI v2 em `.env.local`. Informe o endereço fornecido pelo grupo apenas nesse arquivo e nas variáveis da hospedagem:

```dotenv
CROSSINGS_SOURCE=orion
ORION_URL=http://localhost:1026
ORION_FIWARE_SERVICE=farolamigo
ORION_FIWARE_SERVICEPATH=/
```

O servidor do Next envia `Fiware-Service: farolamigo` e `Fiware-ServicePath: /` em todas as chamadas. Consultas usam `options=keyValues`; somente chamadas com corpo JSON (POST/PATCH) enviam `Content-Type: application/json`. O Orion rejeita esse cabeçalho em GET/DELETE. Esta exceção ao prompt foi aprovada por Eduardo após teste real no Docker. O Orion não exige token. `ORION_URL` é lida apenas no servidor, sem prefixo `NEXT_PUBLIC_`.

O setup também gera `ADMIN_API_TOKEN` (acesso administrativo) e `REQUEST_PROTOCOL_SECRET` (geração de protocolos e idempotência). Mantenha os segredos privados e o segredo de protocolo estável entre deploys. Nunca envie `.env.local` ao GitHub ou ao ZIP.

**Painel do operador:** abra [http://localhost:3000/painel](http://localhost:3000/painel) ou o link no rodapé. No campo “Código de acesso”, informe apenas o valor de `ADMIN_API_TOKEN` do seu `.env.local`. A sessão usa cookie HttpOnly assinado, expira em oito horas e pode ser encerrada em “Sair”. O cidadão não precisa desse código.

## CRUD e regras de acesso

| Operação | Rota do Next | Operação no Orion |
| --- | --- | --- |
| Criar pedido | `POST /api/pedidos` | `POST /v2/entities` |
| Consultar protocolo | `GET /api/pedidos/{protocolo}` | `GET /v2/entities/{id}?options=keyValues` |
| Editar pedido | `PATCH /api/pedidos/{protocolo}` | `POST /v2/entities/{id}/attrs` (atualiza e acrescenta perfil em pedidos antigos) |
| Cancelar pedido | `DELETE /api/pedidos/{protocolo}` | `DELETE /v2/entities/{id}` |
| Listar pedidos | `GET /api/pedidos` | Consulta paginada, protegida por sessão do operador ou Bearer administrativo |

- **Sem login ou cookie para o cidadão:** quem tem o protocolo consegue ver, editar e cancelar o pedido em qualquer navegador, enquanto o status permitir. O protocolo funciona como chave de acesso; não comprova identidade e não deve ser compartilhado.
- Protocolos `FA-XXXX-XXXX` são gerados no servidor com oito caracteres pseudoaleatórios criptográficos, sem `0`, `O`, `1` ou `I`, nunca por data ou sequência. A chave de idempotência evita duplicar o mesmo envio.
- O pedido começa em `enviado`. O cidadão edita apenas motivo/perfil/comentário e pode cancelar após confirmação, somente em `enviado` ou `em_analise`. Pedidos `respondido` ficam bloqueados para essas ações.
- O operador pode iniciar análise e responder; o cidadão não escolhe livremente `id`, `type` ou `status`.
- Não há campos para nome, CPF, telefone ou e-mail. Comentários têm até 280 caracteres e rejeitam `< > " ' = ; ( )` no cliente e no servidor. Não inclua dados pessoais no texto livre.

**Entidades:** `Cruzamento` (`urn:ngsi-ld:Cruzamento:{codigo}`) contém `codigo`, `nome`, `largura_m`, `verde_atual_s` e a telemetria `estado`, `extensao_s`, `leitura_valida`. No servidor compartilhado, o site só lê cruzamentos. O CRUD usa `PedidoRevisao` (`urn:ngsi-ld:PedidoRevisao:{protocolo}`), com `protocolo`, `cruzamento_id`, `motivo`, `perfil`, `comentario`, `status`, `resposta`, `criado_em` e `atualizado_em`. Os motivos são `tempo_curto`, `falta_som`, `botao_cartao` ou `outro`; datas são ISO 8601 geradas no servidor.

## Dados e regras dos cartões

O módulo independente `src/lib/regras.ts` concentra nomes e públicos em `CARTOES`, ritmos e constantes. Para trocar um nome de cartão na interface, altere apenas o respectivo `rotulo`.

- Pessoa idosa: 0,75 m/s, média do estudo de Duim, Lebrão e Antunes (USP, 2017), [Walking speed of older people and pedestrian crossing time](https://doi.org/10.1016/j.jth.2017.02.001).
- Pessoa com deficiência: 0,6 m/s, [Decreto municipal 59.670/2020, art. 11, II, a](https://legislacao.prefeitura.sp.gov.br/decreto-59670-de-7-de-agosto-de-2020).
- Tempo garantido = maior entre tempo cadastrado e largura/ritmo, arredondado para cima após precisão de seis casas. Nunca diminui o tempo atual (RN02/RN04).
- Falha do sensor usa o ritmo PcD: 50 s no C01 (RN05). Extensão em passos de 3 s até 15 s; referência de espera máxima 90 s. O site mostra telemetria; não altera o dispositivo.
- A comparação permite alternar Sem o Farol Amigo e Com o Farol Amigo. Sem, o cartão de tempo mostra o valor atual do cruzamento para ambos os perfis, e a ilustração usa o tempo atual (C01: 15 m para idoso, 12 m para PcD). Com, usa o tempo garantido por cartão e mostra tempo atual + acréscimo = total, com chegada ao fim da faixa em C01–C05. Se o tempo atual já basta, o acréscimo é zero. O acréscimo para a garantia do cartão é separado da extensão por sensor de até 15 s.

| Código | Cruzamento na Av. Paulista | Largura | Tempo atual | Sênior | Especial |
| --- | --- | ---: | ---: | ---: | ---: |
| C01 | Al. Joaquim Eugênio de Lima | 30 m | 20 s | 40 s | 50 s |
| C02 | Rua da Consolação | 27,4 m | 35 s | 37 s | 46 s |
| C03 | Av. Rebouças | 36,96 m | 47 s | 50 s | 62 s |
| C04 | Av. Brigadeiro Luís Antônio | 19,5 m | 24 s | 26 s | 33 s |
| C05 | Av. Bernardino de Campos | 27,82 m | 36 s | 38 s | 47 s |

Os dados exibidos vêm do Orion. As larguras de C02/C03/C05 foram medidas no Google Earth pelo grupo; os tempos são estimativas de simulação, não oficiais da CET. As referências de localização e a composição dos tempos estão em `src/data/crossingCatalog.ts`. C01 e C04 também têm mapa OpenStreetMap e botão de abertura, com coordenadas das interseções confirmadas pelo ArcGIS World Geocoding Service (StreetInt, score 100). A localização é independente dos metadados de largura e tempo. C04 mantém o cadastro anterior, cuja fonte da medição precisa ser confirmada pelo grupo; C01 usa dados fornecidos pelo Bruno.

O cadastro histórico de C02/C03/C05 guarda verde + piscante em `verde_atual_s`. O site usa esse valor integralmente: não soma novamente, não subtrai nem reescreve cruzamentos. Essa convenção deve permanecer alinhada com Bruno.

O campo `perfil` é Text e aceita `idoso`, `pcd` ou `outro`. É obrigatório nos novos pedidos; registros antigos sem ele são lidos como `outro`. Prefiro não dizer grava `outro`. A escolha segue pela URL até o formulário, sem cookie do cidadão, e pode ser editada em `enviado`/`em_analise`.

Somente C01 tem farol conectado. Sem `estado`, o painel mostra Sem farol conectado e não gera alertas nem preenche atributos ausentes. O operador usa sessão assinada em cookie HttpOnly/SameSite Strict, Secure em produção, conferida nas APIs do painel. Atualização a cada 5 s e atendimento são reaproveitados do painel existente.

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
npm run test:docker
```

Os testes cobrem cálculos, contrato NGSI-v2, CRUD, protocolos, acesso ao painel, status, paginação e falhas HTTP, usando dados isolados e broker em memória, sem escrever na Azure. `npm run test:docker` executa dois roteiros contra o Orion real em `127.0.0.1:1026`, com credenciais efêmeras de teste para o Next, sem editar `.env.local`. Requer Orion/MongoDB locais ativos e build concluído. Cria/exclui somente entidades temporárias próprias e compara os registros antes/depois. Os testes individuais `test:orion:local` e `test:pedidos:local` também aceitam apenas Orion local. O CRUD com escritas reais na Azure ainda depende de autorização e validação; dispositivos físicos e leitores de tela não foram testados.

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
- Duim, E.; Lebrão, M. L.; Antunes, J. L. F. (2017). Walking speed of older people and pedestrian crossing time. Journal of Transport & Health. DOI: 10.1016/j.jth.2017.02.001. Decreto municipal 59.670/2020, art. 11, II, a.


## Testar em cinco minutos

1. Na pasta do site, execute `npm run dev` com o `.env.local` já configurado.
2. Abra `/cruzamentos/C01`. Use Tab e as setas para alternar pessoa idosa/PcD: confira 40/50 s e 15/12 m. Teste A+.
3. Selecione PcD, peça revisão, confira o perfil e envie. Guarde o protocolo. Consulte em `/pedidos` e teste editar o perfil antes da resposta.
4. Entre em `/painel` com o código do operador. Confira C02–C05 sem farol conectado e responda ao pedido.
5. Em janela anônima, abra `/pedidos` e informe só o protocolo. Confira a resposta e o bloqueio da edição. Combine esse teste no ambiente compartilhado com Bruno para identificar o pedido de teste.

O teste automatizado de navegador está em `tests/ui.integration.mjs`, com Playwright instalado externamente (sem dependência nova no produto). Defina `PLAYWRIGHT_MODULE` para a instalação existente e execute `node tests/ui.integration.mjs` após o build. Usa portas locais livres, broker em memória e Edge headless por padrão; `PLAYWRIGHT_CHANNEL` permite usar outro navegador instalado. Cobre teclado, foco, toque, A+, perfil, atendimento, consulta sem cookies, contraste de 4,5:1 nos textos renderizados e layout móvel. Capturas em `tmp/`.
