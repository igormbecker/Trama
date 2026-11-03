import io
import sys
from contextlib import redirect_stdout

import numpy as np
import soundfile
import torch
from kokoro import KPipeline

text = sys.stdin.buffer.read().decode("utf-8")
voice = sys.argv[1]
torch.set_num_threads(2)

with redirect_stdout(sys.stderr):
    pipeline = KPipeline(lang_code="p", repo_id="hexgrad/Kokoro-82M")
    chunks = [result.audio.numpy() for result in pipeline(text, voice=voice)]

output = io.BytesIO()
soundfile.write(output, np.concatenate(chunks), 24000, format="WAV")
sys.stdout.buffer.write(output.getvalue())
