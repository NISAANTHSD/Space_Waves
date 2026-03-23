const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "vite-chunks");
const destDir = path.join(
  __dirname,
  "..",
  "node_modules",
  "vite",
  "dist",
  "node",
  "chunks"
);

if (!fs.existsSync(srcDir)) {
  process.exit(0);
}

if (!fs.existsSync(path.join(__dirname, "..", "node_modules", "vite"))) {
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });

const files = fs.readdirSync(srcDir).filter((name) => name.endsWith(".js"));
for (const file of files) {
  const src = path.join(srcDir, file);
  const dest = path.join(destDir, file);
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
  }
}
