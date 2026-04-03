# Pipeline de Agentes

## Objetivo

Definir como a IA deve ser usada ao longo do pipeline sem sobreposicao de responsabilidades.

## Agentes recomendados

### 1. Brief Normalizer

Responsabilidade:

- transformar entrada livre em briefing estruturado
- identificar lacunas
- extrair restricoes

Entrada:

- roteiro bruto
- briefing visual
- metadados da apresentacao

Saida:

- `normalized_brief.json`

### 2. Narrative Planner

Responsabilidade:

- criar outline
- definir ordem dos slides
- manter progressao narrativa

Saida:

- `presentation_plan.json`

### 3. Slide Writer

Responsabilidade:

- escrever conteudo do slide
- ajustar densidade textual
- alinhar titulo e corpo com a tese

Saida:

- `slide_content.json`

### 4. Visual Strategist

Responsabilidade:

- escolher archetype
- definir prioridade visual
- recomendar assets

Saida:

- `design_plan.json`

### 5. Layout Engine

Responsabilidade:

- transformar estrutura em coordenadas

Observacao:

- preferencialmente sem modelo generativo no core

### 6. Asset Resolver

Responsabilidade:

- encontrar assets existentes
- acionar geracao de imagem quando necessario

### 7. Quality Critic

Responsabilidade:

- avaliar clareza
- avaliar densidade
- detectar falhas visuais e narrativas

Saida:

- `quality_report.json`

## Regra de composicao

Nao permitir que um unico agente:

- planeje
- escreva
- desenhe
- aprove

sozinho.

Separar funcoes melhora controle e facilita debug.

## Regra de contexto por agente

Cada agente recebe apenas o necessario:

- o normalizer recebe o briefing completo
- o planner recebe o briefing normalizado
- o writer recebe apenas o packet do slide
- o critic recebe o slide, o papel narrativo e a rubrica

## Ordem recomendada

1. normalizar
2. planejar
3. escrever
4. definir estrategia visual
5. montar layout
6. renderizar
7. criticar
8. corrigir seletivamente

## Regra de retry

Se a etapa falhar:

- nao regenerar tudo
- corrigir apenas a etapa com problema
- preservar IDs e contratos anteriores

## Logs por etapa

Cada agente deve registrar:

- input resumido
- output estruturado
- versao do prompt
- modelo usado
- timestamp
