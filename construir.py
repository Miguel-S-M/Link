#!/usr/bin/env python3
"""Monta os dois apps a partir de fonte/ (o site original, sem a luva).

  python3 construir.py      ->  aprender/  e  tradutor/

Os dois usam o mesmo motor de câmera (mãos, rosto, classificador): os minigames
também reconhecem letras pela câmera. O que muda é a interface (abas) e os módulos.
"""
import json, re, shutil
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
FONTE = RAIZ / 'fonte'


def sub(t, antigo, novo):
    if antigo not in t:
        raise SystemExit('trecho não encontrado: ' + antigo[:80])
    return t.replace(antigo, novo, 1)


def sub_re(t, padrao, novo, flags=re.M):
    t2, n = re.subn(padrao, novo, t, count=1, flags=flags)
    if not n:
        raise SystemExit('padrão não encontrado: ' + padrao[:80])
    return t2


NULO = ("const NULO=new Proxy(function(){},{get:(_,k)=>k===Symbol.toPrimitive?()=>'':k===Symbol.iterator?function*(){}:"
        "(k==='value'||k==='textContent'||k==='innerHTML')?'':(k==='checked'||k==='disabled'||k==='hidden')?false:NULO,"
        "set:()=>true,apply:()=>NULO});   // elemento que não existe neste app: aceita tudo e não faz nada\n"
        "const $=id=>document.getElementById(id)||NULO;")

TODOS = ['imagens', '01-base-tradutor', '02-nucleo-ia', '03-rosto', '04-trava-maos', '05-aprender-jogos', '06-classificador',
         '07-suavizacao', '08-sinais-camera', '09-abas-treino', '10-voz-jogos', '11-progresso', '12-precisao-calibracao',
         '13-utilidades', '14-boxe', '15-minigames', '16-online-boxe', '17-online-rap', '18-online-corrida',
         '19-trilha-licoes', '20-offline']
SO_APRENDER = {'05-aprender-jogos', '11-progresso', '14-boxe', '15-minigames', '16-online-boxe', '17-online-rap',
               '18-online-corrida', '19-trilha-licoes'}

APPS = {
    'aprender': dict(titulo='LinkGlove Aprender', sub='Aprender Libras: trilha de lições e minigames',
                     abas=['games', 'study'], porta=8001, mods=TODOS, peerjs=True,
                     dialogos={'signDlg', 'mqDlg'}, extras={'lesson', 'toast'}),
    'tradutor': dict(titulo='LinkGlove Tradutor', sub='Tradutor de Libras por câmera, offline',
                     abas=['tr', 'cfg', 'diag'], porta=8002,
                     mods=['imagens', '00-ponte-aprender'] + [m for m in TODOS if m not in SO_APRENDER and m != 'imagens'] + ['21-parametros', '22-expressoes', '23-diagnostico'],
                     peerjs=False, dialogos={'nsDlg', 'pwDlg', 'signDlg'}, extras={'interp', 'toast'}),
}

DIAG_HTML = """<div id="tab-diag" class="pane">
<section>
  <h2>Diagnóstico ao vivo</h2>
  <div class="camgrid">
    <div class="cam"><canvas class="mirror"></canvas><div class="off coff">Câmera desligada</div></div>
    <div class="camside">
      <div class="row"><button class="btnCam primary">Ligar câmera</button><button class="btnFace" aria-pressed="false">👤 Reconhecer rosto</button><button class="btnExpr" aria-pressed="false">😀 Expressões</button></div>
      <div class="row" style="margin-top:8px"><button id="dgNeutro">Calibrar rosto neutro (3 s)</button><button id="dgNeutroRest">Restaurar padrão</button><label style="color:var(--mut)"><input type="checkbox" id="dgPts" checked style="min-width:0;flex:none"> pontos do rosto</label></div>
      <small id="dgMsg" style="color:var(--mut)"></small>
      <div class="cmsg" role="status"></div>
      <div id="dgSaude" style="margin-top:8px"></div>
    </div>
  </div>
</section>
<section><h2>Mãos: coordenadas</h2><div id="dgMaos"></div></section>
<section><h2>Rosto e expressões</h2><div id="dgRosto"></div></section>
<section><h2>Parâmetros medidos</h2><div id="dgParam"></div></section>
</div>"""

