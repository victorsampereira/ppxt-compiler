# Schemas de Entrada e Saida

## Objetivo

Padronizar contratos entre etapas do pipeline para reduzir ambiguidade.

## Entrada principal

```json
{
  "project_id": "local-demo-001",
  "presentation": {
    "title": "Automacao de Apresentacoes Profissionais",
    "goal": "Convencer o publico de que o sistema vale ser construido",
    "audience": "executive",
    "tone": "premium",
    "language": "pt-BR",
    "duration_minutes": 12
  },
  "briefing": {
    "script": "Texto do roteiro",
    "design_direction": "Editorial, sofisticado, claro",
    "must_include": [
      "problema",
      "arquitetura",
      "MVP",
      "proximos passos"
    ],
    "must_avoid": [
      "visual generico",
      "excesso de bullets"
    ]
  },
  "brand_kit": {
    "brand_name": "Meu Projeto",
    "logo_path": "",
    "colors": ["#111111", "#F3F0E8", "#C96F3B"],
    "fonts": {
      "headline": "A definir",
      "body": "A definir"
    }
  },
  "data_sources": [],
  "assets": []
}
```

## Saida da normalizacao

```json
{
  "normalized_brief": {
    "presentation_intent": "persuasion",
    "primary_audience_needs": [],
    "design_keywords": [],
    "content_priority": [],
    "constraints": []
  }
}
```

## Saida do planejamento narrativo

```json
{
  "slides": [
    {
      "slide_id": "s01",
      "section": "opening",
      "purpose": "title",
      "key_message": "string",
      "speaker_intent": "string",
      "recommended_archetype": "hero_statement"
    }
  ],
  "narrative_notes": {
    "opening_strategy": "string",
    "flow_logic": "string",
    "closing_strategy": "string"
  }
}
```

## Saida de conteudo por slide

```json
{
  "slide_id": "s03",
  "title": "string",
  "subtitle": "string",
  "body": {
    "bullets": [],
    "paragraphs": [],
    "callouts": [],
    "numbers": []
  },
  "speaker_note": "string"
}
```

## Saida de design por slide

```json
{
  "slide_id": "s03",
  "theme_id": "editorial_premium_v1",
  "archetype": "metric_highlight",
  "visual_priority": "number-first",
  "background_style": "solid-light",
  "asset_strategy": "icon-or-shape"
}
```

## Saida do layout

```json
{
  "slide_id": "s03",
  "size": "wide",
  "elements": [
    {
      "id": "title",
      "type": "text",
      "x": 0.8,
      "y": 0.6,
      "w": 5.2,
      "h": 0.7,
      "style_ref": "title.primary"
    }
  ]
}
```

## Saida de QA

```json
{
  "slide_id": "s03",
  "status": "warn",
  "issues": [
    {
      "code": "TEXT_DENSITY_HIGH",
      "severity": "medium",
      "message": "Excesso de texto para um slide de destaque numerico"
    }
  ],
  "suggested_fixes": [
    "Reduzir subtitulo",
    "Trocar bullets por callouts"
  ]
}
```

## Convencoes

- toda etapa deve produzir JSON valido
- IDs de slide devem ser estaveis
- nomes de archetypes devem vir de um enum fechado
- toda decisao importante deve ser explicitada em campo proprio

## Validacoes obrigatorias

- campos obrigatorios presentes
- enums validos
- limites de tamanho respeitados
- referencias a assets resolvidas
- sem campos livres desnecessarios quando houver schema fechado
