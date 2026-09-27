"""Encontra cartas com premissa parecida, para revisão humana.

Duas cartas com o mesmo truque estragam a segunda: quem resolveu uma resolve a
outra na primeira pergunta. Texto idêntico o gate do baralho já recusa; aqui a
comparação é por vocabulário (TF-IDF com cosseno) sobre situação e solução, o
que encontra o mesmo enredo reescrito com palavras parecidas — como as três
cartas de beisebol e as três de veneno no gelo que a revisão de 27/09/2026
encontrou.

É um sinal, não um veredito: sinônimos escapam e premissas diferentes podem
dividir palavras raras. Por isso quem usa recebe uma lista para ler, e só a
similaridade muito alta é tratada como duplicata provável.
"""

from __future__ import annotations

import math
import re
import unicodedata
from collections import Counter
from collections.abc import Iterable
from dataclasses import dataclass

# Acima disto, a dupla merece leitura humana antes de ir para o baralho.
LIMIAR_REVISAO = 0.25
# Acima disto, é quase certo que as duas cartas contam a mesma coisa.
LIMIAR_DUPLICATA = 0.40

# Palavras frequentes demais para distinguir enredos. A lista é curta de
# propósito: o peso IDF já rebaixa o que aparece em quase todas as cartas.
PALAVRAS_VAZIAS = frozenset(
    """
    a o e de da do das dos um uma uns umas que se na no nas nos em para por com sem ao aos
    ele ela eles elas seu sua seus suas mas mais muito muita nao foi era sao ser tem ter
    isso isto esse essa este esta como quando onde porque pois lhe lhes me te depois antes
    entre sobre ate tambem havia estava estavam fica ficou toda todo todos todas dia dias
    vez vezes outra outro outros outras mesmo mesma homem mulher ninguem alguem pelo pela
    pelos pelas num numa
    """.split()
)


@dataclass(frozen=True)
class ParParecido:
    """Duas cartas com vocabulário de enredo parecido."""

    similaridade: float
    id_a: str
    titulo_a: str
    id_b: str
    titulo_b: str

    def descricao(self) -> str:
        return f"{self.similaridade:.2f} · {self.id_a} «{self.titulo_a}» × {self.id_b} «{self.titulo_b}»"


def termos(texto: str) -> list[str]:
    """Palavras significativas do texto, sem acento e em minúsculas."""
    sem_acento = unicodedata.normalize("NFKD", texto)
    sem_acento = "".join(caractere for caractere in sem_acento if not unicodedata.combining(caractere))
    return [
        palavra
        for palavra in re.findall(r"[a-z0-9]+", sem_acento.casefold())
        if len(palavra) > 2 and palavra not in PALAVRAS_VAZIAS
    ]


def _vetores(historias: list[dict]) -> list[dict[str, float]]:
    documentos = [
        Counter(termos(f"{historia.get('situacao', '')} {historia.get('solucao', '')}")) for historia in historias
    ]
    frequencia_documental: Counter[str] = Counter()
    for documento in documentos:
        frequencia_documental.update(documento.keys())

    total = len(documentos)
    vetores: list[dict[str, float]] = []
    for documento in documentos:
        pesos = {
            palavra: (1 + math.log(contagem)) * math.log(total / frequencia_documental[palavra])
            for palavra, contagem in documento.items()
        }
        norma = math.sqrt(sum(peso * peso for peso in pesos.values())) or 1.0
        vetores.append({palavra: peso / norma for palavra, peso in pesos.items()})
    return vetores


def _cosseno(a: dict[str, float], b: dict[str, float]) -> float:
    if len(a) > len(b):
        a, b = b, a
    return sum(peso * b.get(palavra, 0.0) for palavra, peso in a.items())


def pares_parecidos(
    historias: list[dict],
    limiar: float = LIMIAR_REVISAO,
    so_com_ids: Iterable[str] | None = None,
) -> list[ParParecido]:
    """Pares com similaridade a partir de `limiar`, do mais parecido ao menos.

    `so_com_ids` restringe o resultado aos pares que envolvem aquelas cartas —
    é o que o mesclador usa para comparar só o lote novo com o baralho. O
    vocabulário é sempre calculado sobre todas as cartas recebidas, para que o
    peso de uma palavra não dependa do tamanho do lote.
    """
    filtro = set(so_com_ids) if so_com_ids is not None else None
    vetores = _vetores(historias)
    pares: list[ParParecido] = []
    for i, historia_a in enumerate(historias):
        for j in range(i + 1, len(historias)):
            historia_b = historias[j]
            if filtro is not None and historia_a.get("id") not in filtro and historia_b.get("id") not in filtro:
                continue
            similaridade = _cosseno(vetores[i], vetores[j])
            if similaridade >= limiar:
                pares.append(
                    ParParecido(
                        similaridade=similaridade,
                        id_a=str(historia_a.get("id", "?")),
                        titulo_a=str(historia_a.get("titulo", "")),
                        id_b=str(historia_b.get("id", "?")),
                        titulo_b=str(historia_b.get("titulo", "")),
                    )
                )
    pares.sort(key=lambda par: par.similaridade, reverse=True)
    return pares
