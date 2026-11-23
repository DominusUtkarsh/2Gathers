import { FaceBoundingBox, FaceDetectionResult } from "./types";

interface NativeDetectedFace {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface NativeFaceDetector {
  detect(image: ImageBitmapSource): Promise<NativeDetectedFace[]>;
}

declare global {
  interface Window {
    FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => NativeFaceDetector;
  }
}

let nativeDetectorInstance: NativeFaceDetector | null = null;
let nativeDetectorFailed = false;

function getNativeFaceDetector(): NativeFaceDetector | null {
  if (typeof window === "undefined") return null;
  if (nativeDetectorFailed) return null;
  if (nativeDetectorInstance) return nativeDetectorInstance;

  try {
    if ("FaceDetector" in window && typeof window.FaceDetector === "function") {
      nativeDetectorInstance = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 4 });
      return nativeDetectorInstance;
    }
  } catch {
    nativeDetectorFailed = true;
  }
  return null;
}

/**
 * Fast client-side computer vision face detector using native Shape Detection API
 * with automatic fallback to canvas-based chrominance and spatial clustering.
 */
export async function detectFaces(
  video: HTMLVideoElement,
  workCanvas?: HTMLCanvasElement
): Promise<FaceDetectionResult> {
  if (!video || video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return {
      detected: false,
      count: 0,
      boxes: [],
      isObstructed: false,
      isLookingAway: false,
    };
  }

  // Ensure video is actively playing if ready
  if (video.paused) {
    video.play().catch(() => {});
  }

  const vWidth = video.videoWidth;
  const vHeight = video.videoHeight;

  // 1. Lighting / Obstruction Check (Room lights off or lens covered)
  const lightingCheck = checkFrameLighting(video, workCanvas);
  if (lightingCheck.isObstructed) {
    return {
      detected: false,
      count: 0,
      boxes: [],
      isObstructed: true,
      isLookingAway: false,
    };
  }

  // 2. Hardware-accelerated native detector if available in browser
  const nativeDetector = getNativeFaceDetector();
  if (nativeDetector) {
    try {
      const faces = await nativeDetector.detect(video);
      if (faces && faces.length > 0) {
        const boxes: FaceBoundingBox[] = faces.map((face) => ({
          x: face.boundingBox.x,
          y: face.boundingBox.y,
          width: face.boundingBox.width,
          height: face.boundingBox.height,
          confidence: 0.95,
        }));

        boxes.sort((a, b) => b.width * b.height - a.width * a.height);
        const primary = boxes[0];

        const faceCenterX = primary.x + primary.width / 2;
        const normalizedCenterX = faceCenterX / vWidth;
        const isLookingAway = normalizedCenterX < 0.15 || normalizedCenterX > 0.85;

        return {
          detected: true,
          count: boxes.length,
          boxes,
          primaryBox: primary,
          isObstructed: false,
          isLookingAway,
        };
      }
    } catch {
      nativeDetectorFailed = true;
    }
  }

  // 3. Robust in-canvas computer vision fallback
  return analyzeCanvasSkinFallback(video, workCanvas);
}

/**
 * Checks for darkness (room lights off), covered camera lens, or blinding glare.
 */
