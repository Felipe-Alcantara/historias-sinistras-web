"""Aplica uma revisão editorial às cartas do baralho, carta por carta, pelo id.

Para que serve: corrigir cartas que já existem — frente que contradiz o verso,
erro factual, título que entrega a resposta, aviso de conteúdo que estraga o
enigma, procedência que faltava — sem editar à mão arquivos JSON de cem linhas
e sem o risco de mexer na carta errada.

O arquivo de revisão é uma lista JSON. Cada item diz qual carta muda, por quê
e quais campos passam a valer:

    [
      {
        "id": "com-014",
        "motivo": "a situação dizia 'rua' e a solução, 'rodovia'",
        "campos": {"situacao": "...", "solucao": "...", "fatosChave": ["...", "...", "..."]}
      }
    ]

Só os campos listados mudam; os demais ficam como estavam, na mesma ordem. O
id e a coleção nunca mudam por aqui (a coleção vem do arquivo em que a carta
mora). A revisão é tudo ou nada: se um item tiver problema, nenhum arquivo é
gravado. Aplicar a mesma revisão duas vezes não muda nada na segunda — cada
item já aplicado conta como "sem mudança".

Uso pelo menu: `python start_app.py` → Ferramentas → Aplicar revisão editorial.
Uso direto: `python scripts/aplicar_revisao.py revisao.json` mostra o que
mudaria; acrescente `--aplicar` para gravar.
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

from auditar_baralho import normalizar
from comum import (
    COLECOES,
    DIFICULDADES,
    LIMITES,
    TEMAS,
    TIPOS_ORIGEM,
    ErroDeDados,
    gravar_colecao,
    ler_colecao,
)

CAMPOS_EDITAVEIS = (
    "titulo",
    "situacao",
    "solucao",
    "fatosChave",
    "dificuldade",
    "temas",
    "avisosConteudo",
    "duracaoMin",
    "origem",
)

# O gate do baralho (src/dados/baralhoBase.test.ts) recusa frente com até 20
# caracteres, verso com até 12 e menos de três fatos-chave. Checar aqui evita
# gravar uma carta que só seria recusada depois, nos testes.
MINIMO_SITUACAO = 21
MINIMO_SOLUCAO = 13
MINIMO_FATOS = 3


@dataclass(frozen=True)
class ItemRevisao:
    id: str
    motivo: str
    campos: dict


@dataclass
class ResultadoRevisao:
    alteradas: list[str] = field(default_factory=list)
    sem_mudanca: list[str] = field(default_factory=list)
    campos_por_carta: dict[str, list[str]] = field(default_factory=dict)
    erros: list[str] = field(default_factory=list)
    gravado: bool = False

    def resumo(self) -> str:
        partes = [f"{len(self.alteradas)} carta(s) alterada(s)", f"{len(self.sem_mudanca)} sem mudança"]
        if self.erros:
            partes.append(f"{len(self.erros)} problema(s) — nada foi gravado")
        elif not self.gravado and self.alteradas:
            partes.append("simulação: nada foi gravado")
        return ", ".join(partes)


def ler_revisao(caminho: Path) -> list[ItemRevisao]:
    """Lê e confere a forma do arquivo de revisão, sem olhar o baralho ainda."""
    if not caminho.exists():
        raise ErroDeDados(f"Arquivo não encontrado: {caminho}")
    try:
        bruto = json.loads(caminho.read_text(encoding="utf-8"))
    except json.JSONDecodeError as erro:
        raise ErroDeDados(f"{caminho.name} não é um JSON válido: {erro}") from erro
    if not isinstance(bruto, list):
        raise ErroDeDados(f"{caminho.name} deveria conter uma lista de itens de revisão.")

    itens: list[ItemRevisao] = []
    vistos: set[str] = set()
    for indice, item in enumerate(bruto):
        onde = f"item {indice}"
        if not isinstance(item, dict):
            raise ErroDeDados(f"{onde}: esperava um objeto.")
        identificador = str(item.get("id", "")).strip()
        motivo = str(item.get("motivo", "")).strip()
        campos = item.get("campos")
        if not identificador:
            raise ErroDeDados(f"{onde}: falta o id da carta.")
        if identificador in vistos:
            raise ErroDeDados(f"{onde}: o id {identificador} aparece mais de uma vez na revisão.")
        if not motivo:
            raise ErroDeDados(f"{onde} ({identificador}): falta o motivo — toda mudança precisa de um porquê.")
        if not isinstance(campos, dict) or not campos:
            raise ErroDeDados(f"{onde} ({identificador}): 'campos' deveria ser um objeto com o que muda.")
        vistos.add(identificador)
        itens.append(ItemRevisao(id=identificador, motivo=motivo, campos=campos))
    return itens


def _texto(valor: object, nome: str, minimo: int, maximo: int, erros: list[str]) -> None:
    if not isinstance(valor, str) or not valor.strip():
        erros.append(f"'{nome}' deveria ser um texto preenchido.")
    elif not minimo <= len(valor.strip()) <= maximo:
        erros.append(f"'{nome}' deveria ter entre {minimo} e {maximo} caracteres (tem {len(valor.strip())}).")


def _lista_de_textos(valor: object, nome: str, quantidade: tuple[int, int], maximo: int, erros: list[str]) -> None:
    if not isinstance(valor, list) or not all(isinstance(item, str) and item.strip() for item in valor):
        erros.append(f"'{nome}' deveria ser uma lista de textos preenchidos.")
        return
    minimo_itens, maximo_itens = quantidade
    if not minimo_itens <= len(valor) <= maximo_itens:
        erros.append(f"'{nome}' deveria ter de {minimo_itens} a {maximo_itens} itens (tem {len(valor)}).")
    longos = [item for item in valor if len(item.strip()) > maximo]
    if longos:
        erros.append(f"'{nome}' tem item com mais de {maximo} caracteres.")
    if len({item.strip() for item in valor}) != len(valor):
        erros.append(f"'{nome}' repete um item.")


def validar_campos(campos: dict) -> list[str]:
    """Confere cada campo contra o vocabulário e os limites do app."""
    erros: list[str] = []
    for nome, valor in campos.items():
        if nome not in CAMPOS_EDITAVEIS:
            erros.append(f"o campo '{nome}' não pode ser editado por revisão (use: {', '.join(CAMPOS_EDITAVEIS)}).")
        elif nome == "titulo":
            _texto(valor, nome, 1, LIMITES["titulo"], erros)
        elif nome == "situacao":
            _texto(valor, nome, MINIMO_SITUACAO, LIMITES["situacao"], erros)
        elif nome == "solucao":
            _texto(valor, nome, MINIMO_SOLUCAO, LIMITES["solucao"], erros)
        elif nome == "fatosChave":
            _lista_de_textos(
                valor, nome, (MINIMO_FATOS, LIMITES["fatosChavePorHistoria"]), LIMITES["fatoChave"], erros
            )
        elif nome == "avisosConteudo":
            _lista_de_textos(valor, nome, (0, LIMITES["avisosPorHistoria"]), LIMITES["avisoConteudo"], erros)
        elif nome == "temas":
            _lista_de_textos(valor, nome, (1, LIMITES["temasPorHistoria"]), 40, erros)
            desconhecidos = [tema for tema in valor if tema not in TEMAS] if isinstance(valor, list) else []
            if desconhecidos:
                erros.append(f"tema(s) desconhecido(s): {', '.join(map(str, desconhecidos))}.")
        elif nome == "dificuldade":
            if valor not in DIFICULDADES:
                erros.append(f"'dificuldade' deveria ser uma de: {', '.join(DIFICULDADES)}.")
        elif nome == "duracaoMin":
            if isinstance(valor, bool) or not isinstance(valor, int):
                erros.append("'duracaoMin' deveria ser um número inteiro de minutos.")
            elif not LIMITES["duracaoMinima"] <= valor <= LIMITES["duracaoMaxima"]:
                erros.append(
                    f"'duracaoMin' deveria ficar entre {LIMITES['duracaoMinima']} e {LIMITES['duracaoMaxima']}."
                )
        elif nome == "origem":
            if not isinstance(valor, dict) or set(valor) != {"tipo", "referencia"}:
                erros.append("'origem' deveria ter exatamente 'tipo' e 'referencia'.")
            elif valor["tipo"] not in TIPOS_ORIGEM:
                erros.append(f"'origem.tipo' deveria ser um de: {', '.join(TIPOS_ORIGEM)}.")
            elif not isinstance(valor["referencia"], str) or len(valor["referencia"]) > LIMITES["titulo"]:
                erros.append(f"'origem.referencia' deveria ser um texto de até {LIMITES['titulo']} caracteres.")
    return erros


def aplicar_revisao(itens: list[ItemRevisao], gravar: bool = False) -> ResultadoRevisao:
    """Confere todos os itens contra o baralho e, se tudo estiver certo, grava.

    Nada é gravado quando `gravar` é falso ou quando qualquer item tem
    problema: uma revisão pela metade deixaria o baralho num estado que
    ninguém revisou.
    """
    resultado = ResultadoRevisao()
    colecoes = {colecao: ler_colecao(colecao) for colecao in COLECOES}
    onde_esta = {
        str(historia.get("id")): (colecao, indice)
        for colecao, historias in colecoes.items()
        for indice, historia in enumerate(historias)
    }

    tocadas: set[str] = set()
    for item in itens:
        if item.id not in onde_esta:
            resultado.erros.append(f"{item.id}: nenhuma carta com esse id no baralho.")
            continue
        problemas = validar_campos(item.campos)
        if problemas:
            resultado.erros.extend(f"{item.id}: {problema}" for problema in problemas)
            continue

        colecao, indice = onde_esta[item.id]
        atual = colecoes[colecao][indice]
        mudados = [nome for nome, valor in item.campos.items() if atual.get(nome) != valor]
        if not mudados:
            resultado.sem_mudanca.append(item.id)
            continue

        # Reatribuir as chaves existentes preserva a ordem original dos campos.
        colecoes[colecao][indice] = {**atual, **{nome: item.campos[nome] for nome in mudados}}
        resultado.alteradas.append(item.id)
        resultado.campos_por_carta[item.id] = mudados
        tocadas.add(colecao)

    resultado.erros.extend(_conferir_baralho_final(colecoes, resultado.alteradas))

    if gravar and not resultado.erros:
        for colecao in COLECOES:
            if colecao in tocadas:
                gravar_colecao(colecao, colecoes[colecao])
        resultado.gravado = bool(tocadas)
    return resultado


def _conferir_baralho_final(colecoes: dict[str, list[dict]], alteradas: list[str]) -> list[str]:
    """Repete, sobre o baralho já revisado, os guardas que uma edição pode quebrar."""
    erros: list[str] = []
    todas = [historia for historias in colecoes.values() for historia in historias]
    alteradas_set = set(alteradas)

    titulos: dict[str, str] = {}
    for historia in todas:
        chave = normalizar(historia.get("titulo", ""))
        dono = titulos.setdefault(chave, str(historia.get("id")))
        if dono != historia.get("id") and (historia.get("id") in alteradas_set or dono in alteradas_set):
            erros.append(f"{historia.get('id')}: título igual ao de {dono} depois da revisão.")

    for historia in todas:
        if historia.get("id") not in alteradas_set:
            continue
        solucao = normalizar(historia.get("solucao", ""))
        if solucao and solucao in normalizar(historia.get("situacao", "")):
            erros.append(f"{historia.get('id')}: a solução aparece inteira na situação.")
    return erros


def _principal(argumentos: list[str]) -> int:
    leitor = argparse.ArgumentParser(description="Aplica uma revisão editorial às cartas do baralho, pelo id.")
    leitor.add_argument("arquivo", type=Path, help="JSON com a lista de itens de revisão")
    leitor.add_argument("--aplicar", action="store_true", help="grava as mudanças (sem isto, só simula)")
    opcoes = leitor.parse_args(argumentos)

    try:
        itens = ler_revisao(opcoes.arquivo)
        resultado = aplicar_revisao(itens, gravar=opcoes.aplicar)
    except ErroDeDados as erro:
        print(f"Erro: {erro}")
        return 1

    motivos = {item.id: item.motivo for item in itens}
    for identificador in resultado.alteradas:
        campos = ", ".join(resultado.campos_por_carta[identificador])
        print(f"- {identificador} [{campos}]: {motivos[identificador]}")
    for problema in resultado.erros:
        print(f"! {problema}")
    print(resultado.resumo())
    return 1 if resultado.erros else 0


if __name__ == "__main__":
    sys.exit(_principal(sys.argv[1:]))
