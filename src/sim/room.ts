import { z } from "zod";
import {
  roomNodes,
  roomLinks,
  customerTypes,
  type RoomNode,
} from "../content/tavern";
const node = z.enum(Object.keys(roomNodes) as [RoomNode, ...RoomNode[]]);
/** The walkable floor's extent, from the authored nodes (never smaller than the original 1536 × 1024 floor). */
const FLOOR = {
  width: Math.max(1536, ...Object.values(roomNodes).map((n) => n.x)),
  height: Math.max(1024, ...Object.values(roomNodes).map((n) => n.y)),
};
const walkerShape = z.object({
  node,
  x: z.number().min(0).max(FLOOR.width),
  y: z.number().min(0).max(FLOOR.height),
  route: z.array(node).max(30),
});
// A saved route must leave from the walker's node along an authored link; anything
// else (an edited floor, a tampered save) is dropped so nobody cuts through furniture.
const linkedRoute = <T extends { node: RoomNode; route: RoomNode[] }>(
  w: T,
): T =>
  w.route.length && !roomLinks[w.node].includes(w.route[0])
    ? { ...w, route: [] }
    : w;
const walker = walkerShape.transform(linkedRoute);
// Generous bounds that reject garbage without pinning the tuning: the capacity and
// arrival constants live in hospitality.ts and may grow without a migration.
export const roomSchema = z.object({
  step: z.number().int().min(0),
  nextId: z.number().int().min(1),
  spawnIn: z.number().int().min(0).max(1000),
  player: walker,
  customers: z
    .array(
      walkerShape
        .extend({
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
          wait: z.number().int().min(0).max(1000),
          purchased: z.boolean(),
          saleAmount: z.number().int().min(0),
        })
        .transform(linkedRoute),
    )
    .max(64),
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
/** Deterministic shortest path on the authored walkable floor network: ties break by code point, never by locale. */
function shortestPath(start: RoomNode, end: RoomNode): RoomNode[] {
  if (start === end) return [];
  const distance = new Map<RoomNode, number>([[start, 0]]),
    previous = new Map<RoomNode, RoomNode>(),
    open = new Set<RoomNode>([start]);
  while (open.size) {
    const current = [...open].sort(
      (a, b) =>
        distance.get(a)! - distance.get(b)! || (a < b ? -1 : a > b ? 1 : 0),
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
/** Every route, computed once when the module loads: an unreachable node is a content error found here, never inside a command. */
const routes = new Map<string, RoomNode[]>();
for (const start of Object.keys(roomNodes) as RoomNode[])
  for (const end of Object.keys(roomNodes) as RoomNode[])
    routes.set(`${start}>${end}`, shortestPath(start, end));
export function routeBetween(start: RoomNode, end: RoomNode): RoomNode[] {
  return [...routes.get(`${start}>${end}`)!];
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
