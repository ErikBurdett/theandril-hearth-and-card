import { z } from "zod";
import {
  roomNodes,
  roomLinks,
  customerTypes,
  type RoomNode,
} from "../content/tavern";
const node = z.enum(Object.keys(roomNodes) as [RoomNode, ...RoomNode[]]);
const walker = z.object({
  node,
  x: z.number().min(0).max(1536),
  y: z.number().min(0).max(1024),
  route: z.array(node).max(30),
});
export const roomSchema = z.object({
  step: z.number().int().min(0),
  nextId: z.number().int().min(1),
  spawnIn: z.number().int().min(0).max(100),
  player: walker,
  customers: z
    .array(
      walker.extend({
        id: z.number().int().min(1),
        kind: z
          .number()
          .int()
          .min(0)
          .max(customerTypes.length - 1),
        setId: z.string(),
        purpose: z.enum(["cards", "meal", "drink"]).default("cards"),
        itemId: z.string().nullable().default(null),
        phase: z.enum([
          "arriving",
          "browsing",
          "checkout",
          "dining",
          "leaving",
        ]),
        wait: z.number().int().min(0).max(100),
        purchased: z.boolean(),
        saleAmount: z.number().int().min(0),
      }),
    )
    .max(12),
});
export type Room = z.infer<typeof roomSchema>;
export type Walker = z.infer<typeof walker>;
export type Customer = Room["customers"][number];
export const initialRoom = (): Room => ({
  step: 0,
  nextId: 1,
  spawnIn: 0,
  player: { node: "east", x: roomNodes.east.x, y: roomNodes.east.y, route: [] },
  customers: [],
});
/** Deterministic shortest path on the authored walkable floor network. */
export function routeBetween(start: RoomNode, end: RoomNode): RoomNode[] {
  if (start === end) return [];
  const distance = new Map<RoomNode, number>([[start, 0]]),
    previous = new Map<RoomNode, RoomNode>(),
    open = new Set<RoomNode>([start]);
  while (open.size) {
    const current = [...open].sort(
      (a, b) => distance.get(a)! - distance.get(b)! || a.localeCompare(b),
    )[0];
    open.delete(current);
    if (current === end) break;
    for (const next of roomLinks[current]) {
      const a = roomNodes[current],
        b = roomNodes[next],
        d = distance.get(current)! + Math.hypot(a.x - b.x, a.y - b.y);
      if (d < (distance.get(next) ?? Infinity)) {
        distance.set(next, d);
        previous.set(next, current);
        open.add(next);
      }
    }
  }
  const path: RoomNode[] = [];
  let at = end;
  while (at !== start) {
    path.unshift(at);
    const p = previous.get(at);
    if (!p) throw Error("That part of the tavern is unreachable.");
    at = p;
  }
  return path;
}
export function walkTo(actor: Walker, destination: RoomNode) {
  // Finish the active edge before changing route; never cut through furniture.
  const next = actor.route[0];
  actor.route = next
    ? [next, ...routeBetween(next, destination)]
    : routeBetween(actor.node, destination);
}
export function advanceWalker(actor: Walker, speed: number) {
  let remaining = speed;
  while (actor.route.length && remaining > 0) {
    const dest = roomNodes[actor.route[0]],
      dx = dest.x - actor.x,
      dy = dest.y - actor.y,
      d = Math.hypot(dx, dy);
    if (d <= remaining) {
      actor.x = dest.x;
      actor.y = dest.y;
      remaining -= d;
      actor.node = actor.route.shift()!;
    } else {
      actor.x += (dx / d) * remaining;
      actor.y += (dy / d) * remaining;
      remaining = 0;
    }
  }
}
export function customerName(customer: Customer) {
  return customerTypes[customer.kind].name;
}
