const through = require("through2");

const replacePath = require("./replace-path.js");

module.exports = function(importOptions) {
  return function(file) {
    return through(function(buffer, enc, cb) {
      let code = buffer.toString("utf8");

      code = replacePath(
        code,
        file,
        importOptions.baseUrl,
        importOptions.paths
      );
      buffer = new Buffer(code);
      this.push(buffer);
      cb();
    });
  };
};
