# Auditoria editorial do baralho

Data da revisão: **14/09/2026**  
Escopo: baralho versionado em `src/dados/`, fluxo de partida e documentação pública.

## Resultado executivo

O baralho está estruturalmente consistente para continuar a implementação: são 500 cartas,
100 em cada coleção, todas carregadas pelo aplicativo, com identificadores, títulos, situações e
soluções únicos após normalização local. Todas têm de 3 a 4 fatos-chave e não foi encontrado
vazamento da solução completa para a situação.

A principal pendência não é técnica: **289 cartas têm `origem.referencia` vazia**. Isso impede
afirmar que uma carta é original, licenciada ou de domínio público apenas olhando o JSON. A
coleção de casos reais tem referências preenchidas, mas a amostra não equivale a uma checagem
factual completa. Também não foi realizada uma partida presencial com um grupo nesta sessão.

## Método

- leitura das cinco listas JSON e validação pelo mesmo carregador usado pelo app;
- execução de `python scripts/auditar_baralho.py`, que verifica contagem, ids, duplicatas
  normalizadas, campos vazios e solução repetida na situação;
- amostra determinística das posições **1, 20, 40, 60, 80 e 100** de cada coleção;
- revisão do fluxo no navegador de desenvolvimento e dos testes do app: iniciar, revelar com
  confirmação, acessar o verso, marcar fatos e avançar;
- leitura do README, LICENSE e IA.md, com ajuste das afirmações que não podiam ser sustentadas
  pela inspeção local;
- comparação local de texto não substitui revisão de direitos, atribuição de autoria nem
  conferência de fatos históricos.

## Achados por coleção

| Coleção | Distribuição observada | Achado editorial | Pendência específica |
| --- | --- | --- | --- |
| **Cômicas** | 100 cartas; 43 fáceis, 50 médias e 7 difíceis; 10 com aviso; 2 autorais e 98 de IA; 98 sem referência | A amostra mantém o tom de coincidência e humor nervoso, com situações e soluções compreensíveis. | Revisar as 98 procedências vazias e conferir se os finais cômicos não dependem de premissas jurídicas ou operacionais frágeis. |
| **Pesadas** | 100 cartas; 4 fáceis, 45 médias e 51 difíceis; 80 com aviso; 3 autorais e 97 de IA; 97 sem referência | A amostra é coerente e sombria, sem detalhe gráfico dominante, mas a concentração de dificuldade e tema criminal pede teste com grupo. | Conferir se o aviso de conteúdo acompanha todas as situações sensíveis e ajustar dificuldade após uma partida real. |
| **Casos reais** | 100 cartas; 8 fáceis, 67 médias e 25 difíceis; 59 com aviso; 100 de internet; 100 referências preenchidas | As seis cartas amostradas apontam para episódios reconhecíveis e as referências estão registradas. | Fazer uma checagem factual carta a carta antes de apresentar o conjunto como fonte histórica; uma referência é genérica demais para auditoria independente. |
| **Da internet** | 100 cartas; 40 fáceis, 45 médias e 15 difíceis; 22 com aviso; 100 de internet; 38 referências “enigma clássico de domínio público” e 62 “variação de enigma clássico” | A amostra funciona como raciocínio lateral e não repetiu texto de outra carta no repositório. | “Domínio público” não foi comprovado por essa etiqueta. Identificar a fonte de cada clássico ou substituir o texto por uma versão autoral licenciada. |
| **Creepypasta** | 100 cartas; 16 fáceis, 66 médias e 18 difíceis; 23 com aviso; 1 autoral, 5 de internet e 94 de IA; 94 sem referência | A amostra entrega terror curto com explicação concreta; várias cartas se aproximam mais de curiosidade técnica do que de horror. | Completar procedência, revisar avisos e decidir se o equilíbrio entre terror e explicação combina com uma partida em grupo. |

As médias de fatos-chave ficaram entre **3,19 e 3,99** por carta; as durações declaradas ficaram
entre **10 e 25 minutos**. A comparação local não encontrou duplicatas normalizadas de título,
situação ou solução entre as 500 cartas. Isso é um sinal de variedade do repositório, não uma
certificação de que nenhuma fonte externa contém texto semelhante.

## Direitos, inspiração e factualidade

O README agora descreve explicitamente a inspiração em *Black Stories* e a ausência de vínculo
com a Galápagos ou com os detentores de direitos. A própria Galápagos descreve a localização do
formato como *Histórias Sinistras*; a documentação de regras publicada pela moses identifica
Holger Bösch como autor e reserva os direitos da obra original:

- [Descrição editorial de Histórias Sinistras pela Galápagos](https://lojistagalapagosjogos.wordpress.com/2021/07/02/historias-sinistras-black-stories/)
- [Regras de Black Stories publicadas pela moses (PDF)](https://www.moses-verlag.de/media/48/68/02/1599659367/212-0_black_stories_Anleitung_web.pdf)

Nenhuma conclusão de “não há cópia literal” ou “é domínio público” deve ser registrada como
fato jurídico com base nesta auditoria. O que foi medido foi apenas o conteúdo presente no
repositório. A LICENSE mantém a MIT para o código e deixa explícito que o campo `origem` pode
estar incompleto e não concede licença para histórias de terceiros.

## Ajustes implementados

- filtros de dificuldade e tema ganharam `aria-pressed`, foco visível e área mínima de toque;
- fatos-chave ganharam área mínima de toque e foco visível;
- ao marcar todos os fatos, a rodada exibe “História resolvida” antes da leitura do verso;
- o teste do baralho passou a exigir exatamente 500 cartas e exatamente 100 por coleção;
- o gate verifica duplicatas de título, situação e solução após normalização e reforça o teste de
  vazamento do verso;
- README, LICENSE e IA.md passaram a distinguir transparência editorial de licença, autoria e
  verificação factual;
- `scripts/auditar_baralho.py` tornou a inspeção estrutural repetível e sem escrita nos dados.

## Critérios de aceite e próximos passos

| Critério | Situação | Evidência |
| --- | --- | --- |
| Relatório escrito por coleção | **Concluído** | Este arquivo e o registro da tarefa no Notion. |
| Regra crítica coberta por teste | **Concluído** | Testes de sorteio sem reposição existentes e novos guardas em `src/dados/baralhoBase.test.ts`. |
| Uma partida real com grupo | **Pendente** | O ambiente permitiu validar o fluxo automatizado/navegador, mas não substitui um grupo presencial. |
| README explicita a inspiração | **Concluído** | Seção “Sobre o conteúdo” do README, com fontes e aviso de ausência de vínculo. |

Pendências que devem virar tarefas acompanháveis:

1. jogar uma partida presencial e registrar ajustes de dificuldade, ritmo e avisos;
2. preencher ou retirar com revisão humana as 289 referências de origem vazias;
3. fazer revisão factual dos 100 casos reais;
4. decidir a origem/licença das cartas clássicas da coleção Da internet;
5. validar a experiência em um aparelho físico, além do navegador de desenvolvimento.

