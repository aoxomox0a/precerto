import asyncio
import websockets
import wave


async def simulate_frontend_stream():
    uri = "ws://localhost:8000/ws/audio"

    # Open your local test audio file
    # Make sure this is a 16kHz, mono, 16-bit WAV file!
    wav_path = "./docs/sample_ready.wav"

    print(f"🔌 Connecting to FastAPI WebSocket at {uri}...")

    async with websockets.connect(uri) as websocket:
        print("✅ Connected! Pretending to be the React UI...")

        with wave.open(wav_path, "rb") as wf:
            # Read 32,000 bytes at a time (simulating ~1 second of audio)
            chunk_size = 32000

            # Start a background task to listen for the transcript coming back
            async def listen_for_transcripts():
                try:
                    while True:
                        response = await websocket.recv()
                        print(f"🎙️ Backend Transcription: {response}")
                except websockets.exceptions.ConnectionClosed:
                    print("Connection closed by server.")

            listener_task = asyncio.create_task(listen_for_transcripts())

            # Stream the audio chunks to the server
            while True:
                data = wf.readframes(
                    chunk_size // 2
                )  # // 2 because 1 frame = 2 bytes (16-bit)
                if not data:
                    break

                print(f"⬆️ Sending {len(data)} bytes of audio...")
                await websocket.send(data)

                # Sleep for 1 second to simulate real-time talking
                await asyncio.sleep(1.0)

            print("🏁 Finished sending audio. Waiting for final transcript...")
            await asyncio.sleep(2)  # Give the backend a second to finish processing
            listener_task.cancel()


if __name__ == "__main__":
    asyncio.run(simulate_frontend_stream())
