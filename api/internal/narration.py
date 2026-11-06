import hashlib
import hmac
import io
import json
import os
import threading
import time
from http.server import BaseHTTPRequestHandler

_generation_lock = threading.Lock()
_pipeline = None


def synthesize(text, voice):
    global _pipeline
    os.environ["HF_HOME"] = "/tmp/trama-huggingface"
    import numpy as np
    import soundfile
    import torch
    from kokoro import KPipeline

    torch.set_num_threads(1)
    if _pipeline is None:
        _pipeline = KPipeline(lang_code="p", repo_id="hexgrad/Kokoro-82M")
    chunks = [result.audio.numpy() for result in _pipeline(text, voice=voice)]
    output = io.BytesIO()
    soundfile.write(output, np.concatenate(chunks), 24000, format="WAV")
    return output.getvalue()


class handler(BaseHTTPRequestHandler):
    def reply(self, status, body=b"", content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "private, no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self.reply(405)

    def do_POST(self):
        secret = os.environ.get("TRAMA_NARRATION_SECRET", "")
        if len(secret) < 32:
            self.reply(404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.reply(400)
            return
        if length <= 0 or length > 16384:
            self.reply(413)
            return
        timestamp = self.headers.get("X-Trama-Timestamp", "")
        signature = self.headers.get("X-Trama-Signature", "")
        try:
            valid_time = abs(time.time() - int(timestamp)) <= 60
        except ValueError:
            valid_time = False
        if not valid_time:
            self.reply(401)
            return
        body = self.rfile.read(length)
        expected = hmac.new(secret.encode(), timestamp.encode() + b"." + body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature.encode("utf-8"), expected.encode("ascii")):
            self.reply(401)
            return
        try:
            data = json.loads(body)
            text = data.get("text")
            voice = data.get("voice")
            if not isinstance(text, str) or not text.strip() or len(text) > 1000:
                raise ValueError()
            if voice not in ("pf_dora", "pm_alex", "pm_santa"):
                raise ValueError()
        except (ValueError, AttributeError, UnicodeDecodeError):
            self.reply(400)
            return
        if not _generation_lock.acquire(blocking=False):
            self.reply(503)
            return
        try:
            audio = synthesize(text, voice)
            if len(audio) > 4_000_000:
                self.reply(413)
                return
            self.reply(200, audio, "audio/wav")
        except Exception:
            self.reply(500, b'{"message":"Narration generation failed."}')
        finally:
            _generation_lock.release()

    def log_message(self, format, *args):
        # Never log chapter text, signatures or headers.
        pass
