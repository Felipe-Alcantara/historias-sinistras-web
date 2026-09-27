# Histórias Sinistras — web

**Jogar agora:** https://felipe-alcantara.github.io/historias-sinistras-web/

Jogo de enigmas investigativos para jogar em grupo, com um aparelho só.

Uma pessoa é o **mestre**: lê a situação em voz alta, guarda a solução em segredo e responde
apenas **sim**, **não**, **irrelevante** ou **quase lá**. Os outros reconstroem o que aconteceu
fazendo perguntas fechadas. Quando o grupo descobre tudo, o mestre lê o verso da carta em voz
alta e o aparelho passa para o próximo mestre.

O baralho vem com **500 histórias** divididas em cinco coleções, e o jogo permite escrever as
suas, importar pacotes de outras pessoas e gerar lotes novos com IA.

---

## Como rodar

Forma mais simples — abre o menu interativo onde você instala, configura e inicia:

```bash
python start_app.py
```

No menu você escolhe: **Instalar/Setup**, **Configurar**, **Iniciar/Rodar**, **Ferramentas** e
**Status/Sair**. Não é preciso decorar comando nenhum.

Requisitos: [Node.js](https://nodejs.org) LTS e Python 3.10+. O menu instala as próprias
dependências e avisa, em linguagem clara, o que estiver faltando.

---

## As cinco coleções

| Coleção | Cartas | O que tem dentro |
| --- | --- | --- |
| **Cômicas** | 100 | Mortes bobas, coincidências ridículas e finais que arrancam riso nervoso. |
| **Pesadas** | 100 | Crime, violência e desfechos duros. É o tom clássico do gênero. |
| **Casos reais** | 100 | Cartas editoriais inspiradas em acidentes, casos policiais e episódios históricos; as referências precisam ser conferidas antes de uso como fonte factual. |
| **Da internet** | 100 | Enigmas de raciocínio lateral associados a versões que circulam em fóruns e listas. |
| **Creepypasta** | 100 | Terror de internet, com explicação concreta o bastante para o grupo chegar lá. |

Por padrão o sorteio **mistura todas**. Marcar uma ou mais coleções na tela inicial restringe o
baralho àquele clima.

---

## Como o jogo funciona

- **A carta tem dois lados.** A frente (em âmbar) é a situação, lida para todos. O verso (em
  vermelho) é a solução, do mestre. A cor separa as duas coisas de longe: se a tela está
  vermelha, o que está escrito ali é spoiler.
- **Ir para o verso pede confirmação**, para ninguém abrir sem querer ao passar o aparelho. Dá
  para desligar isso nas preferências.
- **Fatos-chave** funcionam como checklist do mestre: são as descobertas que o grupo precisa
  fazer. Quando todas estão marcadas, a história conta como resolvida.
- **O sorteio é sem reposição.** Uma carta só volta depois que todas as outras do filtro atual
  saíram — e o jogo avisa quando o ciclo recomeça.
- **Avisos de conteúdo** aparecem antes da carta, mas não filtram nada: informam, e o grupo
  decide.

---

## Suas histórias

Na **Biblioteca** você cria, edita, esconde e apaga histórias, além de importar e exportar
pacotes em JSON.

Tudo fica salvo apenas no navegador do aparelho — o jogo não tem servidor e não envia dados
para lugar nenhum. Por isso, **exportar é a única forma de não depender de um aparelho só**. O
botão está no topo da biblioteca.

O formato de importação aceita tanto um pacote exportado pelo app quanto uma lista solta de
histórias:

```json
[
  {
    "titulo": "O pacote fechado",
    "situacao": "Um homem é encontrado morto no meio do deserto...",
    "solucao": "Ele saltou de um avião e o paraquedas não abriu...",
    "fatosChave": ["Ele caiu de uma grande altura.", "Ele veio de um avião."],
    "colecao": "internet",
    "dificuldade": "facil",
    "temas": ["acidente"],
    "avisosConteudo": [],
    "duracaoMin": 10
  }
]
```

Campos que faltarem ganham um padrão seguro; cartas sem título, situação ou solução são
recusadas com o motivo. Importar **soma** ao que já existe: nada é substituído.

---

## Gerar histórias novas com IA

O aplicativo publicado é **100% estático e nunca chama nenhuma API**. A geração acontece na sua
máquina, por script, e o resultado é revisado antes de virar parte do baralho.

No menu: **Ferramentas → Gerar histórias com IA**. Antes disso, em **Configurar**, informe a
chave da API — ela fica só no `.env` local, que está no `.gitignore` e nunca vai para o build.

O script escreve direto no arquivo da coleção escolhida, evita repetir enredos já existentes e
grava uma história por linha, para o diff mostrar exatamente o que entrou. Ao mesclar um lote, o
menu também avisa quando uma carta nova tem premissa parecida com outra do baralho — quem já
resolveu uma resolveria a outra na primeira pergunta.

---

## Corrigir cartas do baralho

Carta que já existe se corrige por revisão, não editando o JSON à mão. Escreva um arquivo com a
lista do que muda, carta por carta, sempre com o motivo:

```json
[
  {
    "id": "com-014",
    "motivo": "a situação dizia 'rua' e a solução, 'rodovia'",
    "campos": { "situacao": "...", "solucao": "...", "fatosChave": ["...", "...", "..."] }
  }
]
```

No menu: **Ferramentas → Aplicar revisão editorial**. A ferramenta mostra o que mudaria, confere
vocabulário e limites do app, recusa título repetido e solução que aparece inteira na frente, e só
grava depois da confirmação — tudo ou nada. Rodar a mesma revisão duas vezes não muda nada na
segunda. Uso direto: `python scripts/aplicar_revisao.py revisao.json --aplicar`.

**Ferramentas → Auditar o baralho** confere a estrutura, conta as procedências vazias e lista os
pares de cartas com premissa parecida para alguém ler.

Na hora de escrever ou corrigir uma carta, o que costuma quebrar o enigma:

- a frente afirmar algo que o verso desmente (a frente pode enganar pela omissão, nunca pela
  mentira);
- a solução depender de um detalhe que nenhuma pergunta de sim ou não alcança;
- o título ou o aviso de conteúdo entregarem a resposta — aviso existe para conteúdo sensível
  (morte, violência, suicídio, luto...), não para nomear o mecanismo do enigma;
- a mesma premissa já existir em outra carta.

---

## Estrutura do projeto

```
src/
├── dominio/         regra pura do jogo — não importa React nem toca no navegador
│   ├── tipos.ts         vocabulário: história, coleção, resposta, dificuldade
│   ├── validacao.ts     todo dado externo passa por aqui antes de entrar
│   ├── baralho.ts       filtro e sorteio sem reposição
│   └── partida.ts       máquina de estado de uma rodada
├── armazenamento/   tudo que conversa com o localStorage
│   ├── persistencia.ts  leitura defensiva, migração de versão e gravação
│   └── portabilidade.ts export e import de pacotes
├── dados/           o baralho, um arquivo por coleção
├── componentes/     peças visuais reutilizáveis
├── telas/           início, rodada e biblioteca
└── ganchos/         ponte entre React e as camadas acima
scripts/             linha de comando: gerador, mesclador, revisão por id, auditoria
start_app.py         menu de entrada do projeto
```

A separação é deliberada: a regra do jogo é testável sem navegador, e trocar a interface não
exige tocar em nada de `dominio/`.

---

## Qualidade

O gate do projeto são três comandos, todos disponíveis em **Ferramentas** no menu:

```bash
npm run lint     # ESLint, com `any` proibido
npm run test     # Vitest
npm run build    # TypeScript estrito + build de produção
```

Para o conteúdo, `python scripts/auditar_baralho.py` (também em **Ferramentas**) confere a
estrutura do baralho e falha se duas cartas contarem praticamente a mesma história.

Os testes cobrem a regra que este projeto trata como crítica: **dado salvo não se perde**.
Conteúdo ilegível é preservado numa chave de resgate antes de qualquer sobrescrita, gravação que
falha devolve erro visível em vez de fingir sucesso, e importar nunca substitui o que já existe.

Também cobrem as regras da partida: o sorteio não repete carta enquanto houver inédita — nem ao
trocar de filtro —, o texto da solução nunca aparece na frente e não existe caminho até o verso
que pule a confirmação do mestre, e a história só conta como resolvida com todos os fatos-chave.
Há ainda testes de validação de pacote e um guarda-corpo que impede carta malformada, repetida ou
com a solução vazada de entrar no baralho.

---

## Sobre o conteúdo

O **código** deste repositório está sob licença MIT.

As **histórias** têm rótulos editoriais de procedência no campo `origem` de cada carta: textos
autorais, geração por IA, referências de internet ou casos reais. Esse campo é transparência
editorial; não é, por si só, prova de domínio público, licença de uso ou verificação factual.

Em 27/09/2026 as 500 cartas foram lidas uma a uma e 179 foram corrigidas: frente que contradizia
o verso, solução que não fechava, erro factual, título ou aviso que entregava a resposta e
premissas repetidas. Ainda há 281 cartas com `origem.referencia` vazia, e as referências de Casos
reais não substituem uma checagem factual carta a carta. Os detalhes e as pendências estão em
[AUDITORIA.md](AUDITORIA.md).

Se você é detentor de direitos sobre algum conteúdo do baralho e quer que ele saia, abra uma
issue e a carta será removida.

O jogo se inspira no formato de *Black Stories*, criado por Holger Bösch e localizado no Brasil
como *Histórias Sinistras* pela Galápagos Jogos — veja a [descrição editorial da série pela
Galápagos](https://lojistagalapagosjogos.wordpress.com/2021/07/02/historias-sinistras-black-stories/).
Este projeto não tem qualquer vínculo com autores, editoras ou detentores de direitos das obras
originais, nem afirma que suas cartas estejam licenciadas ou em domínio público. A mecânica de
perguntas é uma inspiração de formato; o texto de cada carta precisa ter procedência e revisão
próprias.

---

## Ideias para quem quiser contribuir

- Modo em que uma IA assume o papel do mestre, respondendo às perguntas dos jogadores.
- Sala remota, para grupos que não estão na mesma mesa.
- Biblioteca compartilhada, com histórias publicadas e baixadas entre pessoas.
- Instalação como aplicativo (PWA) para jogar sem internet.
- Um coletor que importe pacotes de histórias de fontes públicas para dentro do formato.
