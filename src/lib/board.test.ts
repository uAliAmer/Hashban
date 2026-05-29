import { describe, it, expect } from "vitest";
import {
  encode,
  decode,
  defaultBoard,
  isBoard,
  genId,
  type Board,
} from "./board";

const sample: Board = {
  t: "Test Board",
  cols: [
    {
      id: "c1",
      name: "Todo",
      cards: [
        { id: "k1", txt: "first" },
        { id: "k2", txt: "second", desc: "details", color: "#ff0000", due: "2026-06-01" },
      ],
    },
    { id: "c2", name: "Done", cards: [] },
  ],
};

describe("§V.2 roundtrip lossless", () => {
  it("decode(encode(b)) deep-equals b", () => {
    expect(decode(encode(sample))).toEqual(sample);
  });

  it("roundtrips default board", () => {
    const b = defaultBoard();
    expect(decode(encode(b))).toEqual(b);
  });

  it("roundtrips empty/unicode/special chars", () => {
    const b: Board = {
      t: "日本語 & <html> \"quotes\" | pipes",
      cols: [{ id: "x", name: "↑↓", cards: [{ id: "y", txt: "emoji 🎉" }] }],
    };
    expect(decode(encode(b))).toEqual(b);
  });
});

describe("§V.3 decode never throws, returns null on bad input", () => {
  it("returns null on garbage", () => {
    expect(decode("@@@not-valid@@@")).toBeNull();
  });
  it("returns null on empty string", () => {
    expect(decode("")).toBeNull();
  });
  it("returns null on valid lz of non-board JSON", () => {
    // structurally invalid -> isBoard rejects
    const bad = encode({ foo: "bar" } as unknown as Board);
    expect(decode(bad)).toBeNull();
  });
});

describe("§V.4 unique ids", () => {
  it("genId produces distinct values", () => {
    const ids = new Set(Array.from({ length: 1000 }, () => genId()));
    expect(ids.size).toBe(1000);
  });
});

describe("§V.8 default board", () => {
  it("has Todo/Doing/Done columns", () => {
    const b = defaultBoard();
    expect(b.cols.map((c) => c.name)).toEqual(["Todo", "Doing", "Done"]);
  });
  it("default board column ids are unique", () => {
    const b = defaultBoard();
    const ids = b.cols.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("isBoard guard", () => {
  it("accepts valid board", () => {
    expect(isBoard(sample)).toBe(true);
  });
  it("rejects null/array/primitive", () => {
    expect(isBoard(null)).toBe(false);
    expect(isBoard([])).toBe(false);
    expect(isBoard("x")).toBe(false);
    expect(isBoard({ t: "x" })).toBe(false);
  });
});
