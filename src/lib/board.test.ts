import { describe, it, expect } from "vitest";
import { encode as cborEncode } from "cbor-x";
import { deflateSync } from "fflate";
import {
  encode,
  decode,
  defaultBoard,
  demoBoard,
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

describe("§V.13 optional wip survives roundtrip", () => {
  it("roundtrips a column with a wip limit", () => {
    const b: Board = {
      t: "x",
      cols: [
        { id: "c1", name: "Doing", wip: 3, cards: [] },
        { id: "c2", name: "Done", cards: [] },
      ],
    };
    expect(decode(encode(b))).toEqual(b);
  });
  it("isBoard rejects non-numeric wip", () => {
    const bad = { t: "x", cols: [{ id: "c", name: "n", wip: "3", cards: [] }] };
    expect(isBoard(bad)).toBe(false);
  });
  it("isBoard accepts column without wip", () => {
    expect(isBoard({ t: "x", cols: [{ id: "c", name: "n", cards: [] }] })).toBe(
      true
    );
  });
});

describe("§V.10 demo board", () => {
  it("is a valid, roundtrippable board", () => {
    const b = demoBoard();
    expect(isBoard(b)).toBe(true);
    expect(decode(encode(b))).toEqual(b);
  });
  it("has unique card + column ids", () => {
    const b = demoBoard();
    const ids = [
      ...b.cols.map((c) => c.id),
      ...b.cols.flatMap((c) => c.cards.map((cd) => cd.id)),
    ];
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("§V.3 decode never throws, returns null on bad input", () => {
  it("returns null on garbage", () => {
    expect(decode("@@@not-valid@@@")).toBeNull();
  });
  it("returns null on empty string", () => {
    expect(decode("")).toBeNull();
  });
  it("returns null on valid CBOR+deflate of non-board data", () => {
    // manually compress invalid object — encode() would crash on non-Board input
    const cbor = cborEncode({ foo: "bar" });
    const compressed = deflateSync(cbor);
    let b = "";
    for (let i = 0; i < compressed.length; i++) b += String.fromCharCode(compressed[i]);
    const bad = btoa(b).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
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

describe("§V.14 checklist roundtrip", () => {
  it("roundtrips card with checklist items", () => {
    const b: Board = {
      t: "x",
      cols: [{
        id: "c1", name: "Todo", cards: [{
          id: "k1", txt: "task",
          checklist: [
            { id: "i1", txt: "sub a", done: false },
            { id: "i2", txt: "sub b", done: true },
          ],
        }],
      }],
    };
    expect(decode(encode(b))).toEqual(b);
  });
  it("isBoard rejects invalid checklist item (missing done)", () => {
    const bad = {
      t: "x", cols: [{ id: "c", name: "n", cards: [{
        id: "k", txt: "t", checklist: [{ id: "i", txt: "x" }],
      }] }],
    };
    expect(isBoard(bad)).toBe(false);
  });
});

describe("§V.16 priority roundtrip", () => {
  it("roundtrips card with each priority", () => {
    const priorities = ["P1", "P2", "P3"] as const;
    for (const p of priorities) {
      const b: Board = {
        t: "x",
        cols: [{ id: "c1", name: "Todo", cards: [{ id: "k1", txt: "t", priority: p }] }],
      };
      expect(decode(encode(b))).toEqual(b);
    }
  });
  it("isBoard rejects invalid priority value", () => {
    const bad = { t: "x", cols: [{ id: "c", name: "n", cards: [{ id: "k", txt: "t", priority: "P4" }] }] };
    expect(isBoard(bad)).toBe(false);
  });
});

describe("§V.15 column color roundtrip", () => {
  it("roundtrips column with color", () => {
    const b: Board = {
      t: "x",
      cols: [{ id: "c1", name: "Todo", color: "#3b82f6", cards: [] }],
    };
    expect(decode(encode(b))).toEqual(b);
  });
});

describe("§V.17 swimlanes roundtrip", () => {
  it("roundtrips board with lanes and card laneId", () => {
    const b: Board = {
      t: "x",
      cols: [{ id: "c1", name: "Todo", cards: [{ id: "k1", txt: "t", laneId: "l1" }] }],
      lanes: [{ id: "l1", name: "Team A" }, { id: "l2", name: "Team B" }],
    };
    expect(decode(encode(b))).toEqual(b);
  });
  it("isBoard accepts board without lanes (backward compat)", () => {
    expect(isBoard({ t: "x", cols: [{ id: "c", name: "n", cards: [] }] })).toBe(true);
  });
});
