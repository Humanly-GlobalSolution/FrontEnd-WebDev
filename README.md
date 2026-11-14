# Farol Amigo

Site do cidadão e painel do operador do projeto CitizenTech, para **Front-end Design e Web Development**, turma **1ESPI**.

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

Projeto acadêmico: não encaminha solicitações reais à CET nem controla semáforos físicos. Firmware e interface do poste pertencem ao Edge. Conforme o PDF atualizado, o painel do operador agora faz parte deste site.

## Funcionalidades e arquitetura

Busca por rua ou código, detalhe do cruzamento, comparação de tempos, formulário com conferência, protocolo e CRUD completo de pedidos persistido no FIWARE Orion por NGSI-v2. A administração de cruzamentos é preservada apenas para testes isolados locais; no servidor compartilhado, o site somente lê os cruzamentos mantidos pelo Edge.

Next.js com App Router, React, TypeScript e Tailwind CSS. O navegador acessa a API do Next; somente o servidor acessa o Orion. Credenciais não usam prefixo `NEXT_PUBLIC_`.

| Pasta | Responsabilidade |
| --- | --- |
| `src/app` | Páginas e rotas HTTP |
| `src/components` | Componentes de apresentação reutilizáveis |
| `src/hooks` | Estado e carregamento: `useCruzamentos`, `usePedido` e `useOperatorPanel` |
| `src/lib` | Cálculos, validação e utilitários HTTP |
| `src/services` | Comunicação com a API e com Orion |
| `src/types` | Contratos TypeScript |
| `src/data` | Exemplos identificados do modo demo |
| `tests` | Verificações de HTTP e integração |

Há mais de oito componentes e uso de `useState` e `useEffect`. A referência de travessia é `Math.ceil(largura / 0.75)`; o cenário proposto nunca reduz o tempo atual. É uma comparação acadêmica, sem decisão automática sobre sinalização.

## Executar no computador

Pré-requisitos: Node.js **24 LTS**, npm e conexão com o Orion **3.10.1** do projeto na Azure. Não é necessário Docker local para executar o site.

Na pasta do projeto:

```powershell
npm ci
npm run setup:local
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). O modo de desenvolvimento usa Webpack para contornar a instabilidade de recarregamento observada com Turbopack neste ambiente local. As mudanças nos arquivos aparecem durante o desenvolvimento. Mantenha o terminal aberto; encerre com Ctrl+C. Alterações em `.env.local` exigem reiniciar o servidor.

### Onde fica a área do operador e como acessar

**Link local:** [http://localhost:3000/painel](http://localhost:3000/painel).

1. Inicie o site com `npm run dev` e mantenha o terminal aberto.
2. Abra o link acima ou clique em **“Área do operador”**, no rodapé de qualquer página.
3. Abra o arquivo `.env.local`, na raiz do projeto, e localize `ADMIN_API_TOKEN`. Copie somente o valor depois do sinal `=` e informe-o no campo **“Código de acesso”** do painel.
4. Clique em **“Entrar no painel”**. Ao terminar, use **“Sair do painel”**, especialmente em computador compartilhado.

O código é privado: não deve ser colocado no README, no GitHub, em prints ou em mensagens. `REQUEST_PROTOCOL_SECRET` tem outra função e não é o código de acesso. O cidadão continua consultando seus pedidos pelo protocolo, sem login.

Após publicar na Vercel, a área estará em `/painel` no domínio do site publicado. Nesse ambiente, o código será o `ADMIN_API_TOKEN` configurado nas variáveis do projeto Vercel.

`setup:local` cria o arquivo local `.env.local` somente se ausente, usando o endereço da Azure definido em `.env.example` e gerando os segredos administrativo e de protocolo. Não sobrescreve a configuração existente nem imprime segredos. O arquivo não deve entrar no Git ou no ZIP.

O servidor FIWARE já existe na Azure. Não é necessário criar contêineres ou outra VM para executar o site. As configurações e o contrato estão descritos abaixo.

O contexto oficial da Azure contém C01 a C05. Atualize a página, abra um cruzamento e escolha “Pedir revisão do tempo”. Guarde o protocolo para consultar, editar e cancelar o pedido. Uma lista vazia em outro ambiente indica ausência de cadastros naquele contexto; o site não substitui dados ausentes por exemplos automaticamente.

Para executar a compilação de produção:

```powershell
npm run build
npm start
```

## Configuração e Orion da Azure

O endpoint fornecido por Bruno é `http://farolamigo.northcentralus.cloudapp.azure.com:1026`. A versão **3.10.1** foi confirmada por leitura de `/version` em 13/11/2026. Não foi criada VM nem usado Docker local em produção.

