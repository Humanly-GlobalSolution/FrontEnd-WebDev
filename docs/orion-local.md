# FIWARE Orion local e CRUD de cruzamentos

## Ambiente utilizado

O Orion 4.5.0 já está rodando em `http://localhost:1026`, com MongoDB 4.4 configurado por Eduardo. Nenhum contêiner existente foi recriado ou reinstalado para esta integração.

O arquivo `docker-compose.yml` é apenas uma referência opcional para um ambiente novo. Não execute `docker compose up` nesta pasta para conectar ao ambiente já existente, pois isso tentaria criar outra instância na mesma porta. Também não execute `docker compose down -v`: isso removeria os volumes do projeto Compose correspondente.

O site do cidadão continua somente consultando cruzamentos. O CRUD de cruzamentos está em rotas administrativas do backend, sem mudanças no design ou exposição do token no navegador. Criação, consulta, edição e cancelamento de pedidos pelo protocolo já funcionam. O cancelamento exige confirmação e exclui a entidade no Orion.

## Iniciar o site com o Orion existente

Use Node.js 24 LTS e execute na pasta `Entrega FrontEnd-WebDev`:

```powershell
npm ci
npm run setup:local
npm run dev
```

`setup:local` cria `.env.local` somente se ele não existir, com o endereço local e um token administrativo aleatório. Não sobrescreve configurações existentes nem exibe o token. Nesta implementação, esse arquivo já foi criado; a repetição do comando apenas preservará seu conteúdo.

Se o servidor Next já estiver aberto antes de criar ou mudar o arquivo, encerre esse servidor com Ctrl+C e execute `npm run dev` novamente. Abra http://localhost:3000. Uma lista vazia é esperada enquanto não houver cruzamentos cadastrados no Orion.

Os valores locais são:

```dotenv
CROSSINGS_SOURCE=orion
ORION_BASE_URL=http://localhost:1026
ORION_FIWARE_SERVICE=
ORION_FIWARE_SERVICEPATH=
ORION_AUTH_TOKEN=
```

`ADMIN_API_TOKEN` também fica em `.env.local`, mas não deve ser copiado para exemplos, prints ou commits. As ferramentas abaixo leem esse token diretamente do arquivo.

Os cabeçalhos FIWARE ficam vazios para usar o mesmo contexto da consulta inicial de Eduardo. Se o Bruno definir um serviço ou caminho, configure os dois lados igualmente: uma entidade em outro serviço/caminho não aparecerá na consulta sem esses cabeçalhos.

## Contrato provisório

| API do Next | Atributo Orion padrão | Tipo NGSI-v2 | Regra |
| --- | --- | --- | --- |
| `code` | `codigo` | `Text` | 1 a 40 letras, números, hífens ou sublinhados; novos códigos são normalizados para maiúsculas |
| `address` | `endereco` | `Text` | Endereço não vazio, até 300 caracteres |
| `width` | `largura` | `Number` | Maior que zero, até 1000 metros |
| `currentSeconds` | `tempoAtual` | `Number` | Maior que zero, até 3600 segundos |

O tipo padrão é `Cruzamento`. IDs de novos cadastros seguem `urn:ngsi-ld:Cruzamento:<CODIGO>`. Para entidades existentes, a atualização e a exclusão preservam e utilizam o ID recebido do Orion. O código é imutável após criação.

O mapeamento é **provisório** e configurável por `ORION_CROSSING_TYPE`, `ORION_CODE_ATTRIBUTE`, `ORION_ADDRESS_ATTRIBUTE`, `ORION_WIDTH_ATTRIBUTE` e `ORION_TIME_ATTRIBUTE`. Não altera as regras do ESP32 nem dados de outros tipos. Os atributos definitivos serão alinhados com o Bruno.

Exemplo de entrada na API do Next:

```json
{"code":"C01","address":"Av. Paulista × Al. Joaquim Eugênio de Lima","width":30,"currentSeconds":20}
```

Exemplo do documento persistido no Orion:

```json
{
  "id": "urn:ngsi-ld:Cruzamento:C01",
  "type": "Cruzamento",
  "codigo": {"type":"Text","value":"C01"},
  "endereco": {"type":"Text","value":"Av. Paulista × Al. Joaquim Eugênio de Lima"},
  "largura": {"type":"Number","value":30},
  "tempoAtual": {"type":"Number","value":20}
}
```

## Experimentar o CRUD

Com `npm run dev` aberto em um terminal, use outro terminal nesta pasta. Os exemplos abaixo cadastram dados acadêmicos, não medições ou semáforos reais.

