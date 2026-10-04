import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const executable = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
for (const [source, target] of [["cover.html", "01-cover.png"], ["mobile.html", "09-mobile.png"]]) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "vertice-layout-"));
  const destination = path.resolve("portfolio/images", target);
  const result = spawnSync(executable, ["--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars", `--user-data-dir=${profile}`, "--window-size=1600,1200", "--virtual-time-budget=2000", `--screenshot=${destination}`, pathToFileURL(path.resolve("portfolio", source)).href], { windowsHide: true, timeout: 30000, stdio: "pipe" });
  if (result.error || result.status !== 0 || !fs.existsSync(destination)) throw result.error ?? new Error(`Unable to render ${source}`);
  console.log(`Rendered ${target}`);
  if (path.dirname(profile) === fs.realpathSync(os.tmpdir())) fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
}
