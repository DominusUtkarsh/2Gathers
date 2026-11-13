import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/tasks/[id]/submit/route";
import { NextRequest } from "next/server";

describe("POST /api/tasks/[id]/submit", () => {
  it("rejects final submission if proctoring data is missing", async () => {
    const req = new NextRequest("http://localhost:3000/api/tasks/t1/submit", {
      method: "POST",
      body: JSON.stringify({
        code: "function add(a, b) { return a + b; }",
        taskId: "t1",
        language: "javascript",
        finalSubmit: true,
      }),
    });

    const params = Promise.resolve({ id: "t1" });
    const response = await POST(req, { params });
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toMatch(/invigilated camera session/i);
  });

  it("permits running test cases without final submission even without proctoring payload", async () => {
    const req = new NextRequest("http://localhost:3000/api/tasks/t1/submit", {
      method: "POST",
      body: JSON.stringify({
        code: "function add(a, b) { return a + b; }",
        taskId: "t1",
        language: "javascript",
        finalSubmit: false,
      }),
    });

    const params = Promise.resolve({ id: "t1" });
    const response = await POST(req, { params });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.mode).toBe("run");
  });
});
