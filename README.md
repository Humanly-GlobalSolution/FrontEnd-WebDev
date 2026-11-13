# Farol Amigo

Site do cidadão do projeto CitizenTech, para **Front-end Design e Web Development**, turma **1ESPI**.

## Equipe Humanly

| Integrante | RM |
| --- | --- |
| Eduardo Bechara Medeiros Craveiro | 571081 |
| Gustavo Moita de Lima | 569180 |
| Bruno Carreiro dos Santos | 569423 |

Eduardo é responsável por esta implementação de Front-end e Web Development.

## Ficha CitizenTech

- **Problema:** o tempo de uma travessia pode ser insuficiente para quem precisa caminhar mais devagar, especialmente idosos e pessoas com deficiência.
- **Solução:** consultar cruzamentos e tempos, comparar a travessia e criar, acompanhar, editar ou cancelar pedidos de revisão.
- **Beneficiários:** pedestres que precisam de mais tempo ou de recursos de acessibilidade.
- **ODS:** 11 (metas 11.2 e 11.7), 3 (meta 3.6) e 10 (meta 10.2), relacionados à mobilidade segura e à inclusão.

Projeto acadêmico: não encaminha solicitações reais à CET nem controla semáforos físicos. Firmware, interface do poste e painel Edge estão fora deste repositório.

## Funcionalidades e arquitetura

Busca por rua ou código, detalhe do cruzamento, comparação de tempos, formulário com conferência, protocolo e CRUD completo de pedidos persistido no FIWARE Orion por NGSI-v2. O backend também oferece CRUD administrativo de cruzamentos protegido por token.

Next.js com App Router, React, TypeScript e Tailwind CSS. O navegador acessa a API do Next; somente o servidor acessa o Orion. Credenciais não usam prefixo `NEXT_PUBLIC_`.

| Pasta | Responsabilidade |
| --- | --- |
| `src/app` | Páginas e rotas HTTP |
| `src/components` | Componentes de apresentação reutilizáveis |
| `src/hooks` | Estado e carregamento: `useCruzamentos` e `usePedido` |
| `src/lib` | Cálculos, validação e utilitários HTTP |
| `src/services` | Comunicação com a API e com Orion |
| `src/types` | Contratos TypeScript |
| `src/data` | Exemplos identificados do modo demo |
| `tests` | Verificações de HTTP e integração |

Há mais de oito componentes e uso de `useState` e `useEffect`. A referência de travessia é `Math.ceil(largura / 0.75)`; o cenário proposto nunca reduz o tempo atual. É uma comparação acadêmica, sem decisão automática sobre sinalização.

## Executar no computador

Pré-requisitos: Node.js **24 LTS**, npm e o Orion local ativo. O ambiente utilizado é Orion **4.5.0**, MongoDB **4.4**, endereço `http://localhost:1026`.

Na pasta do projeto:

```powershell
npm ci
npm run setup:local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). O modo de desenvolvimento usa Webpack para contornar a instabilidade de recarregamento observada com Turbopack neste ambiente local. As mudanças nos arquivos aparecem durante o desenvolvimento. Mantenha o terminal aberto; encerre com Ctrl+C. Alterações em `.env.local` exigem reiniciar o servidor.

`setup:local` cria `.env.local` somente se ausente, com conexão local e token administrativo aleatório. Não sobrescreve o arquivo existente nem imprime o token. O arquivo não deve entrar no Git ou no ZIP.

**Não recrie os contêineres já funcionando.** O `docker-compose.yml` é uma referência opcional para um ambiente novo. Instruções de conexão, cadastro de exemplos e CRUD estão em [docs/orion-local.md](docs/orion-local.md).

Uma lista vazia significa que ainda não há cruzamentos cadastrados. Para testar pela interface, cadastre um cruzamento usando o guia, atualize a página, abra seu detalhe e escolha “Pedir revisão do tempo”. Guarde o protocolo para consultar, editar e cancelar o pedido.

Para executar a compilação de produção:

```powershell
npm run build
npm start
```

## Configuração

Copie os nomes das variáveis de `.env.example`; configure os valores somente no ambiente de execução.

| Variável | Uso |
| --- | --- |
| `CROSSINGS_SOURCE` | `orion` para integração; `demo` para exemplos identificados, sem envio de pedidos. Sem configuração, usa `demo`. |
| `ORION_BASE_URL` | Raiz do Orion, sem `/v2/entities`. Local: `http://localhost:1026`. |
| `ORION_FIWARE_SERVICE`, `ORION_FIWARE_SERVICEPATH` | Cabeçalhos opcionais; devem coincidir com o contexto dos dados do grupo. |
| `ORION_AUTH_TOKEN` | Bearer do gateway Orion, quando necessário. |
| `ADMIN_API_TOKEN` | Token administrativo de pelo menos 32 caracteres, exclusivo do servidor. |
| `ORION_CROSSING_TYPE` | Tipo provisório `Cruzamento`. |
| `ORION_CODE_ATTRIBUTE` | Atributo provisório `codigo`. |
| `ORION_ADDRESS_ATTRIBUTE` | Atributo provisório `endereco`. |
| `ORION_WIDTH_ATTRIBUTE` | Atributo provisório `largura`, em metros. |
| `ORION_TIME_ATTRIBUTE` | Atributo provisório `tempoAtual`, em segundos. |
| `ORION_REQUEST_TYPE` | Tipo provisório `PedidoRevisao`. |