function checkFrameLighting(
  video: HTMLVideoElement,
  workCanvas?: HTMLCanvasElement
): { isObstructed: boolean; avgLuminance: number } {
  const canvas = workCanvas || document.createElement("canvas");
  const w = 64;
  const h = 48;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return { isObstructed: false, avgLuminance: 128 };

  ctx.drawImage(video, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;

  let totalLuminance = 0;
  for (let i = 0; i < d.length; i += 4) {
    totalLuminance += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  }

  const avgLuminance = totalLuminance / (w * h);
  // Pitch black / room lights off (avgLuminance < 36) or blinding glare (> 245)
  const isObstructed = avgLuminance < 36 || avgLuminance > 245;

  return { isObstructed, avgLuminance };
}

/**
 * Pure Canvas Computer Vision Analyzer:
 * Uses YCbCr skin modeling + 2D connected components + body part merging
 * to reliably detect a single candidate without false positives from neck, collar, or hands.
 * Only flags multiple faces when a distinct secondary head is horizontally separated in frame.
 */
function analyzeCanvasSkinFallback(
  video: HTMLVideoElement,
  workCanvas?: HTMLCanvasElement
): FaceDetectionResult {
  const canvas = workCanvas || document.createElement("canvas");
  const scale = 0.25;
  const w = Math.max(80, Math.floor(video.videoWidth * scale));
  const h = Math.max(60, Math.floor(video.videoHeight * scale));

  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return { detected: false, count: 0, boxes: [], isObstructed: false, isLookingAway: false };
  }

  ctx.drawImage(video, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const skinMask = new Uint8Array(w * h);
  let skinPixelCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

    // Human skin tone cluster in YCbCr and RGB
    const isSkin =
      cb >= 74 &&
      cb <= 136 &&
      cr >= 128 &&
      cr <= 182 &&
      y >= 32 &&
      y <= 238 &&
      r > g &&
      r > b &&
      r - g >= 3;

    if (isSkin) {
      const pIdx = i / 4;
      skinMask[pIdx] = 1;
      skinPixelCount++;
    }
  }

  // Not enough skin pixels in frame for a face
  if (skinPixelCount < (w * h) * 0.02) {
    return {
      detected: false,
      count: 0,
      boxes: [],
      isObstructed: false,
      isLookingAway: false,
    };
  }

  // 2D Spatial Connected Components (Blobs)
  const visited = new Uint8Array(w * h);
  interface SkinBlob {
    pixels: { x: number; y: number }[];
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    count: number;
    cx: number;
    cy: number;
  }
  const blobs: SkinBlob[] = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (skinMask[idx] === 1 && visited[idx] === 0) {
        const queue: number[] = [idx];
        visited[idx] = 1;
        const blobPixels: { x: number; y: number }[] = [];
        let minX = x, maxX = x, minY = y, maxY = y;
        let sumX = 0, sumY = 0;

        let head = 0;
        while (head < queue.length) {
          const curr = queue[head++];
          const cx = curr % w;
          const cy = Math.floor(curr / w);
          blobPixels.push({ x: cx, y: cy });
          sumX += cx;
          sumY += cy;
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;

          // 4-connected neighbors
          if (cx > 0) {
            const left = curr - 1;
            if (skinMask[left] === 1 && visited[left] === 0) {
              visited[left] = 1;
              queue.push(left);
            }
          }
          if (cx < w - 1) {
            const right = curr + 1;
            if (skinMask[right] === 1 && visited[right] === 0) {
              visited[right] = 1;
              queue.push(right);
            }
          }
          if (cy > 0) {
            const up = curr - w;
            if (skinMask[up] === 1 && visited[up] === 0) {
              visited[up] = 1;
              queue.push(up);
            }
          }
          if (cy < h - 1) {
            const down = curr + w;
            if (skinMask[down] === 1 && visited[down] === 0) {
              visited[down] = 1;
              queue.push(down);
            }
          }
        }

        // Only retain substantial blobs (ignore tiny noise specks)
        if (blobPixels.length >= 35) {
          blobs.push({
            pixels: blobPixels,
            minX,
            maxX,
            minY,
            maxY,
            count: blobPixels.length,
            cx: sumX / blobPixels.length,
            cy: sumY / blobPixels.length,
          });
        }
      }
    }
  }

  // Filter blobs that can qualify as a human head/face
  // Must be located in upper/middle frame (not bottom hands/keyboard)
  const candidateFaceBlobs = blobs.filter((b) => {
    const bw = b.maxX - b.minX + 1;
    const bh = b.maxY - b.minY + 1;
    const aspect = bh / bw;
    return (
      b.minY < h * 0.72 &&
      bw >= w * 0.08 &&
      bh >= h * 0.10 &&
      aspect >= 0.55 &&
      aspect <= 2.5 &&
      b.count >= 50
    );
  });

  if (candidateFaceBlobs.length === 0) {
    if (blobs.length > 0 && blobs[0].count > (w * h) * 0.035) {
      candidateFaceBlobs.push(blobs[0]);
    } else {
      return {
        detected: false,
        count: 0,
        boxes: [],
        isObstructed: false,
        isLookingAway: false,
      };
    }
  }

  // Sort candidate face blobs by size descending
  candidateFaceBlobs.sort((a, b) => b.count - a.count);
  const primaryBlob = candidateFaceBlobs[0];

  // Check if a GENUINE second individual is present:
  // A second person MUST:
  // 1. Have substantial horizontal separation: |b.cx - primaryBlob.cx| >= w * 0.25 (at least 25% of frame apart)
  // 2. Be located in the upper/middle frame (b.minY < h * 0.65)
  // 3. Be substantial in size (count >= 90, width >= w * 0.10, height >= h * 0.12)
  // 4. Have an upright human head aspect ratio (0.65 <= aspect <= 2.2)
  let secondaryFaceBlob: SkinBlob | null = null;

  for (let i = 1; i < candidateFaceBlobs.length; i++) {
    const b = candidateFaceBlobs[i];
    const horizontalDistance = Math.abs(b.cx - primaryBlob.cx);
    const bw = b.maxX - b.minX + 1;
    const bh = b.maxY - b.minY + 1;
    const aspect = bh / bw;

    const isDistinctHorizontal = horizontalDistance >= w * 0.25;
    const isUpperFrame = b.minY < h * 0.65;
    const isSubstantial = b.count >= 90 && bw >= w * 0.10 && bh >= h * 0.12;
    const isValidAspect = aspect >= 0.65 && aspect <= 2.2;

    if (isDistinctHorizontal && isUpperFrame && isSubstantial && isValidAspect) {
      secondaryFaceBlob = b;
      break;
    }
  }

  // Build final face bounding boxes
  const scaleFactor = 1 / scale;
  const boxes: FaceBoundingBox[] = [];

  // Primary face box: Merge with any vertically connected or aligned neck/body blobs
  let pMinX = primaryBlob.minX;
  let pMaxX = primaryBlob.maxX;
  let pMinY = primaryBlob.minY;
  let pMaxY = primaryBlob.maxY;

  for (const b of blobs) {
    if (b === secondaryFaceBlob) continue;
    // If blob is vertically below the face and roughly in the same column, merge it
    const isDirectlyBeneath =
      Math.abs(b.cx - primaryBlob.cx) <= (primaryBlob.maxX - primaryBlob.minX) * 0.85 &&
      b.minY >= primaryBlob.minY &&
      b.minY <= primaryBlob.maxY + 15;
    if (isDirectlyBeneath) {
      pMinX = Math.min(pMinX, b.minX);
      pMaxX = Math.max(pMaxX, b.maxX);
      pMaxY = Math.max(pMaxY, b.maxY);
    }
  }

  boxes.push({
    x: Math.round(pMinX * scaleFactor),
    y: Math.round(pMinY * scaleFactor),
    width: Math.round(Math.max(40, (pMaxX - pMinX)) * scaleFactor),
    height: Math.round(Math.max(40, (pMaxY - pMinY)) * scaleFactor),
    confidence: 0.92,
  });

  if (secondaryFaceBlob) {
    boxes.push({
      x: Math.round(secondaryFaceBlob.minX * scaleFactor),
      y: Math.round(secondaryFaceBlob.minY * scaleFactor),
      width: Math.round(Math.max(40, (secondaryFaceBlob.maxX - secondaryFaceBlob.minX)) * scaleFactor),
      height: Math.round(Math.max(40, (secondaryFaceBlob.maxY - secondaryFaceBlob.minY)) * scaleFactor),
      confidence: 0.88,
    });
  }

  const primary = boxes[0];
  const primaryCenterX = (primary.x + primary.width / 2) / video.videoWidth;
  const isLookingAway = primaryCenterX < 0.15 || primaryCenterX > 0.85;

  return {
    detected: true,
    count: boxes.length,
    boxes,
    primaryBox: primary,
    isObstructed: false,
    isLookingAway,
  };
}

