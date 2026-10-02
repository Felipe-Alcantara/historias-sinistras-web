# Auditoria editorial do baralho

Data da revisão: **14/09/2026**  
Escopo: baralho versionado em `src/dados/`, fluxo de partida e documentação pública.

> **Revisão integral em 27/09/2026:** as 500 cartas foram lidas uma a uma e 179 foram
> corrigidas. Veja a seção "Revisão integral — 27/09/2026", no fim do documento; ela substitui
> as conclusões por amostra abaixo, que ficam como registro.

> **Procedência em 02/10/2026:** nenhuma carta tem mais `origem.referencia` vazia (eram 281).
> Veja a seção "Procedência — 02/10/2026", antes do apêndice.

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

---

## Revisão integral — 27/09/2026

Escopo: as **500 cartas lidas uma a uma**, a regra crítica testada por mutação e o fluxo mobile
medido no build de produção. Esta seção substitui as conclusões por amostra da revisão de
14/09/2026, que continuam acima como registro.

### Por que refazer a revisão

A revisão de 14/09 leu 6 cartas por coleção (30 de 500) e encontrou cartas coerentes. A leitura
integral mostrou que o defeito que a tarefa chama de pior do gênero — enigma que não fecha —
existia em escala: **148 cartas precisaram de correção de conteúdo** e outras **31 só de ajuste
no aviso**, 179 no total (36% do baralho). Uma amostra de 6% não tinha como achar isso.

### Método

- Leitura de situação, solução, fatos-chave, título, temas e avisos de cada carta, conferindo:
  a frente contradiz o verso? a solução fecha com todos os detalhes da frente? dá para chegar lá
  com perguntas de sim ou não? o título ou o aviso entregam a resposta? a premissa se repete em
  outra carta? há erro factual que eu conheça com segurança?
- Premissas parecidas também foram procuradas por vocabulário (TF-IDF com cosseno sobre
  situação e solução, `scripts/premissas.py`). O método achou as três cartas de beisebol e os
  dois bolos cenográficos; as demais repetições só apareceram na leitura — é um sinal, não um
  veredito, e por isso ficou como lista para leitura humana na auditoria e no mesclador.
- Toda correção foi aplicada por `scripts/aplicar_revisao.py`, com um motivo por carta, os ids
  preservados e o gate do baralho rodando depois de cada coleção. O motivo de cada carta está no
  apêndice abaixo.
- Cartas fracas mas coerentes não foram reescritas: ficaram anotadas (lista mais abaixo). O
  critério para reescrever foi defeito que quebra a partida, não gosto.
- **Avisos de conteúdo** aparecem na frente da carta. A regra aplicada: aviso de conteúdo
  sensível (morte, homicídio, suicídio, violência, maus-tratos, luto, sequestro, morte de
  criança ou de animal, saúde mental...) fica sempre, mesmo quando dá uma pista; rótulo de
  categoria de crime ou de mecanismo (`fraude`, `envenenamento`, `histeria coletiva`,
  `distúrbio do sono`, `corpo`...) sai quando entrega a resposta, e `morte acidental` e
  `morte súbita` viram `morte`. Nenhum aviso de conteúdo sensível foi removido.
- **Casos reais:** foram corrigidos só os erros factuais que se sabem com segurança. A checagem
  carta a carta, com fonte, continua sendo tarefa própria.

### Decisões do dono do projeto

Perguntadas nesta revisão e registradas como decididas:

- **Tom de Casos reais:** as quatro cartas de tragédias recentes com mortes, famílias vivas e
  processos (`rea-001` Hotel Cecil, `rea-043` Grenfell, `rea-044` Mariana/Brumadinho, `rea-048`
  Boeing 737 MAX) **ficam, com cuidado**: fatos corrigidos e nada sensacionalista. `rea-001`
  perdeu a frase sobre os hóspedes terem bebido a água; `rea-044` deixou de afirmar que o laudo
  de estabilidade "estava tecnicamente correto", o que as investigações contestam.
- **Charadas de lógica em Da internet:** as ~17 charadas de lógica e matemática (três
  interruptores, nove moedas, cinco piratas...) não são histórias para reconstruir com sim/não.
  Decisão: **trocar aos poucos** por enigmas de história, na tarefa de curadoria da coleção.

### Resultado por coleção

| Coleção | Alteradas | Conteúdo | Só aviso | Destaques |
| --- | --- | --- | --- | --- |
| **Cômicas** | 33 | 32 | 1 | Situações que contradiziam a solução (`com-014` "rua" × "rodovia", `com-033` "o próprio casamento" × padrinho); erros factuais (`com-025` bitcoin antes de 2009, `com-026` sala limpa com gente descalça); títulos que entregavam a resposta (`com-031`, `com-043`, `com-090`). |
| **Pesadas** | 49 | 30 | 19 | `pes-098` usava ar-condicionado no máximo para "retardar o resfriamento" do corpo (o efeito é o oposto); `pes-005` tinha a lógica do borrão de canhoto invertida; `pes-031` ignorava a Lei do Cheque; a maior parte dos avisos que entregavam o mecanismo estava aqui. |
| **Casos reais** | 40 | 37 | 3 | Lenda tratada como fato (`rea-004`, a "ponte da morte"); informação desatualizada ou errada (`rea-026` Homem de Somerton, `rea-027` D. B. Cooper, `rea-025`, `rea-029`, `rea-046`, `rea-097`); `rea-015` afirmava na frente o contrário da solução. |
| **Da internet** | 33 | 32 | 1 | Três cartas de beisebol, duas citando a outra ("é beisebol de novo"); três de veneno no gelo, uma com a lógica invertida; física errada (`int-026`, `int-071`, `int-066`, `int-096`). |
| **Creepypasta** | 24 | 17 | 7 | Três cartas com a mesma premissa (pessoa que não envelhece ao fundo de fotos antigas); erros factuais (`cre-075`, `cre-080`, `cre-100`); a descrição da coleção na tela inicial dizia "o inexplicável fica inexplicável", mas todas as cartas têm explicação. |
| **Total** | **179** | **148** | **31** | |

