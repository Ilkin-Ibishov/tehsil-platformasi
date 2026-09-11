#!/usr/bin/env node
/**
 * agent-registry.mjs
 * 
 * Declarative subagent manifest parser and registry for Antigravity & Cursor.
 * Loads and validates agent definitions from .agents/agents/*.md.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const agentsDir = path.join(repoRoot, ".agents", "agents");

/**
 * Parses frontmatter and body from a markdown file.
 * @param {string} content - Raw markdown text
 * @returns {{ data: Record<string, any>, content: string }}
 */
export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, content: content.trim() };
  }

  const rawYaml = match[1];
  const body = match[2].trim();
  const data = {};

  for (const line of rawYaml.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let val = trimmed.slice(colonIdx + 1).trim();

    // Parse booleans and numbers
    if (val === "true") val = true;
    else if (val === "false") val = false;
    else if (/^\d+$/.test(val)) val = parseInt(val, 10);
    else if (/^["'].*["']$/.test(val)) val = val.slice(1, -1);

    data[key] = val;
  }

  return { data, content: body };
}

/**
 * Loads and validates all agent specifications from .agents/agents/*.md.
 * @returns {Array<{ name: string, role: string, description: string, system_prompt: string, enable_write_tools: boolean, enable_mcp_tools: boolean, enable_subagent_tools: boolean, filePath: string }>}
 */
export function loadAgents() {
  if (!fs.existsSync(agentsDir)) {
    return [];
  }

  const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith(".md"));
  const agents = [];

  for (const file of files) {
    const filePath = path.join(agentsDir, file);
    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = parseFrontmatter(raw);

    if (!data.name || typeof data.name !== "string") {
      throw new Error(`Agent manifest in ${file} missing 'name' in frontmatter.`);
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(data.name)) {
      throw new Error(`Agent name '${data.name}' in ${file} contains invalid characters.`);
    }

    if (!data.description || typeof data.description !== "string") {
      throw new Error(`Agent '${data.name}' in ${file} missing 'description'.`);
    }

    if (!content || content.length < 50) {
      throw new Error(`Agent '${data.name}' in ${file} has an empty or insufficient system prompt.`);
    }

    agents.push({
      name: data.name,
      role: data.role || data.name,
      description: data.description,
      system_prompt: content,
      enable_write_tools: Boolean(data.enable_write_tools),
      enable_mcp_tools: Boolean(data.enable_mcp_tools),
      enable_subagent_tools: Boolean(data.enable_subagent_tools),
      filePath
    });
  }

  return agents;
}

/**
 * Returns a specific agent by name.
 * @param {string} name - Agent name
 * @returns {object|null}
 */
export function getAgent(name) {
  const all = loadAgents();
  return all.find((a) => a.name === name) || null;
}

/**
 * Built-in self-test suite.
 */
export function runSelfTest() {
  console.log("🧪 Running Agent Registry Self-Test Suite...");

  // 1. Frontmatter parser test
  const sample = `---
name: test_agent
role: Testing Role
enable_write_tools: true
enable_mcp_tools: false
---

# System Prompt Body
This is a test prompt that satisfies minimum length requirements.`;

  const parsed = parseFrontmatter(sample);
  if (parsed.data.name !== "test_agent") throw new Error("Parser failed: name mismatch");
  if (parsed.data.enable_write_tools !== true) throw new Error("Parser failed: boolean parsing");
  if (parsed.data.enable_mcp_tools !== false) throw new Error("Parser failed: boolean parsing");
  if (!parsed.content.includes("System Prompt Body")) throw new Error("Parser failed: body missing");

  // 2. Real directory loading test
  const agents = loadAgents();
  if (agents.length < 5) {
    throw new Error(`Expected at least 5 registered agents, got ${agents.length}`);
  }

  const expectedNames = ["reviewer", "student_tester", "ba_analyst", "backend_dev", "qa_tester"];
  for (const name of expectedNames) {
    const found = agents.find((a) => a.name === name);
    if (!found) {
      throw new Error(`Required agent '${name}' not found in registry.`);
    }
    if (!found.role || found.role.length < 3) {
      throw new Error(`Agent '${name}' has invalid role.`);
    }
    if (!found.system_prompt || found.system_prompt.length < 50) {
      throw new Error(`Agent '${name}' system prompt is too short.`);
    }
  }

  console.log(`✅ All ${agents.length} agent declarations validated successfully!\n`);
  return true;
}

if (process.argv.includes("--selftest")) {
  try {
    runSelfTest();
    process.exit(0);
  } catch (err) {
    console.error("❌ Agent registry selftest error:", err.message);
    process.exit(1);
  }
}

if (process.argv.includes("--list")) {
  const agents = loadAgents();
  console.log(`\n📋 Registered Declarative Subagents (${agents.length}):\n`);
  for (const a of agents) {
    console.log(`• ${a.name} [${a.role}]`);
    console.log(`  Description: ${a.description}`);
    console.log(`  Tools: write=${a.enable_write_tools}, mcp=${a.enable_mcp_tools}, subagent=${a.enable_subagent_tools}`);
    console.log(`  File: ${path.relative(repoRoot, a.filePath)}\n`);
  }
}
