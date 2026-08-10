# 🤖 IA.md — Contexto operacional do projeto

> Memória técnica de **Histórias Sinistras — web**. Ponto único de recuperação de contexto para
> qualquer modelo ou pessoa que retome o projeto.
>
> **Regra de preservação histórica**: não apague nem reescreva registros antigos. Quando uma
> decisão mudar, acrescente uma entrada datada explicando o que mudou, por que e como foi
> validado.

---

## 🎯 OBJETIVO DO PROJETO

[2026-08-10] Recriar em web o formato de cardgame investigativo em que um mestre conhece a
solução de um caso e os demais jogadores a reconstroem fazendo apenas perguntas fechadas.

O problema real que motivou o projeto: o baralho físico é finito e, depois de um tempo, as
histórias começam a se repetir. A resposta é um baralho grande, ampliável por IA e por
importação de pacotes.

Público: uso doméstico, jogado com amigos. Prioridade: simplicidade e custo zero de operação
acima de escalabilidade.

---

## 🏁 METAS & MILESTONES

- [2026-08-10] ✅ Alinhamento por questionário com o dono do projeto (24 decisões registradas).
- [2026-08-10] ✅ Esqueleto: Vite + React + TypeScript + Tailwind + ESLint + Vitest.
- [2026-08-10] ✅ Domínio puro: tipos, validação, sorteio sem reposição, máquina de rodada.
- [2026-08-10] ✅ Persistência defensiva com testes da regra crítica.
- [2026-08-10] ✅ Interface mobile-first com carta de dois lados.
- [2026-08-10] ✅ Biblioteca com criação, edição e import/export.
- [2026-08-10] ✅ `start_app.py` com menu interativo.
- [2026-08-10] ✅ Gerador de histórias offline por IA.
- [2026-08-10] 🔄 Baralho: **350 de 500** histórias escritas (70 por coleção; a meta pedida é 100
  por coleção). Faltam 30 por coleção. O caminho para fechar é `start_app.py` → Ferramentas →
  Gerar histórias com IA, ou escrever um lote em JSON e usar Mesclar lote.
- [2026-08-10] ⬜ Publicação no GitHub Pages (`npm run deploy`) — nunca executada ainda.

---

## 🛠️ STACK & DEPENDÊNCIAS

[2026-08-10] Front-end: React 19 + TypeScript 5.9 + Vite 8 + Tailwind CSS 4.
[2026-08-10] UI: `framer-motion` 13 (animação) e `lucide-react` (ícones). Nenhuma biblioteca de
componentes — os primitivos são próprios, em `src/componentes/ui/`.
[2026-08-10] Qualidade: ESLint 10 (flat config) + Vitest 4 + jsdom + Testing Library.
[2026-08-10] Deploy: `gh-pages`, com `base: './'` no Vite para funcionar em qualquer subcaminho.
[2026-08-10] Scripts: Python 3.10+, com `questionary` + `rich` no menu e `anthropic` (opcional)
no gerador.
[2026-08-10] Sem backend, sem banco de dados, sem autenticação. Nada disso está previsto.

**TypeScript preso em 5.9**: o `typescript-eslint` 8.66 declara peer `>=4.8.4 <6.1.0`. Com
TypeScript 7, o `npm install` falha com `ERESOLVE`. Revisitar quando o `typescript-eslint`
publicar suporte.

---

## 📐 DECISÕES DE ARQUITETURA

[2026-08-10] **Três camadas, com dependência em sentido único**: `dominio/` (regra pura) ←
`armazenamento/` (localStorage) ← `ganchos/` ← `telas/` e `componentes/`. Nada em `dominio/`
importa React ou toca em `window`. Motivo: a regra do jogo fica testável sem navegador e a
interface pode ser trocada sem risco.

[2026-08-10] **App 100% estático, sem servidor.** Histórias em JSON versionado no repositório +
`localStorage`. Consequência aceita: nada sincroniza entre aparelhos e limpar o navegador apaga
o progresso — por isso export/import é tratado como funcionalidade de primeira classe, não como
extra.

[2026-08-10] **Geração por IA é offline.** O script roda na máquina de quem desenvolve, grava no
JSON e o resultado é commitado. O app publicado nunca chama API. Motivo: custo zero em runtime,
nenhuma chave exposta no build, e o conteúdo passa por revisão humana antes de existir no jogo.

[2026-08-10] **Validação na fronteira, nunca no meio.** `validarHistoria`/`validarLote` recebem
`unknown` e devolvem `Resultado`, sem lançar exceção. O baralho embutido passa pela mesma
validação dos pacotes importados, porque também é escrito por gente e por script. Campo
obrigatório ausente reprova a carta; campo opcional inválido vira padrão seguro — descartar 200
cartas por causa de uma etiqueta errada seria pior que corrigir.

[2026-08-10] **Uma coleção por arquivo JSON, uma história por linha.** A coleção é atribuída em
`baralhoBase.ts` a partir do arquivo de origem, não do campo no JSON: assim é impossível um lote
inteiro ficar com a etiqueta errada por esquecimento. Uma linha por objeto mantém o diff do git
legível quando o gerador acrescenta um lote.

