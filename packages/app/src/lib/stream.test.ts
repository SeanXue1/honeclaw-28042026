import { describe, expect, it } from "bun:test"
import { parseSseChunks } from "./stream"

describe("parseSseChunks", () => {
  it("parses complete sse events and keeps pending", () => {
    const input =
      'event: run_started\ndata: {"text":"ok"}\n\nevent: run_finished\ndata: {"success":true}\n\nevent: run_started'
    const parsed = parseSseChunks(input)
    expect(parsed.events).toHaveLength(2)
    expect(parsed.pending).toBe("event: run_started")
  })

  it("parses run_error and run_finished in one buffer (same read chunk)", () => {
    const input =
      'event: run_error\ndata: {"message":"bad"}\n\nevent: run_finished\ndata: {"success":false}\n\n'
    const parsed = parseSseChunks(input)
    expect(parsed.events).toHaveLength(2)
    expect(parsed.events[0]?.event).toBe("run_error")
    expect(parsed.events[1]?.event).toBe("run_finished")
  })

  it("parses error and done from early chat exit", () => {
    const input = 'event: error\ndata: {"text":"no actor"}\n\nevent: done\ndata: {}\n\n'
    const parsed = parseSseChunks(input)
    expect(parsed.events).toHaveLength(2)
    expect(parsed.events[0]?.event).toBe("error")
    expect(parsed.events[1]?.event).toBe("done")
  })

  it("parses CRLF-delimited SSE events", () => {
    const input =
      'event: run_started\r\ndata: {"text":"ok"}\r\n\r\nevent: run_finished\r\ndata: {"success":true}\r\n\r\n'
    const parsed = parseSseChunks(input)
    expect(parsed.events).toHaveLength(2)
    expect(parsed.events[0]?.event).toBe("run_started")
    expect(parsed.events[1]?.event).toBe("run_finished")
    expect(parsed.pending).toBe("")
  })
})
