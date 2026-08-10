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
| **Casos reais** | 100 | Inspiradas em acidentes, casos policiais e episódios históricos que aconteceram. |
| **Da internet** | 100 | Enigmas de raciocínio lateral que circulam há décadas em fóruns e listas. |
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
grava uma história por linha, para o diff mostrar exatamente o que entrou.

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
scripts/             ferramentas de linha de comando (gerador, utilidades)
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

Os testes cobrem a regra que este projeto trata como crítica: **dado salvo não se perde**.
Conteúdo ilegível é preservado numa chave de resgate antes de qualquer sobrescrita, gravação que
falha devolve erro visível em vez de fingir sucesso, e importar nunca substitui o que já existe.
Há também testes de sorteio sem repetição, de validação de pacote e um guarda-corpo que impede
carta malformada de entrar no baralho.

---

## Sobre o conteúdo

O **código** deste repositório está sob licença MIT.

As **histórias** têm procedências diferentes, registradas no campo `origem` de cada carta:
enigmas clássicos de domínio público, casos reais com a referência que os inspirou (sem nomear
vítimas), e textos originais escritos para o projeto ou gerados por IA e revisados.

Se você é detentor de direitos sobre algum conteúdo do baralho e quer que ele saia, abra uma
issue e a carta será removida.

O jogo se inspira no formato de *black stories*, criado por Holger Bösch e publicado no Brasil
como *Histórias Sinistras* pela Galápagos Jogos. Este projeto não tem qualquer vínculo com os
autores ou editoras originais.

---

## Ideias para quem quiser contribuir

- Modo em que uma IA assume o papel do mestre, respondendo às perguntas dos jogadores.
- Sala remota, para grupos que não estão na mesma mesa.
- Biblioteca compartilhada, com histórias publicadas e baixadas entre pessoas.
- Instalação como aplicativo (PWA) para jogar sem internet.
- Um coletor que importe pacotes de histórias de fontes públicas para dentro do formato.
