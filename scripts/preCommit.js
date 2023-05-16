const fs = require("fs");

const packageJson = require("./package.json");
const backendPackageJson = require("./backend/package.json");
const frontendPackageJson = require("./frontend/package.json");

backendPackageJson.version = packageJson.version;
frontendPackageJson.version = packageJson.version;

fs.writeFileSync("./backend/package.json", JSON.stringify(backendPackageJson, null, 2));
fs.writeFileSync("./frontend/package.json", JSON.stringify(frontendPackageJson, null, 2));