Defeitos por tipo, contados pela menção no motivo (uma carta pode ter mais de um): erro
factual 50, aviso que entregava a resposta 43, contradição entre frente e verso 40, furo lógico
ou solução inalcançável 35, título que entregava ou não casava 16, premissa repetida 13,
redação 8, tom 3, procedência 1.

### Premissas repetidas que saíram

| Premissa | Cartas | O que ficou |
| --- | --- | --- |
| Beisebol ("casa" é a base) | `int-008`, `int-015`, `int-054` | `int-008`, na forma clássica; as outras viraram outros enigmas clássicos |
| Veneno no gelo | `pes-007`, `int-013`, `int-022` | `int-013`; `pes-007` passou ao saleiro e `int-022` virou outro enigma |
| Andar de costas na neve/poeira | `pes-003`, `int-061` | `pes-003` |
| Bolo cenográfico | `com-036`, `com-058` | `com-058`; `com-036` virou isca salgada |
| Troco errado de propósito | `com-051`, `com-095` | `com-051` |
| Pizza como álibi | `com-006`, `pes-080` | `com-006`; `pes-080` usa o histórico do streaming |
| Pessoa que não envelhece em fotos | `cre-012`, `cre-030`, `cre-056` | `cre-012`; `cre-030` usa a câmera panorâmica |
| Andar técnico escondido | `pes-025`, `cre-019` | `cre-019` |
| Porta para o imóvel vizinho | `cre-013`, `cre-060` | `cre-060` |
| Cômodo que esfria | `cre-031`, `cre-084` | `cre-031` |

Depois da revisão, a auditoria lista um único par para leitura humana (`int-013` × `int-025`,
0,26): é intencional — `int-025` é a subversão declarada do enigma do gelo.

### O que ficou anotado, sem reescrever

- **Cartas fracas mas coerentes** (a solução é difícil de alcançar só com perguntas): `pes-030`,
  `pes-082`, `int-044`, `int-049`, `int-092`. Boas candidatas a ajuste depois da partida
  presencial.
- **Casos reais que não são casos específicos:** `rea-078` (espelho na sala de cirurgia),
  `rea-080` (funil de conversão), `rea-083` (amortecedor de prédio) e `rea-086` (o provérbio do
  prego). **A conferir:** `rea-087` (altura da queda da locomotiva) e `rea-095` (parece o caso do
  aeroporto de Houston, mas a referência é genérica).
- **Vocabulário dos avisos** continua sem controle: 57 rótulos diferentes, com pares como
  `morte`/`mortes` e `acidente`/`acidentes`.
- **Famílias de solução repetida** em Creepypasta ("o próprio aparelho disparou sozinho":
  `cre-005`, `cre-021`, `cre-055`, `cre-091`, `cre-093`) e `cre-008` × `rea-069` (alguém morando
  no sótão). Não são a mesma premissa, mas um grupo que jogou uma desconfia da outra.
- `int-010` usa nanismo como mecanismo do enigma; já tem aviso de capacitismo.
- 60 cartas por coleção carregam a chave `colecao` herdada do mesclador. É inofensiva (o app usa
  o arquivo de origem), mas foge do formato das outras.

### Regra crítica e testes

- **Bug no sorteio sem reposição:** ao esgotar um recorte (por exemplo, só Cômicas),
  `sortearProxima` zerava o histórico inteiro, e as cartas jogadas com outro filtro voltavam como
  inéditas. Agora só o histórico do recorte esgotado é zerado. O teste novo falha na versão
  anterior (o histórico virava `['h1']`) e passa com a correção.
- **Testes de mutação** nas regras críticas: revelar sem forçar o verso, resolver com um fato a
  menos, aceitar fato de outra carta, sortear ignorando o histórico e virar sem confirmação foram
  todos pegos pelos testes existentes. **Uma mutação sobreviveu:** a frente mostrando o texto da
  solução passava em todos os testes, porque o teste de fumaça só olhava os selos. O caso novo
  confere o texto da carta sorteada e mata as duas variações testadas.
- **Atalho que pulava a confirmação:** na frente, "Ler a solução em voz alta" revelava o verso
  com um toque, sem "Sou o mestre". Agora o botão só aparece no verso; teste novo cobre o caso.
