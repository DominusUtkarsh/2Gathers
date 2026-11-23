"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ViolationRecord,
  ViolationType,
  ViolationSeverity,
  ProctoringStatus,
  ProctoringMetrics,
  ProctoringSubmissionPayload,
} from "@/lib/proctoring/types";
import {
  detectFaces,
  extractFaceSignature,
  compareFaceSignatures,
  captureSnapshot,
} from "@/lib/proctoring/vision";

export interface AccountBiometricFace {
  facePhoto: string | null;
  signature: number[] | null;
  candidateName?: string;
}

interface UseProctoringOptions {
  taskId: string;
  maxStrikes?: number;
  enforceFullscreen?: boolean;
  accountVerifiedFace?: AccountBiometricFace | null;
  onDisqualified?: (reason: string) => void;
  onViolation?: (violation: ViolationRecord) => void;
}

function checkIsFullscreen(): boolean {
  if (typeof document === "undefined") return false;
  const doc = document as unknown as {
    fullscreenElement?: Element | null;
    webkitFullscreenElement?: Element | null;
    mozFullScreenElement?: Element | null;
    msFullscreenElement?: Element | null;
  };
  return Boolean(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );
}

export function useProctoring({
  taskId,
  maxStrikes = 5,
  enforceFullscreen = true,
  accountVerifiedFace,
  onDisqualified,
  onViolation,
}: UseProctoringOptions) {
  const [status, setStatus] = useState<ProctoringStatus>("uninitialized");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [isLookingAway, setIsLookingAway] = useState(false);
  const [isObstructed, setIsObstructed] = useState(false);
  const [similarityScore, setSimilarityScore] = useState(1.0);

  const [trustScore, setTrustScore] = useState(100);
  const [strikes, setStrikes] = useState(0);
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [activeViolation, setActiveViolation] = useState<ViolationRecord | null>(null);

  const [baselineSnapshot, setBaselineSnapshot] = useState<string | null>(null);
  const [lastSnapshot, setLastSnapshot] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wasFullscreenRef = useRef(false);
  const [durationSeconds, setDurationSeconds] = useState(0);

  // Persistent master video element that NEVER unmounts during assessment
  const masterVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const baselineSignatureRef = useRef<number[] | null>(null);
  const accountFaceRef = useRef<AccountBiometricFace | null>(accountVerifiedFace || null);
  accountFaceRef.current = accountVerifiedFace || null;

  // Attached UI video elements (modal and HUD)
  const attachedVideosRef = useRef<Set<HTMLVideoElement>>(new Set());

  // Consecutive counts to prevent jitter/false positives
  const noFaceTicksRef = useRef(0);
  const multiFaceTicksRef = useRef(0);
  const mismatchTicksRef = useRef(0);
  const lookingAwayTicksRef = useRef(0);
  const obstructedTicksRef = useRef(0);

  // Metrics tracking
  const metricsRef = useRef<ProctoringMetrics>({
    totalChecks: 0,
    faceLostCount: 0,
    multiFaceCount: 0,
    identityMismatchCount: 0,
    tabSwitchCount: 0,
    pasteCount: 0,
    copyCount: 0,
    screenshotCount: 0,
    averageSimilarity: 1.0,
    totalDurationSeconds: 0,
  });

  const similarityHistoryRef = useRef<number[]>([]);

  const onDisqualifiedRef = useRef(onDisqualified);
  onDisqualifiedRef.current = onDisqualified;
  const onViolationRef = useRef(onViolation);
  onViolationRef.current = onViolation;

  // Create persistent master video element on document.body
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (!masterVideoRef.current) {
      const v = document.createElement("video");
      v.autoplay = true;
      v.playsInline = true;
      v.muted = true;
      v.style.position = "fixed";
      v.style.bottom = "0px";
      v.style.right = "0px";
      v.style.width = "4px";
      v.style.height = "4px";
      v.style.opacity = "0.01";
      v.style.pointerEvents = "none";
      v.style.zIndex = "-999";
      document.body.appendChild(v);
      masterVideoRef.current = v;
    }

    return () => {
      if (masterVideoRef.current && masterVideoRef.current.parentNode) {
        masterVideoRef.current.parentNode.removeChild(masterVideoRef.current);
        masterVideoRef.current = null;
      }
    };
  }, []);

  // Sound generator for violation alert (Web Audio API)
  const playAlertSound = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {
      // Audio might be blocked by browser autoplay policy before gesture
    }
  }, []);

  /**
   * Log violation with automatic snapshot and trust deduction
   */
  const logViolation = useCallback(
    (
      type: ViolationType,
      severity: ViolationSeverity,
      message: string,
      details?: string
    ) => {
      let snapshotUrl: string | undefined = undefined;
      const activeVideo = masterVideoRef.current;
      if (activeVideo && activeVideo.readyState >= 2) {
        snapshotUrl = captureSnapshot(activeVideo, 0.6) || undefined;
      }

      const now = Date.now();
      const newViolation: ViolationRecord = {
        id: `v-${now}-${Math.random().toString(36).substring(2, 6)}`,
        type,
        severity,
        message,
        timestamp: now,
        snapshotUrl,
        details,
      };

      setViolations((prev) => [newViolation, ...prev]);
      setActiveViolation(newViolation);
      playAlertSound();

      if (onViolationRef.current) {
        onViolationRef.current(newViolation);
      }

      // Deduct trust score
      const deductionMap: Record<ViolationType, number> = {
        NO_FACE_DETECTED: 8,
        MULTIPLE_FACES_DETECTED: 18,
        IDENTITY_MISMATCH: 25,
        LOOKING_AWAY: 5,
        TAB_SWITCH: 18,
        WINDOW_BLUR: 10,
        FULLSCREEN_EXIT: 15,
        SUSPICIOUS_PASTE: 15,
        PASTE_ATTEMPT: 18,
        COPY_ATTEMPT: 18,
        SCREENSHOT_ATTEMPT: 25,
        DEVTOOLS_ATTEMPT: 20,
        CAMERA_DISCONNECTED: 25,
        CAMERA_OBSTRUCTED: 18,
      };

      const penalty = deductionMap[type] || 10;
      setTrustScore((prev) => Math.max(0, prev - penalty));

      const isStrike = severity === "medium" || severity === "high" || severity === "critical";
      if (isStrike) {
        setStrikes((prev) => {
          const next = prev + 1;
          if (next >= maxStrikes) {
            setStatus("disqualified");
            if (onDisqualifiedRef.current) {
              onDisqualifiedRef.current(`Exceeded maximum invigilation violations (${maxStrikes} strikes).`);
            }
          }
          return next;
        });
      }

      if (type === "NO_FACE_DETECTED") metricsRef.current.faceLostCount += 1;
      if (type === "MULTIPLE_FACES_DETECTED") metricsRef.current.multiFaceCount += 1;
      if (type === "IDENTITY_MISMATCH") metricsRef.current.identityMismatchCount += 1;
      if (type === "TAB_SWITCH" || type === "WINDOW_BLUR") metricsRef.current.tabSwitchCount += 1;
      if (type === "SUSPICIOUS_PASTE" || type === "PASTE_ATTEMPT") metricsRef.current.pasteCount += 1;
      if (type === "COPY_ATTEMPT") metricsRef.current.copyCount += 1;
      if (type === "SCREENSHOT_ATTEMPT") metricsRef.current.screenshotCount += 1;
    },
    [maxStrikes, playAlertSound]
  );

  /**
   * Connects any mounted UI <video> element (in modal or HUD) to the active media stream
   */
  const attachVideoElement = useCallback((videoEl: HTMLVideoElement | null) => {
    if (!videoEl) return;
    attachedVideosRef.current.add(videoEl);

    if (streamRef.current) {
      if (videoEl.srcObject !== streamRef.current) {
        videoEl.srcObject = streamRef.current;
        videoEl.play().catch(() => undefined);
      }
    }
  }, []);

  /**
   * Request webcam stream and attach to master & UI videos
   */
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Webcam access is not supported on this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;

      // Attach to persistent master video
      if (masterVideoRef.current) {
        masterVideoRef.current.srcObject = stream;
        await masterVideoRef.current.play().catch(() => undefined);
      }

      // Attach to all currently registered UI videos
      attachedVideosRef.current.forEach((el) => {
        try {
          el.srcObject = stream;
          el.play().catch(() => undefined);
        } catch {
          // Ignored
        }
      });

      setIsCameraActive(true);
      setStatus("calibrating");

      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          setIsCameraActive(false);
          logViolation(
            "CAMERA_DISCONNECTED",
            "critical",
            "Webcam disconnected or disabled! Reconnect your camera immediately."
          );
        };
      });

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to access webcam";
      setCameraError(msg);
      setIsCameraActive(false);
      return false;
    }
  }, [logViolation]);

  /**
   * Stop camera tracks
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (masterVideoRef.current) {
      masterVideoRef.current.srcObject = null;
    }
    attachedVideosRef.current.forEach((el) => {
      try {
        el.srcObject = null;
      } catch {
        // Ignored
      }
    });
    setIsCameraActive(false);
  }, []);

  /**
   * Calibrate Baseline & Verify against Registered Account Identity
   */
  const calibrateBaseline = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    const video = masterVideoRef.current;
    if (!video || !isCameraActive || video.readyState < 2 || video.videoWidth === 0) {
      return { success: false, error: "Webcam video stream is not ready. Please wait a moment." };
    }

    const faceCheck = await detectFaces(video);

    if (faceCheck.isObstructed) {
      return {
        success: false,
        error: "Camera view is pitch black or obstructed. Please turn on room lights and ensure your face is well-lit.",
      };
    }

    if (!faceCheck.detected || faceCheck.count === 0) {
      return {
        success: false,
        error: "No face detected. Please position your face inside the camera guide.",
      };
    }

    if (faceCheck.count > 1) {
      return {
        success: false,
        error: "Multiple faces detected. Only the registered candidate may be in the camera view.",
      };
    }

    const signature = extractFaceSignature(video, faceCheck.primaryBox);
    if (!signature) {
      return {
        success: false,
        error: "Could not extract clear facial features. Look directly into the webcam.",
      };
    }

    // GROUND TRUTH IDENTITY CHECK:
    // If the account already has an official registered face, verify this person matches the account owner!
    const accountFace = accountFaceRef.current;
    if (accountFace?.signature && Array.isArray(accountFace.signature) && accountFace.signature.length >= 10) {
      const sim = compareFaceSignatures(accountFace.signature, signature);
      setSimilarityScore(sim);

      if (sim < 0.70) {
        return {
          success: false,
          error: `Identity Mismatch: The person in front of the camera does NOT match the registered account owner (${accountFace.candidateName || "candidate"}). Friends or proxies cannot take assessments on your behalf.`,
        };
      }
    }

    const snapshot = captureSnapshot(video, 0.75);
    baselineSignatureRef.current = signature;
    setBaselineSnapshot(snapshot);
    setSimilarityScore(1.0);
    setStatus("ready");

    return { success: true };
  }, [isCameraActive]);

  /**
   * Start the invigilated test session
   */
  const startSession = useCallback(async () => {
    if (status !== "ready" && status !== "paused") {
      const cal = await calibrateBaseline();
      if (!cal.success) return false;
    }

    if (enforceFullscreen && typeof document !== "undefined") {
      try {
        if (!checkIsFullscreen()) {
          await document.documentElement.requestFullscreen().catch(() => undefined);
        }
      } catch {
        // Ignored
      }
    }

    const currentFs = checkIsFullscreen();
    setIsFullscreen(currentFs);
    wasFullscreenRef.current = currentFs;

    setStatus("active");
    return true;
  }, [status, calibrateBaseline, enforceFullscreen]);

  const pauseSession = useCallback(() => {
    setStatus("paused");
  }, []);

  const resumeSession = useCallback(() => {
    setStatus("active");
  }, []);

  const dismissActiveViolation = useCallback(() => {
    setActiveViolation(null);
  }, []);

  const requestFullscreen = useCallback(async () => {
    if (typeof document === "undefined") return;
    try {
      if (!checkIsFullscreen()) {
        await document.documentElement.requestFullscreen();
      }
      setIsFullscreen(true);
      wasFullscreenRef.current = true;
    } catch {
      // Ignored
    }
  }, []);

  /**
   * Block paste attempts and log violation
   */
  const handlePasteAttempt = useCallback(
    (details?: string) => {
      if (status !== "active") return;
      logViolation(
        "PASTE_ATTEMPT",
        "high",
        "Pasting content into the assessment is disabled. You must type your solution directly.",
        details ? `Blocked paste attempt: "${details.slice(0, 40)}..."` : undefined
      );
    },
    [status, logViolation]
  );

  /**
   * Block copy attempts and log violation
   */
  const handleCopyAttempt = useCallback(
    (details?: string) => {
      if (status !== "active") return;
      logViolation(
        "COPY_ATTEMPT",
        "high",
        "Copying questions, test cases, or code is strictly prohibited during assessments.",
        details
      );
    },
    [status, logViolation]
  );

  /**
   * Intercept screenshot attempts, overwrite clipboard, and log critical violation
   */
  const handleScreenshotAttempt = useCallback(
    (details?: string) => {
      if (status !== "active") return;
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText("Screenshots are strictly prohibited during invigilated assessments.").catch(() => {});
      }
      logViolation(
        "SCREENSHOT_ATTEMPT",
        "critical",
        "Screenshot attempt detected! Capturing or snipping screen content is strictly prohibited.",
        details
      );
    },
    [status, logViolation]
  );

  // Alias for backwards compatibility
  const handlePasteCheck = handlePasteAttempt;

  /**
   * Continuous Vision Inspection Tick Loop:
   * Inspects masterVideoRef (which never unmounts!).
   */
  useEffect(() => {
    if (status !== "active" && status !== "calibrating") return;

    let isMounted = true;

    const interval = setInterval(async () => {
      if (!isMounted || !isCameraActive) return;

      // Prefer any actively rendering attached UI video, fallback to master video
      let video: HTMLVideoElement | null = null;
      for (const v of attachedVideosRef.current) {
        if (v && v.readyState >= 2 && !v.paused && v.videoWidth > 0) {
          video = v;
          break;
        }
      }
      if (!video) {
        video = masterVideoRef.current;
      }
      if (!video || video.readyState < 2 || video.videoWidth === 0) return;
      if (video.paused) {
        video.play().catch(() => {});
      }

      metricsRef.current.totalChecks += 1;

      // 1. Detect faces
      const detection = await detectFaces(video);

      if (!isMounted) return;

      setFaceDetected(detection.detected);
      setFaceCount(detection.count);
      setIsObstructed(detection.isObstructed);
      setIsLookingAway(Boolean(detection.isLookingAway));

      if (status === "calibrating") return;

      // 2. Darkness / Room Lighting / Covered Camera Check
      if (detection.isObstructed) {
        obstructedTicksRef.current += 1;
        // Trigger after ~1.5s of continuous darkness
        if (obstructedTicksRef.current === 2) {
          logViolation(
            "CAMERA_OBSTRUCTED",
            "critical",
            "Camera view is pitch black or lens is covered! Turn on room lights and ensure visibility."
          );
        }
      } else {
        obstructedTicksRef.current = 0;
      }

      // 3. Absence Check (No face detected when lighting is fine)
      if (!detection.isObstructed && (!detection.detected || detection.count === 0)) {
        noFaceTicksRef.current += 1;
        if (noFaceTicksRef.current === 3) {
          logViolation(
            "NO_FACE_DETECTED",
            "high",
            "No candidate detected! Please stay centered in front of the camera."
          );
        }
      } else {
        noFaceTicksRef.current = 0;
      }

      // 4. Multi-Person Detection Check
      if (detection.count > 1) {
        multiFaceTicksRef.current += 1;
        // Sensitive trigger: Immediately penalize on tick 1
        if (multiFaceTicksRef.current === 1) {
          logViolation(
            "MULTIPLE_FACES_DETECTED",
            "critical",
            "Multiple individuals detected in camera frame! Only the test-taker may be present."
          );
        } else if (multiFaceTicksRef.current % 3 === 0) {
          // Re-penalize if secondary person continues to remain in frame
          logViolation(
            "MULTIPLE_FACES_DETECTED",
            "critical",
            "Multiple people still detected in camera frame! Ensure you are completely alone."
          );
        }
      } else {
        // Smooth decay to prevent flicker resets
        multiFaceTicksRef.current = Math.max(0, multiFaceTicksRef.current - 1);
      }

      // 5. Looking Away / Attention Check
      if (detection.isLookingAway) {
        lookingAwayTicksRef.current += 1;
        if (lookingAwayTicksRef.current === 5) {
          logViolation(
            "LOOKING_AWAY",
            "low",
            "Please face your screen directly. Prolonged looking away is flagged."
          );
        }
      } else {
        lookingAwayTicksRef.current = 0;
      }

      // 6. Identity Verification (Face Signature Similarity Matching)
      // Checks both the session baseline AND the account's registered face
      if (detection.detected && detection.count === 1) {
        const targetSignature = baselineSignatureRef.current || accountFaceRef.current?.signature;

        if (targetSignature) {
          const currentSig = extractFaceSignature(video, detection.primaryBox);
          if (currentSig) {
            const sim = compareFaceSignatures(targetSignature, currentSig);
            setSimilarityScore(sim);
            similarityHistoryRef.current.push(sim);

            const history = similarityHistoryRef.current;
            const avg = history.reduce((a, b) => a + b, 0) / history.length;
            metricsRef.current.averageSimilarity = avg;

            // If similarity drops below 0.70 for 3 ticks in a row, a different person is in front of the camera
            if (sim < 0.70) {
              mismatchTicksRef.current += 1;
              if (mismatchTicksRef.current === 3) {
                logViolation(
                  "IDENTITY_MISMATCH",
                  "critical",
                  "Identity mismatch detected! The person in front of the camera does not match the registered candidate."
                );
              }
            } else {
              mismatchTicksRef.current = 0;
            }
          }
        }
      }
    }, 750);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [status, isCameraActive, logViolation]);

  /**
   * Continuous Fullscreen Tracker (active across all session phases)
   * Ensures isFullscreen accurately reflects browser window state before, during,
   * and after session start, completely preventing false "Fullscreen Mode Required" lockouts.
   */
  useEffect(() => {
    if (typeof document === "undefined") return;

    function handleFullscreenChange() {
      const active = checkIsFullscreen();
      setIsFullscreen(active);

      // Only penalize if candidate was in fullscreen during an ACTIVE test and actually exited
      if (!active && wasFullscreenRef.current && status === "active" && enforceFullscreen) {
        logViolation(
          "FULLSCREEN_EXIT",
          "high",
          "Exited fullscreen mode! Fullscreen is required to prevent accessing external resources."
        );
      }

      wasFullscreenRef.current = active;
    }

    const currentFs = checkIsFullscreen();
    setIsFullscreen(currentFs);
    if (status === "active") {
      wasFullscreenRef.current = currentFs;
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [status, enforceFullscreen, logViolation]);

  /**
   * System Activity Listeners
   */
  useEffect(() => {
    if (status !== "active") return;

    function handleVisibilityChange() {
      if (document.hidden) {
        logViolation(
          "TAB_SWITCH",
          "high",
          "Tab switch / Minimize detected! You navigated away from the active assessment."
        );
      }
    }

    function handleWindowBlur() {
      if (!document.hidden) {
        logViolation(
          "WINDOW_BLUR",
          "medium",
          "Window focus lost! Navigating away or clicking outside the test window is prohibited."
        );
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;

      // 1. DevTools Shortcuts
      const isF12 = e.key === "F12";
      const isInspect =
        isCmdOrCtrl &&
        e.shiftKey &&
        (e.key === "I" || e.key === "i" || e.key === "C" || e.key === "c" || e.key === "J" || e.key === "j");
      const isViewSource = isCmdOrCtrl && (e.key === "U" || e.key === "u");

      if (isF12 || isInspect || isViewSource) {
        e.preventDefault();
        e.stopPropagation();
        logViolation(
          "DEVTOOLS_ATTEMPT",
          "critical",
          "Developer Tools or Inspection shortcut blocked."
        );
        return;
      }

      // 2. Screenshot / PrintScreen / Snipping Tool / Print
      const isPrintScreen = e.key === "PrintScreen" || e.code === "PrintScreen";
      const isSnippingTool = isCmdOrCtrl && e.shiftKey && (e.key === "S" || e.key === "s");
      const isMacScreenshot = isCmdOrCtrl && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5");
      const isPrintPage = isCmdOrCtrl && (e.key === "P" || e.key === "p");

      if (isPrintScreen || isSnippingTool || isMacScreenshot || isPrintPage) {
        e.preventDefault();
        e.stopPropagation();
        handleScreenshotAttempt(
          isPrintPage
            ? "Print page shortcut blocked"
            : isSnippingTool
            ? "Snipping Tool shortcut blocked"
            : "Screenshot shortcut blocked"
        );
        return;
      }

      // 3. Copy / Cut Shortcuts
      const isCopy = isCmdOrCtrl && (e.key === "C" || e.key === "c");
      const isCut = isCmdOrCtrl && (e.key === "X" || e.key === "x");
      const isCtrlInsert = isCmdOrCtrl && e.key === "Insert";

      if (isCopy || isCut || isCtrlInsert) {
        e.preventDefault();
        e.stopPropagation();
        handleCopyAttempt(isCut ? "Cut shortcut (Ctrl/Cmd+X) blocked" : "Copy shortcut (Ctrl/Cmd+C) blocked");
        return;
      }

      // 4. Paste Shortcuts
      const isPaste = isCmdOrCtrl && (e.key === "V" || e.key === "v");
      const isShiftInsert = e.shiftKey && e.key === "Insert";

      if (isPaste || isShiftInsert) {
        e.preventDefault();
        e.stopPropagation();
        handlePasteAttempt("Paste shortcut (Ctrl/Cmd+V) blocked");
        return;
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        e.preventDefault();
        e.stopPropagation();
        handleScreenshotAttempt("PrintScreen keyup intercepted");
      }
    }

    function handleContextMenu(e: MouseEvent) {
      e.preventDefault();
    }

    function handleCopy(e: ClipboardEvent) {
      e.preventDefault();
      e.stopPropagation();
      if (e.clipboardData) {
        e.clipboardData.clearData();
        e.clipboardData.setData("text/plain", "Copying is restricted during assessments.");
      }
      handleCopyAttempt("Clipboard copy event blocked");
    }

    function handleCut(e: ClipboardEvent) {
      e.preventDefault();
      e.stopPropagation();
      if (e.clipboardData) {
        e.clipboardData.clearData();
      }
      handleCopyAttempt("Clipboard cut event blocked");
    }

    function handlePaste(e: ClipboardEvent) {
      e.preventDefault();
      e.stopPropagation();
      const text = e.clipboardData?.getData("text") || "";
      handlePasteAttempt(text);
    }

    function handleDragStart(e: DragEvent) {
      e.preventDefault();
      e.stopPropagation();
    }

    function handleDrop(e: DragEvent) {
      e.preventDefault();
      e.stopPropagation();
      handlePasteAttempt("Drag-and-drop text blocked");
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    window.addEventListener("contextmenu", handleContextMenu, true);
    document.addEventListener("copy", handleCopy, true);
    document.addEventListener("cut", handleCut, true);
    document.addEventListener("paste", handlePaste, true);
    document.addEventListener("dragstart", handleDragStart, true);
    document.addEventListener("drop", handleDrop, true);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
      window.removeEventListener("contextmenu", handleContextMenu, true);
      document.removeEventListener("copy", handleCopy, true);
      document.removeEventListener("cut", handleCut, true);
      document.removeEventListener("paste", handlePaste, true);
      document.removeEventListener("dragstart", handleDragStart, true);
      document.removeEventListener("drop", handleDrop, true);
    };
  }, [
    status,
    enforceFullscreen,
    logViolation,
    handleCopyAttempt,
    handlePasteAttempt,
    handleScreenshotAttempt,
  ]);

  /**
   * Session timer
   */
  useEffect(() => {
    if (status !== "active") return;
    const timer = setInterval(() => {
      setDurationSeconds((prev) => {
        const next = prev + 1;
        metricsRef.current.totalDurationSeconds = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  /**
   * Auto-cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  /**
   * Pure getter for final proctoring submission payload
   */
  const getSubmissionPayload = useCallback((): ProctoringSubmissionPayload => {
    let finalSnapshot: string | null = null;
    if (masterVideoRef.current && masterVideoRef.current.readyState >= 2) {
      finalSnapshot = captureSnapshot(masterVideoRef.current, 0.7);
    }

    const isDisqualified = strikes >= maxStrikes || trustScore <= 25;
    const isFlagged = isDisqualified || trustScore < 60 || violations.length >= 3;

    return {
      trustScore,
      strikes,
      isDisqualified,
      isFlagged,
      baselineSnapshot,
      finalSnapshot,
      violations,
      metrics: {
        ...metricsRef.current,
        totalDurationSeconds: durationSeconds,
      },
      completedAt: new Date().toISOString(),
    };
  }, [trustScore, strikes, maxStrikes, violations, baselineSnapshot, durationSeconds]);

  return {
    status,
    isCameraActive,
    cameraError,
    videoRef: masterVideoRef,
    attachVideoElement,

    // Vision States
    faceDetected,
    faceCount,
    isLookingAway,
    isObstructed,
    similarityScore,

    // Proctoring Metrics
    trustScore,
    strikes,
    maxStrikes,
    violations,
    activeViolation,
    baselineSnapshot,
    baselineSignature: baselineSignatureRef.current,
    lastSnapshot,
    isFullscreen,
    durationSeconds,

    // Actions
    startCamera,
    stopCamera,
    calibrateBaseline,
    startSession,
    pauseSession,
    resumeSession,
    dismissActiveViolation,
    requestFullscreen,
    handlePasteCheck,
    handlePasteAttempt,
    handleCopyAttempt,
    handleScreenshotAttempt,
    logViolation,
    getSubmissionPayload,
  };
}
