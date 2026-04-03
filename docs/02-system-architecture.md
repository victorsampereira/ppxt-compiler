# Arquitetura do Sistema

## Visao geral

O sistema deve ser dividido em camadas com responsabilidades explicitas.

## Camadas

### 1. Input normalization

Responsavel por transformar entradas livres em um objeto interno consistente.

Entradas:

- roteiro
- objetivo
- audiencia
- duracao
- briefing de design
- assets de marca
- dados estruturados opcionais

Saida:

- `normalized_brief.json`

### 2. Narrative planning

Responsavel por definir:

- estrutura narrativa
- quantidade de slides
- papel de cada slide
- transicao entre secoes

Saida:

- `presentation_plan.json`

### 3. Slide authoring

Responsavel por escrever o conteudo de cada slide com densidade apropriada.

Saida:

- `slide_content.json`

### 4. Design resolution

Responsavel por escolher:

- tema visual
- tokens de design
- archetype por slide
- regras de composicao

Saida:

- `design_plan.json`

### 5. Layout engine

Responsavel por converter intencoes em coordenadas reais.

Esta camada nao deve depender de geracao livre de texto.

Ela calcula:

- grid
- margem
- alinhamento
- tamanho de texto
- areas de imagem
- fallback de overflow

Saida:

- `layout_spec.json`

### 6. Asset resolution

Responsavel por localizar ou gerar:

- imagens
- icones
- ilustracoes
- graficos
- tabelas

Saida:

- `asset_manifest.json`

### 7. PPTX rendering

Responsavel por montar o arquivo final.

Stack sugerida:

- `PptxGenJS`

Saidas:

- `presentation.pptx`
- `render_manifest.json`

### 8. Quality assurance

Responsavel por verificar:

- overflow
- excesso de texto
- contraste insuficiente
- repeticao excessiva de layout
- baixa clareza da mensagem

Saida:

- `quality_report.json`

## Decisao arquitetural critica

O modelo nao deve produzir coordenadas finais como fonte unica de verdade.

Regra:

- LLM decide "o que"
- engine decide "como encaixar"

## Estrutura recomendada de codigo

```text
src/
  app/
  core/
    schemas/
    planning/
    authoring/
    design/
    layout/
    assets/
    render/
    qa/
  themes/
  templates/
  prompts/
  jobs/
  lib/
data/
  examples/
  brand-kits/
output/
docs/
```

## Persistencia recomendada no MVP

Para uso individual:

- arquivos JSON em disco podem ser suficientes no inicio
- banco de dados pode ser adiado

Persistir pelo menos:

- input original
- input normalizado
- planos intermediarios
- relatorio de QA
- metadados do arquivo gerado
