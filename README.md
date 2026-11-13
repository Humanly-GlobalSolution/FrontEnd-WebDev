# Farol Amigo

## Ficha CitizenTech

- **Projeto:** Farol Amigo.
- **Equipe:** Humanly, turma 1ESPI — Bruno, Eduardo e Gustavo.
- **Disciplinas deste repositório:** Front-end Design e Web Development.
- **Responsável pelo site:** Eduardo.
- **Cidadão beneficiado:** pessoas que precisam de mais tempo ou de recursos de acessibilidade para atravessar, especialmente idosos e pessoas com deficiência.
- **Problema:** o tempo disponível em uma travessia pode ser menor que o tempo necessário ao pedestre.
- **Solução proposta:** consultar os tempos dos cruzamentos e criar, acompanhar, editar ou cancelar pedidos de revisão, sem informar nome, CPF ou telefone.
- **ODS 11, metas 11.2 e 11.7:** contribuir para mobilidade e espaços públicos seguros e acessíveis.
- **ODS 3, meta 3.6:** contribuir para reduzir mortes e ferimentos no trânsito.
- **ODS 10, meta 10.2:** favorecer a inclusão de idosos e pessoas com deficiência.

## Escopo

Este repositório conterá o site do cidadão, seguindo as telas C1 a C7 do protótipo. O firmware, a interface física do poste e o painel do operador pertencem ao trabalho de Edge e não fazem parte desta implementação.

A aplicação utilizará Next.js, React e Tailwind CSS. As rotas de API do Next.js acessarão o FIWARE Orion por NGSI-v2. O navegador não acessará o Orion diretamente.

O site consultará entidades `Cruzamento` e fará o CRUD de entidades `PedidoRevisao`. O tempo de referência para uma pessoa andando a 0,75 m/s será calculado por `largura / 0.75`, sem armazená-lo como um dado independente.

## Situação atual

Etapa 14 de 15: revisão de acessibilidade e telas pequenas, com conferência no Brave do Windows em desktop e largura simulada de 320 pixels. Inclui foco no protocolo inválido, navegação de teclado na edição e confirmação, texto ampliado e ajustes de rolagem e áreas seguras. O CRUD completo continua validado no Orion 4.5.0 local.

Consulte [o guia do Orion local](docs/orion-local.md) para comandos, atributos provisórios, rotas HTTP, testes e preparação da migração futura.

O formulário de revisão possui quatro motivos, comentário opcional de até 500 caracteres, validação e conferência das informações. No detalhe, o link “Pedir revisão do tempo” abre o formulário. A tela de conferência permite voltar e alterar os dados sem perder o preenchimento enquanto a página estiver aberta.

O detalhe possui comparação interativa entre “Hoje” e “Com o Farol Amigo”, diagrama de posições na faixa, linha de tempo e explicação textual. A página inicial tem busca por rua ou código. No modo `demo`, há cinco cruzamentos simulados; no modo `orion`, a lista é consultada no serviço configurado.

O CRUD administrativo de **cruzamentos** e o CRUD de **pedidos de revisão** funcionam no backend. No site, o cidadão pode criar, consultar, editar e cancelar seus pedidos usando o protocolo. A fonte Atkinson Hyperlegible Next é servida localmente e o botão de letra maior alterna a escala entre 100% e 125% até o próximo recarregamento.

No modo Orion, o formulário grava o pedido após a conferência e mostra o protocolo somente após a resposta de sucesso. Em caso de erro, mantém o preenchimento para nova tentativa. A mesma chave de envio recupera o registro existente, evitando duplicação se a resposta anterior se perder. Ao voltar para alterar o rascunho, uma nova chave será usada. No modo demo, o envio permanece desabilitado.

Para experimentar `/cruzamentos/C01/revisao`, cadastre primeiro C01 conforme o guia. Guarde o protocolo exibido e use “Acompanhar pedido” ou a busca em `/pedidos`; o número permite recuperar o registro mesmo após recarregar. Este projeto acadêmico grava no Orion do projeto, sem encaminhar solicitações reais à CET.

### Contrato provisório dos pedidos

`POST /api/pedidos` recebe `{ crossingCode, reason, comment }` e um cabeçalho `Idempotency-Key` com UUID v4. O formulário gera essa chave automaticamente. O tipo padrão no Orion é `PedidoRevisao`, configurável por `ORION_REQUEST_TYPE`.