- `src/dados/vocabularioPython.test.ts` garante que o vocabulário e os limites repetidos em
  `scripts/comum.py` não divergem de `tipos.ts` e `validacao.ts`.
- Total: **52 testes** (eram 46), lint limpo, build aprovado.

### Fluxo mobile

Medido no build de produção com Playwright, em 360×740 e 390×844, percorrendo início, frente,
confirmação, verso e biblioteca:

| Medida | Antes | Depois |
| --- | --- | --- |
| Texto abaixo do contraste AA (4,5:1) | 11 casos em 5 telas, todos em `text-zinc-500` (3,98–4,15:1) | nenhum; menor contraste 6,47:1 |
| Alvos de toque abaixo de 44 px | "Início" da rodada (80×36), 500 botões "Tirar do sorteio" (40×36), busca (42 px) | nenhum entre os 1.102 alvos medidos |
| Ícones de Importar/Exportar | somem em 360 px, espremidos em 390 px | 16×16, sem estouro em 320, 360 e 390 px |
| Rótulos | "Nao", "Quase la", "facil", "misterio" | "Não", "Quase lá", "fácil", "mistério" |
| Chips do editor | ~26 px, sem estado acessível | 44 px, com `aria-pressed` |

Sem rolagem horizontal e sem erro no console em nenhuma tela. A carta vira por um botão grande,
não por gesto de deslizar, e o verso só abre depois de "Sou o mestre" — depois da correção do
atalho, não há mais caminho de um toque só até o segredo.

**Limites desta medição:** foi feita em navegador headless, não em aparelho físico, e ninguém
jogou uma partida real. Brilho de tela, reflexo, mão de outra pessoa e o ritmo do grupo continuam
sem validação — são as tarefas de aparelho físico e de partida presencial.

### Critérios de aceite

| Critério | Situação | Evidência |
| --- | --- | --- |
| Parecer escrito por coleção | **Concluído** | Esta seção e o apêndice, com o motivo de cada uma das 179 cartas alteradas. |
| Regra crítica coberta por teste | **Concluído e reforçado** | Dois bugs corrigidos com teste que falha antes (sorteio entre filtros, atalho do verso) e uma lacuna fechada (texto da solução na frente). |
| Pelo menos uma partida real | **Pendente** | Depende de um grupo presencial; segue como tarefa própria. |
| README explicita a inspiração | **Concluído** | Seção "Sobre o conteúdo" do README (desde 14/09). |

## Procedência — 02/10/2026

Escopo: as **281 cartas com `origem.referencia` vazia** (Cômicas 97, Pesadas 94, Creepypasta 90)
e as **5 marcadas como "autoral — Escrita para este projeto"** (`com-002`, `pes-001`, `pes-002`,
`pes-003`, `cre-001`). Total: 286 cartas, só o campo `origem` mudou; ids, textos e fatos-chave
ficaram como estavam.

### De onde as cartas vieram — medido no git

As três coleções nasceram em três commits de 10/08/2026, todos co-escritos pelo Claude Opus 5
(`Co-Authored-By` na mensagem). Os ids de cada lote foram lidos com
`git show <commit>:src/dados/<colecao>.json`:

| Commit | Hora | Cartas que entraram (em cada coleção) |
| --- | --- | --- |
| `2c42c32` | 04:27 | `001` a `040` |
| `218318a` | 04:49 | `041` a `070` |
| `c606212` | 05:04 | `071` a `100` |

As cinco "autorais" entraram no `2c42c32`, junto com as de IA. Perguntado, o dono do projeto
confirmou que **não** as escreveu: foram reclassificadas como `ia`.

### Regra aplicada

- Carta escrita por IA sem premissa reconhecível: `tipo: ia`, referência
  `Escrita por IA (Claude Opus 5) para este projeto; commit <sha> de 10/08/2026`.
- Carta cuja premissa é um enigma, truque, lenda ou caso conhecido: `tipo: internet`, referência
  `Variação de <fonte>; texto por IA, commit <sha>` — o mesmo critério já usado em `com-001`.
- Carta que só lembra uma obra ou conceito: continua `ia`, com `lembra <fonte>` no fim.
- As 8 cartas reescritas em 27/09/2026 já tinham referência e não mudaram.

### Premissas reconhecidas na leitura das 286 cartas

| Carta | Tipo | Fonte reconhecida |
| --- | --- | --- |
| `com-005` | internet | anedota (apócrifa) de Chaplin num concurso de sósias de si mesmo |
| `com-049` | internet | caso real da PC Pitstop (2005), que premiou quem leu a licença |
| `com-050` | internet | enigma clássico do aniversário em 29 de fevereiro |
| `pes-003` | internet | truque clássico das pegadas feitas andando de costas |
| `pes-016` | internet | truque clássico do quarto trancado com a chave puxada por barbante |
| `cre-008` | internet | lenda urbana do intruso que mora escondido na casa |
| `cre-089` | internet | hipótese do infrassom de Vic Tandy (1998), da mesma família de `cre-022` |
| `com-015` | ia | lembra "Silver Blaze", de Conan Doyle (o cão que não latiu) |
| `com-084` | ia | lembra o paradoxo de Abilene |
| `cre-026` | ia | lembra Tom Sawyer assistindo ao próprio funeral |

