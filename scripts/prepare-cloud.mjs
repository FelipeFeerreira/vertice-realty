import fs from "node:fs";
import { spawnSync } from "node:child_process";

// Keep one canonical data model. Cloud builds use PostgreSQL; local builds
// continue to generate from the original SQLite schema.
const source = fs.readFileSync("prisma/schema.prisma", "utf8");
const target = "prisma/schema.cloud.prisma";
fs.writeFileSync(target, source.replace('provider = "sqlite"', 'provider = "postgresql"'));
const result = spawnSync(process.execPath, ["node_modules/prisma/build/index.js", "generate", "--schema", target], { stdio: "inherit" });
if (result.status !== 0) process.exit(result.status ?? 1);
