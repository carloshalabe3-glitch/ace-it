import http.server
import socketserver
import sys
import traceback

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080


class Handler(http.server.SimpleHTTPRequestHandler):
    def address_string(self):
        try:
            return str(self.client_address[0])
        except Exception:
            return "unknown"

    def log_message(self, fmt, *args):
        try:
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))
        except Exception:
            pass


class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def handle_error(self, request, client_address):
        traceback.print_exc()


if __name__ == '__main__':
    httpd = Server(('0.0.0.0', PORT), Handler)
    print('Serving at http://127.0.0.1:%d/index.html' % PORT)
    while True:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            break
        except Exception:
            traceback.print_exc()
            continue