Resultado da auditoria: Cômicas `ia=96, internet=4`; Pesadas `ia=98, internet=2`; Creepypasta
`ia=93, internet=7`; **0 referências vazias** no baralho inteiro.

### Guarda contra regressão

Referência vazia agora reprova os dois gates: o teste `toda carta diz de onde veio`
(`src/dados/baralhoBase.test.ts`) e a lista de falhas de `python scripts/auditar_baralho.py`.
Os dois foram rodados antes da correção e reprovaram, listando as 281 cartas.

### Limites desta revisão

- A referência diz **onde o texto foi escrito**, não que ele seja inédito. Um modelo pode
  reproduzir premissas de terceiros; a busca por elas foi a leitura humana das 286 cartas, sem
  comparação automatizada com a web nem com as cartas oficiais de *Black Stories*, que não estão
  disponíveis para consulta.
- Tropos genéricos de mistério (gêmeo como álibi, relógio parado, arma limpa demais, confissão
  que erra o detalhe não divulgado) não foram tratados como fonte: não têm um autor ou texto de
  origem identificável.
- As fontes citadas na tabela foram reconhecidas pelo revisor, não reconferidas na web nesta
  sessão.

## Apêndice — cartas alteradas na revisão de 27/09/2026

Gerado a partir dos arquivos de revisão aplicados com `scripts/aplicar_revisao.py`. Formato: id, campos alterados e motivo. Os ids foram preservados.

### Cômicas — 33 cartas (32 com mudança de conteúdo, 1 só de aviso)

- `com-001` (origem): procedência: rotulada como autoral, mas é o enigma clássico do vigia que sonhou em serviço.
- `com-002` (solucao, fatosChave): lógica: o bloqueio da conta não tinha função na solução.
- `com-006` (solucao, fatosChave): furo lógico: ninguém em casa para receber a pizza, e a rotina semanal não tinha motivo.
- `com-008` (solucao, fatosChave): solução inalcançável e juridicamente frágil (fundo fora do testamento); troca pela legítima dos herdeiros necessários.
- `com-009` (solucao, fatosChave): furo lógico: a demissão do motorista não se explicava.
- `com-013` (solucao, avisosConteudo): contradição: o caixão 'vazio' levava uma garrafa; aviso 'alcoolismo' entregava a resposta de uma história de recuperação.
- `com-014` (situacao, solucao, fatosChave): contradição e erro factual: a situação dizia 'rua' e a solução, 'rodovia'; usa a regra real do Código de Trânsito.
- `com-016` (solucao, fatosChave): solução arbitrária ('o café perdeu o sentido'), impossível de alcançar com perguntas.
- `com-019` (situacao, solucao, fatosChave, temas): implausível: crachá lido pela janela do prédio vizinho; a acusação dizia 'nunca ter ido trabalhar'.
- `com-021` (situacao): redação: 'o próprio enterro do irmão' sugeria o enterro dele.
- `com-023` (situacao, solucao, fatosChave): contradição: descobre pela televisão, mas a solução fala de obituário no jornal; obituário não torna ninguém 'oficialmente morto'.
- `com-025` (titulo, situacao, solucao, fatosChave): anacronismo: vinte anos atrás a moeda digital ainda não existia (bitcoin é de 2009).
- `com-026` (solucao, fatosChave, temas): erro factual: sala limpa não admite ninguém descalço.
- `com-027` (solucao, fatosChave): contradições: a carne vinha 'do próprio criatório' e de um cachorro fugido; 'semanas antes' e 'na mesma semana'.
- `com-028` (solucao, fatosChave): furo lógico: nem todo mundo que respondesse teria colado.
- `com-030` (avisosConteudo): aviso 'corpo' na frente da carta entregava o carro funerário.
- `com-031` (titulo, solucao, fatosChave): título entregava a resposta ('O sósia do chefe') e a cadeia da promoção não fechava.
- `com-033` (situacao, solucao, fatosChave, dificuldade, duracaoMin): contradição: 'perde o próprio casamento', mas a solução dizia que ele era o padrinho.
- `com-036` (solucao, fatosChave): contradição (bolo 'cenográfico' feito com sal) e premissa repetida com com-058.
- `com-037` (solucao, fatosChave): furo lógico: não havia motivo para o dono rescindir por uma casa assombrada onde ele não mora.
- `com-038` (solucao, fatosChave): implausível: não há exame de rotina antes da vacina antirrábica.
- `com-042` (solucao, fatosChave): furo lógico: morar mais perto do trabalho não faria ninguém se atrasar.
- `com-043` (titulo, situacao, solucao, fatosChave): título entregava a resposta ('O gato herdeiro'); 'localizar' não casava com a solução.
- `com-050` (titulo, situacao, fatosChave): título dava a dica dos quatro anos e as 'velinhas de número quatro' não faziam sentido.
- `com-055` (situacao): contradição: 'não tinha errado nada', mas a solução diz que ele começou antes da hora.
- `com-057` (situacao): contradição: 'durante quarenta anos' contra um derrame recente.
- `com-067` (solucao, fatosChave): erro factual: no Brasil, o imposto de prêmio promocional é pago por quem promove, não pelo ganhador.
- `com-074` (solucao): implausível: dedetização aérea de um quarteirão; troca por pulverização de larvicida com drone.
- `com-078` (solucao): contradição: 'ninguém usava o produto' e mesmo assim houve onda de reclamações.
- `com-081` (solucao, fatosChave): erro de lógica: corrigir um relógio adiantado faria todos parecerem adiantados, não atrasados.
- `com-088` (situacao): contradição: 'dinheiro bem gasto' sem nenhum gasto.
- `com-090` (titulo): título entregava a resposta ('A festa do prédio errado').
- `com-095` (titulo, situacao, solucao, fatosChave, origem): contradição (gênero trocado, teste sem lógica) e premissa repetida com com-051 (troco errado); premissa nova.