PM_HTML = """<section id="pmSec">
  <h2>Os 5 parâmetros da Libras (ao vivo)</h2>
  <div class="tr">
    <div class="card"><h3>1 · Configuração da mão</h3><p id="pmCM">–</p></div>
    <div class="card"><h3>2 · Locação (ponto de articulação)</h3><p id="pmPA">–</p></div>
    <div class="card"><h3>3 · Orientação</h3><p id="pmOR">–</p></div>
    <div class="card"><h3>4 · Movimento</h3><p id="pmMV">–</p></div>
    <div class="card"><h3>5 · Expressões faciais e corporais</h3><p id="pmENM">–</p></div>
  </div>
  <div class="row" style="margin-top:12px"><label style="color:var(--mut)">Mão dominante <select id="pmDom"><option value="D">Direita</option><option value="E">Esquerda</option></select></label><span id="pmCand"></span></div>
  <div class="row" style="margin-top:10px"><input id="pmNome" placeholder="Nome do sinal (ex.: obrigado)" aria-label="Nome do sinal"><button id="pmGravar" class="primary">Gravar parâmetros (2,5 s)</button><button id="pmExp">Exportar léxico (JSON)</button><button id="pmLimpar">Apagar léxico</button></div>
  <small id="pmMsg" style="color:var(--mut)"></small> <small id="pmLex" style="color:var(--mut)"></small>
  <p class="note">Ligue a câmera e, para locação e expressões, ative "Reconhecer rosto" e "Expressões" em ⚙ Avançado. O corpo (ombros e tronco) ainda não é medido. Valores aproximados: confira os nomes com quem sabe Libras.</p>
</section>

"""

PONTE = """// Ponte: o Tradutor não carrega os minigames/trilha, mas o motor de câmera e as abas ainda os chamam.
// Aqui ficam versões vazias dessas peças (e as funções genéricas que moravam nos módulos dos jogos).
const ls=(k,d)=>{ try{ const v=JSON.parse(localStorage.getItem(pk(k))||'null'); return v===null?d:v }catch(e){ return d } };
const lsSet=(k,v)=>{ try{ localStorage.setItem(pk(k),JSON.stringify(v)) }catch(e){} };
const tx=(c,t,x,y,s,col,al='center')=>{ c.font='bold '+s+'px sans-serif'; c.fillStyle=col; c.textAlign=al; c.fillText(t,x,y); };
function linkSay(expr,msg){ if(ART[expr]&&$('lkImg')) $('lkImg').src=ART[expr]; if($('lkSay')) $('lkSay').textContent=msg; }
function toast(m){ const t=$('toast'); t.textContent=m; t.style.display='block'; clearTimeout(toast.t); toast.t=setTimeout(()=>t.style.display='none',3200); }
let STATS={}, PRG={acc:0}, LASTF=null;
const hit=()=>{}, award=()=>{}, recordResult=()=>{}, pickWeighted=(pool)=>pool[0];
function learnLetter(){} function learnSign(){} function stopGames(){} function lsClose(){}
function adapt(){} function enhance(){} async function hwLight(){ return false }
function boxInput(){} function rapTick(){} function rtTick(){} function lessonTick(){} function cmpTick(){} function cmpStart(){} function cmpStop(){}
const LIGHT={on:false}, box={on:false}, rap={on:false}, rt={on:false}, tut={on:false}, les={on:false,cam:false},
      mp={mode:'',live:false,conn:null,host:false};
"""

