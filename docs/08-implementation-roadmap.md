# Roadmap de Implementacao

## Fase 1: Fundacao

Objetivo:

Ter um pipeline local simples, rastreavel e funcional.

Entregas:

- estrutura base do projeto em Node.js + TypeScript
- schemas iniciais
- parser de briefing
- planner narrativo
- 8 a 10 archetypes
- renderizacao de `.pptx` com PptxGenJS
- tema visual inicial
- QA basico

## Fase 2: Qualidade visual

Objetivo:

Melhorar refinamento e reduzir cara de template.

Entregas:

- biblioteca maior de layouts
- regras melhores de espacamento e tipografia
- variacao controlada de composicao
- melhor tratamento de imagens
- score de qualidade por slide

## Fase 3: Robustez

Objetivo:

Tornar o sistema mais confiavel e reaproveitavel.

Entregas:

- armazenamento de projetos
- historico de execucoes
- rerender parcial por slide
- relatorios de falha
- testes automatizados das etapas centrais

## Fase 4: Refinamento pessoal

Objetivo:

Adaptar o sistema ao seu estilo real de apresentacao.

Entregas:

- perfis de tom por contexto
- themes proprios
- bibliotecas de assets favoritas
- padroes narrativos mais usados

## Ordem tecnica recomendada

1. schemas
2. pipeline de arquivos
3. prompts estruturados
4. renderizador simples
5. archetypes
6. regras de layout
7. QA
8. refinamento visual

## Definicao de pronto do MVP

O MVP estara pronto quando conseguir:

- transformar um roteiro real em uma apresentacao completa
- gerar um `.pptx` utilizavel
- manter consistencia visual razoavel
- exigir apenas ajustes leves manuais

## Risco principal

O maior risco nao e tecnico. E de qualidade de output.

Se o sistema nao tiver:

- bons archetypes
- regras de composicao
- rubrica forte

ele ate gera slides, mas nao gera slides bons.
