"""Discard a tagged APPEND success after the server has committed the message.

For this isolated fixture only: bounded line parsing, one APPEND with a literal
mailbox name unsupported. Payload is forwarded untouched, including its CRLF.
"""
import re
import threading


class AppendAckGate:
    def __init__(self):
        self.pending = bytearray()
        self.replies = bytearray()
        self.literal_size = None
        self.forwarded = 0
        self.tag = None
        self.dropped = False
        self.lock = threading.Lock()

    def feed(self, data, send):
        if self.dropped:
            return
        if self.literal_size is not None:
            with self.lock:
                send(data)
                self.forwarded += min(len(data), self.literal_size - self.forwarded)
            return
        self.pending.extend(data)
        while self.pending:
            end = self.pending.find(b"\r\n")
            if end < 0:
                if len(self.pending) > 65536:
                    raise ValueError("command too large")
                return
            line = bytes(self.pending[:end + 2])
            del self.pending[:end + 2]
            if re.match(rb"[^\s]+ APPEND ", line, re.I):
                marker = re.search(rb"\{([0-9]+)\+?\}\r\n$", line)
                if not marker:
                    raise ValueError("unsupported APPEND")
                self.literal_size = int(marker[1])
                self.tag = line.split(b" ", 1)[0]
                send(line)
                payload = bytes(self.pending)
                self.pending.clear()
                self.feed(payload, send)
                return
            send(line)

    def reply(self, data, send):
        if self.dropped:
            return
        self.replies.extend(data)
        while self.replies:
            end = self.replies.find(b"\r\n")
            if end < 0:
                if len(self.replies) > 65536:
                    raise ValueError("reply too large")
                return
            line = bytes(self.replies[:end + 2])
            del self.replies[:end + 2]
            if self.tag and re.match(re.escape(self.tag) + rb" OK(?: |\r)", line, re.I):
                with self.lock:
                    if self.forwarded != self.literal_size:
                        raise ValueError("success before whole literal was forwarded")
                    self.dropped = True
                self.replies.clear()
                return
            send(line)