```dotenv
CROSSINGS_SOURCE=orion
ORION_URL=http://farolamigo.northcentralus.cloudapp.azure.com:1026
ORION_FIWARE_SERVICE=farolamigo
ORION_FIWARE_SERVICEPATH=/
ORION_AUTH_TOKEN=
```

Esses valores ficam em `.env.local`, ignorado pelo Git. O módulo `src/services/orion.server.ts` usa `server-only`; o navegador acessa somente as rotas Next. Nunca usar prefixo `NEXT_PUBLIC_`. `ORION_URL` tem prioridade; `ORION_BASE_URL` é aceito somente como alternativa legada. Reinicie o servidor após alterar variáveis.

Todas as chamadas usam `Fiware-Service: farolamigo` e `Fiware-ServicePath: /`; POST/PATCH usam JSON. O Orion do projeto não usa Keyrock/PEP nem token. `ADMIN_API_TOKEN` protege a listagem administrativa do Next, não autentica o Orion. `REQUEST_PROTOCOL_SECRET` é um segredo aleatório de pelo menos 32 caracteres usado exclusivamente no servidor para gerar protocolos e manter idempotência. Ambos são criados por `setup:local` em instalação nova; os valores existentes são preservados. Não publicar nenhum deles. O segredo do protocolo precisa permanecer estável entre instâncias e deploys para recuperar um envio após perda da resposta.

O contexto oficial da Azure contém C01, cadastrado pelo Bruno, e C02 a C05, cadastrados com autorização de Eduardo. Os quatro exemplos também foram atualizados no Orion local; C01 foi preservado. Não foram criados pedidos de teste na Azure.

## Contrato oficial definido pelo Bruno

### Cruzamento — somente leitura no servidor compartilhado

| Atributo | Tipo NGSI-v2 | Exemplo/regra |
| --- | --- | --- |
| `id`, `type` | Identificadores | `urn:ngsi-ld:Cruzamento:C01`, `Cruzamento` |
| `codigo` | Text | `C01` |
| `nome` | Text | Nome do cruzamento |
| `largura_m` | Number | Largura em metros; C01: 30 |
| `verde_atual_s` | Number | Campo usado para o tempo atual total informado, incluindo verde e piscante em C02–C05; C01 permanece com 20 s |
| `estado` | Text | VERDE_CARROS, PEDIDO, VERDE_PEDESTRE, TEMPO_ESTENDIDO ou FALHA; mantido pelo Edge |
| `extensao_s` | Number | 0 a 15, de 3 em 3; mantido pelo Edge |
| `leitura_valida` | Boolean | Mantido pelo Edge |

A aplicação usa código, nome, largura e tempo para a busca/comparação. C01 mantém os dados do piloto. As novas larguras de C02, C03 e C05 foram medidas no Google Earth, conforme informado por Eduardo; seus tempos são **estimativas para simulação, não dados oficiais da CET**. C04 mantém os dados e configurações anteriores. O tempo de referência não é armazenado: `Math.ceil(largura_m / 0.75)`.

| Código | Cruzamento na Paulista | Largura | Verde estimado | Piscante estimado | Total sem Farol Amigo | Referência a 0,75 m/s |
| --- | --- | --- | --- | --- | --- | --- |
| C02 | Rua da Consolação | 27,40 m | 5 s | 30 s | 35 s | 37 s |
| C03 | Av. Rebouças | 36,96 m | 5 s | 42 s | 47 s | 50 s |
| C04 | Av. Brigadeiro Luís Antônio | 19,5 m | 10 s | 14 s | 24 s | 26 s |
| C05 | Av. Bernardino de Campos | 27,82 m | 5 s | 31 s | 36 s | 38 s |

O tempo atual é o total de verde mais vermelho piscante, não somente o verde. O nome do atributo `verde_atual_s` foi mantido por compatibilidade. Não somar o piscante novamente no site. O catálogo `src/data/crossingCatalog.ts` centraliza os novos endereços, medidas, estimativas e coordenadas de C02/C03/C05; os exemplos e a interface o reutilizam.

