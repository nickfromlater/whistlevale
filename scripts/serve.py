"""Local preview, allowing only the demo and its public assets."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
import argparse
import json
import re

ROOT = Path(__file__).resolve().parents[1]

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        path = unquote(urlsplit(self.path).path).lstrip('/')
        if not path:
            path = 'index.html'
        parts = Path(path).parts
        allowed = path in ('index.html', 'grandhall.html') or (bool(parts) and parts[0] in ('assets', 'src', 'vendor'))
        resolved = (ROOT / path).resolve()
        if not allowed or any(p.startswith('.') for p in parts) or not resolved.is_relative_to(ROOT) or not resolved.is_file():
            self.send_error(404)
            return
        self.path = '/' + path
        if path in ('index.html', 'grandhall.html'):
            recordings = sorted(p.stem for p in (ROOT / 'assets' / 'audio').glob('*.mp3') if p.is_file() and not p.name.startswith('.'))
            catalog = json.dumps(recordings, separators=(',', ':')).replace('<', '\\u003c')
            html = re.sub(r'(<script id="audioCatalog">)[\s\S]*?(</script>)', lambda match: match[1] + 'window.HOUSE_AUDIO_AVAILABLE=' + catalog + ';' + match[2], resolved.read_text())
            community = json.dumps(json.loads((ROOT / 'contributions/world.json').read_text()), separators=(',', ':')).replace('<', '\\u003c')
            html = re.sub(r'(<script id="communityCatalog">)[\s\S]*?(</script>)', lambda match: match[1] + 'window.HOUSE_COMMUNITY=' + community + ';' + match[2], html)
            payload = html.encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            if self.command != 'HEAD':
                self.wfile.write(payload)
            return
        if resolved.suffix.lower() == '.mp4':
            self.send_video(resolved)
            return
        if self.command == 'HEAD':
            super().do_HEAD()
        else:
            super().do_GET()

    def send_video(self, resolved):
        # A single byte range is enough for native media loading and seeking.
        # Keep the public-path allowlist above in force for every media request.
        size = resolved.stat().st_size
        start, end = 0, size - 1
        requested = self.headers.get('Range') if not self.headers.get('If-Range') else None
        if requested:
            match = re.fullmatch(r'bytes=(\d*)-(\d*)', requested.strip())
            valid = bool(match and any(match.groups()) and size)
            if valid:
                first, last = match.groups()
                if first:
                    start = int(first)
                    end = min(int(last), size - 1) if last else size - 1
                else:
                    length = int(last)
                    valid = length > 0
                    start = max(0, size - length)
                valid = valid and 0 <= start <= end < size
            if not valid:
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{size}')
                self.send_header('Content-Length', '0')
                self.send_header('Accept-Ranges', 'bytes')
                self.end_headers()
                return
        self.send_response(206 if requested else 200)
        self.send_header('Content-Type', 'video/mp4')
        self.send_header('Content-Length', str(max(0, end - start + 1)))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Last-Modified', self.date_time_string(resolved.stat().st_mtime))
        if requested:
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.end_headers()
        if self.command == 'HEAD':
            return
        with resolved.open('rb') as media:
            media.seek(start)
            remaining = end - start + 1
            try:
                while remaining > 0:
                    chunk = media.read(min(65536, remaining))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    remaining -= len(chunk)
            except (BrokenPipeError, ConnectionResetError):
                pass  # Browsers cancel ranges when seeking or leaving a room.

    def do_HEAD(self):
        self.do_GET()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', type=int, default=4174)
    args = parser.parse_args()
    print(f'Whistlevale: http://127.0.0.1:{args.port}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
