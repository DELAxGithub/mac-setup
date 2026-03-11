"""音声ファイルを文字起こしするスクリプト"""
import sys
import wave
import struct
from moonshine_voice import get_model_for_language
from moonshine_voice.transcriber import Transcriber


def load_wav(path: str) -> tuple[list[float], int]:
    """WAVファイルを読み込んでPCM floatリストとサンプルレートを返す"""
    with wave.open(path, "rb") as wf:
        channels = wf.getnchannels()
        sample_width = wf.getsampwidth()
        sample_rate = wf.getframerate()
        n_frames = wf.getnframes()
        raw = wf.readframes(n_frames)

    if sample_width == 2:
        fmt = f"<{n_frames * channels}h"
        samples = struct.unpack(fmt, raw)
        audio = [s / 32768.0 for s in samples]
    elif sample_width == 4:
        fmt = f"<{n_frames * channels}i"
        samples = struct.unpack(fmt, raw)
        audio = [s / 2147483648.0 for s in samples]
    else:
        raise ValueError(f"Unsupported sample width: {sample_width}")

    # ステレオ→モノラル変換
    if channels == 2:
        audio = [(audio[i] + audio[i + 1]) / 2 for i in range(0, len(audio), 2)]

    return audio, sample_rate


def main():
    if len(sys.argv) < 2:
        print("使い方: python transcribe_file.py <音声ファイル.wav> [言語(ja/en/...)]")
        sys.exit(1)

    audio_path = sys.argv[1]
    lang = sys.argv[2] if len(sys.argv) > 2 else "ja"

    print(f"モデル読み込み中 (lang={lang})...")
    model_path, model_arch = get_model_for_language(wanted_language=lang)
    transcriber = Transcriber(model_path=model_path, model_arch=model_arch)

    print(f"音声読み込み中: {audio_path}")
    audio, sample_rate = load_wav(audio_path)
    duration = len(audio) / sample_rate
    print(f"  {duration:.1f}秒, {sample_rate}Hz")

    print("文字起こし中...")
    transcript = transcriber.transcribe_without_streaming(audio, sample_rate)

    print("\n--- 結果 ---")
    for line in transcript.lines:
        print(line.text)

    transcriber.close()


if __name__ == "__main__":
    main()
