import hashlib
import hmac
import importlib.util
import io
import json
import os
import time
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("narration_function", "api/internal/narration.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
SECRET = "test-secret-with-at-least-32-characters"

class NarrationFunctionTests(unittest.TestCase):
    def request(self, data=None, timestamp=None, signature=None):
        body = json.dumps(data or {"text": "Olá.", "voice": "pf_dora"}).encode()
        timestamp = timestamp or str(int(time.time()))
        signature = signature or hmac.new(SECRET.encode(), timestamp.encode() + b"." + body, hashlib.sha256).hexdigest()
        handler = object.__new__(module.handler)
        handler.headers = {"Content-Length": str(len(body)), "X-Trama-Timestamp": timestamp, "X-Trama-Signature": signature}
        handler.rfile = io.BytesIO(body)
        handler.wfile = io.BytesIO()
        handler.send_response = lambda status: setattr(handler, "status", status)
        handler.send_header = lambda *args: None
        handler.end_headers = lambda: None
        return handler

    @patch.dict(os.environ, {"TRAMA_NARRATION_SECRET": SECRET})
    @patch.object(module, "synthesize")
    def test_unsigned_and_expired_requests_never_generate(self, generate):
        for request in [self.request(signature="invalid"), self.request(signature="assinatura-inválida"), self.request(timestamp=str(int(time.time()) - 300))]:
            request.do_POST()
            self.assertEqual(request.status, 401)
        generate.assert_not_called()

    @patch.dict(os.environ, {"TRAMA_NARRATION_SECRET": SECRET})
    @patch.object(module, "synthesize")
    def test_valid_request_generates_audio(self, generate):
        generate.return_value = b"RIFFtestWAVE"
        request = self.request()
        request.do_POST()
        self.assertEqual(request.status, 200)
        self.assertEqual(request.wfile.getvalue(), b"RIFFtestWAVE")
        generate.assert_called_once_with("Olá.", "pf_dora")

    @patch.dict(os.environ, {"TRAMA_NARRATION_SECRET": SECRET})
    @patch.object(module, "synthesize")
    def test_rejects_invalid_voices_and_oversized_text(self, generate):
        for data in [{"text": "test", "voice": "../../invalid"}, {"text": "a" * 1001, "voice": "pf_dora"}, {"text": "", "voice": "pf_dora"}]:
            request = self.request(data)
            request.do_POST()
            self.assertEqual(request.status, 400)
        generate.assert_not_called()

    @patch.dict(os.environ, {"TRAMA_NARRATION_SECRET": SECRET})
    @patch.object(module, "synthesize")
    def test_generation_errors_do_not_expose_text_or_secret(self, generate):
        generate.side_effect = RuntimeError(SECRET)
        request = self.request()
        request.do_POST()
        self.assertEqual(request.status, 500)
        self.assertNotIn(SECRET.encode(), request.wfile.getvalue())

if __name__ == "__main__":
    unittest.main()
