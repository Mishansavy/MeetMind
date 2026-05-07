import whisper

_model = whisper.load_model("base")


def transcribe_audio(file_path: str) -> str:
    result = _model.transcribe(file_path)
    return result["text"].strip()