### Pesadas — 49 cartas (30 com mudança de conteúdo, 19 só de aviso)

- `pes-003` (avisosConteudo): aviso 'hipotermia' na frente da carta entregava o mecanismo.
- `pes-005` (titulo, situacao, solucao, fatosChave): erro factual: a lógica do borrão estava invertida (quem escreve da esquerda para a direita e borra é o canhoto); situação afirmava que a letra era da vítima.
- `pes-006` (titulo, situacao, solucao, fatosChave): furo lógico: duas passagens no mesmo nome não tinham função (o gêmeo só precisava de uma).
- `pes-007` (solucao, fatosChave, avisosConteudo): premissa repetida (veneno no gelo, também em int-013 e int-022); aviso 'envenenamento' entregava o mecanismo.
- `pes-010` (titulo, situacao, solucao, fatosChave): implausível: um toque de campainha levando alguém a silenciar um alarme de gás; a situação afirmava que era a campainha.
- `pes-011` (solucao): redação: 'assinou a autorização' sem dizer de quê.
- `pes-012` (solucao, fatosChave, avisosConteudo): erro factual: climatização regulada não superaquece a cabine; troca por calor extremo com o ar desligado.
- `pes-013` (avisosConteudo): aviso 'morte acidental' entregava que não era crime.
- `pes-014` (solucao, fatosChave, temas, avisosConteudo): solução incompleta (a morte não era explicada) e confusa ('devedores antigos').
- `pes-016` (solucao, fatosChave): erro factual: não se enfia uma chave na fechadura puxando um barbante; troca pelo truque clássico de girar a chave.
- `pes-017` (situacao): contradição: paciente 'em estado grave' e cirurgia desnecessária.
- `pes-022` (avisosConteudo): aviso 'morte súbita' entregava que a morte foi natural.
- `pes-023` (situacao, solucao, fatosChave, temas): contradição: pulseiras 'corretas' com o bebê errado.
- `pes-025` (titulo, situacao, solucao, fatosChave, avisosConteudo, origem): premissa repetida com cre-019 (andar técnico escondido) e mecanismo implausível (corpo apertando o botão por dias); premissa nova.
- `pes-027` (solucao, fatosChave): furo lógico: 'nunca foi lá; foi resolver a testemunha' se contradizia e não levava à conclusão da esposa.
- `pes-029` (solucao, fatosChave): contradição: detalhes que 'só apareceriam na perícia' e que ao mesmo tempo 'estavam errados'.
- `pes-031` (solucao, fatosChave): erro factual: pela Lei do Cheque (art. 37), a morte de quem emitiu não invalida o cheque.
- `pes-033` (avisosConteudo): aviso 'tráfico de drogas' entregava a resposta e não é aviso de conteúdo sensível.
- `pes-035` (situacao, solucao, fatosChave, avisosConteudo): contradição: anel 'apertado demais' num dedo que emagreceu; 'identificada' contra 'identidade forjada'.
- `pes-037` (solucao): redação: 'retirava as doses que causavam as mortes' era ambíguo.
- `pes-038` (solucao, fatosChave): furo lógico: o sequestro do filho 'ao fundo', no mesmo instante da agressão, não fazia sentido.
- `pes-039` (avisosConteudo): aviso 'chantagem' entregava a resposta e não é aviso de conteúdo sensível.
- `pes-041` (situacao): redação: 'no próprio quarto' depois de uma troca de quartos.
- `pes-042` (avisosConteudo): aviso 'fraude' entregava a resposta e não é aviso de conteúdo sensível.
- `pes-043` (titulo, avisosConteudo): aviso 'corpo' entregava o que havia no freezer; título não tinha relação com a carta.
- `pes-044` (titulo): título contradizia a situação ('O aluno que faltou' e 'sem que tenha faltado').
- `pes-045` (solucao, fatosChave, temas): furo lógico: uma tornozeleira presa no braço continua rastreando quem a usa.
- `pes-046` (avisosConteudo): aviso 'sedação' entregava o mecanismo.
- `pes-049` (situacao, solucao, fatosChave): contradição e erro factual: relógios 'parados' que teriam sido 'ajustados' (e o do celular não para).
- `pes-056` (avisosConteudo): aviso 'fraude' entregava a encenação.
- `pes-060` (avisosConteudo): aviso 'fraude' não é aviso de conteúdo sensível.
- `pes-063` (situacao, solucao): implausível: uma gravação em loop não 'conversa' com o motorista.
- `pes-066` (avisosConteudo): aviso 'tráfico de drogas' entregava a resposta.
- `pes-067` (avisosConteudo): avisos 'corpo' e 'incêndio' entregavam como o corpo ficou irreconhecível.
- `pes-070` (titulo, situacao, solucao, fatosChave, temas, dificuldade, duracaoMin, origem): furo lógico: diferença de pressão não abre porta trancada; premissa nova.
- `pes-077` (avisosConteudo): aviso 'envenenamento' entregava o que as anotações escondiam.
- `pes-080` (titulo, situacao, solucao, fatosChave, temas, origem): contradição ('realmente sozinho' e 'alguém entrou') e premissa próxima de com-006 (pizza como álibi); premissa nova.
- `pes-081` (avisosConteudo): aviso 'ocultação de cadáver' entregava a resposta.
- `pes-084` (avisosConteudo): aviso 'incêndio criminoso' entregava que o vazamento foi provocado.
- `pes-085` (avisosConteudo): aviso 'fraude' entregava a resposta.
- `pes-088` (avisosConteudo): aviso 'fraude' não é aviso de conteúdo sensível.
- `pes-089` (situacao): contradição: 'quarta pessoa' na situação e 'terceira pessoa' nos fatos.
- `pes-091` (situacao, solucao, fatosChave, avisosConteudo): erro factual: o conteúdo da geladeira não data a última refeição de ninguém (isso é o conteúdo do estômago).
- `pes-092` (avisosConteudo): aviso 'fraude' entregava que não houve sequestro.
- `pes-093` (solucao, fatosChave): furo lógico: um registro fechado não molha parede nenhuma.
- `pes-095` (avisosConteudo): avisos 'corpo' e 'fraude' entregavam o motivo.
- `pes-097` (solucao, fatosChave): contradição: apólice 'em nome dela' e 'o segurado é ele'.
- `pes-098` (solucao, fatosChave): erro factual: ar-condicionado no máximo acelera o resfriamento do corpo e empurraria a hora da morte para trás, não para a frente.
- `pes-100` (avisosConteudo): aviso 'negligência' entregava a resposta.

