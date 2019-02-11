const serverAssets = {
  gulpConfig: ["gulpfile.js"],
  allTS: [
    "src/server.js",
    "src/config/**/*.js",
    "src/models/*.js",
    "src/modules/*/**/*.js",
    "src/utils/**/*..js"
  ],
  allJS: [
    "dist/server.js",
    "dist/config/**/*.js",
    "dist/models/*.js",
    "dist/modules/*/**/*.js",
    "dist/utils/**/*.js"
  ],
  models: "dist/models/**/*.js",
  routes: [
    "dist/modules/!(core)/routes/**/*.js",
    "dist/modules/core/routes/**/*.js"
  ],
  sockets: "dist/modules/*/sockets/**/*.js",
  configs: ["dist/modules/*/config/*.js"],
  policies: "dist/modules/*/policies/**/*.js",
  validations: "dist/modules/*/validations/**/*.js",
  i18n: "dist/config/assets/i18n/*.js"
};

export default serverAssets;