Os atributos provisórios são `protocolo` (Text), `cruzamento` (Relationship com o ID do cruzamento), `codigoCruzamento`, `endereco`, `motivo`, `comentario`, `status` (Text) e `data` (DateTime). O status inicial é `enviado`. Não são coletados nome, CPF ou telefone. O endereço é uma cópia do endereço do cruzamento no momento do pedido.

O protocolo usa o formato `FA-AAMM-<32 caracteres hexadecimais>`, preservando a aleatoriedade do UUID. Seu tamanho evita depender de uma sequência curta facilmente adivinhável; guarde-o como informação de acesso ao pedido. O contrato deve ser alinhado com o Bruno antes da integração definitiva.

`GET /api/pedidos/{protocolo}` consulta diretamente a entidade identificada pelo UUID do protocolo, sem listar pedidos de outras pessoas. O protocolo armazenado deve coincidir com o informado; a busca aceita letras minúsculas e espaços nas extremidades. Formato inválido retorna 400; pedido inexistente retorna 404; status ou dados inesperados do Orion retornam erro, sem inventar andamento.

O contrato provisório de status é `enviado`, `em_analise` ou `respondido`. Os atributos opcionais `resposta` (Text), `dataAnalise` e `dataResposta` (DateTime) são exibidos quando presentes. O site não altera esses status automaticamente. Datas são apresentadas no fuso de São Paulo e nenhuma data de transição é estimada.

`PATCH /api/pedidos/{protocolo}` aceita somente `reason` e/ou `comment`. Pedidos enviados ou em análise podem ser editados; pedidos já respondidos são rejeitados com 409. O servidor consulta o status antes da operação e altera somente os atributos `motivo` e `comentario` via NGSI-v2. Protocolo, cruzamento, data de criação, status e resposta não são modificados por essa operação. Não há transação distribuída entre a consulta de status e o PATCH: a integração definitiva com o operador deverá considerar alterações simultâneas.

Na interface, consulte o protocolo e escolha “Editar pedido”. O formulário mantém os dados em caso de erro e permite voltar sem gravar. A consulta de outro pedido fica desabilitada durante a edição para evitar perder o rascunho. Após salvar, os detalhes são carregados novamente do Orion e a confirmação é exibida. O comentário é opcional e pode ser apagado; seu limite continua sendo 500 caracteres.

Para cancelar, consulte o protocolo e escolha “Cancelar pedido”. Uma janela informa a exclusão definitiva e mostra o protocolo. “Manter pedido” recebe o foco inicial e fecha a janela sem requisição de exclusão; Escape também fecha antes do envio. Durante a operação, as ações ficam bloqueadas. Erros são exibidos na janela; a confirmação e a remoção dos detalhes da tela acontecem somente após HTTP 204.

`DELETE /api/pedidos/{protocolo}` exige o cabeçalho explícito `X-Confirm-Cancel: true` e só permite cancelar pedidos enviados ou em análise. Pedidos respondidos retornam 409; confirmação ausente retorna 400; pedido inexistente retorna 404. O servidor consulta o pedido antes de chamar `DELETE /v2/entities/{id}` no Orion. Essa checagem tem a mesma limitação de concorrência da edição: não há transação distribuída com as alterações do operador. A exclusão não pode ser desfeita e consultas posteriores retornam 404; um novo pedido recebe outro protocolo.

A página de consulta usa `noindex` e política de referência `no-referrer`; a resposta da API usa `Cache-Control: no-store`. Como o protocolo pode aparecer na URL de acompanhamento, evite compartilhá-la ou publicar logs com esses endereços. Não há endpoint público para listar todos os pedidos.

O tempo de referência é `Math.ceil(largura / 0.75)`: o arredondamento para cima evita apresentar um tempo inferior ao calculado. Por exemplo, 30 m resultam em 40 s e 16 m em 22 s. Os números são uma referência do modelo acadêmico e não uma indicação de segurança para atravessar uma via real.

Na comparação, o tempo proposto é o maior entre o tempo atual e o tempo de referência, para nunca reduzir o período atual. As posições consideram velocidades constantes de 1,2 m/s e 0,75 m/s, limitadas à largura da travessia. A faixa adicional do gráfico representa a diferença até esse tempo proposto; ela não representa o teto de extensão por sensores, ainda a ser definido pelo grupo.

## Pré-requisitos e execução

- Node.js 24 LTS e npm. O Next.js utilizado exige, no mínimo, Node.js 20.9.
- Execute os comandos dentro da pasta deste projeto.

