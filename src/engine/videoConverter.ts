import { FFmpeg } from "@ffmpeg/ffmpeg";
import {
  fetchFile,
  toBlobURL,
} from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;
let loadingPromise: Promise<void> | null = null;

async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;

  if (loadingPromise) {
    await loadingPromise;
    return ffmpeg!;
  }

  const instance = new FFmpeg();

  loadingPromise = (async () => {
    const baseURL =
      "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

    await instance.load({
      coreURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.js`,
        "text/javascript"
      ),
      wasmURL: await toBlobURL(
        `${baseURL}/ffmpeg-core.wasm`,
        "application/wasm"
      ),
    });

    ffmpeg = instance;
  })();

  await loadingPromise;

  return ffmpeg!;
}

export async function convertVideoToCompatibleMP4(
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> {
  const engine = await loadFFmpeg();

  const inputName = `input_${Date.now()}_${file.name
    .replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  const outputName = `boxing_compatible_${Date.now()}.mp4`;

  engine.on("progress", ({ progress }) => {
    onProgress?.(
      Math.max(0, Math.min(1, progress))
    );
  });

  await engine.writeFile(
    inputName,
    await fetchFile(file)
  );

  await engine.exec([
    "-i",
    inputName,

    "-c:v",
    "libx264",

    "-preset",
    "ultrafast",

    "-crf",
    "23",

    "-pix_fmt",
    "yuv420p",

    "-c:a",
    "aac",

    "-movflags",
    "+faststart",

    outputName,
  ]);

  const data = await engine.readFile(
    outputName
  );

  await engine.deleteFile(inputName);
  await engine.deleteFile(outputName);

  const bytes =
    typeof data === "string"
      ? new TextEncoder().encode(data)
      : data;

  return new File(
    [bytes],
    outputName,
    {
      type: "video/mp4",
    }
  );
}
