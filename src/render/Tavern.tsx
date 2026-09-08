import { assetUrl } from "../content/artwork";
import { clockPhase, hasUpgrade, roomUnlocked } from "../sim/hospitality";
import { itemName } from "../content/hospitality";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { BookOpen, Package, Layers, Swords, MessageCircle } from "lucide-react";
import type { Game } from "../sim/game";
import {
  roomNodes,
  roomLinks,
  stations,
  customerTypes,
  customerDialogue,
  type RoomNode,
} from "../content/tavern";
import type { Walker } from "../sim/room";
const expandedFloor: Record<RoomNode, { x: number; y: number }> = {
  entrance: { x: 890, y: 860 },
  foyer: { x: 980, y: 630 },
  east: { x: 1100, y: 535 },
  counter: { x: 1260, y: 480 },
  middle: { x: 1030, y: 525 },
  shelves: { x: 975, y: 390 },
  north: { x: 800, y: 435 },
  west: { x: 650, y: 460 },
  book: { x: 540, y: 475 },
  table: { x: 900, y: 610 },
  hearth: { x: 740, y: 660 },
  dining: { x: 390, y: 790 },
  kitchen: { x: 230, y: 640 },
  serving: { x: 1100, y: 890 },
  bar: { x: 1240, y: 880 },
};
const floorPoint = (g: Game, id: RoomNode) =>
  hasUpgrade(g, "hall") ? expandedFloor[id] : roomNodes[id];