```bash
npm ci
npm run setup:local
npm run dev
```

Abra http://localhost:3000. Para parar o servidor, pressione `Ctrl+C` no terminal.

### Acompanhar as mudanças em tempo real

Mantenha `npm run dev` executando e o site aberto no navegador. O Next.js aplica as alterações automaticamente ao salvar os arquivos. Caso o terminal informe outra porta, use o endereço exibido por ele. Se já houver um servidor deste projeto em execução, reutilize-o.

Acesse http://localhost:3000/componentes para conferir a demonstração dos componentes, incluindo campos com erro e botões desabilitados ou carregando. Esta página usa exemplos e não envia nem exclui pedidos.

## Validação e produção

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

`npm start` serve o build de produção e exige que `npm run build` tenha concluído. O arquivo `package-lock.json` deve ser versionado para reproduzir a instalação. Não inclua `node_modules` nem `.next` no repositório ou ZIP.

## Configuração do FIWARE Orion

Execute `npm run setup:local` para criar `.env.local` a partir do exemplo, com endereço local e token aleatório. O comando preserva arquivos existentes. O arquivo local é ignorado pelo Git. Reinicie `npm run dev` após alterar a configuração. O Orion existente já está funcionando; não execute o Compose de referência para recriá-lo.

| Variável | Uso |
| --- | --- |
| `CROSSINGS_SOURCE` | `demo` para exemplos; `orion` para consulta externa. Sem configuração, o padrão é `demo`. |
| `ORION_BASE_URL` | Raiz do Orion, como `http://localhost:1026`, sem `/v2/entities`. Obrigatória no modo `orion`. |
| `ORION_FIWARE_SERVICE` | Cabeçalho de serviço, se o ambiente do grupo utilizar. |
| `ORION_FIWARE_SERVICEPATH` | Caminho de serviço, se utilizado pelo grupo. |
| `ORION_AUTH_TOKEN` | Token Bearer, somente se o acesso do grupo exigir esse mecanismo. |
| `ADMIN_API_TOKEN` | Token aleatório de no mínimo 32 caracteres para as rotas `/api/admin/cruzamentos`. Nunca vai ao navegador. |
| `ORION_CROSSING_TYPE` | Tipo da entidade; padrão `Cruzamento`. |
| `ORION_CODE_ATTRIBUTE` | Nome do atributo de código; padrão provisório `codigo`. |
| `ORION_ADDRESS_ATTRIBUTE` | Nome do atributo de endereço; padrão provisório `endereco`. |
| `ORION_WIDTH_ATTRIBUTE` | Nome do atributo numérico de largura em metros; padrão provisório `largura`. |
| `ORION_TIME_ATTRIBUTE` | Nome do atributo numérico de tempo em segundos; padrão provisório `tempoAtual`. |

Os nomes devem corresponder aos dados publicados pelo Edge. Confirme-os com o Bruno antes de ativar a conexão do grupo. Não use prefixo `NEXT_PUBLIC_` para essas variáveis. Na Vercel, cadastre-as no ambiente do deploy; não envie `.env.local` no ZIP.

O navegador consulta somente a API do Next.js. A API e as páginas de detalhe compartilham o serviço de servidor, protegido por `server-only`. O serviço chama `GET /v2/entities?type=Cruzamento&options=keyValues`, com paginação de 100 registros e ordenação por ID. O contrato aceita atributos simplificados ou objetos NGSI-v2 com `value`, exigindo código de até 40 caracteres alfanuméricos, hífen ou sublinhado, endereço não vazio, largura e tempo positivos. Códigos duplicados são rejeitados.

As consultas não usam cache e têm timeout de 8 segundos por página. Falhas HTTP, conexão, formato ou configuração não acionam fallback para dados demo. Mensagens da API não expõem o corpo da resposta externa nem credenciais. A fonte Orion indica dados do projeto, sem afirmar vínculo com a CET ou sinalização em tempo real.

### Falhas e recuperação

As chamadas do navegador têm limite de 20 segundos, incluindo leitura do corpo da resposta. Falhas de rede, HTML no lugar de JSON e respostas incompletas geram mensagens em português com orientação para nova tentativa. Os serviços validam os campos antes da renderização, evitando usar dados inválidos nos cálculos ou no andamento. O timeout do servidor para Orion é de 8 segundos por chamada e retorna HTTP 504 tanto para cabeçalhos quanto para corpo demorados.

