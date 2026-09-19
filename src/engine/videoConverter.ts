import { FFmpeg } from "@ffmpeg/ffmpeg";
import {
  fetchFile,
  toBlobURL,
} from "@ffmpeg/util";

let ffmpeg: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

async function loadFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) {
    return ffmpeg;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    const instance = new FFmpeg();

    const baseURL =
      "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm";

    instance.on("log", ({ message }) => {
      console.log("[FFmpeg]", message);
    });

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

    return instance;
  })();

  return loadingPromise;
}

export async function convertVideoToCompatibleMP4(
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> {
  const engine = await loadFFmpeg();

  const inputName =
    `input_${Date.now()}.mov`;

  const outputName =
    `boxing_compatible_${Date.now()}.mp4`;

  const progressHandler = ({
    progress,
  }: {
    progress: number;
  }) => {
    onProgress?.(
      Math.max(
        0,
        Math.min(1, progress)
      )
    );
  };

  engine.on(
    "progress",
    progressHandler
  );

  try {
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

    const data =
      await engine.readFile(
        outputName
      );

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
  } finally {
    try {
      await engine.deleteFile(
        inputName
      );
    } catch {
      // File may not exist if conversion failed.
    }

    try {
      await engine.deleteFile(
        outputName
      );
    } catch {
      // File may not exist if conversion failed.
    }

    engine.off(
      "progress",
      progressHandler
    );
  }
}
