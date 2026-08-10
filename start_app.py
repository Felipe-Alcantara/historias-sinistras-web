#!/usr/bin/env python3
"""Porta de entrada do projeto: menu interativo para instalar, configurar e rodar.

Um comando resolve tudo:

    python start_app.py

Nada aqui exige decorar argumento de linha de comando. O menu lista o que dá
para fazer, explica cada opção em uma linha e executa a escolhida, voltando
sempre para o menu — inclusive quando algo dá errado.
"""

from __future__ import annotations

import os
import shutil
import socket
import subprocess
import sys
import webbrowser
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
PASTA_SCRIPTS = RAIZ / "scripts"
sys.path.insert(0, str(PASTA_SCRIPTS))

PORTA_PADRAO = 5173
DEPENDENCIAS_DO_MENU = ("questionary", "rich")


# --------------------------------------------------------------------------- #
# Bootstrap: o menu instala as próprias dependências antes de se desenhar.
# --------------------------------------------------------------------------- #


def _garantir_dependencias_do_menu() -> bool:
    faltando = []
    for pacote in DEPENDENCIAS_DO_MENU:
        try:
            __import__(pacote)
        except ImportError:
            faltando.append(pacote)
    if not faltando:
        return True

    print(f"O menu precisa de: {', '.join(faltando)}. Instalando...")
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "--quiet", *faltando],
            check=True,
        )
    except (subprocess.CalledProcessError, OSError) as erro:
        print(f"\nNão consegui instalar as dependências do menu: {erro}")
        print(f"Instale manualmente:  {sys.executable} -m pip install {' '.join(faltando)}")
        return False
    return True


if not _garantir_dependencias_do_menu():
    raise SystemExit(1)

import questionary  # noqa: E402
from questionary import Style  # noqa: E402
from rich.console import Console  # noqa: E402
from rich.panel import Panel  # noqa: E402
from rich.table import Table  # noqa: E402

from comum import (  # noqa: E402
    COLECOES,
    ROTULO_COLECAO,
    carregar_configuracao,
    contar_todas,
    gravar_env,
)

console = Console()

ESTILO = Style(
    [
        ("qmark", "fg:#f59e0b bold"),
        ("question", "bold"),
        ("pointer", "fg:#f59e0b bold"),
        ("highlighted", "fg:#f59e0b bold"),
        ("selected", "fg:#fcd34d"),
        ("answer", "fg:#fcd34d bold"),
        ("instruction", "fg:#71717a"),
    ]
)


# --------------------------------------------------------------------------- #
# Execução de comandos externos
# --------------------------------------------------------------------------- #


def _executavel(nome: str) -> str | None:
    """Resolve o caminho de um executável, cobrindo o `.cmd` do Windows."""
    return shutil.which(nome)


def rodar(comando: list[str], titulo: str, ambiente: dict[str, str] | None = None) -> bool:
    """Executa um comando mostrando a saída ao vivo. Devolve se deu certo."""
    binario = _executavel(comando[0])
    if binario is None:
        console.print(f"[red]{comando[0]} não encontrado no PATH.[/red]")
        if comando[0] in {"npm", "node"}:
            console.print("Instale o Node.js LTS: https://nodejs.org")
        return False

    console.print(f"\n[bold #f59e0b]▸ {titulo}[/bold #f59e0b] [dim]({' '.join(comando)})[/dim]\n")
    try:
        resultado = subprocess.run(
            [binario, *comando[1:]],
            cwd=RAIZ,
            env={**os.environ, **(ambiente or {})},
            check=False,
        )
    except KeyboardInterrupt:
        console.print("\n[yellow]Interrompido.[/yellow]")
        return False
    except OSError as erro:
        console.print(f"[red]Falha ao executar: {erro}[/red]")
        return False

    if resultado.returncode == 0:
        console.print(f"\n[green]✓ {titulo} concluído.[/green]")
        return True
    console.print(f"\n[red]✗ {titulo} terminou com erro (código {resultado.returncode}).[/red]")
    return False


