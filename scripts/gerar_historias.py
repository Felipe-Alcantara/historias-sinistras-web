"""Gerador de histórias por IA — roda na sua máquina, nunca no navegador.

Por que existe: o problema que originou o projeto é o baralho de caixa acabar.
Este script transforma isso num processo repetível — pede lotes novos ao modelo,
valida, remove repetição e grava no JSON da coleção, que depois é commitado.

Como se encaixa: o aplicativo web é 100% estático e não chama nenhuma API. A
chave da Anthropic fica só no `.env` local, que está no `.gitignore`. Nada que
este script usa vai para o build.

Uso normal: pelo menu (`python start_app.py` → Ferramentas → Gerar histórias).
Também roda sozinho com `python scripts/gerar_historias.py`, que pergunta o que
precisa saber.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field

from comum import (
    ROTULO_COLECAO,
    Configuracao,
    ErroDeDados,
    apelido,
    carregar_configuracao,
    gravar_colecao,
    ids_existentes,
    ler_colecao,
    titulos_existentes,
)

# Quantas histórias pedir por chamada. Lotes grandes economizam chamadas, mas
# aumentam a chance de o modelo cortar a resposta no meio do JSON.
TAMANHO_DO_LOTE = 8

INSTRUCAO_POR_COLECAO = {
    "comica": (
        "Histórias de humor negro: mortes bobas, coincidências ridículas, burocracia absurda, "
        "desfechos que arrancam riso nervoso. Ninguém precisa morrer, mas a situação tem que ser "
        "estranha o bastante para render perguntas. Evite crueldade gratuita."
    ),
    "pesada": (
        "Histórias duras no tom do jogo original: crime, violência, vingança, desfechos frios. "
        "Descreva de forma seca e objetiva, sem detalhe gráfico gratuito."
    ),
    "real": (
        "Histórias inspiradas em casos que aconteceram de verdade (acidentes notórios, casos "
        "policiais conhecidos, fatos históricos curiosos). Não invente detalhes falsos sobre "
        "pessoas reais identificáveis: mantenha o caso reconhecível mas sem nomear vítimas. "
        "Em `origem.referencia`, diga em que caso se inspirou."
    ),
    "internet": (
        "Enigmas de raciocínio lateral no estilo dos que circulam há décadas em fóruns: curtos, "
        "com uma virada lógica limpa e uma solução que faz sentido retroativamente."
    ),
    "creepypasta": (
        "Terror de internet. O inexplicável pode continuar inexplicável, mas a solução ainda "
        "precisa responder o que aconteceu de forma concreta o suficiente para o grupo chegar lá "
        "com perguntas de sim ou não."
    ),
}

CONTRATO = """Você escreve cartas para um jogo de enigmas investigativos em português do Brasil.

Cada carta tem dois lados:
- FRENTE (`situacao`): 1 a 3 frases, contadas em voz alta para todos. Apresenta uma cena
  aparentemente impossível ou absurda. Nunca entrega a explicação.
- VERSO (`solucao`): a explicação completa, que só o mestre lê. Precisa tornar a frente
  inevitável em retrospecto — nada de reviravolta arbitrária.

Os jogadores só podem perguntar coisas respondíveis com sim, não ou irrelevante. Então a
solução tem que ser feita de fatos verificáveis, não de sentimentos ou intenções vagas.

Responda SOMENTE com um array JSON, sem cercas de código e sem texto em volta. Cada item:

