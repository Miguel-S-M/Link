#!/usr/bin/env python3
"""Servidor local de LinkGlove Aprender (só biblioteca padrão do Python, sem instalar nada).

  python3 servidor.py                      abre no navegador normal
  python3 servidor.py --quiosque           tela cheia, sem barras (hardware dedicado)
  python3 servidor.py --quiosque --posicao 1920,0     abre na 2ª tela (x,y do canto da tela)
  python3 servidor.py --sem-navegador      só serve (abra http://localhost:8001 você mesmo)

Offline: abra uma vez COM internet e use o botão "Preparar uso offline" (aba Avançado da câmera).
Depois disso funciona sem internet.
"""
import argparse, http.server, mimetypes, os, shutil, socketserver, subprocess, threading, webbrowser
from pathlib import Path

PASTA = Path(__file__).resolve().parent
NOME, PORTA = "LinkGlove Aprender", 8001
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
    for p in (r'C:\Program Files\Google\Chrome\Application\chrome.exe',
              r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
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
            print('\nEncerrado.')


if __name__ == '__main__':
    main()
