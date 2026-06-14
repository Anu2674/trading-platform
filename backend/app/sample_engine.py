#!/usr/bin/env python3
import json
import time
import threading
import socketserver
from http.server import HTTPServer, BaseHTTPRequestHandler


class OrderBook:
    def __init__(self):
        self.lock = threading.Lock()
        self.bids = []   # [(price, ts, order_id, qty)]  high price first
        self.asks = []   # [(price, ts, order_id, qty)]  low price first
        self.orders = {}
        self.order_count = 0
        self.fill_count = 0

    def process(self, order):
        with self.lock:
            self.order_count += 1
            oid   = order.get('OrderID', '')
            otype = order.get('Type', 'limit').lower()
            side  = order.get('Side', 'buy').lower()
            price = float(order.get('Price', 0))
            qty   = int(order.get('Quantity', 1))
            ts    = order.get('Timestamp', int(time.time() * 1000))

            if otype == 'cancel':
                self.orders.pop(oid, None)
                return {'order_id': oid, 'status': 'cancelled', 'filled_qty': 0, 'timestamp': ts}

            self.orders[oid] = {'price': price, 'qty': qty, 'side': side, 'ts': ts}

            filled = False
            if side == 'buy':
                if self.asks and (otype == 'market' or price >= self.asks[0][0]):
                    self.asks.pop(0)
                    self.fill_count += 1
                    filled = True
                else:
                    self.bids.append((price, ts, oid, qty))
                    self.bids.sort(key=lambda x: (-x[0], x[1]))
            else:
                if self.bids and (otype == 'market' or price <= self.bids[0][0]):
                    self.bids.pop(0)
                    self.fill_count += 1
                    filled = True
                else:
                    self.asks.append((price, ts, oid, qty))
                    self.asks.sort(key=lambda x: (x[0], x[1]))

            return {
                'order_id': oid,
                'status': 'filled' if filled else 'accepted',
                'filled_qty': qty if filled else 0,
                'timestamp': ts,
            }


book = OrderBook()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # suppress per-request logs

    def do_POST(self):
        if self.path == '/order':
            try:
                n    = int(self.headers.get('Content-Length', 0))
                data = json.loads(self.rfile.read(n))
                result = book.process(data)
                resp = json.dumps(result).encode()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(resp)))
                self.end_headers()
                self.wfile.write(resp)
            except Exception as e:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path == '/health':
            resp = json.dumps({
                'status': 'ok',
                'orders': book.order_count,
                'filled': book.fill_count,
            }).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(resp)))
            self.end_headers()
            self.wfile.write(resp)
        else:
            self.send_response(404)
            self.end_headers()


class ThreadedHTTPServer(socketserver.ThreadingMixIn, HTTPServer):
    daemon_threads = True


if __name__ == '__main__':
    server = ThreadedHTTPServer(('0.0.0.0', 8888), Handler)
    print('Trading engine listening on :8888', flush=True)
    server.serve_forever()
