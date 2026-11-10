import asyncio
from backend.app.services.audio_service import AudioService
from backend.app.services.nlp_service import NLPService


async def run_pipeline():
    print("--- BOOTING EDGE ML PIPELINE ---")
    audio_engine = AudioService()
    nlp_engine = NLPService()
    print("--- MODELS LOADED IN RAM ---\n")

    # 1. Simulate the frontend sending bytes over the WebSocket
    print("Reading mock audio file...")
    with open("./docs/sample_safe.wav", "rb") as f:
        # Note: A real wav file has a header, but Faster-Whisper's
        # robust enough to usually transcribe raw wav bytes anyway for a quick test.
        pcm_bytes = bytearray(f.read())

    # 2. Run your Faster-Whisper Service
    print("\n--- 1. TRANSCRIPTION ---")
    transcript = await audio_engine.transcribe_audio(pcm_bytes)
    print(f"Raw Speech: '{transcript}'")

    # 3. Run your SciSpacy Service
    # print("\n--- 2. ENTITY EXTRACTION ---")
    # entities = nlp_engine.extract_medical_entities(transcript)
    # print(f"Objective Medical Data: {entities}")
    ## print("\n--- PIPELINE COMPLETE ---")


if __name__ == "__main__":
    asyncio.run(run_pipeline())
