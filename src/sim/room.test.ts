import { it, expect } from "vitest";
import {
  initialRoom,
  roomSchema,
  routeBetween,
  walkTo,
  advanceWalker,
} from "./room";
import {
  roomNodes,
  roomLinks,
  customerTypes,
  customerDialogue,
  duelists,
  type RoomNode,
} from "../content/tavern";
it("all stations are reachable through adjacent walkable edges", () => {
  for (const from of Object.keys(roomNodes) as RoomNode[])
    for (const to of Object.keys(roomNodes) as RoomNode[]) {
      let at = from;
      for (const next of routeBetween(from, to)) {
        expect(roomLinks[at]).toContain(next);
        at = next;
      }
      expect(at).toBe(to);
    }
});
it("retargeting a moving player completes the current edge without teleporting", () => {
  const p = initialRoom().player;
  walkTo(p, "book");
  advanceWalker(p, 10);
  const pos = { x: p.x, y: p.y },
    edge = p.route[0];
  walkTo(p, "entrance");
  expect({ x: p.x, y: p.y }).toEqual(pos);
  expect(p.route[0]).toBe(edge);
  for (let i = 0; i < 500; i++) advanceWalker(p, 11);
  expect(p.node).toBe("entrance");
  expect(p.x).toBe(roomNodes.entrance.x);
  expect(p.route).toHaveLength(0);
});

it("guests have valid distinct identities and varied phase-aware table talk", () => {
  expect(customerTypes).toHaveLength(20);
  expect(new Set(customerTypes.map((p) => p.art)).size).toBe(14);
  expect(new Set(customerTypes.map((p) => p.name)).size).toBe(20);
  expect(new Set(duelists.map((p) => p.deck)).size).toBe(18);
  for (let kind = 0; kind < customerTypes.length; kind++) {
    const guest = { kind, id: 21, phase: "browse", purchased: false };
    const lines = Array.from({ length: 9 }, (_, day) =>
      customerDialogue(guest, day),
    );
    expect(new Set(lines).size).toBeGreaterThan(3);
    expect(lines).toContain(customerTypes[kind].greeting);
    expect(customerDialogue({ ...guest, phase: "checkout" }, 1)).not.toBe(
      lines[1],
    );
    expect(customerDialogue({ ...guest, purchased: true }, 1)).not.toBe(
      lines[1],
    );
  }
});

it("every node reaches every other, routes are fresh arrays, and a saved route that leaves its node off the links is dropped on load", () => {
  const nodes = Object.keys(roomNodes) as RoomNode[];
  for (const a of nodes)
    for (const b of nodes) {
      const route = routeBetween(a, b);
      expect(a === b ? route.length : route.at(-1)).toBe(a === b ? 0 : b);
      route.push(a);
      expect(routeBetween(a, b)).not.toContain(a === b ? "never" : a);
    }
  const room = initialRoom(),
    stray = nodes.find(
      (n) => n !== room.player.node && !roomLinks[room.player.node].includes(n),
    )!;
  room.player.route = [stray];
  const loaded = roomSchema.parse(room);
  expect(loaded.player.route).toEqual([]);
  room.player.route = [roomLinks[room.player.node][0]];
  expect(roomSchema.parse(room).player.route).toEqual(room.player.route);
});
