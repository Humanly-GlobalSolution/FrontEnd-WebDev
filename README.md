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

Etapa 3 de 15: identidade visual, cabeçalho, marca vetorial e estrutura responsiva inicial implementados conforme a referência do Figma. A fonte Atkinson Hyperlegible Next é servida localmente. O botão de letra maior alterna a escala de texto entre 100% e 125% durante a navegação; ao recarregar, retorna ao padrão.

A busca, os detalhes dos cruzamentos e o CRUD ainda serão implementados. A página informa que o envio de pedidos não está disponível.

## Pré-requisitos e execução

- Node.js 24 LTS e npm. O Next.js utilizado exige, no mínimo, Node.js 20.9.
- Execute os comandos dentro da pasta deste projeto.

```bash
npm ci
npm run dev
```

Abra http://localhost:3000. Para parar o servidor, pressione `Ctrl+C` no terminal.

## Validação e produção

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

`npm start` serve o build de produção e exige que `npm run build` tenha concluído. O arquivo `package-lock.json` deve ser versionado para reproduzir a instalação. Não inclua `node_modules` nem `.next` no repositório ou ZIP.

O projeto ainda não exige variáveis de ambiente. A configuração do Orion será adicionada na etapa de integração, somente no servidor.

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
