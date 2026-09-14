"""Audita o baralho versionado antes de uma revisão editorial.

O script não altera os JSONs. Ele reúne os guardas que ajudam a separar três
perguntas diferentes: o baralho está estruturalmente íntegro, as cartas se
repetem e a procedência está documentada o bastante para uma revisão humana.

Uso direto: ``python scripts/auditar_baralho.py``.
"""

from __future__ import annotations

import re
import sys
import unicodedata
from collections import Counter

from comum import COLECOES, ROTULO_COLECAO, ler_colecao


def normalizar(texto: object) -> str:
    """Normaliza acentos, pontuação e espaços para comparar conteúdo."""
    sem_acentos = unicodedata.normalize("NFKD", str(texto))
    sem_acentos = "".join(caractere for caractere in sem_acentos if not unicodedata.combining(caractere))
    return " ".join(re.findall(r"\w+", sem_acentos.casefold()))


def repetidos(valores: list[str]) -> list[str]:
    """Retorna valores repetidos, uma vez cada, em ordem de aparição."""
    contagem = Counter(valores)
    vistos: set[str] = set()
    resultado: list[str] = []
    for valor in valores:
        if contagem[valor] > 1 and valor not in vistos:
            resultado.append(valor)
            vistos.add(valor)
    return resultado


def resumo_numerico(valores: list[int]) -> str:
    if not valores:
        return "n/a"
    media = sum(valores) / len(valores)
    return f"{min(valores)}–{max(valores)}, média {media:.2f}"


def origem_da(historia: dict) -> tuple[str, bool]:
    origem = historia.get("origem")
    if not isinstance(origem, dict):
        return "ausente", True
    tipo = str(origem.get("tipo", "ausente"))
    referencia = str(origem.get("referencia", "")).strip()
    return tipo, not referencia


def auditar() -> int:
    por_colecao = {colecao: ler_colecao(colecao) for colecao in COLECOES}
    todas = [historia for historias in por_colecao.values() for historia in historias]
    problemas: list[str] = []

    for colecao, historias in por_colecao.items():
        if len(historias) != 100:
            problemas.append(f"{colecao}: esperava 100 cartas, encontrou {len(historias)}")

    ids = [str(historia.get("id", "")) for historia in todas]
    if len(set(ids)) != len(ids):
        problemas.append("há identificadores repetidos")

    for campo in ("titulo", "situacao", "solucao"):
        valores = [normalizar(historia.get(campo, "")) for historia in todas]
        if "" in valores:
            problemas.append(f"há {campo} vazio")
        if repetidos(valores):
            problemas.append(f"há {campo}s repetidos após normalização")

    vazamentos = [
        str(historia.get("id", "?"))
        for historia in todas
        if normalizar(historia.get("solucao", ""))
        and normalizar(historia.get("solucao", "")) in normalizar(historia.get("situacao", ""))
    ]
    if vazamentos:
        problemas.append(f"solução aparece na situação: {', '.join(vazamentos)}")

    print("Auditoria do baralho")
    print(f"Total: {len(todas)} cartas")
    for colecao, historias in por_colecao.items():
        dificuldades = Counter(str(historia.get("dificuldade", "ausente")) for historia in historias)
        avisos = sum(bool(historia.get("avisosConteudo")) for historia in historias)
        origens = Counter(origem_da(historia)[0] for historia in historias)
        referencias_vazias = sum(origem_da(historia)[1] for historia in historias)
        fatos = [len(historia.get("fatosChave", [])) for historia in historias]
        duracoes = [int(historia.get("duracaoMin", 0)) for historia in historias]
        dificuldade_texto = ", ".join(f"{chave}={valor}" for chave, valor in sorted(dificuldades.items()))
        origem_texto = ", ".join(f"{chave}={valor}" for chave, valor in sorted(origens.items()))
        print(f"- {ROTULO_COLECAO[colecao]}: {len(historias)} cartas")
        print(f"  dificuldade: {dificuldade_texto}; avisos: {avisos} com, {len(historias) - avisos} sem")
        print(f"  origem: {origem_texto}; referências vazias: {referencias_vazias}")
        print(f"  fatos-chave: {resumo_numerico(fatos)}; duração: {resumo_numerico(duracoes)} minutos")

    print("Guarda-corpos:")
    print(f"- ids únicos: {'sim' if len(set(ids)) == len(ids) else 'não'}")
    print(f"- títulos/situações/soluções únicos: {'sim' if not problemas or not any('repetidos' in problema for problema in problemas) else 'não'}")
    print(f"- solução vazada na situação: {'não' if not vazamentos else 'sim'}")
    print(f"- referências de origem vazias: {sum(origem_da(historia)[1] for historia in todas)}")

    if problemas:
        print("Falhas:")
        for problema in problemas:
            print(f"- {problema}")
        return 1

    print("Resultado: estrutura e comparações locais aprovadas; procedência continua sendo revisão editorial.")
    return 0


if __name__ == "__main__":
    sys.exit(auditar())
