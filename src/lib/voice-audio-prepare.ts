/**
 * 多数自建 Dify 的 STT 实际只稳定支持 wav（文档写 m4a/webm 也常 415）。
 * 上传前统一转为 16kHz 单声道 WAV。
 */

export function extensionForBlob(blob: Blob): string {
  const t = blob.type || "";
  if (t.includes("wav")) return "wav";
  if (t.includes("mp4")) return "m4a";
  if (t.includes("mpeg")) return "mp3";
  if (t.includes("ogg")) return "ogg";
  if (t.includes("webm")) return "webm";
  return "wav";
}

async function hasWavHeader(blob: Blob): Promise<boolean> {
  if (blob.size < 12) return false;
  const head = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  return head[0] === 0x52 && head[1] === 0x49 && head[2] === 0x46 && head[3] === 0x46;
}

function downmixToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) {
    return buffer.getChannelData(0);
  }
  const len = buffer.length;
  const mono = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    let sum = 0;
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      sum += buffer.getChannelData(c)[i] ?? 0;
    }
    mono[i] = sum / buffer.numberOfChannels;
  }
  return mono;
}

function floatTo16BitPcm(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

function encodeWav(pcm: Int16Array, sampleRate: number): ArrayBuffer {
  const dataSize = pcm.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < pcm.length; i++, offset += 2) {
    view.setInt16(offset, pcm[i], true);
  }
  return buffer;
}

async function resampleTo16k(mono: Float32Array, sampleRate: number): Promise<Float32Array> {
  const targetRate = 16000;
  if (sampleRate === targetRate) return mono;

  const duration = mono.length / sampleRate;
  const targetLength = Math.max(1, Math.round(duration * targetRate));
  const offline = new OfflineAudioContext(1, targetLength, targetRate);
  const buffer = offline.createBuffer(1, mono.length, sampleRate);
  buffer.copyToChannel(new Float32Array(mono), 0);
  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.connect(offline.destination);
  source.start(0);
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0);
}

async function blobToWav(blob: Blob): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const ctx = new AudioContext();
  try {
    const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
    let mono = downmixToMono(decoded);
    mono = await resampleTo16k(mono, decoded.sampleRate);
    const pcm = floatTo16BitPcm(mono);
    const wav = encodeWav(pcm, 16000);
    return new Blob([wav], { type: "audio/wav" });
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

/** 上传 Dify 前统一为 WAV（兼容仅接受 wav 的 Dify STT） */
export async function prepareAudioForStt(blob: Blob): Promise<{ blob: Blob; filename: string }> {
  if (await hasWavHeader(blob)) {
    return { blob, filename: "recording.wav" };
  }
  try {
    const wavBlob = await blobToWav(blob);
    return { blob: wavBlob, filename: "recording.wav" };
  } catch {
    throw new Error("录音格式无法转换，请换用手机微信/Safari，或改用文字输入");
  }
}
