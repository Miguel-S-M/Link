# LinkGlove em dois apps

| Pasta | Para quê | Abas |
|---|---|---|
| `aprender/` | Aprender Libras: trilha de lições, minigames (boxe, rap, corrida online), progresso | Minigames · Trilha de estudo |
| `tradutor/` | Traduzir Libras por câmera (texto + voz), conversa por voz, treino e calibração do alfabeto | Tradutor · Configurar alfabeto |
| `fonte/` | Site original (sem a luva). É daqui que os dois apps são gerados | |
| `construir.py` | Gera `aprender/` e `tradutor/` a partir de `fonte/` | |
| `teste_carga.js` | Teste de carga (Node): `node teste_carga.js aprender` | |

## Como usar

**Na web:** publique cada pasta como um site (ex.: dois repositórios no GitHub Pages). Cada app é um PWA separado.

**No hardware (PC, Raspberry Pi etc.), com Python 3 e Chrome/Chromium/Edge:**

    cd tradutor
    python3 servidor.py --quiosque                      # tela cheia
    python3 servidor.py --quiosque --posicao 1920,0     # na 2ª tela

Não instala nada (só biblioteca padrão). Portas: aprender 8001, tradutor 8002.

**Offline:** abra uma vez COM internet e use "Preparar uso offline" (⚙ Avançado da câmera).
Depois funciona sem internet.

## O que foi feito
- Luva e Bluetooth removidos (código, botões e status).
- Mesmo motor de câmera nos dois (mãos, rosto, classificador): os minigames também reconhecem letras pela câmera.
- `tradutor/` não carrega os módulos dos jogos (05, 11, 14–19) nem o PeerJS.
- `tradutor/js/00-ponte-aprender.js`: versões vazias das funções dos jogos que o motor ainda chama.
- `$()` em `01-base-tradutor.js` devolve um elemento "nulo" quando o id não existe no app (transição).
- Service worker, manifest e cache separados por app.

## Limites e pendências (honesto)
- Só testei o carregamento dos scripts num DOM falso (0 erros). NÃO testei câmera, MediaPipe nem jogos em navegador real: teste cada aba.
- Os módulos 01, 09, 10 e 13 ainda misturam código dos dois lados. Dividir de verdade é a próxima refatoração.
- O `$()` nulo esconde erros de id: se algo não responder, procure por isso.
- NÃO existe ainda: tela Português → Libras, reconhecimento em Python, voz offline (Vosk), gramática, modelo para 500 sinais.
- `subir-versao.py` do original não foi adaptado: para publicar versão nova, mude `?v=` em `fonte/` e rode `construir.py`.
- Se os dois sites ficarem na mesma origem (ex.: usuario.github.io), compartilham o treino salvo no navegador.

## Os 5 parâmetros (só no `tradutor/`)
Módulo `js/21-parametros.js` + painel "Os 5 parâmetros da Libras (ao vivo)" na aba Tradutor:
configuração da mão, locação, orientação, movimento e expressões (rosto/cabeça). Cada sinal gravado vira uma combinação dos 5 e pode ser exportado em JSON (`lexico-parametros.json`).
- `python`-side: o JSON é o formato de entrada para o treino/consulta em Python depois.
- Teste da lógica: `node teste_carga.js tradutor teste_parametros.js` (20 verificações com mãos sintéticas).
- Limites: o corpo (ombros/tronco) ainda não é medido (precisa de MediaPipe Pose); a locação no corpo é estimada pelo tamanho do rosto; palma para cima/baixo ainda não é distinguida; a mão dominante é escolhida no painel.

## Expressões, palma e aba Diagnóstico (só no `tradutor/`)
- `js/22-expressoes.js`: 16 expressões com intensidade de 0 a 100% (boca aberta, em O, bico, lábios apertados, sorriso, cantos para baixo, bochecha inflada, nariz franzido, sobrancelhas erguidas/franzidas/assimétrica, olhos arregalados/semicerrados/fechados, piscada de um olho, língua). Ajusta-se ao rosto neutro de cada pessoa (botão "Calibrar rosto neutro").
- A **língua é experimental**: compara a cor da região abaixo do lábio com a cor da pele; depende da luz. Precisa ser validada com vídeo real.
- Orientação agora usa a profundidade da mão: palma para frente, trás, cima, baixo e lados.
- Aba **🔎 Diagnóstico** (protegida pela mesma senha da aba Configurar): câmera com pontos numerados nas mãos e no rosto, coordenadas (x, y, z) dos 21 pontos de cada mão, barras de cada expressão, medidas do rosto, parâmetros e verificações de funcionamento. Não mostra limites nem fórmulas.
- Testes: `node teste_carga.js tradutor teste_parametros.js teste_expressoes.js` (45 verificações com mãos e rostos sintéticos).
