const serverAssets = {
  allTS: [
    "src/server.ts",
    "src/config/**/*.ts",
    "src/models/*.ts",
    "src/modules/*/**/*.ts",
    "src/utils/*.ts"
  ],
  allJS: [
    "src/server.ts",
    "src/config/**/*.ts",
    "src/models/*.ts",
    "src/modules/*/**/*.ts",
    "src/utils/**/*.ts"
  ],
  models: "src/models/**/*.ts",
  routes: [
    "src/modules/!(core)/routes/**/*.ts",
    "src/modules/core/routes/**/*.ts"
  ],
  sockets: "src/modules/*/sockets/**/*.ts",
  typedefs: "src/modules/*/typedefs/**/*.ts",
  resolvers: "src/modules/*/resolvers/**/*.ts",
  configs: ["src/modules/*/config/*.ts"],
  policies: "src/modules/*/policies/**/*.ts",
  validations: "src/modules/*/validations/**/*.ts",
  i18n: "src/config/assets/i18n/*.ts"
};

export default serverAssets;
