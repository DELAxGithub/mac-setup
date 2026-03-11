"""最初10分の文字起こしテスト"""
import wave
import time
from moonshine_voice import get_model_for_language
from moonshine_voice.transcriber import Transcriber

WAV_PATH = "/Users/delaxpro/src/文字起こし/test/33_cut.wav"
DURATION_SEC = 10 * 60  # 10分

# WAV読み込み（最初10分のみ）
print("音声読み込み中...")
with wave.open(WAV_PATH, "rb") as wf:
    ch = wf.getnchannels()
    sw = wf.getsampwidth()
    sr = wf.getframerate()
    frames_to_read = min(DURATION_SEC * sr, wf.getnframes())
    raw = wf.readframes(frames_to_read)

print(f"  {frames_to_read/sr:.1f}秒, {sr}Hz, {ch}ch, {sw*8}bit")

# 24bit → float変換
print("音声変換中 (24bit stereo → mono float)...")
n_samples = frames_to_read * ch
audio = []
for i in range(n_samples):
    offset = i * 3
    b = raw[offset:offset + 3]
    val = int.from_bytes(b, byteorder='little', signed=True)
    audio.append(val / 8388608.0)

# ステレオ→モノラル
if ch == 2:
    audio = [(audio[i] + audio[i + 1]) / 2.0 for i in range(0, len(audio), 2)]

print(f"  サンプル数: {len(audio):,}")

# モデル読み込み
print("モデル読み込み中...")
model_path, model_arch = get_model_for_language(wanted_language='ja')
transcriber = Transcriber(model_path=model_path, model_arch=model_arch)

# 文字起こし
print("文字起こし中（10分間）...")
t0 = time.time()
transcript = transcriber.transcribe_without_streaming(audio, sr)
elapsed = time.time() - t0
print(f"  処理時間: {elapsed:.1f}秒")

# 結果出力
print(f"\n結果: {len(transcript.lines)}行")

out_path = "/Users/delaxpro/src/文字起こし/test/33_cut_10min.txt"
with open(out_path, "w", encoding="utf-8") as f:
    for line in transcript.lines:
        mm = int(line.start_time // 60)
        ss = line.start_time % 60
        speaker = f"[話者{line.speaker_index}] " if line.has_speaker_id else ""
        text = f"[{mm:02d}:{ss:05.2f}] {speaker}{line.text}\n"
        f.write(text)
        print(text, end="")

print(f"\n保存先: {out_path}")
transcriber.close()