SERVIDOR = '''#!/usr/bin/env python3
"""Servidor local de __NOME__ (só biblioteca padrão do Python, sem instalar nada).

  python3 servidor.py                      abre no navegador normal
  python3 servidor.py --quiosque           tela cheia, sem barras (hardware dedicado)
  python3 servidor.py --quiosque --posicao 1920,0     abre na 2ª tela (x,y do canto da tela)
  python3 servidor.py --sem-navegador      só serve (abra http://localhost:__PORTA__ você mesmo)

Offline: abra uma vez COM internet e use o botão "Preparar uso offline" (aba Avançado da câmera).
Depois disso funciona sem internet.
"""
import argparse, http.server, mimetypes, os, shutil, socketserver, subprocess, threading, webbrowser
from pathlib import Path

PASTA = Path(__file__).resolve().parent
NOME, PORTA = "__NOME__", __PORTA__
for ext, tipo in (('.wasm', 'application/wasm'), ('.webmanifest', 'application/manifest+json'),
                  ('.js', 'text/javascript'), ('.binarypb', 'application/octet-stream')):
    mimetypes.add_type(tipo, ext)


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(PASTA), **k)

    def end_headers(self):
        if self.path.split('?')[0] in ('/', '/index.html', '/sw.js'):
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def log_message(self, *a):
        pass


def achar_navegador():
    for n in ('chromium-browser', 'chromium', 'google-chrome', 'google-chrome-stable', 'chrome', 'microsoft-edge', 'msedge'):
        p = shutil.which(n)
        if p:
            return p
    for p in (r'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
              r'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
              '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'):
        if os.path.exists(p):
            return p
    return None


def abrir(url, a):
    exe = achar_navegador()
    if exe and (a.quiosque or a.posicao):
        cmd = [exe, '--app=' + url, '--user-data-dir=' + str(Path.home() / '.linkglove-perfis' / NOME.replace(' ', '-'))]
        if a.quiosque:
            cmd.append('--kiosk')
        if a.posicao:
            cmd.append('--window-position=' + a.posicao)
        if a.permitir_camera:
            cmd.append('--use-fake-ui-for-media-stream')   # aceita câmera/microfone sem perguntar
        subprocess.Popen(cmd)
    else:
        webbrowser.open(url)


def main():
    p = argparse.ArgumentParser(description=NOME)
    p.add_argument('--porta', type=int, default=PORTA)
    p.add_argument('--quiosque', action='store_true', help='tela cheia (precisa de Chrome/Chromium/Edge)')
    p.add_argument('--posicao', help='posição da janela, ex.: 1920,0 para a segunda tela')
    p.add_argument('--permitir-camera', action='store_true', help='não perguntar permissão de câmera/microfone')
    p.add_argument('--sem-navegador', action='store_true')
    a = p.parse_args()
    socketserver.ThreadingTCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(('127.0.0.1', a.porta), Handler) as srv:
        url = f'http://localhost:{a.porta}/index.html'
        print(f'{NOME}: {url}   (Ctrl+C para parar)')
        if not a.sem_navegador:
            threading.Timer(0.6, abrir, (url, a)).start()
        try:
            srv.serve_forever()
        except KeyboardInterrupt:
            print('\\nEncerrado.')


if __name__ == '__main__':
    main()
'''


def blocos_abas(html):
    ini = html.index('<div id="tab-tr"')
    fim = html.index('</main>')
    corpo = html[ini:fim].rstrip()
    partes = [p for p in re.split(r'(?=<div id="tab-)', corpo) if p.strip()]
    return html[:ini], {re.match(r'<div id="tab-(\w+)"', p).group(1): p.rstrip() for p in partes}, html[fim:]


