# AutomacaoSlides

Sistema para gerar apresentacoes `.pptx` de alta qualidade a partir de:

- roteiro
- briefing de design
- objetivos da apresentacao
- assets de marca

O projeto deve funcionar como um compilador de apresentacoes:

1. interpreta o briefing
2. planeja a narrativa
3. escolhe layouts adequados
4. resolve assets visuais
5. renderiza o arquivo `.pptx`
6. executa validacao automatica de qualidade

## Objetivo

Gerar apresentacoes realmente profissionais, com consistencia visual, narrativa clara e baixa dependencia de edicao manual posterior.

## Principios

- IA decide intencao, estrutura e conteudo
- engine deterministica decide layout final e coordenadas
- qualidade visual deve ser validada por regras objetivas
- o sistema deve favorecer reutilizacao de templates e tokens de design
- o resultado nao deve parecer generico ou "templateado"

## Documentacao

- [Visao do Produto](./docs/01-product-spec.md)
- [Arquitetura do Sistema](./docs/02-system-architecture.md)
- [Gerenciamento de Contexto da IA](./docs/03-ai-context-management.md)
- [Schemas de Entrada e Saida](./docs/04-input-output-schemas.md)
- [Rubrica de Qualidade](./docs/05-slide-quality-rubric.md)
- [Pipeline de Agentes](./docs/06-pipeline-agents.md)
- [Contratos de Prompt](./docs/07-prompt-contracts.md)
- [Roadmap de Implementacao](./docs/08-implementation-roadmap.md)

## Stack recomendada

- Node.js + TypeScript
- PptxGenJS para geracao do `.pptx`
- OpenAI API para planejamento, escrita e critica
- armazenamento local no MVP
- possivel uso de LibreOffice ou PowerPoint para render de preview

## Como executar

Instalacao:

```bash
npm install
```

Gerar a apresentacao de exemplo:

```bash
npm run generate:sample
```

Validar tipagem:

```bash
npm run typecheck
```

## Saidas do pipeline

Ao executar o gerador, o projeto grava em `output/generated/<project_id>/`:

- arquivo `.pptx`
- `artifacts.json` com todos os artefatos intermediarios
- `quality-report.json` com score e alertas por slide

## Estado atual do MVP

Ja implementado:

- leitura e validacao do briefing em JSON
- normalizacao do contexto
- planejamento narrativo inicial
- escrita deterministica de slides
- resolucao basica de design
- renderizacao de `.pptx`
- QA inicial por regras objetivas

Proximo passo recomendado:

- integrar OpenAI API no planner, writer e critic
- expandir biblioteca de archetypes
- melhorar layout engine para composicao menos rigida

## Status esperado do MVP

O MVP deve:

- receber um briefing estruturado
- gerar plano de apresentacao
- gerar de 8 a 20 slides
- aplicar um tema visual consistente
- exportar `.pptx`
- executar checks de qualidade basicos