[2026-08-10] **Rodada como reducer puro** (`reduzirRodada`), com o estado da rodada vivendo só em
memória. Rodada não é persistida de propósito: se o navegador fechar no meio, começar outra é
mais barato que carregar estado parcial inconsistente.

---

## 🎨 DECISÕES DE DESIGN & CONVENÇÕES

[2026-08-10] **Código, comentários e nomes em português.** Segue a convenção do ecossistema do
autor. Identificadores sem acento; texto de interface e conteúdo com acentuação correta.

[2026-08-10] **Comentário explica o porquê, não o quê.** Onde há comentário, ele registra a
razão de a solução ser aquela — especialmente nas escolhas defensivas da persistência.

[2026-08-10] **Cor com função semântica**: âmbar (`brasa`) é o que todos podem ver; vermelho
(`sangue`) é o segredo do mestre. A regra vale em toda a interface — se algo está em vermelho, é
spoiler. Base quase preta e fria, tipografia Space Grotesk.

[2026-08-10] **Mobile-first sem PWA.** O aparelho circula na mão durante a partida, então os
alvos de toque são grandes, os painéis sobem de baixo e há respiro para a barra de gestos
(`area-segura`). Funcionamento offline instalável ficou fora do escopo desta etapa.

[2026-08-10] **Quatro respostas em vez de três.** O formato original usa sim/não/irrelevante.
"Quase lá" é uma extensão pedida pelo dono do projeto, para encurtar partidas em que o grupo
está no caminho certo mas travado.

[2026-08-10] Commits em Conventional Commits, direto no `main`, com documentação atualizada no
mesmo passo.

---

## 🧪 TESTES IMPORTANTES

A regra crítica escolhida pelo dono do projeto é **não perder dados salvos**. Como o aparelho é
a única cópia das histórias escritas, os testes cobrem as formas reais de perda silenciosa.

[2026-08-10] ✅ `persistencia` — round-trip de estado sem alterar as histórias da pessoa.
[2026-08-10] ✅ `persistencia` — JSON corrompido é preservado na chave de resgate, não descartado.
[2026-08-10] ✅ `persistencia` — leitura parcial preserva o estado anterior antes de sobrescrever.
[2026-08-10] ✅ `persistencia` — navegador que bloqueia o armazenamento não derruba o app.
[2026-08-10] ✅ `persistencia` — cota cheia devolve erro visível em vez de fingir que salvou.
[2026-08-10] ✅ `portabilidade` — importar soma ao existente e nunca substitui.
[2026-08-10] ✅ `portabilidade` — lista solta de histórias (saída do gerador) é aceita.
[2026-08-10] ✅ `portabilidade` — cartas incompletas são relatadas sem derrubar as boas.
[2026-08-10] ✅ `baralho` — sorteio não repete enquanto houver carta inédita.
[2026-08-10] ✅ `baralho` — ciclo reinicia sinalizado e não emenda a mesma carta duas vezes.
[2026-08-10] ✅ `partida` — resolução exige todos os fatos-chave; revelação força o verso.
[2026-08-10] ✅ `baralhoBase` — nenhuma carta descartada, sem id repetido, sem solução vazada na
frente, mínimo de três fatos-chave por carta.

Total em 2026-08-10: **38 testes, todos passando**. Lint limpo, build de produção em ~1s.

---

## 🐛 BUGS & FIXES RELEVANTES

[2026-08-10] BUG: a contagem de histórias descartadas num lote exagerava o número.
CAUSA: `validarLote` empilhava uma entrada por *erro*, e uma carta sem situação e sem solução
gerava dois erros — a mensagem dizia "2 histórias" para uma carta só.
FIX: os erros de cada carta passaram a ser unidos numa única mensagem, então o tamanho da lista
responde "quantas histórias se perderam". Detectado por teste antes de qualquer uso real.

[2026-08-10] BUG: `npm install` falhava com `ENOSPC` ao criar o projeto no disco E:.
CAUSA: o disco estava com 0 GB livres.
FIX: projeto criado em `C:\Projects\historias-sinistras-web`, ao lado do projeto de referência.

[2026-08-10] BUG: `eslint` reprovava `useRef(...).current` lido durante a renderização em
`useEstadoSalvo`.
CAUSA: a regra `react-hooks/refs` proíbe acessar refs em render.
FIX: trocado por `useState` com inicializador preguiçoso, que garante execução única sem violar
a regra.

[2026-08-10] BUG: o teste do baralho reprovava uma carta legítima cuja revelação tem uma frase só.
CAUSA: o limite mínimo do verso (20 caracteres) confundia concisão com esboço vazio.
FIX: limite do verso reduzido para 12 e a carta em questão ganhou a explicação completa.

---

## 🔗 INTEGRAÇÕES & SERVIÇOS EXTERNOS

