const through = require("through2");

const replacePath = require("./replace-path.js");

module.exports = function(importOptions) {
  return through.obj(function(file, enc, cb) {
    let code = file.contents.toString("utf8");

    code = replacePath(
      code,
      file.history.toString(),
      importOptions.baseUrl,
      importOptions.paths
    );

    file.contents = new Buffer(code);

    this.push(file);
    cb();
  });
};