def montar_html(app, c):
    h = (FONTE / 'index.html').read_text(encoding='utf-8')
    h = sub(h, '<title>LinkGlove – Luva tradutora de LIBRAS</title>', '<title>' + c['titulo'] + '</title>')
    h = sub(h, 'Painel LinkGlove</h1><small style="color:var(--mut)">Luva inteligente tradutora de Libras (ESP32)</small>',
            c['titulo'] + '</h1><small style="color:var(--mut)">' + c['sub'] + '</small>')
    h = sub(h, '    <span id="status" class="off">❌ Desconectado</span>\n    <button id="btnConn" class="primary">Conectar via Bluetooth</button>\n', '')
    if app == 'aprender':
        h = sub(h, '    <button id="btnInterp">🔄 Modo intérprete</button>\n', '')
    h = sub_re(h, r'<span class="pillst" id="stMode".*?<span class="pillst" id="stCam"></span>',
               '<span class="pillst" id="stCam"></span>', re.S)
    rot = {'diag': '🔎 Diagnóstico', 'tr': '🗣️ Tradutor', 'games': '🎮 Minigames', 'study': '🧭 Trilha de estudo', 'cfg': '⚙️ Configurar alfabeto'}
    nav = ''
    for i, t in enumerate(c['abas']):
        cls = ' class="on"' if i == 0 else ''
        nav += '<button data-tab="' + t + '"' + cls + '>' + rot[t] + '</button>'
    h = sub_re(h, r'<nav class="tabs">.*?</nav>', '<nav class="tabs">' + nav + '</nav>', re.S)
    antes, abas, depois = blocos_abas(h)
    if app == 'tradutor':
        abas['diag'] = DIAG_HTML
    novo = []
    for i, t in enumerate(c['abas']):
        b = re.sub(r'^<div id="tab-(\w+)" class="pane( on)?"', lambda m, i=i: '<div id="tab-' + m.group(1) + '" class="pane' + (' on' if i == 0 else '') + '"', abas[t])
        novo.append(b)
    h = antes + '\n\n'.join(novo) + '\n\n' + depois
    for ident in ('nsDlg', 'pwDlg', 'signDlg', 'mqDlg'):
        if ident not in c['dialogos']:
            h = sub_re(h, '<dialog id="' + ident + '">.*?</dialog>\n?', '', re.S)
    if 'lesson' not in c['extras']:
        h = sub_re(h, r'<div id="lesson".*?\n</div>\n', '', re.S)
    if 'interp' not in c['extras']:
        h = sub_re(h, r'<div id="interp"[^\n]*\n', '')
    if app == 'aprender':   # o motor de câmera precisa destes elementos mesmo sem a aba do Tradutor
        h = sub(h, '<div id="warn"></div>\n', '<div id="warn"></div>\n<div id="camHidden" hidden><video id="camVideo" playsinline muted></video><canvas id="camCanvas"></canvas>'
                '<div id="camBig"><span id="camLetter"></span><div class="bar"><i id="camBar"></i></div></div><div id="camDbg"></div></div>\n')
    if app == 'tradutor':
        h = sub(h, '<section>\n  <h2>Tradução em tempo real</h2>', PM_HTML + '<section>\n  <h2>Tradução em tempo real</h2>')
        h = sub(h, '<h2>Texto recebido da luva</h2>', '<h2>Texto reconhecido</h2>')
        h = sub(h, 'aria-label="Texto recebido da luva" placeholder="As letras recebidas da luva aparecem aqui (pode ter erros e faltar acentos)..."',
                'aria-label="Texto reconhecido" placeholder="As letras reconhecidas pela câmera aparecem aqui (pode ter erros e faltar acentos)..."')
    if not c['peerjs']:
        h = sub_re(h, r'<script src="https://cdn.jsdelivr.net/npm/peerjs[^\n]*\n', '')
    h = sub_re(h, r'(<script src="js/[^\n]*\n)+', ''.join('<script src="js/' + m + '.js?v=2"></script>\n' for m in c['mods']))
    return h


