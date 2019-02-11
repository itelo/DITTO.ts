const serverAssets = {
  gulpConfig: ["gulpfile.js"],
  allTS: [
    "src/server.ts",
    "src/config/**/*.ts",
    "src/models/*.ts",
    "src/modules/*/**/*.ts",
    "src/utils/**/*..ts"
  ],
  allJS: [
    "dist/server.js",
    "dist/config/**/*.js",
    "dist/models/*.js",
    "dist/modules/*/**/*.js",
    "dist/utils/**/*.js"
  ],
  models: "src/models/**/*.ts",
  routes: [
    "src/modules/!(core)/routes/**/*.ts",
    "src/modules/core/routes/**/*.ts"
  ],
  sockets: "src/modules/*/sockets/**/*.ts",
  configs: ["src/modules/*/config/*.ts"],
  policies: "src/modules/*/policies/**/*.ts",
  validations: "src/modules/*/validations/**/*.ts",
  i18n: "src/config/assets/i18n/*.ts"
};

export default serverAssets;