[2026-08-10] **API da Anthropic** — usada apenas por `scripts/gerar_historias.py`, na máquina de
quem desenvolve. Chave em `ANTHROPIC_API_KEY` no `.env` (ignorado pelo git). Modelo configurável
em `MODELO_GERACAO`. O aplicativo publicado não tem nenhuma integração externa.

[2026-08-10] **GitHub Pages** — deploy previsto por `npm run deploy` (`gh-pages -d dist`). Ainda
não executado.

[2026-08-10] **Google Fonts** — a família Space Grotesk é carregada por `<link>` no `index.html`.
É a única requisição externa do site.

---

[2026-08-10] CONTEXTO: o `localStorage` do ambiente de teste (Node + jsdom) é um objeto
incompleto, sem `clear` nem `removeItem`.
ALTERNATIVAS: forçar um polyfill no setup dos testes; adaptar os testes.
DECISÃO: não mexer no ambiente. `depositoDoNavegador()` já detecta armazenamento inutilizável e
cai para um depósito em memória, então cada montagem do app nos testes fica isolada sozinha.
VALIDAÇÃO: os seis casos do teste de fumaça passam sem nenhuma limpeza entre eles. O episódio
serve como prova acidental de que o app continua jogável num navegador que bloqueia
armazenamento — cenário previsto no desenho, agora exercitado de verdade.

[2026-08-10] CONTEXTO: definir o tamanho do bundle aceitável com o baralho embutido.
ALTERNATIVAS: carregar as coleções por importação dinâmica; manter tudo no bundle inicial.
DECISÃO: manter tudo no bundle. O modo padrão mistura todas as coleções, então o carregamento
tardio não evitaria baixar nada — só adicionaria estado de carregamento e complexidade.
VALIDAÇÃO: com 350 histórias, o build fica em ~600 kB brutos e ~175 kB comprimidos. Se o baralho
passar de mil cartas, revisitar: aí a importação dinâmica por coleção começa a compensar.

---

## 📝 NOTAS GERAIS

[2026-08-10] O projeto foi alinhado por um questionário de 24 perguntas antes de qualquer linha
de código. As respostas estão condensadas nas seções acima; as que mais restringem o desenho são:
um aparelho só, mestre humano, sem backend, GitHub Pages, mobile-first, sem filtro de conteúdo.

[2026-08-10] Fora de escopo por decisão explícita: IA como mestre, multiplayer remoto, PWA
offline, filtro de conteúdo, contas de usuário, backend. A próxima fase provável é **biblioteca
compartilhada de histórias** — por isso cada carta já nasce com `id` estável e `origem`
registrada.

[2026-08-10] O projeto de referência (SpicyGame, do mesmo autor) tem toda a lógica num único
arquivo de 770 linhas, sem testes nem lint. A instrução original era "usar os mesmos padrões",
mas o dono do projeto optou pelo padrão de qualidade completo — por isso a estrutura aqui é
bastante diferente da do projeto que a inspirou.

---

## 🧠 RESUMOS DE DECISÃO

[2026-08-10] CONTEXTO: o card original pedia respostas apenas de "sim ou não", mas a pesquisa
sobre o jogo de referência mostrou que o formato usa três respostas (sim, não, irrelevante).
ALTERNATIVAS: seguir o card ao pé da letra; seguir o original; estender.
DECISÃO: quatro respostas — as três do original mais "quase lá", escolha do dono do projeto para
encurtar partidas travadas.
VALIDAÇÃO: `RESPOSTAS` no domínio é a fonte única; a interface deriva os botões dela, então
acrescentar ou remover uma resposta é uma linha só.

[2026-08-10] CONTEXTO: definir como tratar as cartas das edições oficiais num repositório público.
ALTERNATIVAS: código público com o baralho oficial fora do git; repositório privado com tudo;
repositório público com tudo; abrir mão das cartas oficiais.
DECISÃO: o dono do projeto escolheu **repositório público com tudo dentro**, ciente do risco de
reivindicação dos detentores de direitos.
VALIDAÇÃO: o risco foi comunicado antes da escolha e reafirmado. As mitigações aplicadas são:
campo `origem` em cada carta, nota de conteúdo na LICENSE, crédito aos autores originais no
README e um canal explícito de remoção por issue. Nenhuma carta transcrita das edições oficiais
foi incluída até agora — as 200 atuais são clássicos de domínio público, casos reais referenciados
e textos originais.

[2026-08-10] CONTEXTO: onde guardar o estado da rodada em andamento.
ALTERNATIVAS: persistir no localStorage para retomar; manter só em memória.
DECISÃO: só em memória.
VALIDAÇÃO: retomar uma rodada exigiria decidir o que fazer com o lado da carta ao reabrir — e
restaurar no verso é justamente o pior caso possível (spoiler ao abrir o app). Sorteio, histórico
e histórias continuam persistidos.

---

> Projeto iniciado em 2026-08-10, seguindo o padrão de qualidade **Felixo System Design**.
> Origem do padrão: https://github.com/Felipe-Alcantara/Felixo-System-Design
