const gulp = require("gulp");
const del = require("del");
const ts = require("gulp-typescript");
const tsimport = require("./setup/tsimport");
const chalk = require("chalk");
const runSequence = require("run-sequence");
const _ = require("lodash");
const gulpLoadPlugins = require("gulp-load-plugins");
const semver = require("semver");
const typedoc = require("gulp-typedoc");
const plugins = gulpLoadPlugins();
const open = require("gulp-open");
const exec = require("child_process").exec;
const sourcemaps = require("gulp-sourcemaps");
const tsProject = ts.createProject("tsconfig.json", {
  typescript: require("typescript")
});
const spawn = require("child_process").spawn;

gulp.task("typedoc:default", function() {
  return gulp.src(["src/**/*.ts"]).pipe(
    typedoc({
      module: tsProject.config.compilerOptions.module,
      target: tsProject.config.compilerOptions.target,
      out: "docs/",
      json: "docs/doc.json",
      name: "BACKEND.TS",
      ignoreCompilerErrors: true
    })
  );
});

gulp.task("typedoc:markdown", function(cb) {
  exec(
    `npx typedoc --theme markdown \
    --module ${tsProject.config.compilerOptions.module} \
    --target ${tsProject.config.compilerOptions.target} \
    --out docs \
    --json docs/doc.json \
    --name BACKEND.TS \
    --ignoreCompilerErrors \
    `,
    function(err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
      cb(err);
    }
  );
});

gulp.task("open:docs", function() {
  return gulp.src("./docs/index.html").pipe(open());
});

gulp.task("open:docs-md", function() {
  return gulp.src("./docs/README.md").pipe(open());
});

// Set NODE_ENV to 'test'
gulp.task("env:test", function() {
  process.env.NODE_ENV = "test";
});

// Set NODE_ENV to 'development'
gulp.task("env:dev", function() {
  process.env.NODE_ENV = "development";
});

// Set NODE_ENV to 'production'
gulp.task("env:prod", function() {
  process.env.NODE_ENV = "production";
});

// Watch Files For Changes
gulp.task("watch", function() {
  const defaultAssets = require("./dist/config/assets/default").default;

  // Add watch rules
  gulp.watch(defaultAssets.allTS).on("change", event => {
    const path = event.path.replace(__dirname, "");
    console.log(chalk.yellow(`reload by changed in ${path}`));
    console.log();
    runSequence("compile:source");
  });
});

// Nodemon task
gulp.task("nodemon", function() {
  const defaultAssets = require("./dist/config/assets/default").default;

  // Node.js v7 and newer use different debug argument
  var debugArgument = semver.satisfies(process.versions.node, ">=7.0.0")
    ? "--inspect"
    : "--debug";

  return plugins.nodemon({
    script: "./dist/server.js",
    nodeArgs: [debugArgument],
    ext: "js",
    verbose: false,
    watch: _.union(defaultAssets.allJS),
    delay: 500
  });
});

gulp.task("compile:source", function(done) {
  console.log(chalk.yellow("[Typescript]"));
  console.log(chalk.magenta("Transpiling Source"));

  gulp
    .src("src/**/*")

    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(sourcemaps.write("."))
    .pipe(tsimport(tsProject.config.compilerOptions))
    .on("error", function(error, callback) {
      console.log(chalk.red("[Typescript] Server Error:"), error.stack);
      this.emit("end");
    })
    .pipe(gulp.dest("dist/"))
    .on("end", () => {
      console.log(chalk.green(`Transpiling Complete`));
      console.log();
      done();
    });
});

gulp.task("clean:dist", function(done) {
  del.sync(["dist"]);
  done();
});

gulp.task("clean:docs", function(done) {
  del.sync(["docs"]);
  done();
});

// Seed Mongo database based on configuration
gulp.task("mongo-seed", function(done) {
  const db = require("./dist/config/libs/mongoose");
  const seed = require("./dist/config/libs/mongo-seed");
  const configStack = require("./dist/config/index").default;

  console.log(db.connect);
  console.log(seed);
  console.log(configStack);

  // Open mongoose database connection
  db.connect(
    configStack.config,
    function() {
      db.loadModels(configStack.config);
      console.log("omg");
      seed
        .start({
          options: {
            logResults: true
          }
        })
        .then(function() {
          console.log("omg --");
          // Disconnect and finish task
          db.disconnect(done);
        })
        .catch(function(err) {
          db.disconnect(function(disconnectError) {
            if (disconnectError) {
              console.log(
                "Error disconnecting from the database, but was preceded by a Mongo Seed error."
              );
            }
            // Finish task with error
            done(err);
          });
        });
    }
  );
});

gulp.task("jest:default", done => {
  const jest = spawn("yarn", ["jest", "--bail"], {
    shell: true,
    stdio: "inherit"
  });

  jest.on("exit", function(code) {
    console.log("child process exited with code " + code.toString());
    if (code === 0) {
      done();
    }
    process.exit(code);
  });
});

gulp.task("jest:coverage", done => {
  const jest = spawn("yarn", ["jest", "--coverage", "--bail"], {
    shell: true,
    stdio: "inherit"
  });

  jest.on("exit", function(code) {
    console.log("child process exited with code " + code.toString());
    if (code === 1) {
      done();
    }
  });
});

// Drops the MongoDB database
gulp.task("dropdb", function(done) {
  // Use mongoose configuration
  const mongooseService = require("./dist/config/libs/mongoose");
  const configStack = require("./dist/config/index").default;

  mongooseService.connect(
    configStack.config,
    function(db, _err) {
      if (_err) {
        console.log(_err);

        done(_err);
      } else {
        db.dropDatabase(function(err) {
          if (err) {
            console.error(err);
            done(err);
          } else {
            console.log(
              chalk.green("Successfully dropped db: ", db.databaseName)
            );

            mongooseService.disconnect(function(disconnectError) {
              if (disconnectError) {
                console.log(
                  chalk.red(
                    "Error disconnecting from the database, but was preceded by a Mongo Seed error."
                  )
                );

                // Finish task with error
                done(disconnectError);
              }
              done();
            });
          }
        });
      }
    }
  );
});

// Run the project in development mode with node debugger enabled
gulp.task("default", function(done) {
  runSequence(
    "env:dev",
    "clean:dist",
    "compile:source",
    "nodemon",
    "watch",
    done
  );
});

// Run the project in development mode with node debugger enabled
gulp.task("build", function(done) {
  runSequence("env:dev", "clean:dist", "compile:source", done);
});

// Run the project in development mode with node debugger enabled
gulp.task("build:prod", function(done) {
  runSequence("env:prod", "clean:dist", "compile:source", done);
});

// Run the project in production mode with node
// just run node dist/server.js
// since is heavily discouraged to use gulp to run the server
gulp.task("prod", function(done) {
  runSequence("env:prod", "clean:dist", "compile:source", done);
});

gulp.task("docs", function(done) {
  runSequence("clean:docs", "typedoc:default", "open:docs", done);
});

gulp.task("docs --no-browser", function(done) {
  runSequence("clean:docs", "typedoc:default", done);
});

gulp.task("docs:markdown", function(done) {
  runSequence("clean:docs", "typedoc:markdown", "open:docs-md", done);
});

gulp.task("test", function(done) {
  runSequence(
    "env:test",
    "clean:dist",
    "compile:source",
    "mongo-seed",
    "jest:default",
    "dropdb",
    done
  );
});

gulp.task("test-coverage", function(done) {
  runSequence(
    "env:test",
    "clean:dist",
    "compile:source",
    "mongo-seed",
    "jest:coverage",
    "dropdb",
    done
  );
});
