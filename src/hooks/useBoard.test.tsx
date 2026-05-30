import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBoard } from "./useBoard";
import { addCard } from "@/lib/ops";
import { decode, defaultBoard, encode } from "@/lib/board";

beforeEach(() => {
  // Seed a known empty board into the hash so the hook loads from it (the
  // single source of truth, §V.1) instead of seeding the first-visit demo
  // board (§V.10), which only fires when hash AND cache are both empty.
  window.location.hash = encode(defaultBoard());
  window.localStorage?.clear();
});

describe("§V.1 hash = source of truth", () => {
  it("setBoard writes encoded state to window.location.hash", () => {
    const { result } = renderHook(() => useBoard());
    const colId = result.current.board.cols[0].id;
    act(() => {
      result.current.setBoard((b) => addCard(b, colId, "x"));
    });
    const fromHash = decode(window.location.hash.replace(/^#/, ""));
    expect(fromHash).not.toBeNull();
    expect(fromHash!.cols[0].cards[0].txt).toBe("x");
  });
});

describe("§V.9 undo/redo via snapshots, each re-commits hash", () => {
  it("undo restores previous state and rewrites hash; redo replays", () => {
    const { result } = renderHook(() => useBoard());
    const colId = result.current.board.cols[0].id;

    act(() => result.current.setBoard((b) => addCard(b, colId, "first")));
    expect(result.current.board.cols[0].cards).toHaveLength(1);
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.undo());
    expect(result.current.board.cols[0].cards).toHaveLength(0);
    expect(
      decode(window.location.hash.replace(/^#/, ""))!.cols[0].cards
    ).toHaveLength(0);
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.redo());
    expect(result.current.board.cols[0].cards).toHaveLength(1);
  });
});

describe("§V.10 first-visit demo seed", () => {
  it("seeds demo board when hash and cache are both empty", () => {
    window.location.hash = "";
    window.localStorage?.clear();
    const { result } = renderHook(() => useBoard());
    expect(result.current.board.t).toBe("✨ Hashban Demo");
    expect(result.current.board.cols.length).toBeGreaterThan(0);
  });
});