O contrato aguarda a definição oficial do Bruno. O CRUD de cruzamentos, seus limites e exemplos NGSI-v2 estão no guia local. A integração aceita atributos NGSI-v2 com `value` e respostas `keyValues`.

## Pedidos de revisão: contrato provisório

| Método e rota | Comportamento |
| --- | --- |
| `POST /api/pedidos` | Recebe `{ crossingCode, reason, comment }` e `Idempotency-Key` UUID v4; cria ou recupera o mesmo envio. |
| `GET /api/pedidos/{protocolo}` | Consulta um pedido pelo protocolo completo. |
| `PATCH /api/pedidos/{protocolo}` | Altera somente `reason` e/ou `comment`, preservando os demais atributos. |
| `DELETE /api/pedidos/{protocolo}` | Exige `X-Confirm-Cancel: true` e exclui definitivamente; sucesso HTTP 204. |

O formulário gera a chave de envio. Há quatro motivos e comentário opcional de até 500 caracteres, com orientação para não informar dados pessoais. Não são coletados nome, CPF ou telefone.

Atributos Orion: `protocolo`, `cruzamento` (Relationship), `codigoCruzamento`, `endereco`, `motivo`, `comentario`, `status` (Text) e `data` (DateTime). `endereco` registra o endereço no momento da criação. O status inicial é `enviado`; também são aceitos `em_analise` e `respondido`, com `resposta`, `dataAnalise` e `dataResposta` opcionais. O site não inventa andamento nem altera status automaticamente. Datas são exibidas no fuso de São Paulo.

O protocolo `FA-AAMM-<32 caracteres hexadecimais>` permite acessar o pedido: guarde-o e evite compartilhar a URL. Não há listagem pública de pedidos. Consulta usa `noindex`, `no-referrer` e respostas sem cache. Formato inválido retorna 400; inexistência, 404; edição ou cancelamento de respondidos, 409.

Edição e cancelamento conferem o status antes da escrita. Não há transação distribuída com o painel do operador; alterações simultâneas precisarão ser consideradas na integração definitiva.

## Erros e acessibilidade

Falhas do Orion não acionam fallback para dados demo. Há mensagens de carregamento, lista vazia, erro e recuperação. Requisições têm limites de 8 segundos no servidor e 20 segundos no navegador, incluindo o corpo. Escritas não são repetidas automaticamente. Se uma resposta de edição ou exclusão se perder, consulte o protocolo para conferir o resultado.

Fonte Atkinson Hyperlegible Next servida localmente, link de salto, rótulos associados, foco visível, mensagens de status e opção de letra maior (125%, até recarregar). A confirmação de exclusão inicia em “Manter pedido”, mantém o foco entre ações e permite Escape antes do envio.

Foram conferidos desktop e largura simulada de 320 pixels no Brave, letra maior e navegação por teclado. Os nove pares de contraste avaliados tiveram mínimo de 4,83:1. Aparelhos físicos, leitores de tela e alto contraste do sistema não foram testados; não se declara certificação de acessibilidade.

## Verificar

```powershell
npm run lint
npm run build
npm run typecheck
npm run test:http
npm run test:orion:local
npm run test:pedidos:local
node tests/orion.integration.mjs
```

Os testes locais exigem build atualizado e Orion ativo. Criam instâncias temporárias do Next, verificam persistência diretamente no Orion e removem somente seus próprios registros. Recusam Orion remoto e não encerram o servidor de desenvolvimento. O teste de pedidos cobre criação, consulta, edição, exclusão, validações, idempotência, status, datas e bloqueio de respondidos. Os testes HTTP e de Orion simulado cobrem respostas inválidas, falhas, paginação e timeout, sem Docker.

## Preparação para Azure

Nenhuma implantação foi realizada. A conexão muda por variáveis de ambiente, sem reescrever os serviços. Para Next na mesma rede Docker do Orion, use o nome real do serviço, como `http://orion:1026`; `localhost` no contêiner aponta para ele próprio.

`Dockerfile` e Compose permitem reproduzir um ambiente novo. `infra/azure/` contém referência ainda não validada em VM: gateway Caddy com HTTPS e Bearer, redes internas e MongoDB sem porta pública. Configure domínio, tokens e imagem Mongo compatível com suporte de segurança antes de usar. Não exponha 1026 ou 27017 na Internet. Na hospedagem do Next, configure o endereço HTTPS do gateway e suas credenciais. Veja o guia local para detalhes.

## Entrega acadêmica

A entrega exige repositório privado com ao menos 15 commits significativos, permissão de escrita para os professores, URL publicada, README, AI.md e ZIP. A mesma aplicação deve ser entregue separadamente nas duas disciplinas.

O código e as instruções estão preparados para execução local. Repositório, acessos dos professores, publicação e URL final permanecem pendentes. A seção 3 específica de instruções para `AI.md` não foi fornecida; o arquivo registra o uso real das ferramentas e verificações realizadas.

O ZIP de código-fonte exclui `.git`, `.env.local`, dependências, build, caches, logs e temporários. Quem recebê-lo deve executar os comandos de instalação e configuração acima. O histórico de commits fica no repositório Git, não no ZIP.

## Referências

- [Protótipo Figma](https://www.figma.com/design/nHm3SZXp7YdzztSLdtm543)
- [Tutorial oficial de CRUD FIWARE](https://fiware-tutorials.readthedocs.io/en/latest/crud-operations.html)
- DOCX, PDF e prints fornecidos pelo grupo.
- [Registro de uso de IA](AI.md)
