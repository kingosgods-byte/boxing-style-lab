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

    const exitCode =
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

    if (exitCode !== 0) {
      throw new Error(
        `FFmpeg conversion failed with exit code ${exitCode}.`
      );
    }

    const data =
      await engine.readFile(
        outputName
      );

    const buffer =
      typeof data === "string"
        ? new TextEncoder().encode(data)
        : data.buffer;

    const blob = new Blob(
      [buffer],
      {
        type: "video/mp4",
      }
    );

    if (blob.size === 0) {
      throw new Error(
        "FFmpeg created an empty video."
      );
    }

    return new File(
      [blob],
      outputName,
      {
        type: "video/mp4",
        lastModified: Date.now(),
      }
    );
  } finally {
    try {
      await engine.deleteFile(
        inputName
      );
    } catch {
      // Ignore cleanup errors.
    }

    try {
      await engine.deleteFile(
        outputName
      );
    } catch {
      // Ignore cleanup errors.
    }

    engine.off(
      "progress",
      progressHandler
    );
  }
}
