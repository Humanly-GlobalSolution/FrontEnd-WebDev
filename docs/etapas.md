#code Etapas de desenvolvimento

## Forma de trabalho

Implementar uma etapa por vez, verificar o resultado e parar para Eduardo revisar e realizar o commit. As mensagens abaixo são sugestões. Não criar commits automaticamente nem avançar para a etapa seguinte antes da confirmação do usuário.

| Etapa | Entrega verificável | Mensagem sugerida |
| --- | --- | --- |
| 1 | Escopo, requisitos, sequência de desenvolvimento e registro inicial de IA | `docs: definir escopo e etapas do Farol Amigo` |
| 2 | Next.js, TypeScript, Tailwind e comandos de desenvolvimento e validação | `chore: configurar Next.js e Tailwind` |
| 3 | Cores, fonte, layout responsivo, marca e cabeçalho acessível | `feat: criar identidade visual e estrutura do site` |
| 4 | Componentes reutilizáveis de botão, campo, status e cartões | `feat: adicionar componentes de interface` |
| 5 | Tipos, regras de tempo, dados de demonstração identificados e busca de cruzamentos | `feat: listar e buscar cruzamentos` |
| 6 | Detalhe do cruzamento e comparação visual dos tempos de travessia | `feat: comparar tempos de travessia` |
| 7 | Formulário de pedido, motivos, validação e progresso | `feat: criar formulario de revisao` |
| 8 | Integração NGSI-v2, configuração local e CRUD administrativo de cruzamentos com testes reais no Orion | `feat: integrar CRUD de cruzamentos ao Orion local` |
| 9 | Criação real de pedido, protocolo e confirmação, com hook de pedidos | `feat: registrar pedidos de revisao no Orion` |
| 10 | Consulta por protocolo, detalhes e andamento do pedido | `feat: consultar andamento dos pedidos` |
| 11 | Edição real de motivo e comentário | `feat: editar pedidos de revisao` |
| 12 | Cancelamento com confirmação e exclusão real | `feat: cancelar pedidos com confirmacao` |
| 13 | Estados de carregamento, erro, vazio e recuperação nas operações | `fix: tratar falhas e estados das consultas` |
| 14 | Revisão de teclado, foco, letra maior, celular e fluxos completos | `fix: aprimorar acessibilidade e responsividade` |
| 15 | README e AI.md finais, configuração de deploy e preparação do ZIP | `docs: preparar documentacao e entrega final` |

As etapas poderão ser ajustadas conforme os testes, preservando pelo menos 15 commits com mudanças reais. Atualizações de documentação e evidências de verificação acompanham a etapa correspondente.

Antes de qualquer publicação ou preparação da entrega final, revisar e remover arquivos, páginas de demonstração, pastas e código sem uso que não sejam exigidos pelo professor nem necessários à execução. Repetir as validações após a limpeza, conforme solicitação de Eduardo.

## Requisitos de aceite

- React com Next.js e estilização Tailwind CSS.
- Pelo menos 8 componentes React organizados e reutilizáveis.
- Uso de `useState` e `useEffect`.
- Pelo menos 2 hooks personalizados: `useCruzamentos` e `usePedido`.
- Separação entre apresentação, regras de negócio e acesso aos dados.
- CRUD completo persistido em uma API externa FIWARE Orion; dados em memória ou localStorage não substituem esse requisito.
- Telas do cidadão conforme o Figma, com adaptação para computador e celular.
- Busca por rua ou código do poste; consulta de pedido por protocolo.
- Edição do motivo e comentário; confirmação antes da exclusão.
- Sem campos para nome, CPF ou telefone; orientação para não incluir dados pessoais no comentário.
- Feedback de carregamento, sucesso, ausência de resultado e erro.
- Navegação por teclado, rótulos de formulário, foco visível e opção de letra maior.
- README com Ficha CitizenTech, pré-requisitos, instalação e execução.
- AI.md verdadeiro com ferramentas, prompts, uso dos resultados e validações.
- Repositório privado, histórico de commits, deploy e ZIP entregues nas duas disciplinas.

## Estrutura prevista

- `src/app/`: páginas e rotas de API do Next.js.
- `src/components/`: componentes de apresentação.
- `src/hooks/`: carregamento e gerenciamento de estado da interface.
- `src/services/`: comunicação HTTP e acesso ao Orion no servidor.
- `src/lib/`: regras de tempo, validações e funções compartilhadas.
- `src/types/`: contratos dos cruzamentos e pedidos.

As cores de referência são asfalto `#1F2328`, amarelo `#FFC21A`, verde `#12B76A` e vermelho `#D92D20`. A fonte prevista é Atkinson Hyperlegible Next. Ajustar os pares de cor quando necessário para garantir legibilidade.

## Contrato inicial de dados

- `Cruzamento`: código, endereço, largura em metros e tempo atual em segundos. Somente leitura pelo cidadão.
- Por solicitação posterior de Eduardo, o backend também permite CRUD administrativo de `Cruzamento` por rotas protegidas. A interface do cidadão preserva a consulta; o CRUD dos pedidos permanece nas etapas 9 a 12.
- `PedidoRevisao`: protocolo, referência ao cruzamento, motivo, comentário opcional, status e data.
- Criação: `POST /v2/entities`.
- Consulta: `GET /v2/entities` ou `GET /v2/entities/{id}`.
- Edição: `PATCH /v2/entities/{id}/attrs`.
- Cancelamento: `DELETE /v2/entities/{id}`.

Os nomes exatos dos atributos, IDs e eventuais cabeçalhos de serviço precisam corresponder ao Orion do grupo. Não presumir que o protocolo visível é o ID completo da entidade.

## Dependências a resolver antes da integração final

- Endereço de produção do Orion para a futura Azure e sua autenticação; o ambiente local já foi conectado e testado em `http://localhost:1026`.
- Contrato das entidades `Cruzamento` compartilhadas com o Edge.
- Dados de cinco cruzamentos de exemplo, identificados como simulados.
- Nomes completos e RMs dos integrantes para completar a documentação.
- Repositório privado, identificação dos professores e projeto de deploy.
- Requisitos da seção 3 sobre AI.md, citada nos prints e não incluída nos materiais recebidos.

## Decisões sobre divergências dos materiais

O PDF menciona Supabase em dois itens do cronograma, mas define FIWARE Orion na arquitetura e nas operações. O DOCX atualizado também determina Orion. A implementação seguirá FIWARE Orion.

O teto de tempo extra é provisório e pertence ao modelo definido pelo grupo. O site não deve apresentar 15 segundos como decisão final nem implementar controle de tráfego.

O protótipo exemplifica um andamento do pedido. O site deve exibir o status efetivamente recebido da API, sem inventar que a CET iniciou ou concluiu uma análise.