### Casos reais — 40 cartas (37 com mudança de conteúdo, 3 só de aviso)

- `rea-001` (solucao, avisosConteudo): tom (decisão do dono: manter com cuidado): tira a frase sensacionalista sobre os hóspedes beberem a água; aviso 'corpo' entregava a resposta.
- `rea-002` (situacao, solucao, fatosChave): erro factual: apresentava como certo que o navio afundou por causa dos binóculos; a situação misturava a chave e o armário.
- `rea-004` (situacao, solucao, fatosChave, avisosConteudo): erro factual: 'quase todos morreram' é a lenda da 'ponte da morte', nunca comprovada; aviso 'radiação' entregava a resposta.
- `rea-005` (situacao): erro factual: 'usando o rádio corretamente' é falso (a fraseologia ambígua fez parte do acidente).
- `rea-006` (situacao): imprecisão: o segundo irmão foi achado a poucos metros de onde o primeiro estava, não da porta.
- `rea-007` (solucao, fatosChave): os fatos-chave apresentavam como certo o que é hipótese.
- `rea-008` (solucao, fatosChave): erro factual: nem todos morreram de hipotermia (três tinham ferimentos graves).
- `rea-011` (situacao): exagero: 'quase todas estão mortas'.
- `rea-012` (situacao): erro factual: o tanque ficava ao lado do porto de Boston ('não havia mar por perto' é falso).
- `rea-013` (situacao, avisosConteudo): as mortes são relato de crônicas, disputado; aviso 'histeria coletiva' entregava a resposta.
- `rea-014` (solucao): imprecisão: quem conhecia a pista desativada era o copiloto.
- `rea-015` (titulo, situacao): contradição: situação e título diziam que desligaram o motor avariado/certo, e a solução é o contrário.
- `rea-017` (solucao): erro factual comum: não foi ressonância simples, foi flutter aeroelástico.
- `rea-021` (situacao): erro factual: a nave se desintegrou aos 73 segundos, mas a cabine só atingiu o mar depois.
- `rea-022` (solucao): nuance: o surto já perdia força quando o cabo da bomba foi retirado.
- `rea-025` (situacao, avisosConteudo): erro factual: três das vítimas eram da mesma família e as mortes não foram num fim de semana; aviso 'envenenamento' entregava a resposta.
- `rea-026` (solucao, fatosChave): desatualizado: em 2022 uma pesquisa genealógica de DNA apontou um nome provável.
- `rea-027` (solucao): erro factual: parte do dinheiro apareceu em 1980, enterrada na margem do rio Columbia.
- `rea-029` (situacao, solucao): erro factual: o local do acidente fica a cerca de 3.600 metros, não a cinco mil; a discussão pública não era sobre 'crime'.
- `rea-033` (situacao): erro factual: o pouso no rio foi cerca de seis minutos depois da decolagem.
- `rea-036` (titulo): título sem relação com a carta.
- `rea-037` (avisosConteudo): aviso 'intoxicação' entregava a resposta.
- `rea-042` (avisosConteudo): aviso 'radiação' entregava a resposta.
- `rea-043` (situacao): erro factual: a reforma terminou em 2016 e o incêndio foi em 2017 ('anos depois'); tom (decisão do dono: manter com cuidado).
- `rea-044` (situacao, solucao, fatosChave): erro factual e tom (decisão do dono: manter com cuidado): 'o laudo estava tecnicamente correto' é contestado pelas investigações e pelos processos.
- `rea-046` (situacao): erro factual: a ponte fechou dois dias depois da inauguração, não no mesmo dia.
- `rea-049` (situacao, avisosConteudo): exagero ('milhares de pessoas cegas'); aviso 'intoxicação' entregava a resposta.
- `rea-053` (titulo): título sem relação com a carta.
- `rea-058` (situacao): erro factual: muitas das vítimas eram crianças, mas não a maioria.
- `rea-063` (titulo): título entregava a solução ('alfinete').
- `rea-064` (avisosConteudo): aviso 'histeria coletiva' entregava a resposta.
- `rea-068` (solucao): erro factual: o condenado era um homem.
- `rea-069` (titulo): título contradizia a carta ('Ninguém morava na fazenda').
- `rea-073` (titulo, situacao): erro factual: a queda durou cerca de quatro horas, não dez; 'um único caractere' é simplificação.
- `rea-074` (situacao): erro factual: ele reportou o alerta como falha do sistema, não deixou de reportar.
- `rea-075` (titulo): título entregava a vaca e a lanterna.
- `rea-077` (situacao, solucao, fatosChave): erro factual: ele ainda aprendia habilidades motoras; perdeu a memória nova de fatos e acontecimentos.
- `rea-084` (situacao, solucao, fatosChave): erro factual: a história dos guardas é tradição sem comprovação, e Parmentier não era governante.
- `rea-091` (titulo): título sem relação com a carta.
- `rea-097` (titulo, situacao): erro factual: a sangria foi usada por mais de dois mil anos, não dois séculos.

