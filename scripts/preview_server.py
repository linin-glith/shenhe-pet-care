"""
The local preview: the static site AND the API, on one origin.

WHY ONE ORIGIN
In production, nginx serves the exported files and reverse-proxies /api/* to
the Node service, so the page and the API are the same origin: the session
cookie travels, there is no CORS, and Sec-Fetch-Site says "same-origin".
Running the two on different ports locally would test something production
never does — cookies would be dropped, every write would look like a network
error, and a green run would mean nothing. So the preview forwards /api/* to
the API instead of serving it from the static directory.

Usage:
    python scripts/preview_server.py --root <dir> --port 8099 --api http://127.0.0.1:4000
"""
import argparse
import mimetypes
import os
import posixpath
import urllib.error
import urllib.parse
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HOP_BY_HOP = {
    'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
    'te', 'trailers', 'transfer-encoding', 'upgrade', 'content-encoding',
    'content-length',
}


class PreviewHandler(SimpleHTTPRequestHandler):
    root = '.'
    api_base = 'http://127.0.0.1:4000'

    # ---- API proxy --------------------------------------------------
    def proxy(self):
        length = int(self.headers.get('Content-Length') or 0)
        body = self.rfile.read(length) if length else None

        headers = {}
        for key, value in self.headers.items():
            if key.lower() in HOP_BY_HOP or key.lower() == 'host':
                continue
            headers[key] = value
        headers['Host'] = self.api_base.split('//', 1)[-1]
        headers['X-Forwarded-For'] = self.client_address[0]

        url = self.api_base.rstrip('/') + self.path
        req = urllib.request.Request(url, data=body, headers=headers, method=self.command)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                payload = resp.read()
                self.send_response(resp.status)
                for key, value in resp.headers.items():
                    if key.lower() in HOP_BY_HOP:
                        continue
                    if key.lower() == 'set-cookie':
                        continue
                    self.send_header(key, value)
                for value in resp.headers.get_all('Set-Cookie') or []:
                    self.send_header('Set-Cookie', value)
                self.send_header('Content-Length', str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
        except urllib.error.HTTPError as err:
            payload = err.read()
            self.send_response(err.code)
            for key, value in err.headers.items():
                if key.lower() in HOP_BY_HOP or key.lower() == 'set-cookie':
                    continue
                self.send_header(key, value)
            for value in err.headers.get_all('Set-Cookie') or []:
                self.send_header('Set-Cookie', value)
            self.send_header('Content-Length', str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except Exception as err:  # the API is down
            msg = f'{{"message":"The API at {self.api_base} could not be reached: {err}"}}'.encode()
            self.send_response(502)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)

    def _route(self):
        if self.path.startswith('/api/'):
            self.proxy()
            return True
        return False

    # ---- static files -----------------------------------------------
    def translate_path(self, path):
        path = path.split('?', 1)[0].split('#', 1)[0]
        path = posixpath.normpath(urllib.parse.unquote(path))
        parts = [p for p in path.split('/') if p and p not in ('.', '..')]
        target = os.path.join(self.root, *parts) if parts else self.root

        if os.path.isdir(target):
            index = os.path.join(target, 'index.html')
            if os.path.exists(index):
                return index
            return target
        if os.path.exists(target):
            return target
        # /products/deodorizing-disinfecting -> /products/deodorizing-disinfecting.html
        candidate = target + '.html'
        if os.path.exists(candidate):
            return candidate
        return target

    def _canonical_redirect(self):
        """301 the extensionless form to the .html form.

        THE SITE PUBLISHES ONE PAGE ON TWO URLS
        Every page answers 200 on both /about.html and /about, with the same
        bytes. The canonical tag names the .html form, so a search engine
        treats the other one as a duplicate of it -- which is what the
        Search Console indexing report shows: 44 of the 86 URLs it knows are
        "alternate pages with a proper canonical".

        That is half the known URL space spent on a second copy of a page
        that was already there. One URL per page, and a 301 from the other
        form, is the cheapest traffic available: no content change, no
        advertisement, and a crawler that reads fewer copies of the same
        page reads more pages.
        """
        path = self.path.split('?', 1)[0].split('#', 1)[0]
        if not path or path == '/':
            return False
        stem = path.rstrip('/')
        if os.path.splitext(stem)[1]:
            return False
        target = os.path.join(self.root, *[p for p in stem.split('/') if p])
        if not os.path.exists(target + '.html'):
            return False
        self.send_response(301)
        self.send_header('Location', stem + '.html' + ('?' + self.path.split('?', 1)[1] if '?' in self.path else ''))
        self.send_header('Content-Length', '0')
        self.end_headers()
        return True

    def do_GET(self):
        if self._route():
            return
        if self._canonical_redirect():
            return
        super().do_GET()

    def do_HEAD(self):
        if self._route():
            return
        if self._canonical_redirect():
            return
        super().do_HEAD()

    def do_POST(self):
        if self._route():
            return
        self.send_error(405, 'Method Not Allowed')

    def do_PATCH(self):
        if self._route():
            return
        self.send_error(405, 'Method Not Allowed')

    def do_DELETE(self):
        if self._route():
            return
        self.send_error(405, 'Method Not Allowed')

    def do_OPTIONS(self):
        if self._route():
            return
        self.send_response(204)
        self.end_headers()

    def end_headers(self):
        if not self.path.startswith('/api/'):
            self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def log_message(self, fmt, *args):
        if '/api/' in (args[0] if args else ''):
            super().log_message(fmt, *args)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--root', required=True)
    parser.add_argument('--port', type=int, default=8099)
    parser.add_argument('--api', default='http://127.0.0.1:4000')
    args = parser.parse_args()

    PreviewHandler.root = os.path.abspath(args.root)
    PreviewHandler.api_base = args.api
    mimetypes.add_type('application/javascript', '.js')
    mimetypes.add_type('text/css', '.css')
    mimetypes.add_type('image/webp', '.webp')

    server = ThreadingHTTPServer(('127.0.0.1', args.port), PreviewHandler)
    print(f'preview: http://127.0.0.1:{args.port}/  (root: {PreviewHandler.root})')
    print(f'api:     {args.api}/api/* is forwarded')
    server.serve_forever()


if __name__ == '__main__':
    main()