// Intermediate points follow the painted stair treads and open floor landings.
const stairPaths: Record<string, { x: number; y: number }[]> = {
  "hearth:dining": [
    { x: 580, y: 650 },
    { x: 500, y: 730 },
    { x: 440, y: 760 },
  ],
  "dining:kitchen": [
    { x: 460, y: 750 },
    { x: 460, y: 640 },
    { x: 300, y: 615 },
  ],
  "entrance:foyer": [
    { x: 890, y: 810 },
    { x: 890, y: 725 },
  ],
  "entrance:hearth": [
    { x: 890, y: 810 },
    { x: 890, y: 725 },
  ],
};
function actorPoint(g: Game, w: Walker) {
  if (!hasUpgrade(g, "hall")) return w;
  const a = floorPoint(g, w.node),
    next = w.route[0];
  if (!next) return a;
  const original = roomNodes[w.node],
    destination = roomNodes[next],
    b = floorPoint(g, next);
  const t = Math.min(
    1,
    Math.hypot(w.x - original.x, w.y - original.y) /
      Math.hypot(destination.x - original.x, destination.y - original.y),
  );
  const middle =
    stairPaths[`${w.node}:${next}`] ??
    [...(stairPaths[`${next}:${w.node}`] ?? [])].reverse();
  const points = [a, ...middle, b],
    lengths = points
      .slice(1)
      .map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  let distance = t * lengths.reduce((a, n) => a + n, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const u = lengths[i] ? distance / lengths[i] : 0;
      return {
        x: points[i].x + (points[i + 1].x - points[i].x) * u,
        y: points[i].y + (points[i + 1].y - points[i].y) * u,
      };
    }
    distance -= lengths[i];
  }
  return b;
}
interface Atlas {
  meta: { size: { w: number; h: number } };
  frames: Record<
    string,
    { frame: { x: number; y: number; w: number; h: number } }
  >;
}
const icons = [Package, BookOpen, Layers, Swords];
export function Tavern({
  game,
  onVisit,
  onMove,
  onAutoplay,
  blocked = false,
}: {
  game: Game;
  onVisit: (tab: string) => void;
  onMove: (node: RoomNode) => void;
  onAutoplay: () => void;
  blocked?: boolean;
}) {
  const host = useRef<HTMLDivElement>(null),
    snapshot = useRef(game),
    callbacks = useRef({ onVisit, onMove, blocked });
  snapshot.current = game;
  callbacks.current = { onVisit, onMove, blocked };
  const [error, setError] = useState(false),
    [view, setView] = useState({ w: 1536, h: 1024, x: 0, y: 0, zoom: 1 }),
    [talk, setTalk] = useState<number | null>(null);
  const cameraActions = useRef({
    zoom: (_factor: number) => {},
    pan: (_x: number, _y: number) => {},
    reset: () => {},
  });
  useEffect(() => {
    const node = host.current!;
    let dead = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    } catch {
      setError(true);
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute(
      "aria-label",
      "The tavern floor. Click a clear aisle to move Erilian Kantonine.",
    );
    node.append(renderer.domElement);
    const scene = new THREE.Scene(),
      camera = new THREE.OrthographicCamera(-768, 768, 512, -512, 0.1, 100);
    camera.position.z = 10;
    const textures: THREE.Texture[] = [],
      materials: THREE.Material[] = [],
      geometries: THREE.BufferGeometry[] = [];
    const loader = new THREE.TextureLoader(),
      actors = new Map<string, THREE.Sprite>(),
      materialByArt = new Map<string, THREE.SpriteMaterial>();
    function configure(t: THREE.Texture) {
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.NearestFilter;
      t.generateMipmaps = false;
      t.colorSpace = THREE.SRGBColorSpace;
      textures.push(t);
      return t;
    }
    const bg = configure(
      loader.load(
        assetUrl("/art/tavern.png"),
        () => {
          if (!dead) renderer.render(scene, camera);
        },
        undefined,
        () => {
          if (!dead) setError(true);
        },
      ),
    );
    const wings: Record<string, THREE.Texture> = {};
    function wing(id: "hall" | "bar") {
      if (!wings[id])
        wings[id] = configure(
          loader.load(
            assetUrl(`/art/tavern-${id}.png`),
            undefined,
            undefined,
            () => {
              if (!dead) setError(true);
            },
          ),
        );
      return wings[id];
    }
    const geometry = new THREE.PlaneGeometry(1536, 1024),
      material = new THREE.MeshBasicMaterial({ map: bg });
    geometries.push(geometry);
    materials.push(material);
    scene.add(new THREE.Mesh(geometry, material));
    // Presentation-only candle motes; no simulation randomness is consumed.
    const moteGeometry = new THREE.BufferGeometry();
    const motePositions = new Float32Array(48 * 3);
    moteGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(motePositions, 3),
    );
    const moteMaterial = new THREE.PointsMaterial({
      color: "#edbc71",
      size: 3,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthTest: false,
    });
    const motes = new THREE.Points(moteGeometry, moteMaterial);
    motes.renderOrder = 3;
    scene.add(motes);
    geometries.push(moteGeometry);
    materials.push(moteMaterial);
    const ringGeometry = new THREE.RingGeometry(23, 26, 40),
      ringMaterial = new THREE.MeshBasicMaterial({
        color: "#edbc71",
        transparent: true,
        opacity: 0.5,
        depthTest: false,
      });
    geometries.push(ringGeometry);
    materials.push(ringMaterial);
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.scale.y = 0.4;
    ring.renderOrder = 1;
    scene.add(ring);
    Promise.all([
      loader.loadAsync(assetUrl("/art/animation/sprites.png")),
      fetch(assetUrl("/art/animation/sprites.json")).then((r) => {
        if (!r.ok) throw Error("Missing atlas");
        return r.json() as Promise<Atlas>;
      }),
    ])
      .then(([atlas, data]) => {
        if (dead) {
          atlas.dispose();
          return;
        }
        configure(atlas);
        for (const [id, entry] of Object.entries(data.frames)) {
          const f = entry.frame,
            t = configure(atlas.clone());
          t.repeat.set(f.w / data.meta.size.w, f.h / data.meta.size.h);
          t.offset.set(
            f.x / data.meta.size.w,
            1 - (f.y + f.h) / data.meta.size.h,
          );
          const m = new THREE.SpriteMaterial({
            map: t,
            transparent: true,
            depthTest: false,
            alphaTest: 0.1,
          });
          materials.push(m);
          materialByArt.set(id, m);
        }
      })
      .catch(() => {
        if (!dead) setError(true);
      });
    function syncActor(
      id: string,
      art: string,
      x: number,
      y: number,
      player = false,
      moving = false,
      time = 0,
    ) {
      const state = moving ? "walk" : "idle",
        count = moving ? 4 : 2;
      const frame = reduced.matches
        ? 0
        : Math.floor((time + (player ? 0 : x * 3)) / (moving ? 140 : 650)) %
          count;
      const mat = materialByArt.get(`${art}/${state}/se/${frame}`);
      if (player) {
        node.dataset.playerAnimation = state;
        node.dataset.playerFrame = String(frame);
      }
      if (!mat) return;
      let sprite = actors.get(id);
      if (!sprite) {
        sprite = new THREE.Sprite(mat);
        sprite.center.set(0.5, 8 / 160);
        sprite.scale.set(player ? 132 : 112, player ? 176 : 149, 1);
        sprite.position.set(x - 768, 512 - y, 2);
        actors.set(id, sprite);
        scene.add(sprite);
      }
      sprite.position.x += (x - 768 - sprite.position.x) * 0.38;
      sprite.position.y += (512 - y - sprite.position.y) * 0.38;
      sprite.material = mat;
      const facing = x - 768 - sprite.position.x;
      if (Math.abs(facing) > 0.5) sprite.userData.facing = facing < 0 ? -1 : 1;
      sprite.scale.set(
        (player ? 141 : 119) * (sprite.userData.facing ?? 1),
        player ? 176 : 149,
        1,
      );
      sprite.renderOrder = 1000 + Math.round(y);
    }
    const props = new Map<string, THREE.Sprite>();
    function ambience(
      id: string,
      art: string,
      x: number,
      y: number,
      size: number,
      time: number,
      visible = true,
    ) {
      const frame = reduced.matches ? 0 : Math.floor((time + x) / 180) % 4;
      const mat = materialByArt.get(`${art}/active/se/${frame}`);
      if (!mat) return;
      let sprite = props.get(id);
      if (!sprite) {
        sprite = new THREE.Sprite(mat);
        sprite.center.set(0.5, 8 / 128);
        scene.add(sprite);
        props.set(id, sprite);
      }
      sprite.material = mat;
      sprite.position.set(x - 768, 512 - y, 1);
      sprite.scale.set(size, size, 1);
      sprite.renderOrder = 900 + Math.round(y);
      sprite.visible = visible;
    }
    const framing = { zoom: 1, x: 0, y: 0 };
    const resize = () => {
      const w = node.clientWidth,
        h = node.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      const aspect = w / h,
        width = Math.max(1536, 1024 * aspect) / framing.zoom,
        height = width / aspect;
      camera.left = framing.x - width / 2;
      camera.right = framing.x + width / 2;
      camera.top = framing.y + height / 2;
      camera.bottom = framing.y - height / 2;
      camera.updateProjectionMatrix();
      setView({
        w: width,
        h: height,
        x: framing.x,
        y: framing.y,
        zoom: framing.zoom,
      });
    };
    cameraActions.current = {
      zoom: (factor) => {
        framing.zoom = THREE.MathUtils.clamp(framing.zoom * factor, 0.65, 2.6);
        resize();
      },
      pan: (x, y) => {
        framing.x = THREE.MathUtils.clamp(framing.x + x, -700, 700);
        framing.y = THREE.MathUtils.clamp(framing.y + y, -500, 500);
        resize();
      },
      reset: () => {
        framing.zoom = 1;
        framing.x = 0;
        framing.y = 0;
        resize();
      },
    };
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    resize();
    const pointer = (e: PointerEvent) => {
      if (callbacks.current.blocked) return;
      const r = renderer.domElement.getBoundingClientRect(),
        x =
          ((e.clientX - r.left) / r.width) * (camera.right - camera.left) +
          camera.left +
          768,
        y =
          512 -
          ((1 - (e.clientY - r.top) / r.height) * (camera.top - camera.bottom) +
            camera.bottom);
      const candidates = (Object.keys(roomNodes) as RoomNode[])
        .filter((id) => roomUnlocked(snapshot.current, id))
        .map((id) => ({ id, ...floorPoint(snapshot.current, id) }));
      if (hasUpgrade(snapshot.current, "hall"))
        for (const [edge, points] of Object.entries(stairPaths)) {
          const id = edge.split(":")[1] as RoomNode;
          if (roomUnlocked(snapshot.current, id))
            for (const point of points) candidates.push({ id, ...point });
        }
      const nearest = candidates.sort(
        (a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y),
      )[0];
      if (Math.hypot(nearest.x - x, nearest.y - y) < 145) {
        callbacks.current.onMove(nearest.id);
        setTalk(null);
      }
    };
    const contacts = new Map<number, { x: number; y: number }>();
    let dragged = false,
      travel = 0;
    const pointerDown = (e: PointerEvent) => {
      if (callbacks.current.blocked || (e.button !== 0 && e.button !== 1))
        return;
      contacts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (contacts.size === 1) {
        dragged = false;
        travel = 0;
      } else dragged = true;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const pointerMove = (e: PointerEvent) => {
      const old = contacts.get(e.pointerId);
      if (!old) return;
      const before = [...contacts.values()];
      contacts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (callbacks.current.blocked) {
        dragged = true;
        return;
      }
      const dx = e.clientX - old.x,
        dy = e.clientY - old.y;
      travel += Math.hypot(dx, dy);
      if (contacts.size === 2) {
        const after = [...contacts.values()],
          a = Math.hypot(before[0].x - before[1].x, before[0].y - before[1].y),
          b = Math.hypot(after[0].x - after[1].x, after[0].y - after[1].y);
        if (a > 2 && b > 2) cameraActions.current.zoom(b / a);
        dragged = true;
      } else if (travel > 5) {
        dragged = true;
        cameraActions.current.pan(
          (-dx * (camera.right - camera.left)) / node.clientWidth,
          (dy * (camera.top - camera.bottom)) / node.clientHeight,
        );
      }
    };
    const pointerUp = (e: PointerEvent) => {
      if (!contacts.has(e.pointerId)) return;
      contacts.delete(e.pointerId);
      if (renderer.domElement.hasPointerCapture(e.pointerId))
        renderer.domElement.releasePointerCapture(e.pointerId);
      if (!dragged && e.button === 0) pointer(e);
    };
    const pointerCancel = (e: PointerEvent) => {
      contacts.delete(e.pointerId);
      dragged = true;
    };
    const wheel = (e: WheelEvent) => {
      if (callbacks.current.blocked) return;
      e.preventDefault();
      cameraActions.current.zoom(
        Math.exp(-THREE.MathUtils.clamp(e.deltaY, -160, 160) * 0.002),
      );
    };
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.addEventListener("pointerdown", pointerDown);
    renderer.domElement.addEventListener("pointermove", pointerMove);
    renderer.domElement.addEventListener("pointerup", pointerUp);
    renderer.domElement.addEventListener("pointercancel", pointerCancel);
    renderer.domElement.addEventListener("wheel", wheel, { passive: false });
    const keyboard = (e: KeyboardEvent) => {
      if (
        callbacks.current.blocked ||
        document.querySelector("dialog[open]") ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        (e.target instanceof HTMLElement &&
          e.target.closest("input,select,textarea,button"))
      )
        return;
      const key = e.key.toLowerCase(),
        p = snapshot.current.room.player;
      if (
        [
          "w",
          "a",
          "s",
          "d",
          "arrowup",
          "arrowdown",
          "arrowleft",
          "arrowright",
        ].includes(key)
      ) {
        e.preventDefault();
        if (p.route.length) return;
        const direction = ["w", "arrowup"].includes(key)
          ? [0, -1]
          : ["s", "arrowdown"].includes(key)
            ? [0, 1]
            : ["a", "arrowleft"].includes(key)
              ? [-1, 0]
              : [1, 0];
        const choices = roomLinks[p.node]
          .filter((id) => roomUnlocked(snapshot.current, id))
          .map((id) => {
            const n = floorPoint(snapshot.current, id),
              point = actorPoint(snapshot.current, p),
              dx = n.x - point.x,
              dy = n.y - point.y;
            return {
              id,
              score:
                (dx * direction[0] + dy * direction[1]) / Math.hypot(dx, dy),
            };
          })
          .sort((a, b) => b.score - a.score);
        if (choices[0]?.score > 0.1) callbacks.current.onMove(choices[0].id);
      }
      if (key === "e") {
        const nearest = [...stations].sort(
          (a, b) =>
            Math.hypot(roomNodes[a.id].x - p.x, roomNodes[a.id].y - p.y) -
            Math.hypot(roomNodes[b.id].x - p.x, roomNodes[b.id].y - p.y),
        )[0];
        if (
          Math.hypot(
            roomNodes[nearest.id].x - p.x,
            roomNodes[nearest.id].y - p.y,
          ) < 160
        ) {
          callbacks.current.onVisit(nearest.tab);
          e.preventDefault();
        }
      }
    };
    window.addEventListener("keydown", keyboard);
    let previous = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    renderer.setAnimationLoop((time) => {
      if (document.hidden || time - previous < 30) return;
      previous = time;
      const g = snapshot.current,
        p = g.room.player,
        point = actorPoint(g, p);
      const background = hasUpgrade(g, "bar")
        ? wing("bar")
        : hasUpgrade(g, "hall")
          ? wing("hall")
          : bg;
      if (background.image && material.map !== background) {
        material.map = background;
        material.needsUpdate = true;
      }
      const night = Math.max(
        0,
        Math.cos((((g.hospitality.bell % 48) - 36) / 48) * Math.PI * 2),
      );
      material.color.setRGB(
        1 - night * 0.38,
        1 - night * 0.32,
        1 - night * 0.18,
      );
      syncActor(
        "player",
        "player.erilian",
        point.x,
        point.y,
        true,
        p.route.length > 0,
        time,
      );
      motes.visible = !reduced.matches && !callbacks.current.blocked;
      if (motes.visible) {
        for (let i = 0; i < 48; i++) {
          const anchor = hasUpgrade(g, "hall")
            ? i % 2
              ? [1220, 410]
              : [580, 360]
            : i % 2
              ? [1110, 510]
              : [350, 400];
          motePositions[i * 3] =
            anchor[0] - 768 + Math.sin(i * 2.4 + time / 2500) * 45;
          motePositions[i * 3 + 1] =
            512 - anchor[1] + ((time * 0.018 + i * 13) % 130);
          motePositions[i * 3 + 2] = 1;
        }
        moteGeometry.attributes.position.needsUpdate = true;
      }
      const expanded = hasUpgrade(g, "hall");
      ambience(
        "hearth",
        "ambience.fire",
        expanded ? 640 : 395,
        expanded ? 410 : 523,
        expanded ? 44 : 60,
        time,
      );
      ambience(
        "lantern",
        "ambience.lantern",
        expanded ? 1404 : 1380,
        expanded ? 357 : 451,
        48,
        time,
      );
      const kitchen = floorPoint(g, "kitchen"),
        bar = floorPoint(g, "bar"),
        book = floorPoint(g, "book");
      ambience(
        "stew",
        "ambience.cauldron",
        expanded ? 320 : kitchen.x - 25,
        expanded ? 576 : kitchen.y - 26,
        65,
        time,
        hasUpgrade(g, "kitchen"),
      );
      ambience(
        "brew",
        "ambience.barrel",
        bar.x + 38,
        bar.y - 35,
        85,
        time,
        hasUpgrade(g, "bar") && g.hospitality.batches.length > 0,
      );
      ambience("grimoire", "ornament.book", book.x - 15, book.y - 42, 68, time);
      ring.position.set(point.x - 768, 512 - point.y, 1);
      ringMaterial.opacity = reduced.matches
        ? 0.5
        : 0.45 + Math.sin(time / 900) * 0.1;
      const active = new Set(["player"]);
      for (const c of g.room.customers) {
        const id = `customer-${c.id}`;
        active.add(id);
        syncActor(
          id,
          customerTypes[c.kind].art,
          actorPoint(g, c).x,
          actorPoint(g, c).y,
          false,
          c.route.length > 0,
          time,
        );
      }
      for (const [id, sprite] of actors)
        if (!active.has(id)) {
          scene.remove(sprite);
          actors.delete(id);
        }
      renderer.render(scene, camera);
    });
    return () => {
      dead = true;
      observer.disconnect();
      window.removeEventListener("keydown", keyboard);
      renderer.domElement.removeEventListener("pointerdown", pointerDown);
      renderer.domElement.removeEventListener("pointermove", pointerMove);
      renderer.domElement.removeEventListener("pointerup", pointerUp);
      renderer.domElement.removeEventListener("pointercancel", pointerCancel);
      renderer.domElement.removeEventListener("wheel", wheel);
      renderer.setAnimationLoop(null);
      textures.forEach((t) => t.dispose());
      materials.forEach((m) => m.dispose());
      geometries.forEach((g) => g.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  const position = (x: number, y: number) => ({
    left: `${50 + ((x - 768 - view.x) / view.w) * 100}%`,
    top: `${50 + ((y - 512 + view.y) / view.h) * 100}%`,
  });
  const customer = game.room.customers.find((c) => c.id === talk);
  return (
    <div
      className="world immersive-world"
      data-camera-zoom={view.zoom.toFixed(2)}
      data-camera-x={Math.round(view.x)}
      data-camera-y={Math.round(view.y)}
      data-player-node={game.room.player.node}
      data-time-phase={clockPhase(game)}
      data-tavern-size={
        hasUpgrade(game, "bar")
          ? "bar"
          : hasUpgrade(game, "hall")
            ? "hall"
            : "original"
      }
    >
      <div className="world-canvas" ref={host} />
      {!blocked && (
        <aside className="tavern-camera" aria-label="Tavern view controls">
          <div>
            <button
              aria-label="Zoom out"
              onClick={() => cameraActions.current.zoom(1 / 1.2)}
            >
              −
            </button>
            <output aria-label="Tavern zoom">
              {Math.round(view.zoom * 100)}%
            </output>
            <button
              aria-label="Zoom in"
              onClick={() => cameraActions.current.zoom(1.2)}
            >
              +
            </button>
            <button onClick={() => cameraActions.current.reset()}>
              Fit tavern
            </button>
          </div>
          <div>
            {[
              ["left", -140, 0, "←"],
              ["up", 0, 110, "↑"],
              ["down", 0, -110, "↓"],
              ["right", 140, 0, "→"],
            ].map(([name, x, y, label]) => (
              <button
                key={name}
                aria-label={`Pan ${name}`}
                onClick={() => cameraActions.current.pan(Number(x), Number(y))}
              >
                {label}
              </button>
            ))}
          </div>
          <small>
            Drag to pan · scroll or pinch to zoom
            <br />
            Click an aisle to walk
          </small>
        </aside>
      )}
      {error && (
        <div className="world-fallback">
          <img src={assetUrl("/art/tavern.png")} alt="The candlelit tavern" />
          <p>
            Character rendering unavailable. The grimoire controls are still
            usable.
          </p>
        </div>
      )}
      {!blocked && (
        <div className="room-markers">
          {hasUpgrade(game, "hall") && (
            <button
              className="station-marker wing-marker"
              style={position(
                floorPoint(game, "dining").x,
                floorPoint(game, "dining").y - 40,
              )}
              aria-label="Dining wing and kitchen"
              onClick={() => onVisit("Hospitality")}
            >
              <span>♨</span>
              <strong>
                {hasUpgrade(game, "kitchen") ? "Hearth kitchen" : "Dining wing"}
              </strong>
              <small>Meals · pantry · upgrades</small>
            </button>
          )}
          {hasUpgrade(game, "bar") && (
            <button
              className="station-marker wing-marker"
              style={position(
                floorPoint(game, "bar").x,
                floorPoint(game, "bar").y - 40,
              )}
              aria-label="Brewer’s bar and cellar"
              onClick={() => onVisit("Hospitality")}
            >
              <span>♧</span>
              <strong>Bar & cellar</strong>
              <small>Drinks · fermentation</small>
            </button>
          )}
          <button
            className="table-autoplay-launch"
            aria-label={
              game.battle?.autoplay
                ? "Watch autobattles"
                : game.battle?.result === "playing"
                  ? "Resume autobattles"
                  : "Start autobattles"
            }
            style={position(
              floorPoint(game, "table").x,
              floorPoint(game, "table").y + 12,
            )}
            onClick={onAutoplay}
          >
            {game.battle?.autoplay
              ? "Watch autobattles"
              : game.battle?.result === "playing"
                ? "Resume autobattles"
                : "Start autobattles"}{" "}
            <span>▶</span>
          </button>
          {stations.map((station, i) => {
            const Icon = icons[i],
              n = floorPoint(game, station.id);
            return (
              <button
                key={station.id}
                className="station-marker"
                style={position(n.x, n.y - 45)}
                aria-label={station.title}
                onClick={() => {
                  onMove(station.id);
                  onVisit(station.tab);
                }}
              >
                <span>
                  <Icon size={18} />
                </span>
                <strong>{station.title}</strong>
                <small>{station.hint}</small>
              </button>
            );
          })}
          <div
            className="player-name"
            style={position(
              actorPoint(game, game.room.player).x,
              actorPoint(game, game.room.player).y - 178,
            )}
          >
            <span>YOU</span> Erilian Kantonine
          </div>
          {game.room.customers.map((c) => (
            <button
              key={c.id}
              data-customer-phase={c.phase}
              className={
                "customer-label " + (c.purchased ? "customer-bought" : "")
              }
              style={position(
                actorPoint(game, c).x,
                actorPoint(game, c).y - 155,
              )}
              aria-label={`Speak to ${customerTypes[c.kind].name}`}
              onClick={() => {
                setTalk(talk === c.id ? null : c.id);
                onMove(c.node);
              }}
            >
              {c.purchased
                ? `+${c.saleAmount} crowns`
                : c.purpose !== "cards"
                  ? `${c.purpose === "meal" ? "Hungry" : "Thirsty"} · ${itemName(c.itemId ?? "stew")}`
                  : c.phase === "browsing"
                    ? "Browsing…"
                    : c.phase === "checkout"
                      ? "At the counter"
                      : c.phase === "leaving"
                        ? "Heading home"
                        : customerTypes[c.kind].name}
              <MessageCircle size={10} />
            </button>
          ))}
        </div>
      )}
      {customer && !blocked && (
        <div className="customer-dialogue" role="status">
          <img
            src={assetUrl(
              `/art/animation/${customerTypes[customer.kind].art}-idle.png`,
            )}
            alt=""
          />
          <div>
            <strong>{customerTypes[customer.kind].name}</strong>
            <small>{customerTypes[customer.kind].role}</small>
            <p>
              “
              {customer.purpose === "cards"
                ? customerDialogue(customer, game.day)
                : customer.purchased
                  ? "That was just what a weary traveler needed. Thank you, keeper."
                  : `A serving of ${itemName(customer.itemId ?? "stew")}, if you please.`}
              ”
            </p>
          </div>
          <button aria-label="Close conversation" onClick={() => setTalk(null)}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