### Da internet — 33 cartas (32 com mudança de conteúdo, 1 só de aviso)

- `int-003` (situacao, solucao): redação: 'a três metros do chão' exigiria um bloco de gelo enorme; 'o que sobrou dele' era ambíguo.
- `int-004` (avisosConteudo): aviso 'morte de animal' na frente da carta entregava que Romeu e Julieta não são pessoas.
- `int-008` (titulo, situacao, solucao, fatosChave): premissa repetida três vezes (int-008, int-015, int-054, com referências cruzadas 'de novo'); fica só esta, na forma clássica.
- `int-012` (situacao, solucao, fatosChave): contradição: a situação diz que a voz pede socorro e a solução, que não pedia; a pista do cadastro vazado era inalcançável.
- `int-013` (titulo, situacao, solucao, fatosChave, avisosConteudo): contradição: 'o vinho estava envenenado' e 'a garrafa estava limpa'; aviso 'envenenamento' entregava o mecanismo.
- `int-014` (solucao): contradição: balão 'sobre o mar', mas o corpo está num campo.
- `int-015` (titulo, situacao, solucao, fatosChave, temas): segunda carta de beisebol, com 'desta vez' e 'de novo' citando outra carta; troca por outro enigma clássico.
- `int-019` (solucao): imprecisão: 'nenhum' degrau submerso ignora os que já estavam embaixo d'água.
- `int-021` (situacao, solucao, fatosChave, temas): contradição: a situação diz que ele sai pela porta e a solução usa uma passagem atrás do espelho (versão sem o trocadilho em inglês do original).
- `int-022` (titulo, situacao, solucao, fatosChave, temas, dificuldade, duracaoMin, avisosConteudo, origem): terceira premissa de veneno no gelo, com a lógica invertida (gelo inteiro daria menos veneno a quem bebeu cedo); troca por outro enigma clássico; o rótulo de domínio público não foi herdado pelo enigma novo.
- `int-025` (solucao, fatosChave, avisosConteudo): furo lógico: se só um copo tinha veneno, a velocidade não importava; aviso 'envenenamento' entregava o mecanismo.
- `int-026` (solucao, fatosChave): erro factual: espelho plano não concentra sol para acender fogo, e não há sol à noite.
- `int-030` (solucao): contradição: ela pega o trem das sete e o marido 'almoçava'.
- `int-034` (fatosChave): concordância: 'a substituta' contra 'um colega inexperiente'.
- `int-047` (solucao, fatosChave): furo lógico: a corda precisa estar presa lá em cima para alguém subir.
- `int-054` (titulo, situacao, solucao, fatosChave, temas, avisosConteudo): terceira carta de beisebol, com 'outra vez' citando outra carta; troca por outro enigma clássico.
- `int-060` (situacao, solucao, fatosChave, avisosConteudo): redação confusa ('o mesmo nome dos pais') e alívio sem motivo; premissa simplificada.
- `int-061` (titulo, situacao, solucao, fatosChave, temas, avisosConteudo, origem): solução invertida ('entrou de costas' daria pegadas saindo) e premissa repetida com pes-003 (andar de costas); troca por outro enigma clássico; o rótulo de domínio público não foi herdado pelo enigma novo.
- `int-063` (situacao, solucao, fatosChave): erro de conta: cinco minutos por dia dão 144 dias, não 'duas vezes por ano'.
- `int-064` (titulo, situacao, solucao): contradição: 'ganha a aposta' e 'perdeu dinheiro'.
- `int-066` (situacao, solucao, fatosChave): erro factual: pedra-pomes não impede o copo cheio de transbordar; troca pela tensão superficial.
- `int-070` (titulo): título contradizia a situação ('mentiram' e 'todos dizem a verdade').
- `int-071` (situacao, solucao, fatosChave): erro factual: cruzar a linha internacional de data para leste repete um dia; quem pula é quem cruza para oeste.
- `int-076` (solucao, fatosChave): contradição: 'não consegue se levantar', mas a solução era não conseguir sair da piscina.
- `int-080` (solucao, fatosChave): contradição ('vende por um real' e 'ela pagou um real') e comprador assumindo dívida maior que o imóvel.
- `int-084` (solucao, fatosChave): contradição: três pessoas na ilha, mas a terceira 'já estava na balsa'.
- `int-085` (solucao, fatosChave): solução arbitrária (andaime deitado com 'décimo andar' pintado); troca pela versão clássica.
- `int-086` (solucao, fatosChave): furo lógico: luz fraca não faz ninguém ligar aquecedor; troca pelo retrabalho.
- `int-091` (titulo, situacao, solucao, fatosChave): contradição: 'nunca sai' e 'sai depois com outro número'.
- `int-093` (situacao, solucao, fatosChave): erro de lógica: cortar uma casa ao meio não põe portas de lados opostos na mesma parede.
- `int-096` (situacao, solucao, fatosChave): contradição ('mesmo ambiente' e 'dentro de uma redoma') e erro factual (pouco oxigênio apaga a vela).
- `int-099` (titulo, solucao, fatosChave): contradição: 'pelo mesmo caminho' e 'em sentidos opostos ao redor de um lago'.
- `int-100` (situacao): contradição: borrão 'em qualquer câmera' e 'câmeras rápidas o registrariam'.

