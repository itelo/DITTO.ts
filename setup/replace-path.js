const fs = require("fs");
const path = require("path");

/**
 * @function replacePath
 * @param {any} code the real code
 * @param {string} filePath the full path of code
 * @param {string} rootPath can be found at .tsconfig.json as baseUrl
 * @param {} targetPaths can be found at .tsconfig.json as paths
 * @returns
 */
function replacePath(code, filePath, rootPath, targetPaths) {
  const tscpaths = Object.keys(targetPaths);

  const lines = code.split("\n");

  return lines
    .map(line => {
      const matches = [];
      const require_matches = line.match(/require\(('|")(.*)('|")\)/g);

      Array.prototype.push.apply(matches, require_matches);

      if (!matches) {
        return line;
      }

      // Go through each require statement
      for (let match of matches) {
        // Find each paths
        for (let tscpath of tscpaths) {
          // Find required module & check if its path matching what is described in the paths config.
          const requiredModules = match.match(new RegExp(tscpath, "g"));

          if (requiredModules && requiredModules.length > 0) {
            for (let requiredModule of requiredModules) {
              // Skip if it resolves to the node_modules folder
              const modulePath = path.resolve("./node_modules/" + tscpath);
              if (fs.existsSync(modulePath)) {
                continue;
              }

              // Get relative path and replace
              const sourcePath = path.dirname(filePath);
              const targetPath = path.dirname(
                path.resolve(rootPath + "/" + targetPaths[tscpath])
              );

              let relativePath = path.relative(sourcePath, targetPath);

              // in windows
              if (process.platform === "win32") {
                relativePath = relativePath.replace(/\\/g, "/");
              }

              line = line.replace(
                new RegExp(tscpath + "/", "g"),
                "./" + relativePath + "/"
              );
            }
          }
        }
      }

      return line;
    })
    .join("\n");
}

module.exports = replacePath;
