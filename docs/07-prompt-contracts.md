# Contratos de Prompt

## Objetivo

Padronizar prompts para garantir saidas previsiveis e validaveis.

## Regras gerais

- exigir JSON quando a etapa produz estrutura
- fornecer schema e enums fechados
- explicitar restricoes de tamanho
- definir papel da etapa com clareza
- evitar prompts literarios demais

## Estrutura base de prompt

Cada prompt deve conter:

1. papel do agente
2. objetivo da etapa
3. contexto minimo necessario
4. regras obrigatorias
5. formato de saida
6. criterios de erro

## Exemplo: Brief Normalizer

```text
Voce e o agente responsavel por normalizar um briefing de apresentacao.
Sua tarefa e converter a entrada livre em um objeto JSON valido seguindo exatamente o schema abaixo.
Nao invente dados. Quando houver ambiguidade, registre em "open_questions".
```

## Exemplo: Narrative Planner

```text
Voce e o planejador narrativo da apresentacao.
Sua tarefa e criar uma sequencia de slides que leve o publico do problema a conclusao.
Cada slide deve ter apenas uma mensagem principal.
Retorne apenas JSON valido.
```

## Exemplo: Slide Writer

```text
Voce esta escrevendo o conteudo de um unico slide.
Considere o papel narrativo, o archetype e as restricoes de densidade.
Escreva texto proprio para slide, nao para documento.
Retorne apenas JSON valido.
```

## Exemplo: Quality Critic

```text
Voce esta avaliando um slide com base em uma rubrica objetiva.
Identifique falhas concretas e proponha correcoes acionaveis.
Nao reescreva o slide inteiro a menos que isso seja necessario.
Retorne apenas JSON valido.
```

## Anti-padroes

- prompt sem schema de saida
- prompt com contexto demais e sem prioridade
- prompt que mistura criacao e avaliacao na mesma etapa
- prompt que permite texto livre quando o sistema espera JSON
- prompt com exemplos contraditorios

## Politica de exemplos

Exemplos sao uteis apenas quando:

- mostram o formato correto
- esclarecem o nivel de qualidade esperado
- nao engessam estilo em excesso

## Versionamento

Todo prompt operacional deve ter:

- `prompt_id`
- `version`
- `owner`
- data da ultima alteracao

## Regra de seguranca semantica

Se o modelo nao tiver informacao suficiente:

- nao preencher lacunas silenciosamente
- explicitar suposicoes
- registrar `open_questions` ou `assumptions`