{
  "titulo": "curto, 2 a 5 palavras, sem entregar a solução",
  "situacao": "a frente da carta",
  "solucao": "o verso da carta",
  "fatosChave": ["3 a 4 descobertas que o grupo precisa fazer, na ordem em que costumam vir"],
  "dificuldade": "facil | media | dificil",
  "temas": ["1 a 3 de: crime, acidente, sobrenatural, misterio, humor-negro, historico, tecnologia, cotidiano"],
  "avisosConteudo": ["etiquetas de tema pesado, ex.: suicídio, violência contra criança. Vazio se não houver"],
  "duracaoMin": 10,
  "origem": { "tipo": "ia", "referencia": "o que inspirou, se houver" }
}
"""


class ErroDeGeracao(RuntimeError):
    """Falha ao falar com o modelo ou ao interpretar a resposta."""


@dataclass
class ResultadoGeracao:
    colecao: str
    adicionadas: int = 0
    repetidas: int = 0
    invalidas: int = 0
    avisos: list[str] = field(default_factory=list)

    def resumo(self) -> str:
        partes = [f"{self.adicionadas} adicionada(s)"]
        if self.repetidas:
            partes.append(f"{self.repetidas} repetida(s) descartada(s)")
        if self.invalidas:
            partes.append(f"{self.invalidas} inválida(s)")
        return ", ".join(partes)


def _cliente(configuracao: Configuracao):
    """Cria o cliente da Anthropic, com erro legível quando falta alguma coisa."""
    if not configuracao.tem_chave:
        raise ErroDeGeracao(
            "Nenhuma chave de API configurada. Rode `python start_app.py` → Configurar, "
            "ou preencha ANTHROPIC_API_KEY no arquivo .env."
        )
    try:
        from anthropic import Anthropic
    except ImportError as erro:
        raise ErroDeGeracao(
            "A biblioteca `anthropic` não está instalada. Rode `python start_app.py` → "
            "Instalar/Setup, ou `pip install anthropic`."
        ) from erro
    return Anthropic(api_key=configuracao.chave_api)


def _extrair_json(texto: str) -> list[dict]:
    """Recupera o array JSON mesmo que o modelo devolva texto em volta."""
    limpo = texto.strip()
    limpo = re.sub(r"^```(?:json)?|```$", "", limpo, flags=re.MULTILINE).strip()
    inicio, fim = limpo.find("["), limpo.rfind("]")
    if inicio == -1 or fim == -1 or fim < inicio:
        raise ErroDeGeracao("O modelo não devolveu um array JSON reconhecível.")
    try:
        conteudo = json.loads(limpo[inicio : fim + 1])
    except json.JSONDecodeError as erro:
        raise ErroDeGeracao(f"O JSON devolvido está quebrado: {erro}") from erro
    if not isinstance(conteudo, list):
        raise ErroDeGeracao("O modelo devolveu um objeto, mas era esperada uma lista.")
    return [item for item in conteudo if isinstance(item, dict)]


def _id_unico(titulo: str, colecao: str, usados: set[str]) -> str:
    base = f"{colecao}-{apelido(titulo)}"[:60]
    candidato, sufixo = base, 2
    while candidato in usados:
        candidato = f"{base}-{sufixo}"
        sufixo += 1
    usados.add(candidato)
    return candidato


def _validar(bruta: dict) -> dict | None:
    """Checagem mínima antes de gravar. A validação completa é feita pelo app."""
    titulo = str(bruta.get("titulo", "")).strip()
    situacao = str(bruta.get("situacao", "")).strip()
    solucao = str(bruta.get("solucao", "")).strip()
    if not (titulo and situacao and solucao):
        return None

    fatos_brutos = bruta.get("fatosChave") or []
    fatos = [str(fato).strip() for fato in fatos_brutos if str(fato).strip()][:6]

    return {
        "titulo": titulo,
        "situacao": situacao,
        "solucao": solucao,
        "fatosChave": fatos,
        "dificuldade": str(bruta.get("dificuldade", "media")).strip().lower(),
        "temas": [str(tema).strip().lower() for tema in (bruta.get("temas") or []) if str(tema).strip()][:3],
        "avisosConteudo": [
            str(aviso).strip() for aviso in (bruta.get("avisosConteudo") or []) if str(aviso).strip()
        ][:6],
        "duracaoMin": bruta.get("duracaoMin", 15),
        "origem": bruta.get("origem") or {"tipo": "ia", "referencia": ""},
    }


def gerar(colecao: str, quantidade: int, ao_progredir=None) -> ResultadoGeracao:
    """Gera `quantidade` histórias novas e grava na coleção.

    `ao_progredir` recebe (feitas, total) a cada lote, para o menu desenhar a barra.
    """
    if colecao not in ROTULO_COLECAO:
        raise ErroDeDados(f"Coleção desconhecida: {colecao!r}.")
    if quantidade < 1:
        raise ErroDeDados("A quantidade precisa ser pelo menos 1.")

    configuracao = carregar_configuracao()
    cliente = _cliente(configuracao)

    resultado = ResultadoGeracao(colecao=colecao)
    existentes = ler_colecao(colecao)
    apelidos = titulos_existentes(colecao)
    usados = ids_existentes()
    novas: list[dict] = []

    while len(novas) < quantidade:
        faltam = quantidade - len(novas)
        pedido = min(TAMANHO_DO_LOTE, faltam)
        # Mostrar os títulos já usados é o que impede o modelo de reciclar enredo.
        ja_usados = sorted(apelidos)[-60:]

        try:
            resposta = cliente.messages.create(
                model=configuracao.modelo,
                max_tokens=8000,
                system=CONTRATO,
                messages=[
                    {
                        "role": "user",
                        "content": (
                            f"Coleção: {ROTULO_COLECAO[colecao]}.\n"
                            f"{INSTRUCAO_POR_COLECAO[colecao]}\n\n"
                            f"Escreva {pedido} cartas novas.\n"
                            f"Não repita nem reaproveite estes enredos já existentes: "
                            f"{', '.join(ja_usados) if ja_usados else '(nenhum ainda)'}."
                        ),
                    }
                ],
            )
        except ErroDeGeracao:
            raise
        except Exception as erro:  # a SDK levanta varios tipos; a mensagem e o que importa
            raise ErroDeGeracao(f"A chamada ao modelo falhou: {erro}") from erro

        texto = "".join(bloco.text for bloco in resposta.content if getattr(bloco, "type", "") == "text")
        lote = _extrair_json(texto)
        if not lote:
            raise ErroDeGeracao("O modelo devolveu um lote vazio; nada foi gravado.")

        progrediu = False
        for bruta in lote:
            if len(novas) >= quantidade:
                break
            validada = _validar(bruta)
            if validada is None:
                resultado.invalidas += 1
                continue
            marca = apelido(validada["titulo"])
            if marca in apelidos:
                resultado.repetidas += 1
                continue
            apelidos.add(marca)
            validada["id"] = _id_unico(validada["titulo"], colecao, usados)
            validada["colecao"] = colecao
            novas.append(validada)
            progrediu = True

        if ao_progredir:
            ao_progredir(len(novas), quantidade)

        if not progrediu:
            resultado.avisos.append(
                "O modelo passou a repetir histórias já existentes; a geração parou antes do total pedido."
            )
            break

    if novas:
        gravar_colecao(colecao, existentes + novas)
    resultado.adicionadas = len(novas)
    return resultado


def _principal() -> int:
    """Execução direta, para quem prefere o terminal ao menu."""
    print("Gerador de histórias — coleções:", ", ".join(ROTULO_COLECAO))
    colecao = input("Coleção: ").strip().lower()
    try:
        quantidade = int(input("Quantas histórias? ").strip() or "5")
    except ValueError:
        print("Quantidade inválida.")
        return 1

    try:
        resultado = gerar(colecao, quantidade, lambda feitas, total: print(f"  {feitas}/{total}"))
    except (ErroDeGeracao, ErroDeDados) as erro:
        print(f"Erro: {erro}")
        return 1

    print(resultado.resumo())
    for aviso in resultado.avisos:
        print(f"Aviso: {aviso}")
    return 0


if __name__ == "__main__":
    raise SystemExit(_principal())