**Persistência verificada em 14/11/2026:** após autorização de Eduardo, os três registros foram atualizados na Azure e no Orion local, com seis PATCH somente de nome, largura e tempo total. Os dois ambientes mantêm cinco cruzamentos, sem duplicatas. C01, C04 e os demais atributos permaneceram intactos. O backup anterior e o resultado da verificação ficam fora da entrega, em `Backups Farol Amigo`. As coordenadas e a separação verde/piscante são metadados locais do site; não foram adicionados atributos ao contrato Orion.

A comparação segue RN02/RN03 com acionamentos unificados nos cinco cruzamentos. O usuário seleciona adulto (1,2 m/s), pessoa idosa (0,75 m/s) ou pessoa com mobilidade reduzida (0,6 m/s), e acionamento por botão, sensor ou cartão. A extensão é calculada automaticamente, inclusive zero quando não falta tempo; não é escolhida manualmente. Veja a regra e as tabelas abaixo.

Os dados cadastrados de C01 e C04 continuam preservados. A mesma regra de simulação passa a valer para os cinco cruzamentos; em C01, a pessoa idosa recebe 40 s e a PcD recebe 52 s nos três acionamentos, concluindo a travessia no modelo. Nenhum comando é enviado ao ESP32 ou ao Orion pela comparação.