Não há repetição automática de operações de escrita. Ao tentar reenviar o mesmo rascunho, a chave do formulário é mantida para recuperar o protocolo sem duplicação. Em falhas ou tempo limite de edição/cancelamento, consulte o protocolo para verificar o resultado, pois uma operação pode ter sido gravada antes da perda da resposta.

A lista vazia distingue ausência de cadastros de uma pesquisa sem resultados. O botão de recuperação da página de erro de cruzamento usa a função `retry` da versão instalada do Next.js, refazendo a consulta ao servidor.

### Acessibilidade e telas pequenas

- Link de salto para o conteúdo, rótulos associados aos campos, grupos de opções nativos e mensagens de erro/status.
- Foco direcionado ao campo de protocolo inválido; foco visível em controles, títulos de resultado e ações.
- Botão de letra maior com nome acessível estável e estado `aria-pressed`; textos e espaçamentos ampliados para 125% durante a navegação.
- Confirmação de cancelamento com foco inicial em “Manter pedido”, ciclo de Tab/Shift+Tab entre as ações, Escape antes do envio e bloqueio da rolagem ao fundo.
- Quebra de protocolos e textos longos, botões que se reorganizam em telas estreitas, margens de rolagem e CSS preparado para áreas seguras e cores forçadas.

Conferido no Brave: página inicial em desktop e 320 pixels, letra maior, protocolo longo, erro de protocolo com foco no campo, formulário de edição com navegação por teclado, retorno sem salvar, confirmação com Tab e fechamento sem exclusão. Um pedido e cruzamento temporários foram usados e removidos após a conferência; os dados originais permaneceram intactos.

Os nove pares de texto/fundo avaliados apresentaram contraste mínimo de 4,83:1 (acima do limiar de 4,5:1 usado na revisão). A conferência foi realizada no navegador desktop com emulação de largura; aparelhos físicos, leitores de tela e o modo de alto contraste do sistema não foram testados. O CSS de cores forçadas e áreas seguras foi revisado no código.

### Teste de integração local

```bash
npm run build
npm run test:http
npm run test:orion:local
npm run test:pedidos:local
node tests/orion.integration.mjs
```

`test:orion:local` testa o CRUD de cruzamentos. `test:pedidos:local` confere o CRUD completo, validações, status, datas e resposta, preservação dos demais registros, confirmação obrigatória, bloqueio de respondidos e ausência real da entidade após cancelamento. Ambos usam o Orion local real e um Next em porta temporária, recusam Orion remoto e removem somente os registros temporários que criaram. O teste `orion.integration.mjs` usa Orion simulado para conferir paginação e falhas. Os processos criados pelos testes são encerrados ao final.

`test:http` usa o executor nativo do Node.js 24 para verificar o tratamento HTTP do navegador com respostas simuladas: JSON, erro controlado, rede, resposta inválida, timeout na requisição e no corpo, cancelamento externo e exigência de HTTP 204 para confirmar exclusão. Não requer Docker. O teste de Orion simulado também verifica os dois tipos de timeout de 8 segundos.

Na configuração inicial, lint, checagem de tipos e build concluíram com sucesso. A auditoria npm não apontou vulnerabilidades de produção, mas registrou 7 avisos moderados em dependências de desenvolvimento da cadeia `typescript-eslint`/`minimatch`, ainda presentes após `npm audit fix`.

## Referências

- Protótipo: https://www.figma.com/design/nHm3SZXp7YdzztSLdtm543
- CRUD FIWARE: https://fiware-tutorials.readthedocs.io/en/latest/crud-operations.html
- DOCX de contexto, PDF do plano do site e imagens exportadas do Figma fornecidos pelo grupo na pasta superior.

## Desenvolvimento e entrega

Consulte [o plano de etapas](docs/etapas.md). Cada etapa será implementada e verificada separadamente, com uma pausa para Eduardo realizar o commit.

A entrega final exige repositório GitHub privado com pelo menos 15 commits significativos, acesso de escrita para os professores, deploy, ZIP, README e AI.md. A mesma aplicação deve ser entregue separadamente nas duas disciplinas.

## Limites do protótipo

Os cruzamentos de exemplo e os fluxos de atendimento são acadêmicos. Esta aplicação não comprova integração com sistemas reais da CET e não controla um semáforo físico. Qualquer demonstração com dados simulados deverá ser identificada na interface.