def porta_ocupada(porta: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sonda:
        sonda.settimeout(0.4)
        return sonda.connect_ex(("127.0.0.1", porta)) == 0


def primeira_porta_livre(inicial: int = PORTA_PADRAO) -> int:
    porta = inicial
    while porta_ocupada(porta) and porta < inicial + 20:
        porta += 1
    return porta


# --------------------------------------------------------------------------- #
# Estado real do projeto
# --------------------------------------------------------------------------- #


def dependencias_instaladas() -> bool:
    return (RAIZ / "node_modules").is_dir()


def build_existe() -> bool:
    return (RAIZ / "dist" / "index.html").exists()


def anthropic_instalada() -> bool:
    try:
        __import__("anthropic")
        return True
    except ImportError:
        return False


def painel_de_status() -> Table:
    tabela = Table(show_header=False, box=None, padding=(0, 2, 0, 0))
    tabela.add_column(style="dim")
    tabela.add_column()

    def linha(rotulo: str, ok: bool, detalhe: str) -> None:
        marca = "[green]●[/green]" if ok else "[red]○[/red]"
        tabela.add_row(rotulo, f"{marca} {detalhe}")

    node = _executavel("node")
    npm = _executavel("npm")
    versao_node = ""
    if node:
        try:
            versao_node = subprocess.run(
                [node, "--version"], capture_output=True, text=True, check=False
            ).stdout.strip()
        except OSError:
            versao_node = ""

    linha("Node.js", bool(node), versao_node or "não encontrado")
    linha("npm", bool(npm), "disponível" if npm else "não encontrado")
    linha("Dependências", dependencias_instaladas(), "instaladas" if dependencias_instaladas() else "faltando (use Instalar/Setup)")
    linha("Build", build_existe(), "dist/ pronto" if build_existe() else "ainda não gerado")

    configuracao = carregar_configuracao()
    linha("Chave de IA", configuracao.tem_chave, configuracao.chave_mascarada())
    linha("Modelo", True, configuracao.modelo)
    linha("Biblioteca anthropic", anthropic_instalada(), "instalada" if anthropic_instalada() else "opcional, só para gerar")

    ocupada = porta_ocupada(PORTA_PADRAO)
    linha("Porta 5173", not ocupada, "livre" if not ocupada else "em uso (há algo rodando)")

    contagem = contar_todas()
    total = sum(contagem.values())
    tabela.add_row("", "")
    tabela.add_row("Baralho", f"[bold]{total}[/bold] histórias")
    for colecao in COLECOES:
        tabela.add_row("", f"[dim]{ROTULO_COLECAO[colecao]:<14}[/dim] {contagem[colecao]}")

    return tabela


def cabecalho() -> None:
    console.clear()
    console.print(
        Panel(
            "[bold]Histórias Sinistras[/bold] [dim]— jogo web de enigmas investigativos[/dim]\n"
            "[dim]Um mestre lê a solução em segredo; os outros perguntam só sim ou não.[/dim]",
            border_style="#f59e0b",
            padding=(1, 2),
        )
    )


# --------------------------------------------------------------------------- #
# Ações do menu
# --------------------------------------------------------------------------- #


def acao_iniciar() -> None:
    if not dependencias_instaladas():
        console.print("[yellow]As dependências ainda não foram instaladas.[/yellow]")
        if questionary.confirm("Instalar agora?", default=True, style=ESTILO).ask():
            acao_instalar()
        else:
            return

    escolha = questionary.select(
        "O que você quer subir?",
        choices=[
            questionary.Choice("Desenvolvimento — recarrega sozinho ao salvar arquivo", "dev"),
            questionary.Choice("Pré-visualização — serve o build de produção", "preview"),
            questionary.Choice("Voltar", "voltar"),
        ],
        style=ESTILO,
    ).ask()

    if escolha in (None, "voltar"):
        return

    porta = primeira_porta_livre()
    if porta != PORTA_PADRAO:
        console.print(f"[yellow]A porta {PORTA_PADRAO} está ocupada; usando {porta}.[/yellow]")

    url = f"http://localhost:{porta}/"
    if questionary.confirm(f"Abrir {url} no navegador quando subir?", default=True, style=ESTILO).ask():
        webbrowser.open(url)

    console.print("[dim]Pressione Ctrl+C para parar o servidor e voltar ao menu.[/dim]")

    if escolha == "preview":
        if not rodar(["npm", "run", "build"], "Gerando o build"):
            return
        rodar(["npm", "run", "preview", "--", "--port", str(porta)], "Servidor de pré-visualização")
    else:
        rodar(["npm", "run", "dev", "--", "--port", str(porta)], "Servidor de desenvolvimento")


def acao_instalar() -> None:
    escolhas = questionary.checkbox(
        "O que preparar?",
        choices=[
            questionary.Choice("Dependências do site (npm install)", "npm", checked=True),
            questionary.Choice("Arquivo .env a partir do .env.example", "env", checked=not (RAIZ / ".env").exists()),
            questionary.Choice("Biblioteca de geração por IA (pip install anthropic)", "ia", checked=False),
        ],
        style=ESTILO,
    ).ask()

    if not escolhas:
        return

    if "npm" in escolhas:
        rodar(["npm", "install"], "Instalando dependências do site")

    if "env" in escolhas:
        destino, exemplo = RAIZ / ".env", RAIZ / ".env.example"
        if destino.exists():
            console.print("[yellow]O .env já existe; nada foi sobrescrito.[/yellow]")
        elif exemplo.exists():
            destino.write_text(exemplo.read_text(encoding="utf-8"), encoding="utf-8")
            console.print("[green]✓ .env criado a partir do exemplo.[/green] Preencha em Configurar.")
        else:
            console.print("[red].env.example não encontrado.[/red]")

    if "ia" in escolhas:
        rodar([sys.executable, "-m", "pip", "install", "anthropic"], "Instalando a biblioteca anthropic")


def acao_configurar() -> None:
    configuracao = carregar_configuracao()
    console.print(
        Panel(
            f"Chave atual: [bold]{configuracao.chave_mascarada()}[/bold]\n"
            f"Modelo atual: [bold]{configuracao.modelo}[/bold]\n\n"
            "[dim]Estes valores são usados APENAS pelo gerador de histórias, na sua máquina.\n"
            "O site publicado é estático e não chama nenhuma API.[/dim]",
            title="Configuração",
            border_style="#f59e0b",
        )
    )

    escolha = questionary.select(
        "O que ajustar?",
        choices=[
            questionary.Choice("Chave da API da Anthropic", "chave"),
            questionary.Choice("Modelo usado na geração", "modelo"),
            questionary.Choice("Voltar", "voltar"),
        ],
        style=ESTILO,
    ).ask()

    if escolha in (None, "voltar"):
        return

    chave, modelo = configuracao.chave_api, configuracao.modelo

    if escolha == "chave":
        digitada = questionary.password(
            "Cole a chave (fica só no .env, que está no .gitignore):", style=ESTILO
        ).ask()
        if not digitada:
            return
        chave = digitada.strip()
    else:
        escolhido = questionary.select(
            "Qual modelo?",
            choices=[
                questionary.Choice("claude-sonnet-5 — equilíbrio entre custo e qualidade", "claude-sonnet-5"),
                questionary.Choice("claude-opus-5 — melhor escrita, mais caro", "claude-opus-5"),
                questionary.Choice("claude-haiku-4-5-20251001 — mais rápido e barato", "claude-haiku-4-5-20251001"),
            ],
            style=ESTILO,
        ).ask()
        if not escolhido:
            return
        modelo = escolhido

    caminho = gravar_env(chave, modelo)
    console.print(f"[green]✓ Salvo em {caminho.name}.[/green]")


def acao_gerar_historias() -> None:
    from gerar_historias import ErroDeGeracao, gerar

    colecao = questionary.select(
        "Para qual coleção?",
        choices=[questionary.Choice(ROTULO_COLECAO[nome], nome) for nome in COLECOES]
        + [questionary.Choice("Voltar", "voltar")],
        style=ESTILO,
    ).ask()

    if colecao in (None, "voltar"):
        return

    quantidade_texto = questionary.text(
        "Quantas histórias novas?", default="10", style=ESTILO
    ).ask()
    if not quantidade_texto:
        return
    try:
        quantidade = int(quantidade_texto.strip())
    except ValueError:
        console.print("[red]Quantidade inválida.[/red]")
        return

    console.print(f"\n[dim]Gerando para {ROTULO_COLECAO[colecao]}...[/dim]")
    with console.status("Conversando com o modelo...", spinner="dots") as estado:

        def progresso(feitas: int, total: int) -> None:
            estado.update(f"{feitas}/{total} histórias prontas...")

        try:
            resultado = gerar(colecao, quantidade, progresso)
        except Exception as erro:  # ErroDeGeracao, ErroDeDados e falhas de rede
            console.print(f"[red]✗ {erro}[/red]")
            return

    console.print(f"[green]✓ {resultado.resumo()}[/green]")
    for aviso in resultado.avisos:
        console.print(f"[yellow]! {aviso}[/yellow]")
    if resultado.adicionadas:
        console.print("[dim]Revise o JSON antes de commitar.[/dim]")


def acao_ferramentas() -> None:
    escolha = questionary.select(
        "Ferramentas",
        choices=[
            questionary.Choice("Gerar histórias com IA — amplia uma coleção do baralho", "gerar"),
            questionary.Choice("Rodar testes — valida as regras críticas", "testes"),
            questionary.Choice("Verificar o código (lint) — padrão e erros comuns", "lint"),
            questionary.Choice("Gerar build de produção — cria a pasta dist/", "build"),
            questionary.Choice("Publicar no GitHub Pages — envia o build", "deploy"),
            questionary.Choice("Voltar", "voltar"),
        ],
        style=ESTILO,
    ).ask()

    if escolha in (None, "voltar"):
        return
    if escolha == "gerar":
        acao_gerar_historias()
    elif escolha == "testes":
        rodar(["npm", "run", "test"], "Rodando os testes")
    elif escolha == "lint":
        rodar(["npm", "run", "lint"], "Verificando o código")
    elif escolha == "build":
        rodar(["npm", "run", "build"], "Gerando o build")
    elif escolha == "deploy":
        if questionary.confirm(
            "Isto publica o site na internet (branch gh-pages). Continuar?", default=False, style=ESTILO
        ).ask():
            rodar(["npm", "run", "deploy"], "Publicando no GitHub Pages")


def acao_status() -> None:
    console.print(Panel(painel_de_status(), title="Status", border_style="#f59e0b", padding=(1, 2)))
    questionary.text("Enter para voltar ao menu.", style=ESTILO).ask()


# --------------------------------------------------------------------------- #
# Laço principal
# --------------------------------------------------------------------------- #


def principal() -> int:
    while True:
        cabecalho()
        try:
            escolha = questionary.select(
                "O que você quer fazer?",
                choices=[
                    questionary.Choice("Iniciar / Rodar — sobe o jogo no navegador", "iniciar"),
                    questionary.Choice("Instalar / Setup — prepara o ambiente do zero", "instalar"),
                    questionary.Choice("Configurar — chave e modelo do gerador de histórias", "configurar"),
                    questionary.Choice("Ferramentas — gerar histórias, testes, lint, build, publicar", "ferramentas"),
                    questionary.Choice("Status — o que está pronto e o que falta", "status"),
                    questionary.Choice("Sair", "sair"),
                ],
                style=ESTILO,
            ).ask()
        except KeyboardInterrupt:
            escolha = "sair"

        if escolha in (None, "sair"):
            console.print("[dim]Até a próxima.[/dim]")
            return 0

        acoes = {
            "iniciar": acao_iniciar,
            "instalar": acao_instalar,
            "configurar": acao_configurar,
            "ferramentas": acao_ferramentas,
            "status": acao_status,
        }
        try:
            acoes[escolha]()
        except KeyboardInterrupt:
            console.print("\n[yellow]Ação interrompida.[/yellow]")
        except Exception as erro:  # o menu nunca deve morrer por causa de uma ação
            console.print(f"[red]Erro inesperado: {erro}[/red]")

        if escolha != "status":
            questionary.text("Enter para voltar ao menu.", style=ESTILO).ask()


if __name__ == "__main__":
    raise SystemExit(principal())