/**
 * Extracts a normalized 192-dimensional facial feature signature from a video frame.
 * Uses an 8x8 spatial grid with luminance, Cb, Cr, and color distribution.
 */
export function extractFaceSignature(
  video: HTMLVideoElement,
  box?: FaceBoundingBox
): number[] | null {
  if (!video || video.readyState < 2 || video.videoWidth === 0) return null;

  const canvas = document.createElement("canvas");
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const sx = box && box.width > 20 ? Math.max(0, box.x) : video.videoWidth * 0.2;
  const sy = box && box.height > 20 ? Math.max(0, box.y) : video.videoHeight * 0.15;
  const sw = box && box.width > 20 ? Math.min(video.videoWidth - sx, box.width) : video.videoWidth * 0.6;
  const sh = box && box.height > 20 ? Math.min(video.videoHeight - sy, box.height) : video.videoHeight * 0.7;

  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, size, size);
  const imgData = ctx.getImageData(0, 0, size, size);
  const d = imgData.data;

  const gridSize = 8;
  const blockSize = size / gridSize;
  const vector: number[] = [];

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      let sumY = 0;
      let sumCb = 0;
      let sumCr = 0;

      for (let by = 0; by < blockSize; by++) {
        for (let bx = 0; bx < blockSize; bx++) {
          const px = gx * blockSize + bx;
          const py = gy * blockSize + by;
          const idx = (py * size + px) * 4;

          const r = d[idx];
          const g = d[idx + 1];
          const b = d[idx + 2];

          const y = 0.299 * r + 0.587 * g + 0.114 * b;
          const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
          const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

          sumY += y;
          sumCb += cb;
          sumCr += cr;
        }
      }

      const pixelCount = blockSize * blockSize;
      vector.push(sumY / pixelCount);
      vector.push(sumCb / pixelCount);
      vector.push(sumCr / pixelCount);
    }
  }

  let norm = 0;
  for (const val of vector) {
    norm += val * val;
  }
  norm = Math.sqrt(norm);
  if (norm === 0) return null;

  return vector.map((v) => v / norm);
}

