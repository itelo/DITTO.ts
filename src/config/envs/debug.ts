import defaultEnvConfig from "@config/envs/default";
import developmentEnvConfig from "@config/envs/development";
import path from "path";

export default {
  outDir: "src",
  extension: "ts",
  ...developmentEnvConfig
};
