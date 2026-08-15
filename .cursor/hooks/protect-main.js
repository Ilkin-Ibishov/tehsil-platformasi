"use strict";

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.on("data", (c) => chunks.push(c));
    process.stdin.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
  });
}

function send(obj) {
  process.stdout.write(JSON.stringify(obj));
}

(async () => {
  let input = {};
  try {
    input = await readStdin();
  } catch {
    send({ permission: "allow" });
    return;
  }

  const command = String(input.command || "");
  const forcePush =
    /\bgit\b[\s\S]*\bpush\b[\s\S]*(--force-with-lease|--force|-f\b)/.test(
      command
    );
  const mentionsMain = /(^|[\s:])main(\s|$|:)/.test(command);

  if (forcePush && mentionsMain) {
    send({
      permission: "deny",
      user_message: "Force-push to main is blocked by the project hook.",
      agent_message:
        "Do not force-push main. Use a normal push, or ask the user to run a destructive git command themselves.",
    });
    return;
  }

  if (forcePush) {
    send({
      permission: "ask",
      user_message: "Force-push requires confirmation.",
      agent_message: "Force-push on a non-main branch needs explicit user approval.",
    });
    return;
  }

  if (/\bgit\b[\s\S]*\breset\b[\s\S]*--hard\b/.test(command)) {
    send({
      permission: "ask",
      user_message: "git reset --hard is destructive. Confirm before running.",
      agent_message: "Destructive git reset requires user confirmation.",
    });
    return;
  }

  send({ permission: "allow" });
})();
