import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

// Run only against the separate, freshly seeded portfolio database.
const base = process.env.CAPTURE_BASE_URL ?? "http://localhost:3002";
const executable = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "vertice-capture-"));
const chrome = spawn(executable, ["--headless=new", "--disable-gpu", "--no-first-run", "--remote-debugging-port=9337", `--user-data-dir=${profile}`, "about:blank"], { windowsHide: true, stdio: "ignore" });
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
let sequence = 0;
const pending = new Map();
const exceptions = [];
const output = path.resolve("portfolio/images");
fs.mkdirSync(output, { recursive: true });

async function connect() {
  let pages;
  for (let i = 0; i < 60; i++) {
    try { pages = await (await fetch("http://127.0.0.1:9337/json/list")).json(); break; } catch { await delay(250); }
  }
  socket = new WebSocket(pages.find(page => page.type === "page").webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener("open", resolve, { once: true }));
  socket.addEventListener("message", event => {
    const message = JSON.parse(event.data);
    if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails.text);
    const item = pending.get(message.id);
    if (item) { pending.delete(message.id); clearTimeout(item.timer); if (message.error) item.reject(new Error(message.error.message)); else item.resolve(message.result); }
  });
  await command("Page.enable"); await command("Runtime.enable");
}
function command(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)); }, 45000);
    pending.set(id, { resolve, reject, timer }); socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(fn, ...args) {
  const result = await command("Runtime.evaluate", { expression: `(${fn.toString()})(${args.map(arg => JSON.stringify(arg)).join(",")})`, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  return result.result.value;
}
async function waitFor(fn, ...args) {
  for (let i = 0; i < 120; i++) { if (await evaluate(fn, ...args)) return; await delay(200); }
  throw new Error(`Condition timed out: ${fn.toString().slice(0, 150)}`);
}
async function viewport(width, height, mobile = false) {
  await command("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile });
}
async function navigate(route) {
  await command("Page.navigate", { url: base + route });
  await waitFor(url => location.href === url && document.readyState === "complete", base + route);
  await delay(1000);
  await evaluate(async () => { await document.fonts.ready; });
}
async function screenshot(name) {
  await evaluate(() => Promise.race([Promise.all([...document.images].filter(img => img.getBoundingClientRect().top < innerHeight).map(img => img.decode().catch(() => {}))), new Promise(resolve => setTimeout(resolve, 8000))]));
  const image = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  fs.writeFileSync(path.join(output, name), Buffer.from(image.data, "base64"));
  console.log(`Captured ${name}`);
}
async function click(selector) { await evaluate(selector => { const element = document.querySelector(selector); element.focus(); element.click(); }, selector); }
async function sendChat(text) {
  await waitFor(() => !document.querySelector('[aria-label="Maya is typing"]'));
  await evaluate(text => {
    const input = document.querySelector("#chat-input");
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, text);
  await delay(100);
  await click('button[aria-label="Send message"]');
  await delay(200);
  await waitFor(() => !document.querySelector('[aria-label="Maya is typing"]'));
}

try {
  await connect();
  if (!process.env.CAPTURE_MOBILE_ONLY) {
  await viewport(1600, 1100);
  await navigate("/"); await screenshot("02-homepage.png");
  await navigate("/properties?purpose=buy"); await screenshot("03-property-search.png");
  const inventory = await (await fetch(base + "/api/properties?purpose=buy&type=apartment")).json();
  const home = inventory.properties.find(home => home.bedrooms >= 2);
  await navigate(`/properties/${home.slug}`); await screenshot("04-property-detail.png");
  await click('[aria-label="Open image gallery"]');
  await waitFor(() => document.activeElement?.getAttribute("aria-label") === "Close gallery");
  await command("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  assert.equal(await evaluate(() => !!document.querySelector('[aria-label="Close gallery"]')), false);
  assert.equal(await evaluate(() => document.activeElement?.getAttribute("aria-label")), "Open image gallery");
  console.log("PASS: gallery keyboard focus and Escape");

  await click('[aria-label="Chat with Maya"]');
  await waitFor(() => !document.querySelector('[aria-label="Maya is typing"]') && !!document.querySelector('#chat-input'));
  await delay(1000);
  for (const answer of ["buy", "apartment", home.neighborhood, `up to ${home.price + 100000}`, String(home.bedrooms), "immediately", "cash", "Alex Morgan", "alex.morgan@example.com", "+55 11 98888-7777", "yes"]) await sendChat(answer);
  assert.equal(await evaluate(() => JSON.parse(localStorage.getItem("vertice:chat-state")).completed), true);
  await screenshot("05-ai-concierge.png");
  await command("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  assert.equal(await evaluate(() => document.querySelector('[aria-label="Maya virtual assistant"]').inert), true);
  console.log("PASS: full chat journey in browser and closed panel is inert");

  await navigate("/dashboard?lead=lead-daniel"); await screenshot("06-agent-dashboard.png");
  await navigate(`/schedule/${home.slug}`);
  await waitFor(() => !!document.querySelector('input[name="visit-time"]'));
  await click('input[name="visit-time"]:not(:disabled)');
  await screenshot("07-booking.png");
  await navigate("/how-it-works");
  await evaluate(() => window.scrollTo({ top: document.querySelector("#automation-title").getBoundingClientRect().top + scrollY - 145, behavior: "instant" }));
  await delay(500); await screenshot("08-automation.png");

  for (const width of [360, 390, 768, 1024, 1440]) {
    await viewport(width, 900, width < 768);
    for (const route of ["/", "/properties", "/dashboard?lead=lead-daniel"]) {
      await navigate(route);
      assert.ok(await evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Horizontal overflow: ${route} at ${width}`);
    }
  }
  console.log("PASS: responsive layouts at 360, 390, 768, 1024 and 1440 pixels");
  }
  await viewport(390, 844, true); await navigate("/");
  await click('[aria-label="Open menu"]');
  await click('#mobile-navigation a[href="/properties"]');
  await waitFor(() => location.pathname === "/properties" && !document.querySelector("#mobile-navigation"));
  console.log("PASS: mobile navigation");
  await waitFor(() => !!document.querySelector("#filter-q") && !!document.querySelector("article"));
  await evaluate(() => window.scrollTo({ top: document.querySelector("#filter-q").getBoundingClientRect().top + scrollY - 96, behavior: "instant" }));
  await delay(500);
  await screenshot("mobile-catalog.png");
  await navigate("/"); await screenshot("mobile-home.png");
  assert.deepEqual(exceptions, [], "Browser runtime exceptions");
  console.log("Browser checks and portfolio captures completed.");
} finally {
  try { await command("Browser.close"); } catch {}
  socket?.close(); chrome.unref();
  await delay(1000);
  if (path.dirname(profile) === fs.realpathSync(os.tmpdir())) {
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 300 }); } catch { console.warn("Chrome profile cleanup deferred:", profile); }
  }
}
