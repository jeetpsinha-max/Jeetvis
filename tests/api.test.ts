import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../server.js";

describe("Jeetvis API Integration Tests", () => {
  it("GET /api/health returns status ok and system details", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("service", "jeetvis-api");
    expect(res.body).toHaveProperty("geminiConfigured");
    expect(res.headers).toHaveProperty("x-ratelimit-limit");
  });

  it("POST /api/gemini/ask returns 400 when prompt is missing", async () => {
    const res = await request(app).post("/api/gemini/ask").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Bad Request");
  });

  it("POST /api/gemini/ask returns valid response with prompt", async () => {
    const res = await request(app)
      .post("/api/gemini/ask")
      .send({ prompt: "Explain task optimization algorithms" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body).toHaveProperty("response");
  });

  it("POST /api/tasks creates a new task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Build test pipeline" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("success", true);
    expect(res.body.data).toHaveProperty("title", "Build test pipeline");
  });
});
