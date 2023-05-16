const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const packageJson = require(path.join(__dirname, "../package.json"));
const backendPackageJson = require(path.join(__dirname, "../backend/package.json"));
const frontendPackageJson = require(path.join(__dirname, "../frontend/package.json"));

backendPackageJson.version = packageJson.version;
frontendPackageJson.version = packageJson.version;

fs.writeFileSync(path.join(__dirname, "../backend/package.json"), JSON.stringify(backendPackageJson, null, 2));
fs.writeFileSync(path.join(__dirname, "../frontend/package.json"), JSON.stringify(frontendPackageJson, null, 2));

try {
  execSync("git add ./**/package.json", { cwd: path.join(__dirname, "..") });
} catch (err) {
  console.error(err);
}
