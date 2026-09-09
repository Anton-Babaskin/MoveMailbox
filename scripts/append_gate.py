"""Bounded streaming parser for the disposable IMAP APPEND fault proxy."""
import re


class AppendGate:
    def __init__(self, limit):
        if limit < 1:
            raise ValueError("positive literal prefix required")
        self.limit = limit
        self.pending = bytearray()
        self.literal_size = None
        self.forwarded = 0
        self.dropped = False

    def feed(self, data, send):
        if self.dropped:
            return
        self.pending.extend(data)
        while self.pending:
            if self.literal_size is not None:
                count = min(len(self.pending), self.limit - self.forwarded)
                send(bytes(self.pending[:count]))
                del self.pending[:count]
                self.forwarded += count
                if self.forwarded == self.limit:
                    self.dropped = True
                    self.pending.clear()
                return
            end = self.pending.find(b"\r\n")
            if end < 0:
                if len(self.pending) > 65536:
                    raise ValueError("IMAP command exceeds test parser limit")
                return
            line = bytes(self.pending[:end + 2])
            del self.pending[:end + 2]
            marker = re.search(rb"\{([0-9]+)(\+)?\}\r\n$", line)
            if re.match(rb"[^\s]+ APPEND ", line, re.I):
                if not marker:
                    raise ValueError("unsupported APPEND framing")
                size = int(marker[1])
                if size <= self.limit:
                    raise ValueError("literal must be larger than cut point")
                self.literal_size = size
            elif marker:
                raise ValueError("non-APPEND literals unsupported by this test proxy")
            send(line)
