const fs = require("fs");
const path = require("path");
const backendPackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../backend/package.json")));

const packageJson = {
  name: "conveyor",
  version: backendPackageJson.version,
  author: "Alanimdeo <alan@imdeo.kr>",
  license: "MIT",
  scripts: {
    start: "nodemon index.js",
    alteration: "node alteration/index.js",
  },
  dependencies: backendPackageJson.dependencies,
};
packageJson.dependencies["@conveyor/types"] = "file:./types";

fs.writeFileSync(path.join(__dirname, "../dist/package.json"), JSON.stringify(packageJson, null, 2));
fs.cpSync(path.join(__dirname, "../types/dist"), path.join(__dirname, "../dist/types/dist"), { recursive: true });
fs.copyFileSync(path.join(__dirname, "../types/package.json"), path.join(__dirname, "../dist/types/package.json"));
