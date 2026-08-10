"""Mescla um arquivo de lote em uma coleção do baralho.

Para que serve: histórias novas chegam em lotes — escritas à mão, produzidas
pelo gerador de IA ou recebidas de outra pessoa. Este script coloca o lote
dentro da coleção certa sem duplicar id nem repetir enredo, e sem que ninguém
precise editar um JSON de centenas de linhas na mão.

Uso pelo menu: `python start_app.py` → Ferramentas → Mesclar lote de histórias.
Uso direto: `python scripts/mesclar_lote.py`, que pergunta o que precisa saber.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

from comum import (
    COLECOES,
    ROTULO_COLECAO,
    ErroDeDados,
    apelido,
    gravar_colecao,
    ids_existentes,
    ler_colecao,
)

CAMPOS_OBRIGATORIOS = ("titulo", "situacao", "solucao")


@dataclass
class ResultadoMesclagem:
    colecao: str
    adicionadas: int = 0
    id_repetido: int = 0
    enredo_repetido: int = 0
    invalidas: list[str] = field(default_factory=list)

    def resumo(self) -> str:
        partes = [f"{self.adicionadas} adicionada(s)"]
        if self.id_repetido:
            partes.append(f"{self.id_repetido} com id já usado")
        if self.enredo_repetido:
            partes.append(f"{self.enredo_repetido} com título repetido")
        if self.invalidas:
            partes.append(f"{len(self.invalidas)} inválida(s)")
        return ", ".join(partes)


def ler_lote(caminho: Path) -> list[dict]:
    if not caminho.exists():
        raise ErroDeDados(f"Arquivo não encontrado: {caminho}")
    try:
        conteudo = json.loads(caminho.read_text(encoding="utf-8"))
    except json.JSONDecodeError as erro:
        raise ErroDeDados(f"{caminho.name} não é um JSON válido: {erro}") from erro
    if not isinstance(conteudo, list):
        raise ErroDeDados(f"{caminho.name} deveria conter uma lista de histórias.")
    return [item for item in conteudo if isinstance(item, dict)]


def mesclar(colecao: str, caminho_lote: Path) -> ResultadoMesclagem:
    """Acrescenta o lote ao fim da coleção, preservando o que já existe.

    Nada é sobrescrito: uma história cujo id ou título já exista é recusada e
    contabilizada, para quem revisa decidir o que fazer.
    """
    if colecao not in ROTULO_COLECAO:
        raise ErroDeDados(f"Coleção desconhecida: {colecao!r}. Use uma de {', '.join(COLECOES)}.")

    atuais = ler_colecao(colecao)
    resultado = ResultadoMesclagem(colecao=colecao)

    ids_usados = ids_existentes()
    apelidos_usados = {apelido(str(historia.get("titulo", ""))) for historia in atuais}

    novas: list[dict] = []
    for indice, bruta in enumerate(ler_lote(caminho_lote)):
        faltando = [campo for campo in CAMPOS_OBRIGATORIOS if not str(bruta.get(campo, "")).strip()]
        if faltando:
            resultado.invalidas.append(f"item {indice}: falta {', '.join(faltando)}")
            continue

        identificador = str(bruta.get("id", "")).strip()
        if not identificador:
            resultado.invalidas.append(f"item {indice}: sem id")
            continue
        if identificador in ids_usados:
            resultado.id_repetido += 1
            continue

        marca = apelido(str(bruta["titulo"]))
        if marca in apelidos_usados:
            resultado.enredo_repetido += 1
            continue

        ids_usados.add(identificador)
        apelidos_usados.add(marca)
        novas.append({**bruta, "colecao": colecao})

    if novas:
        gravar_colecao(colecao, atuais + novas)
    resultado.adicionadas = len(novas)
    return resultado


def _principal() -> int:
    print("Coleções:", ", ".join(COLECOES))
    colecao = input("Coleção de destino: ").strip().lower()
    caminho = input("Caminho do arquivo de lote: ").strip().strip('"')

    try:
        resultado = mesclar(colecao, Path(caminho))
    except ErroDeDados as erro:
        print(f"Erro: {erro}")
        return 1

    print(resultado.resumo())
    for problema in resultado.invalidas:
        print(f"  ignorada — {problema}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_principal())
