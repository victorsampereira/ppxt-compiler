# Gerenciamento de Contexto da IA

## Objetivo

Garantir que a IA opere com contexto suficiente para produzir slides bons, sem sobrecarregar o prompt com informacao desnecessaria.

## Regra principal

Separar o contexto em tres categorias:

- contexto estavel
- contexto de execucao
- contexto por slide

## 1. Contexto estavel

Informacao raramente muda e pode ser reutilizada em varias execucoes.

Exemplos:

- visao do produto
- principios de qualidade
- lista de archetypes
- rubrica de avaliacao
- regras do brand kit
- contratos de schema

Esses itens devem viver em arquivos `.md` e `.json` versionados.

## 2. Contexto de execucao

Informacao da apresentacao atual.

Exemplos:

- roteiro
- publico
- objetivo
- briefing visual
- duracao
- dados e fontes
- restricoes do usuario

Esse contexto deve ser normalizado antes de ser entregue aos agentes.

## 3. Contexto por slide

Cada agente que trabalha no slide deve receber apenas:

- contexto global minimo necessario
- resumo da apresentacao
- slide anterior e proximo
- papel do slide atual
- regra visual do archetype escolhido

Isso reduz ruido e aumenta consistencia.

## Hierarquia de contexto

A IA deve consumir contexto nesta ordem:

1. schema tecnico
2. regras fixas do sistema
3. brand kit e design tokens
4. objetivo da apresentacao
5. outline global
6. contexto local do slide

## O que nunca deve ir em todo prompt

- texto completo de todos os slides anteriores
- historico de iteracoes irrelevantes
- assets nao utilizados
- exemplos em excesso
- regras duplicadas em varios arquivos

## Estrategia de arquivos para contexto

Criar documentos pequenos, cada um com uma funcao clara:

- especificacao do produto
- arquitetura
- rubrica de qualidade
- contratos de prompt
- schemas
- pipeline

Evitar um unico documento gigante.

## Estrategia de resumo

Cada etapa do pipeline deve gerar um resumo curto para a proxima etapa.

Exemplo:

- `normalized_brief.json`
- `presentation_plan.json`
- `presentation_summary.md`
- `slide_packets/s01.json`

## Pacote ideal por slide

Cada slide deve ser processado com um "packet" proprio:

```json
{
  "slide_id": "s07",
  "slide_role": "argument",
  "section": "market-opportunity",
  "key_message": "A automacao reduz tempo e aumenta consistencia",
  "audience": "executivos",
  "tone": "premium, objetivo",
  "archetype": "2_col_argument",
  "content_constraints": {
    "max_bullets": 4,
    "max_words_per_bullet": 10
  },
  "adjacent_context": {
    "previous_slide_goal": "definir problema",
    "next_slide_goal": "mostrar evidencias"
  }
}
```

## Regras para evitar degradacao do contexto

- nao permitir que um agente reescreva regras globais
- manter schemas como fonte de verdade
- validar JSON de saida sempre
- gerar logs por etapa
- registrar justificativas curtas para decisoes de layout

## Padrao de recuperacao de contexto

Quando a IA falhar, o sistema deve permitir diagnostico por:

- input da etapa
- output da etapa
- prompt usado
- modelo usado
- score de qualidade

## Regra de ouro

Prompt grande nao e igual a contexto bom.

O sistema deve entregar apenas o contexto certo, no momento certo, para a etapa certa.
