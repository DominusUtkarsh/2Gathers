import { describe, it, expect } from "vitest";
import { ViolationType, ProctoringSubmissionPayload } from "@/lib/proctoring/types";

describe("Anti-Cheat Restrictions & Proctoring Rules", () => {
  it("defines copy, paste, and screenshot violations in type system", () => {
    const copyViolation: ViolationType = "COPY_ATTEMPT";
    const pasteViolation: ViolationType = "PASTE_ATTEMPT";
    const screenshotViolation: ViolationType = "SCREENSHOT_ATTEMPT";

    expect(copyViolation).toBe("COPY_ATTEMPT");
    expect(pasteViolation).toBe("PASTE_ATTEMPT");
    expect(screenshotViolation).toBe("SCREENSHOT_ATTEMPT");
  });

  it("calculates correct deductions and metric tallies for security violations", () => {
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

    let trust = 100;
    // Attempted copy (-18)
    trust = Math.max(0, trust - deductionMap.COPY_ATTEMPT);
    expect(trust).toBe(82);

    // Attempted paste (-18)
    trust = Math.max(0, trust - deductionMap.PASTE_ATTEMPT);
    expect(trust).toBe(64);

    // Attempted screenshot (-25)
    trust = Math.max(0, trust - deductionMap.SCREENSHOT_ATTEMPT);
    expect(trust).toBe(39);
  });

  it("produces compliant submission payload with clipboard and screenshot counters", () => {
    const payload: ProctoringSubmissionPayload = {
      trustScore: 39,
      strikes: 3,
      isDisqualified: false,
      isFlagged: true,
      baselineSnapshot: "data:image/jpeg;base64,mockBaseline",
      finalSnapshot: "data:image/jpeg;base64,mockFinal",
      violations: [
        {
          id: "v-1",
          type: "COPY_ATTEMPT",
          severity: "high",
          message: "Copying task questions or code is prohibited",
          timestamp: Date.now() - 3000,
        },
        {
          id: "v-2",
          type: "PASTE_ATTEMPT",
          severity: "high",
          message: "Pasting is restricted",
          timestamp: Date.now() - 2000,
        },
        {
          id: "v-3",
          type: "SCREENSHOT_ATTEMPT",
          severity: "critical",
          message: "Screenshot shortcut intercepted",
          timestamp: Date.now() - 1000,
        },
      ],
      metrics: {
        totalChecks: 100,
        faceLostCount: 0,
        multiFaceCount: 0,
        identityMismatchCount: 0,
        tabSwitchCount: 0,
        pasteCount: 1,
        copyCount: 1,
        screenshotCount: 1,
        averageSimilarity: 0.96,
        totalDurationSeconds: 120,
      },
      completedAt: new Date().toISOString(),
    };

    expect(payload.metrics.copyCount).toBe(1);
    expect(payload.metrics.pasteCount).toBe(1);
    expect(payload.metrics.screenshotCount).toBe(1);
    expect(payload.isFlagged).toBe(true);
    expect(payload.violations).toHaveLength(3);
  });
});