### Creepypasta — 24 cartas (17 com mudança de conteúdo, 7 só de aviso)

- `cre-001` (solucao, fatosChave): contradição: a solução dizia que o passageiro 'é o pai dele' e, em seguida, 'é o irmão'.
- `cre-002` (solucao): redação: 'farol de carro' e depois 'caminhão de coleta'.
- `cre-003` (avisosConteudo): aviso 'asfixia' entregava a resposta.
- `cre-005` (solucao): redação: aplicativo de 'gravação de tela' não liga a câmera frontal.
- `cre-007` (solucao, fatosChave): erro factual: sonambulismo acontece dormindo, não logo depois de chegar do trabalho.
- `cre-008` (avisosConteudo): aviso 'invasão de domicílio' entregava a resposta.
- `cre-010` (situacao): contradição: a frente afirmava como fato que o aparelho foi enterrado.
- `cre-013` (situacao, solucao, fatosChave, dificuldade, duracaoMin, origem): premissa repetida com cre-060 (porta para o imóvel vizinho) e solução arbitrária (móveis idênticos por coincidência); premissa nova.
- `cre-014` (avisosConteudo): aviso 'invasão' entregava que havia alguém dentro do carro.
- `cre-016` (titulo, situacao, avisosConteudo): título falava de 'ele' numa história sobre uma mulher; aviso 'invasão' entregava a resposta.
- `cre-018` (avisosConteudo): aviso 'invasão de privacidade' entregava a resposta.
- `cre-022` (solucao, avisosConteudo): exagero ('a explicação mais aceita'); aviso 'intoxicação' entregava a resposta.
- `cre-030` (titulo, situacao, solucao, fatosChave, origem): premissa repetida com cre-012 e cre-056 (pessoa que não envelhece ao fundo de fotos antigas); troca por um fenômeno real de câmera panorâmica.
- `cre-036` (solucao, fatosChave): erro factual: isolamento acústico não bloqueia sinal de celular.
- `cre-056` (titulo, situacao, solucao, fatosChave, temas, origem): terceira carta com a mesma premissa de cre-012 e cre-030, e 'idade escondida pela baixa resolução' por quarenta anos; premissa nova.
- `cre-058` (solucao, fatosChave): erro factual: a desinfecção terminal do leito é feita depois do óbito, não antes.
- `cre-067` (titulo): título ('Não durma com a janela aberta') contradizia as janelas fechadas.
- `cre-069` (avisosConteudo): aviso 'distúrbio do sono' entregava a resposta.
- `cre-075` (situacao, solucao, fatosChave, avisosConteudo): erro factual: ligar para o próprio número não faz o próprio celular tocar.
- `cre-080` (situacao, solucao, fatosChave): erro de lógica: pular o quarto andar faria o botão do sexto levar ao quinto nível, não ao sétimo.
- `cre-082` (avisosConteudo): aviso 'saúde' entregava que a causa é médica.
- `cre-084` (titulo, situacao, solucao, fatosChave, dificuldade, duracaoMin, avisosConteudo, origem): premissa repetida com cre-031 (cômodo que esfria) e solução arbitrária; premissa nova.
- `cre-099` (avisosConteudo): aviso 'distúrbio do sono' entregava a resposta.
- `cre-100` (solucao, fatosChave): erro factual: quando a bateria da placa-mãe acaba, o relógio volta para uma data passada, não futura.