def montar_js(app, c, dest):
    (dest / 'js').mkdir(parents=True, exist_ok=True)
    for m in c['mods']:
        if m == '00-ponte-aprender':
            (dest / 'js' / (m + '.js')).write_text(PONTE, encoding='utf-8')
            continue
        t = (FONTE / 'js' / (m + '.js')).read_text(encoding='utf-8')
        if m == '01-base-tradutor':
            t = sub(t, '// Configuração, Bluetooth da luva, idiomas, palavras e tradutor', '// Configuração, idiomas, palavras e tradutor')
            for _ in range(3):
                t = sub_re(t, r"^const (DEVICE_NAME|SERVICE_UUID|CHAR_UUID) = .*\n", '')
            t = sub(t, "const $=id=>document.getElementById(id);", NULO)
            t = sub(t, 'vLang=0,device=null,idleT', 'vLang=0,idleT')
            i, j = t.index('function setStatus(on){'), t.index("$('btnClear').onclick")
            t = t[:i] + "function warn(m){const w=$('warn');w.textContent=m;w.style.display=m?'block':'none'}\n" + t[j:]
        if m == '10-voz-jogos':
            for pre in (r"  const ble=", r"  const mode = ble", r"  const ago = ", r"  \$\('stMode'\)", r"  \$\('stBle'\)",
                        r"  \$\('stData'\)", r"  \$\('stBat'\)"):
                t = sub_re(t, '^' + pre + r'.*\n', '')
            t = sub(t, "['Bluetooth (luva)',!!navigator.bluetooth],", '')
            t = sub_re(t, r"^    \+ \(navigator\.bluetooth\?.*\n", '')
            t = sub(t, " && !(device&&device.gatt&&device.gatt.connected)", '')
            t = sub(t, 'Ligue a câmera ou conecte a luva para este jogo.', 'Ligue a câmera para este jogo.')
        if m == '03-rosto' and app == 'tradutor':
            t = sub(t, "  const fH=d(10,152)||1, fW=d(234,454)||1;\n", "  const fH=d(10,152)||1, fW=d(234,454)||1;\n  exprStep(l,W,H);\n")
            t = sub(t, "['tab-tr','tab-cfg']", "['tab-tr','tab-cfg','tab-diag']")
        if m == '09-abas-treino' and app == 'tradutor':
            t = sub(t, "let cfgUnlocked =", "let pwDest = 'cfg';\nlet cfgUnlocked =")
            t = sub(t, "if (b.dataset.tab==='cfg' && !cfgUnlocked){ askPw(); return; }", "if ((b.dataset.tab==='cfg'||b.dataset.tab==='diag') && !cfgUnlocked){ pwDest=b.dataset.tab; askPw(); return; }")
            t = sub(t, "$('pwDlg').close(); goTab('cfg'); }", "$('pwDlg').close(); goTab(pwDest); }")
        if m == '08-sinais-camera' and app == 'tradutor':
            t = sub(t, "  document.querySelectorAll('canvas.mirror').forEach(m=>{", "  diagDraw(cx,w,h,all);\n  document.querySelectorAll('canvas.mirror').forEach(m=>{")
            t = sub(t, '  poseCheck(all,cl,now);\n', '  poseCheck(all,cl,now);\n  paramsStep(all,cl,now,w,h);\n')
        if m == '09-abas-treino' and app == 'aprender':
            t = sub(t, "let curTab = 'tr';", "let curTab = 'games';")
        (dest / 'js' / (m + '.js')).write_text(t, encoding='utf-8')


def montar_sw(app, c, dest):
    s = (FONTE / 'sw.js').read_text(encoding='utf-8')
    s = s.replace("'linkglove-app-'", "'lg-" + app + "-'")

    def filtra(m):
        linhas = []
        for l in m.group(2).split('\n'):
            mm = re.search(r'"js/([^"?]+)\.js', l)
            if mm and mm.group(1) not in c['mods']:
                continue
            linhas.append(l)
        extra = ' "js/00-ponte-aprender.js?v=2",\n "js/21-parametros.js?v=2",\n "js/22-expressoes.js?v=2",\n "js/23-diagnostico.js?v=2",\n' if app == 'tradutor' else ''
        return m.group(1) + extra + '\n'.join(linhas) + m.group(3)

    s = sub_re(s, r'(const APP_FILES = \[\n)(.*?)(\n\];)', filtra, re.S)
    if not c['peerjs']:
        s = sub_re(s, r',\n "https://cdn.jsdelivr.net/npm/peerjs[^\n]*', '')
    (dest / 'sw.js').write_text(s, encoding='utf-8')


def construir(app):
    c = APPS[app]
    dest = RAIZ / app
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir()
    for p in ('assets', 'icons'):
        shutil.copytree(FONTE / p, dest / p)
    for f in ('style.css', 'favicon.webp'):
        shutil.copy(FONTE / f, dest / f)
    (dest / 'index.html').write_text(montar_html(app, c), encoding='utf-8')
    montar_js(app, c, dest)
    montar_sw(app, c, dest)
    mf = json.loads((FONTE / 'manifest.webmanifest').read_text(encoding='utf-8'))
    mf.update(name=c['titulo'], short_name=c['titulo'].replace('LinkGlove ', 'Link '), description=c['sub'],
              id='./index.html?app=' + app)
    (dest / 'manifest.webmanifest').write_text(json.dumps(mf, ensure_ascii=False, indent=1), encoding='utf-8')
    (dest / 'servidor.py').write_text(SERVIDOR.replace('__NOME__', c['titulo']).replace('__PORTA__', str(c['porta'])), encoding='utf-8')
    print('ok:', app, len(c['mods']), 'módulos')


if __name__ == '__main__':
    for a in APPS:
        construir(a)