As localizações novas usam pontos de referência verificados no OpenStreetMap em 14/11/2026. C02: `-23.5556572, -46.6627851` ([nó 1421376041](https://www.openstreetmap.org/node/1421376041)); C03: `-23.5559500, -46.6634004` ([nó 28149758](https://www.openstreetmap.org/node/28149758)); C05: `-23.5713665, -46.6443028` ([nó 60609866](https://www.openstreetmap.org/node/60609866)). C03 representa o braço da Rebouças no entroncamento Paulista/Consolação; não é a antiga Alameda Campinas. Os mapas são individuais e não representam um levantamento topográfico da faixa. C01/C04 não receberam marcadores novos.

O mapeamento de leitura usa `ORION_CROSSING_TYPE=Cruzamento`, `ORION_CODE_ATTRIBUTE=codigo`, `ORION_ADDRESS_ATTRIBUTE=nome`, `ORION_WIDTH_ATTRIBUTE=largura_m` e `ORION_TIME_ATTRIBUTE=verde_atual_s`. As antigas ferramentas administrativas de cruzamento permanecem restritas ao Orion em loopback para testes isolados; escritas pelo Next no servidor compartilhado são recusadas, mesmo com token administrativo.

### PedidoRevisao — CRUD do site

| Atributo | Tipo NGSI-v2 | Regra |
| --- | --- | --- |
| `id`, `type` | Identificadores | `urn:ngsi-ld:PedidoRevisao:{protocolo}`, `PedidoRevisao` |
| `protocolo` | Text | `FA-XXXX-XXXX`, oito símbolos de A–Z/2–9, excluindo I e O |
| `cruzamento_id` | Text | Código, por exemplo `C01` |
| `motivo` | Text | `tempo_curto`, `falta_som`, `botao_cartao`, `outro` |
| `comentario` | Text | Opcional, até 280 caracteres; vazio quando ausente |
| `status` | Text | `enviado`, `em_analise`, `respondido`; criação sempre `enviado` |
| `resposta` | Text | Vazia até uma resposta ser registrada pelo operador |
| `criado_em` | DateTime | Data ISO 8601 gerada pelo servidor |
| `atualizado_em` | DateTime | Data ISO 8601; atualizada ao editar |

Não são armazenados nome, CPF, telefone, e-mail, cópia do endereço ou dados pessoais. O comentário não aceita `< > " ' = ; ( )`: a mesma validação funciona no cliente e no servidor, com mensagem de correção antes do envio. Esses caracteres não são silenciosamente removidos.

O protocolo é gerado **no servidor**, sem data ou sequência. Um HMAC-SHA256 com segredo privado e a chave UUID v4 aleatória de envio produz oito símbolos criptograficamente pseudoaleatórios do alfabeto de 32 caracteres. Assim, a mesma tentativa recupera o mesmo protocolo sem criar atributos extras no Orion. A unicidade do ID é conferida pelo broker; conflitos com dados diferentes retornam 409, sem sobrescrever outro pedido.

## Rotas e regras de acesso

| Método e rota | Comportamento |
| --- | --- |
| `POST /api/pedidos` | `{ crossingCode, reason, comment? }` e cabeçalho `Idempotency-Key` UUID v4. Retorna 201; recuperação do mesmo envio retorna 200. |
| `GET /api/pedidos?limit=20&offset=0` | Listagem administrativa, exige `Authorization: Bearer <ADMIN_API_TOKEN>`. |
| `GET /api/pedidos/{protocolo}` | Consulta a entidade pelo protocolo completo, usando `options=keyValues`. |
| `PATCH /api/pedidos/{protocolo}` | Altera somente motivo/comentário e atualiza `atualizado_em`. |
| `DELETE /api/pedidos/{protocolo}` | Exige `X-Confirm-Cancel: true`; exclui após conferência do status. Sucesso 204. |

**Decisão explícita do projeto: somente o protocolo, sem cookie e sem login. Quem tem o protocolo consegue ver e editar o pedido em qualquer navegador**, enquanto o status permitir. Também pode cancelá-lo após confirmação. Não há comprovação de identidade nem propriedade além da posse desse segredo. Guarde o protocolo, não compartilhe a URL nem publique logs que o contenham. O formato tem 40 bits de entropia; não equivale a uma conta autenticada.

Criação e edição rejeitam campos desconhecidos, inclusive `id`, `type`, `status`, `protocolo` e datas. Edição/cancelamento só são permitidos em `enviado` ou `em_analise`; `respondido` retorna 409. A confirmação de exclusão é obrigatória. Falta de registro retorna 404 e formato inválido, 400. Não há transação distribuída entre a conferência de status e a escrita; concorrência com o operador continua uma limitação do Orion NGSI-v2.

A listagem não é pública e o token administrativo nunca vai ao frontend. Aceita `limit` de 1 a 100 e `offset` de 0 a 10000. Retorna `requests` e `pagination`; a próxima página pode estar vazia. Os retornos expõem apenas os campos necessários, sem IDs internos nem credenciais. `/pedidos` usa `noindex`/`no-referrer`, e respostas da API não usam cache.

## Interface e tratamento de erros

C3, C5, C6 e C7 usam `usePedido` e as rotas Next para criar, consultar, editar e cancelar pedidos. Preservados o design, a conferência antes do envio e o preenchimento em caso de erro. Os status vêm do Orion; o site não inventa andamento nem datas de análise/resposta. `atualizado_em` é apresentado como atualização do registro, não como data de mudança de status.

Timeout de 8 segundos no servidor e 20 segundos no navegador, incluindo leitura do corpo. Erros não expõem detalhes internos do Orion. Escritas não são repetidas automaticamente; um reenvio do mesmo rascunho usa a mesma chave. Em caso de dúvida após edição/exclusão, consulte o protocolo para conferir o resultado.

Fonte local Atkinson Hyperlegible Next, link de salto, rótulos, foco visível, mensagens de status e letra maior (125%). A confirmação de cancelamento começa em “Manter pedido” e permite teclado. A revisão visual anterior cobriu desktop/320 pixels; esta integração foi verificada por código, HTTP e testes automatizados, sem nova conferência visual. Aparelhos físicos e leitores de tela não foram testados.

## Painel do operador

Abra `/painel` ou o link “Área do operador” no rodapé. O código de acesso é o valor de `ADMIN_API_TOKEN` configurado no servidor. Não publique nem compartilhe esse valor no README, código, prints ou Git. O cidadão continua sem login e consulta seus pedidos apenas pelo protocolo.

- Acesso conferido no servidor antes de consultar ou alterar dados privados. O código é digitado uma vez; a sessão usa cookie assinado, HttpOnly e SameSite=Strict, com duração de oito horas e Secure em produção. O token administrativo não é devolvido ao cliente, colocado em localStorage ou encaminhado ao Orion. “Sair” remove o cookie do navegador; alterar o token do servidor invalida as assinaturas anteriores.
- Dez tentativas incorretas bloqueiam novas tentativas por cinco minutos naquela instância. Esse limite em memória não é global entre funções da Vercel; o gateway pode acrescentar proteção distribuída. A sessão pertence somente ao operador, sem mudar o acesso por protocolo do cidadão.
- Cruzamentos mostram `estado`, `extensao_s` e `leitura_valida`. A consulta é atualizada a cada cinco segundos na aba visível, sem requisições sobrepostas; há atualização manual. A interface mantém a última consulta com aviso quando ocorre falha e exige nova entrada se a sessão expirar.
- Alertas destacam FALHA, leitura inválida, atributos fora do contrato e extensão de 15 s. Dados ausentes aparecem como não informados. C02–C05 continuam identificados como simulados; não recebem estado ou leitura inventados.
- Pedidos são paginados de 20 em 20, com busca/filtro na página atual. O operador pode iniciar a análise ou registrar resposta, alterando somente `status`, `resposta` e `atualizado_em`. A resposta é obrigatória para concluir, limitada a 2000 caracteres pela aplicação e validada contra os símbolos recusados pelo Orion. Pedidos respondidos não são reabertos pelo painel; a resposta aparece na consulta do cidadão e a edição/cancelamento ficam bloqueados.
- A referência do Figma orienta cores, navegação e hierarquia. Contagens históricas de ciclos, percentuais e exportação de relatórios não foram inventados: o contrato atual não fornece esse histórico. O painel exibe o estado atual disponível no Orion, sem garantir que o dispositivo esteja online.

| Rota | Acesso e finalidade |
| --- | --- |
| `GET/POST/DELETE /api/painel/sessao` | Verificar sessão, entrar pelo código e sair |
| `GET /api/painel/cruzamentos` | Telemetria; exige sessão válida ou Bearer administrativo |
| `GET /api/pedidos` | Listagem protegida; agora também aceita a sessão do operador |
| `PATCH /api/painel/pedidos/{protocolo}` | Atendimento protegido, com validação de origem e regras de status |

O painel somente lê os cruzamentos. Nenhum controle do ESP32 ou escrita na sinalização foi adicionado. O cookie protege as rotas do Next; o acesso direto ao Orion público continua dependendo da proteção do servidor do Bruno.

## Testes sem escrever na Azure

```powershell
npm run lint
npm run build
npm run typecheck
npm run test:http
node --test tests/crossings.test.mjs
npm run test:pedidos
npm run test:painel
node tests/orion.integration.mjs
```

Os testes de pedidos usam broker em memória em `127.0.0.1` e Next em porta temporária. Cobrem o contrato oficial, cabeçalhos, CRUD, acesso por protocolo sem cookies, listagem protegida, validação dos símbolos/limites, idempotência, datas, status e confirmação da exclusão. Os demais verificam paginação, falhas HTTP, respostas inválidas e timeout.

`test:painel` cobre acesso sem credenciais, código inválido, cookie assinado/adulterado/expirado, limite de tentativas, telemetria ausente/inválida/atualizada, mudança para análise, resposta visível ao cidadão e bloqueio após atendimento. As únicas escritas são em um broker simulado em memória, nunca na Azure.

`test:orion:local` e `test:pedidos:local` são testes opcionais com escritas em Orion local. Antes de qualquer requisição, ambos conferem o endereço efetivo (`ORION_URL` antes do nome legado) e recusam a Azure. Não executar testes de escrita no servidor compartilhado sem autorização específica. O CRUD ainda não foi testado com escritas reais na Azure.

## Segurança e publicação na Vercel

O endereço fornecido é HTTP público e sem autenticação Orion. Proteger as rotas Next não bloqueia acesso direto ao broker nem criptografa o trecho Next → Orion. HTTPS e restrição do acesso direto devem ser combinados com Bruno antes de utilizar dados reais; não serão criadas outra VM ou infraestrutura paralela.

Para a meta de **18/11**, configurar `ORION_URL`, `CROSSINGS_SOURCE=orion`, `ORION_FIWARE_SERVICE=farolamigo`, `ORION_FIWARE_SERVICEPATH=/`, `ADMIN_API_TOKEN` e `REQUEST_PROTOCOL_SECRET` como variáveis do servidor na Vercel. Os dois segredos devem ser privados. Sem Keyrock/PEP, `ORION_AUTH_TOKEN` fica vazio. Criar novo deploy após configurar as variáveis. Nenhuma publicação foi realizada neste trabalho.

Os cruzamentos já estão disponíveis no contexto oficial. Para concluir a validação do CRUD real de pedidos prevista para **15/11**, ainda é necessária autorização específica para criar e remover pedidos temporários de teste na Azure. Não restam atributos provisórios: o contrato recebido foi aplicado.

## Entrega acadêmica

Repositório privado com pelo menos 15 commits significativos, escrita para os dois professores, link do deploy, README, AI.md e ZIP; envio separado nas duas disciplinas. Repositório publicado, acessos e URL final ainda precisam ser conferidos. A seção 3 específica do AI.md não foi fornecida; o arquivo registra o uso real da assistência.

O ZIP exclui `.git`, `.env.local`, dependências, builds, caches e temporários. O histórico permanece no Git. A auditoria anterior registrou 7 avisos moderados de desenvolvimento, sem alertas de produção; não foi aplicada atualização forçada.

## Referências

- [Protótipo Figma](https://www.figma.com/design/nHm3SZXp7YdzztSLdtm543)
- [Tutorial de CRUD FIWARE](https://fiware-tutorials.readthedocs.io/en/latest/crud-operations.html)
- Contrato oficial fornecido por Bruno por intermédio de Eduardo em 13/11/2026, DOCX, PDF e prints do grupo.
- [Registro de uso de IA](AI.md)


### Regra de cálculo da equipe — acionamentos unificados

Adotada em 14/11/2026 para todos os cruzamentos. Os tempos atuais são totais de verde e vermelho piscante: não somar o piscante novamente. As velocidades são hipóteses constantes da simulação: adulto 1,2 m/s, idoso 0,75 m/s e PcD/mobilidade reduzida 0,6 m/s, sem generalizar a velocidade real das pessoas.

1. Tempo necessário = largura / velocidade, sem arredondamento intermediário.
2. Botão, sensor ou cartão: garantia = tempo atual (RN02, com acionamentos unificados por solicitação posterior da equipe).
3. Exceção acessível do piloto C01: para idoso e PcD, garantia = max(tempo atual, ceil(largura / 0,75)), em qualquer acionamento. Com os dados atuais, a garantia é 40 s; idoso recebe 40 s, PcD recebe 40 + 12 = 52 s. A garantia é separada do teto de 15 s da extensão. Adulto permanece em 26 s. A forma de acionamento não altera o tempo. Este ajuste substitui a garantia diferenciada do cartão descrita anteriormente em RN04.
4. Falta = max(0, tempo necessário - garantia).
5. Extensão = min(15, 3 × ceil(falta / 3)) (RN03). Sem falta, a extensão é zero.
6. Total com Farol Amigo = garantia + extensão. Sem Farol Amigo, usar o tempo atual, independentemente de perfil/acionamento.
7. Distância = min(largura, velocidade × total); restante = max(0, largura - distância). Velocidade exigida = largura / tempo disponível.
8. Se o total não bastar para concluir a travessia, mostrar alerta simulado ao operador. Usar exatamente 15 s de extensão e concluir não gera alerta de insuficiência.

| Código | Largura | Atual | Base comum |
|---|---:|---:|---:|
| C01 | 30 m | 20 s | 40 s para idoso/PcD; 20 s para adulto |
| C02 | 27,40 m | 35 s | 35 s |
| C03 | 36,96 m | 47 s | 47 s |
| C04 | 19,5 m | 24 s | 24 s |
| C05 | 27,82 m | 36 s | 36 s |

**Totais pelo botão, sensor ou cartão:** ✓ conclui no modelo; ⚠ extensão máxima insuficiente.

| Código | Adulto | Idoso | PcD |
|---|---:|---:|---:|
| C01 | 26 s ✓ | 40 s ✓ | 52 s ✓ |
| C02 | 35 s ✓ | 38 s ✓ | 47 s ✓ |
| C03 | 47 s ✓ | 50 s ✓ | 62 s ✓ |
| C04 | 24 s ✓ | 27 s ✓ | 33 s ✓ |
| C05 | 36 s ✓ | 39 s ✓ | 48 s ✓ |

O sensor é representado pela distância restante; o site não mede velocidades. O alerta é somente visual, não é enviado a um operador real e não autoriza liberar veículos com pessoas ainda na faixa. Não há comandos ao semáforo nem gravação da extensão no Orion. Os dados de C01 são mantidos conforme Bruno; C02/C03/C05 têm larguras informadas como medidas no Google Earth e tempos estimados, não oficiais da CET. C04 mantém os dados anteriores.

As referências de velocidades informadas pela equipe são Duim, Lebrão e Antunes (2017), para 0,75 m/s, e Decreto municipal 59.670/2020, para 0,6 m/s. Essas atribuições precisam ser conferidas nas fontes originais antes de apresentá-las como fundamento bibliográfico/legal; os cálculos aqui adotam os valores definidos pelo grupo como parâmetros da simulação.
