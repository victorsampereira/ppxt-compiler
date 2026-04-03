# Visao do Produto

## Problema

Ferramentas de geracao de slides normalmente falham em um ou mais pontos:

- narrativa fraca
- excesso de texto
- layout generico
- inconsistencia visual entre slides
- dependencia alta de ajuste manual

Este projeto existe para resolver isso com uma abordagem hibrida:

- IA para estrategia e conteudo
- regras deterministicas para design e composicao

## Usuario-alvo

Uso individual pelo proprio autor do projeto.

Isso muda o desenho do produto:

- nao precisa de multi-tenant no MVP
- nao precisa de billing interno
- nao precisa de fluxo complexo de permissao
- pode priorizar velocidade de iteracao local

## Objetivo principal

Receber um roteiro e um briefing visual e gerar uma apresentacao `.pptx` pronta para uso, com nivel profissional.

## Objetivos secundarios

- reduzir tempo de preparacao de apresentacoes
- manter consistencia de estilo
- permitir reaproveitamento de brand kits e templates
- produzir variacoes de uma mesma narrativa

## Nao objetivos no MVP

- colaboracao em tempo real
- editor visual completo
- marketplace de templates
- sincronizacao com Google Slides
- suporte amplo a multiplos idiomas de forma especializada

## Requisitos funcionais

- receber briefing em texto livre e formato estruturado
- normalizar entrada em schema interno
- gerar outline da apresentacao
- definir intencao de cada slide
- selecionar archetype de layout por slide
- gerar copy curta e adequada para slide
- inserir imagens, icones, tabelas e graficos quando necessario
- renderizar `.pptx`
- gerar versao PDF ou thumbnails no futuro
- executar validacoes de qualidade

## Requisitos nao funcionais

- previsibilidade de output
- facilidade de debug
- baixo custo operacional
- alta reutilizacao de componentes visuais
- rastreabilidade do processo por arquivos JSON intermediarios

## Principio central de qualidade

Cada slide deve ter:

- uma mensagem principal clara
- hierarquia visual forte
- densidade adequada ao contexto
- composicao deliberada, nao acidental

## Criterio de sucesso

Uma apresentacao e considerada boa quando:

- o fluxo narrativo faz sentido sem reescrita pesada
- o arquivo abre corretamente no PowerPoint
- poucos ou nenhum slide exigem retrabalho estrutural
- a apresentacao nao parece um template generico preenchido automaticamente
