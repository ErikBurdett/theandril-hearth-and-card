/** Commissions card paintings from the Codex CLI's built-in image generator,
 * one call per card, and retains each original with its actual generation
 * record. It never approves anything: run `card-art.ts prepare`, inspect the
 * contact sheets and approve exact hashes afterward.
 *
 *   node --import tsx scripts/codex-card-art.ts generate SET_ID [CONCURRENCY] [ID,ID]
 *   node --import tsx scripts/codex-card-art.ts adopt CARD_ID THREAD_ID
 *
 * Uses the signed-in Codex CLI (ChatGPT subscription quota), not an API key.
 * The generator's actual `revisedPrompt` must equal the brief byte for byte. */
import { spawn } from "node:child_process";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { decodePng, sha256 } from "../packages/art-pipeline/src/index";

const [command, first, second, third] = process.argv.slice(2);
const codexHome = process.env.CODEX_HOME ?? `${homedir()}/.codex`;
const briefs: { id: string; setId: string; prompt: string }[] = JSON.parse(
  await readFile("assets/art/card-briefs/catalog.json", "utf8"),
);
const exists = (path: string) =>
  readFile(path).then(
    () => true,
    () => false,
  );

function runCodex(prompt: string): Promise<string> {
  const instruction = `Use your built-in image generation tool exactly once to create a single portrait image (2:3, 1024x1536) from the prompt below, passing the prompt text verbatim. Do not edit files, run shell commands, or generate more than one image. When the image exists, reply with only the word DONE.\n\n${prompt}\n`;
  return new Promise((resolve, reject) => {
    const child = spawn(
      "codex",
      [
        "exec",
        "--skip-git-repo-check",
        "-s",
        "read-only",
        "-c",
        'model_reasoning_effort="low"',
        "--json",
        "-",
      ],
      { cwd: tmpdir(), stdio: ["pipe", "pipe", "ignore"] },
    );
    let out = "";
    child.stdout.on("data", (chunk) => (out += chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      const thread = out
        .split("\n")
        .map((line) => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        })
        .find((event) => event?.type === "thread.started")?.thread_id;
      if (code === 0 && thread) resolve(thread);
      else reject(Error(`codex exec exited ${code} without a thread`));
    });
    child.stdin.end(instruction);
  });
}

/** Reads the actual image-generation events from the Codex session log. */
async function generationsIn(thread: string) {
  const root = `${codexHome}/sessions`;
  const file = (await readdir(root, { recursive: true })).find((p) =>
    p.endsWith(`${thread}.jsonl`),
  );
  if (!file) throw Error(`No Codex session log for ${thread}`);
  const events = (await readFile(`${root}/${file}`, "utf8"))
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter(
      (e) =>
        e.type === "event_msg" &&
        e.payload?.type === "item_completed" &&
        e.payload.item?.kind === "image_gen.generation",
    )
    .map((e) => e.payload.item);
  return {
    session: `${root}/${file}`,
    generations: events.map((item) => ({
      id: item.id as string,
      status: item.status as string,
      savedPath: item.savedPath as string,
      revisedPrompt: item.revisedPrompt as string,
      transparentBackground: item.transparentBackground as boolean,
    })),
  };
}

async function retain(cardId: string, thread: string) {
  const brief = briefs.find((b) => b.id === cardId);
  if (!brief) throw Error(`No brief for ${cardId}`);
  const { generations } = await generationsIn(thread);
  const done = generations.filter((g) => g.status === "completed");
  if (done.length !== 1)
    throw Error(`${cardId}: expected one generation, found ${done.length}`);
  const [g] = done;
  if (g.revisedPrompt !== brief.prompt)
    throw Error(`${cardId}: the generator did not receive the exact brief`);
  const bytes = await readFile(g.savedPath),
    image = decodePng(bytes);
  if (image.width !== 1024 || image.height !== 1536)
    throw Error(`${cardId}: unexpected size ${image.width}×${image.height}`);
  let minAlpha = 255;
  for (let i = 3; i < image.data.length; i += 4)
    minAlpha = Math.min(minAlpha, image.data[i]);
  const source = `assets/art/source/cards/${cardId}.png`;
  await mkdir("assets/art/source/cards", { recursive: true });
  await copyFile(g.savedPath, source);
  await writeFile(
    `assets/art/source/cards/${cardId}.generation.json`,
    JSON.stringify(
      {
        cardId,
        provider: "codex-imagegen",
        model: "not-exposed-by-tool",
        prompt: brief.prompt,
        revisedPromptMatchesBrief: true,
        originalOutput: g.savedPath.split("/").pop(),
        codexThread: thread,
        sourceHash: sha256(bytes),
        outputAlpha:
          minAlpha < 255
            ? `The tool returned RGBA with transparentBackground=${g.transparentBackground} and minimum alpha ${minAlpha}; prepare discards this content-independent alpha for full-bleed art.`
            : "opaque",
        source,
        review:
          "Candidate only; requires processed-image inspection and exact-hash approval.",
      },
      null,
      2,
    ) + "\n",
  );
  return { cardId, thread, sourceHash: sha256(bytes) };
}

if (command === "adopt")
  console.log(JSON.stringify(await retain(first, second)));

if (command === "generate") {
  const only = third ? new Set(third.split(",")) : null;
  const queue: typeof briefs = [];
  for (const b of briefs.filter((b) => b.setId === first))
    if (
      (!only || only.has(b.id)) &&
      !(await exists(`assets/art/source/cards/${b.id}.png`))
    )
      queue.push(b);
  const concurrency = Number(second ?? 4);
  console.log(JSON.stringify({ queued: queue.length, concurrency }));
  let next = 0;
  const failures: string[] = [];
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < queue.length) {
        const b = queue[next++];
        for (let attempt = 1; ; attempt++) {
          try {
            const thread = await runCodex(b.prompt);
            console.log(JSON.stringify(await retain(b.id, thread)));
            break;
          } catch (error) {
            console.log(
              JSON.stringify({ cardId: b.id, attempt, error: String(error) }),
            );
            if (attempt >= 3) {
              failures.push(b.id);
              break;
            }
          }
        }
      }
    }),
  );
  console.log(
    JSON.stringify({ done: queue.length - failures.length, failures }),
  );
  if (failures.length) process.exitCode = 1;
}
