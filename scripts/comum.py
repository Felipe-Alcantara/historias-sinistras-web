"""Utilidades compartilhadas pelos scripts do projeto.

Concentra o que mais de um script precisa: achar a raiz do repositorio, ler
configuracao do `.env` sem depender de biblioteca externa e ler/gravar os
arquivos de baralho com o mesmo formato que o aplicativo espera.

Nao ha nada especifico de geracao por IA aqui — isso vive em
`gerar_historias.py`. A separacao existe para que um script novo (um coletor,
um exportador) reuse esta base sem arrastar dependencias que nao usa.
"""

from __future__ import annotations

import json
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PASTA_DADOS = RAIZ / "src" / "dados"

COLECOES = ("comica", "pesada", "real", "internet", "creepypasta")

ROTULO_COLECAO = {
    "comica": "Cômicas",
    "pesada": "Pesadas",
    "real": "Casos reais",
    "internet": "Da internet",
    "creepypasta": "Creepypasta",
}


class ErroDeDados(RuntimeError):
    """Falha ao ler ou gravar um arquivo de baralho."""


@dataclass(frozen=True)
class Configuracao:
    """Valores lidos do `.env`. Nunca sao impressos por inteiro."""

    chave_api: str
    modelo: str

    @property
    def tem_chave(self) -> bool:
        return bool(self.chave_api.strip())

    def chave_mascarada(self) -> str:
        if not self.tem_chave:
            return "(não configurada)"
        return f"{self.chave_api[:7]}...{self.chave_api[-4:]}"


def ler_env(caminho: Path | None = None) -> dict[str, str]:
    """Le um `.env` simples (`CHAVE=valor`), ignorando comentarios e linhas vazias.

    Evita uma dependencia so para isso. Aspas ao redor do valor sao removidas.
    """
    arquivo = caminho or (RAIZ / ".env")
    if not arquivo.exists():
        return {}

    valores: dict[str, str] = {}
    for linha in arquivo.read_text(encoding="utf-8").splitlines():
        limpa = linha.strip()
        if not limpa or limpa.startswith("#") or "=" not in limpa:
            continue
        nome, _, valor = limpa.partition("=")
        valores[nome.strip()] = valor.strip().strip("\"'")
    return valores


def carregar_configuracao() -> Configuracao:
    valores = ler_env()
    return Configuracao(
        chave_api=valores.get("ANTHROPIC_API_KEY", ""),
        modelo=valores.get("MODELO_GERACAO", "claude-sonnet-5"),
    )


def gravar_env(chave_api: str, modelo: str) -> Path:
    """Regrava o `.env` preservando o formato documentado no `.env.example`."""
    destino = RAIZ / ".env"
    destino.write_text(
        "# Gerado pelo start_app.py. Este arquivo fica fora do git.\n"
        f"ANTHROPIC_API_KEY={chave_api}\n"
        f"MODELO_GERACAO={modelo}\n",
        encoding="utf-8",
    )
    return destino


def caminho_da_colecao(colecao: str) -> Path:
    if colecao not in COLECOES:
        raise ErroDeDados(f"Coleção desconhecida: {colecao!r}. Use uma de {', '.join(COLECOES)}.")
    return PASTA_DADOS / f"{colecao}.json"


def ler_colecao(colecao: str) -> list[dict]:
    caminho = caminho_da_colecao(colecao)
    if not caminho.exists():
        return []
    try:
        conteudo = json.loads(caminho.read_text(encoding="utf-8"))
    except json.JSONDecodeError as erro:
        raise ErroDeDados(f"{caminho.name} não é um JSON válido: {erro}") from erro
    if not isinstance(conteudo, list):
        raise ErroDeDados(f"{caminho.name} deveria conter uma lista de histórias.")
    return conteudo


def gravar_colecao(colecao: str, historias: list[dict]) -> Path:
    """Grava a coleção formatada como o restante do repositório (2 espaços, UTF-8)."""
    caminho = caminho_da_colecao(colecao)
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(
        json.dumps(historias, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return caminho


def contar_todas() -> dict[str, int]:
    """Quantas histórias existem hoje em cada coleção."""
    return {colecao: len(ler_colecao(colecao)) for colecao in COLECOES}


def apelido(texto: str) -> str:
    """Transforma um título em identificador estável: sem acento, minúsculo, com hífen."""
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", sem_acento.lower()).strip("-") or "historia"


def titulos_existentes(colecao: str) -> set[str]:
    """Apelidos já usados na coleção, para o gerador não repetir enredo."""
    return {apelido(str(historia.get("titulo", ""))) for historia in ler_colecao(colecao)}


def ids_existentes() -> set[str]:
    """Todos os ids do baralho, considerando as cinco coleções."""
    usados: set[str] = set()
    for colecao in COLECOES:
        usados.update(str(historia.get("id", "")) for historia in ler_colecao(colecao))
    usados.discard("")
    return usados
