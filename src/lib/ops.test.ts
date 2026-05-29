import { describe, it, expect } from "vitest";
import {
  addCard,
  updateCard,
  deleteCard,
  addColumn,
  renameColumn,
  deleteColumn,
  moveCard,
  moveColumn,
  setColumnWip,
} from "./ops";
import { defaultBoard, type Board } from "./board";

function freshWithCards(): Board {
  let b = defaultBoard();
  b = addCard(b, b.cols[0].id, "a");
  b = addCard(b, b.cols[0].id, "b");
  return b;
}

describe("card ops are immutable (§V.5 DOM never authoritative)", () => {
  it("addCard returns new board, original untouched", () => {
    const b = defaultBoard();
    const n = addCard(b, b.cols[0].id, "hi");
    expect(b.cols[0].cards).toHaveLength(0);
    expect(n.cols[0].cards).toHaveLength(1);
    expect(n).not.toBe(b);
  });

  it("updateCard patches fields but keeps id (§V.4)", () => {
    let b = defaultBoard();
    b = addCard(b, b.cols[0].id, "x");
    const id = b.cols[0].cards[0].id;
    const n = updateCard(b, b.cols[0].id, id, { txt: "y", color: "#fff" });
    expect(n.cols[0].cards[0].id).toBe(id);
    expect(n.cols[0].cards[0].txt).toBe("y");
    expect(n.cols[0].cards[0].color).toBe("#fff");
  });

  it("deleteCard removes by id", () => {
    const b = freshWithCards();
    const id = b.cols[0].cards[0].id;
    const n = deleteCard(b, b.cols[0].id, id);
    expect(n.cols[0].cards.map((c) => c.txt)).toEqual(["b"]);
  });
});

describe("column ops", () => {
  it("addColumn appends unique-id column", () => {
    const b = defaultBoard();
    const n = addColumn(b, "Extra");
    expect(n.cols).toHaveLength(4);
    expect(new Set(n.cols.map((c) => c.id)).size).toBe(4);
  });
  it("renameColumn / deleteColumn", () => {
    let b = defaultBoard();
    const id = b.cols[0].id;
    b = renameColumn(b, id, "Renamed");
    expect(b.cols[0].name).toBe("Renamed");
    b = deleteColumn(b, id);
    expect(b.cols.find((c) => c.id === id)).toBeUndefined();
  });
});

describe("moveCard (§V.5)", () => {
  it("moves card across columns at index", () => {
    const b = freshWithCards();
    const from = b.cols[0].id;
    const to = b.cols[1].id;
    const cardId = b.cols[0].cards[0].id;
    const n = moveCard(b, from, to, cardId, 0);
    expect(n.cols[0].cards.map((c) => c.txt)).toEqual(["b"]);
    expect(n.cols[1].cards.map((c) => c.txt)).toEqual(["a"]);
  });
  it("reorders within same column", () => {
    const b = freshWithCards();
    const col = b.cols[0].id;
    const cardId = b.cols[0].cards[0].id; // "a"
    const n = moveCard(b, col, col, cardId, 2);
    expect(n.cols[0].cards.map((c) => c.txt)).toEqual(["b", "a"]);
  });
  it("no-op on unknown card", () => {
    const b = freshWithCards();
    const n = moveCard(b, b.cols[0].id, b.cols[1].id, "nope", 0);
    expect(n).toBe(b);
  });
});

describe("setColumnWip (§V.12)", () => {
  it("sets a floored positive limit", () => {
    const b = defaultBoard();
    const n = setColumnWip(b, b.cols[0].id, 3.7);
    expect(n.cols[0].wip).toBe(3);
  });
  it("clears wip on undefined / 0 / negative", () => {
    let b = defaultBoard();
    const id = b.cols[0].id;
    b = setColumnWip(b, id, 5);
    expect(b.cols[0].wip).toBe(5);
    b = setColumnWip(b, id, 0);
    expect("wip" in b.cols[0]).toBe(false);
    b = setColumnWip(b, id, 5);
    b = setColumnWip(b, id, undefined);
    expect("wip" in b.cols[0]).toBe(false);
  });
});

describe("moveColumn", () => {
  it("reorders columns", () => {
    const b = defaultBoard();
    const n = moveColumn(b, 0, 2);
    expect(n.cols.map((c) => c.name)).toEqual(["Doing", "Done", "Todo"]);
  });
});
