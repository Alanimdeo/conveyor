const fs = require("fs");
const backendPackageJson = JSON.parse(fs.readFileSync("./package.json"));

const packageJson = {
  name: "conveyor",
  version: backendPackageJson.version,
  author: "Alanimdeo <alan@imdeo.kr>",
  license: "MIT",
  scripts: {
    start: "supervisor index.js",
    alteration: "node alteration/index.js",
  },
  dependencies: backendPackageJson.dependencies,
};

fs.writeFileSync("./dist/package.json", JSON.stringify(packageJson, null, 2));