/**
 * Computes cosine similarity between two face signature vectors.
 * Returns a value between 0.0 and 1.0.
 */
export function compareFaceSignatures(sig1: number[] | null, sig2: number[] | null): number {
  if (!sig1 || !sig2 || sig1.length !== sig2.length) return 0;

  let dot = 0;
  for (let i = 0; i < sig1.length; i++) {
    dot += sig1[i] * sig2[i];
  }

  return Math.max(0, Math.min(1, dot));
}

/**
 * Captures a compressed base64 JPEG snapshot from video stream.
 */
export function captureSnapshot(video: HTMLVideoElement, quality = 0.65, maxWidth = 480): string | null {
  if (!video || video.readyState < 2 || video.videoWidth === 0) return null;

  try {
    const canvas = document.createElement("canvas");
    const aspect = video.videoHeight / video.videoWidth;
    const width = Math.min(maxWidth, video.videoWidth);
    const height = Math.round(width * aspect);

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);

    const now = new Date();
    const timeStr = `${now.toLocaleTimeString()} - 2Gathers Proctor`;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(8, height - 24, 180, 18);
    ctx.fillStyle = "#ffffff";
    ctx.font = "10px monospace";
    ctx.fillText(timeStr, 12, height - 12);

    return canvas.toDataURL("image/jpeg", quality);
  } catch (err) {
    console.warn("Failed to capture snapshot:", err);
    return null;
  }
}
