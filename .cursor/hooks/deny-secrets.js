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

function basename(p) {
  const n = String(p || "").replace(/\\/g, "/");
  const i = n.lastIndexOf("/");
  return i >= 0 ? n.slice(i + 1) : n;
}

(async () => {
  let input = {};
  try {
    input = await readStdin();
  } catch {
    send({ permission: "allow" });
    return;
  }

  const base = basename(input.file_path);
  const isExample = /^\.env\.example$/i.test(base);
  const isEnv = /^\.env(\.|$)/i.test(base);
  const isCred =
    /^credentials\.json$/i.test(base) ||
    /service[-_]?account.*\.json$/i.test(base);

  if ((isEnv && !isExample) || isCred) {
    send({
      permission: "deny",
      user_message: "Refusing to read a secrets file into the model context.",
    });
    return;
  }

  send({ permission: "allow" });
})();
