# faster-whisper
import os
import numpy as np
import asyncio
from faster_whisper import WhisperModel


class AudioService:
    def __init__(self):
        # cap at 4 cores for whisper
        optimal_threads = min(4, max(1, os.cpu_count() - 1))
        model_size = "turbo"
        self.model = WhisperModel(
            model_size, device="cpu", compute_type="int8", cpu_threads=optimal_threads
        )
        self.clinical_prompt = "The following is a medical consultation regarding obesity, symptoms, and clinical findings."

    async def transcribe_audio(self, audio_buffer: np.ndarray, **kwargs) -> str:
        loop = asyncio.get_running_loop()

        # 1. We wrap the heavy CPU-bound task in a function
        def _do_transcribe():
            segments, _ = self.model.transcribe(
                audio_buffer,
                beam_size=5,
                language="en",  # Lock to English so it doesn't try to guess in silence
                temperature=0.0,
                initial_prompt=self.clinical_prompt,  # From Snippet 1
                vad_filter=True,  # From Snippet 2
                vad_parameters=dict(
                    threshold=0.3,
                    min_speech_duration_ms=250,
                ),
                **kwargs,
            )
            return "".join([segment.text for segment in segments]).strip()

        # 2. CRITICAL: We run this in a background thread so the WebSocket stays alive
        # This is the "Separation of Concerns" for your CPU
        return await loop.run_in_executor(None, _do_transcribe)
