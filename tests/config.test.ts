import { describe, expect, test } from "bun:test";
import { normalizeModelConfig, parseConfig } from "../src/config/schema";

const minimalMcp = {
  playwright: {
    enabled: true,
    transport: "stdio" as const,
    stdio: { command: "node", args: ["s.js"] }
  },
  postman: {
    enabled: true,
    transport: "sse" as const,
    sse: { url: "http://localhost:7000" }
  }
};

const minimalAgent = { maxIterations: 2, toolTimeoutMs: 1000, requestTimeoutMs: 1000 };

describe("config schema", () => {
  test("accepts valid stdio config", () => {
    const config = parseConfig({
      model: {
        provider: "openaiCompat",
        modelName: "test-model",
        baseUrl: "http://localhost:11434",
        timeoutMs: 1000
      },
      mcp: {
        playwright: {
          enabled: true,
          transport: "stdio",
          stdio: { command: "node", args: ["server.js"] }
        },
        postman: {
          enabled: true,
          transport: "sse",
          sse: { url: "http://localhost:7000" }
        }
      },
      agent: {
        maxIterations: 3,
        toolTimeoutMs: 1000,
        requestTimeoutMs: 1000
      }
    });
    expect(config.mcp.playwright.transport).toBe("stdio");
    expect(config.mcp.postman.transport).toBe("sse");
  });

  test("model.tools false disables tools in parsed config", () => {
    const config = parseConfig({
      model: {
        provider: "openaiCompat",
        modelName: "m",
        baseUrl: "http://localhost:11434",
        tools: false,
        timeoutMs: 1000
      },
      mcp: minimalMcp,
      agent: minimalAgent
    });
    expect(config.model.tools).toBe(false);
  });

  test("deprecated supportsTools false maps to tools false", () => {
    const config = parseConfig({
      model: {
        provider: "openaiCompat",
        modelName: "m",
        baseUrl: "http://localhost:11434",
        supportsTools: false,
        timeoutMs: 1000
      },
      mcp: minimalMcp,
      agent: minimalAgent
    });
    expect(config.model.tools).toBe(false);
  });

  test("when both tools and supportsTools set, tools wins", () => {
    const config = parseConfig({
      model: {
        provider: "openaiCompat",
        modelName: "m",
        baseUrl: "http://localhost:11434",
        tools: true,
        supportsTools: false,
        timeoutMs: 1000
      },
      mcp: minimalMcp,
      agent: minimalAgent
    });
    expect(config.model.tools).toBe(true);
  });

  test("normalizeModelConfig merges legacy supportsTools", () => {
    expect(normalizeModelConfig({ supportsTools: false, baseUrl: "http://x" }).tools).toBe(false);
    expect(normalizeModelConfig({ tools: true, supportsTools: false }).tools).toBe(true);
  });

  test("rejects missing stdio details", () => {
    expect(() => parseConfig({
      model: {
        provider: "ollama",
        modelName: "llama3.1",
        baseUrl: "http://localhost:11434",
        timeoutMs: 1000
      },
      mcp: {
        playwright: { enabled: true, transport: "stdio" },
        postman: {
          enabled: true,
          transport: "sse",
          sse: { url: "http://localhost:7000" }
        }
      },
      agent: { maxIterations: 2, toolTimeoutMs: 1000, requestTimeoutMs: 1000 }
    })).toThrow();
  });
});