```powershell
node scripts/crossings.mjs list
node scripts/crossings.mjs create --code C01 --address "Av. Paulista x Al. Joaquim Eugenio de Lima" --width 30 --seconds 20
node scripts/crossings.mjs get --code C01
node scripts/crossings.mjs update --code C01 --seconds 40
node scripts/crossings.mjs list
```

A criação retorna HTTP 201, a consulta e a atualização retornam HTTP 200. O PATCH aceita apenas os campos que deseja mudar e preserva os demais. Repetir um código já cadastrado retorna 409. Campos inválidos retornam 400.

Para excluir **esse cadastro de exemplo**, execute:

```powershell
node scripts/crossings.mjs delete --code C01 --confirm
```

Exclusão retorna HTTP 204. Consultar ou excluir um código inexistente retorna 404. Atualize a página inicial para carregar a lista novamente após alterações administrativas; a busca da página continua funcionando sobre os dados carregados.

### Rotas HTTP

| Método | Rota Next | Operação Orion |
| --- | --- | --- |
| GET | `/api/cruzamentos` | Listagem pública somente de leitura |
| GET | `/api/admin/cruzamentos` | `GET /v2/entities` |
| POST | `/api/admin/cruzamentos` | `POST /v2/entities` |
| GET | `/api/admin/cruzamentos/C01` | Consulta por código, resolvendo o ID existente |
| PATCH | `/api/admin/cruzamentos/C01` | `PATCH /v2/entities/{id}/attrs` |
| DELETE | `/api/admin/cruzamentos/C01` | `DELETE /v2/entities/{id}` |

As rotas administrativas exigem `Authorization: Bearer <ADMIN_API_TOKEN>`. O token protege leitura e escrita administrativas; a listagem pública contém apenas os campos necessários ao cidadão. JSON de entrada é limitado a 8 KB. Credenciais do Orion são independentes do token administrativo.

## Verificações

```powershell
npm run lint
npm run typecheck
npm run build
npm run test:orion:local
```

O teste local exige Orion ativo e usa uma instância temporária de produção do Next em porta disponível, sem encerrar o seu servidor de desenvolvimento. Cria um código único `TEST_...`, verifica autenticação, validação, duplicidade, listagem, consulta, atualização parcial e exclusão. Confere também os valores diretamente no Orion, comprovando persistência. Ao final, remove somente a entidade criada pelo teste. O script recusa execução contra endereço remoto.

O teste de falhas com Orion simulado continua disponível:

```powershell
node tests/orion.integration.mjs
```

Ele verifica paginação, lista vazia, cabeçalhos e falhas sem fallback silencioso. Ambos os testes exigem build atualizado. Não se trata de um teste visual do navegador.

Verificação direta do Orion:

```powershell
Invoke-RestMethod http://localhost:1026/version
Invoke-RestMethod "http://localhost:1026/v2/entities?type=Cruzamento&options=keyValues"
```

## Migração futura e segurança

Não foi realizado deploy na Azure. Para o Next executado no computador, use `http://localhost:1026`. Se Next e Orion estiverem na mesma rede Docker, use `http://orion:1026` (nome de serviço); `localhost` dentro do contêiner aponta para o próprio contêiner.

Para usar os contêineres atuais com um Next em contêiner no futuro, conecte-o à rede real desses contêineres e use o nome/alias real do Orion. O perfil opcional `app` do Compose fornecido supõe um ambiente novo gerenciado pelo mesmo arquivo, não se conecta automaticamente a um Compose externo.

Na Azure, mantenha a API Orion atrás de um gateway HTTPS autenticado. No Next/Vercel, altere `ORION_BASE_URL` para o domínio HTTPS e configure `ORION_AUTH_TOKEN`; o restante da integração permanece igual. Configure também `ADMIN_API_TOKEN` no ambiente do Next e use HTTPS para acessar as rotas administrativas.

`infra/azure/` contém uma referência de gateway Caddy com token Bearer e HTTPS, redes internas e MongoDB sem portas públicas. Não foi aplicada nem validada em uma VM. O acesso público deve limitar-se a 80/443 no gateway; não libere 1026 nem 27017 no NSG da Azure. Restrinja SSH à administração, mantenha backups e rotação de tokens e valide a configuração antes da publicação.

MongoDB 4.4 corresponde ao ambiente local informado. A imagem de produção deve ter suporte de segurança e compatibilidade confirmados com Orion antes da implantação; por isso o Compose de nuvem exige uma escolha explícita de `MONGO_IMAGE`. Não reutilize automaticamente o ambiente local como configuração de produção.
