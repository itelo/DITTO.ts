import mongoose from "mongoose";
import chalk from "chalk";

export default function createSeed(
  modelName: string,
  selector: string,
  populateFunctions?: Array<Function>
) {
  return (doc: any, options: any) => {
    const _Model = mongoose.model(modelName);

    return new Promise((resolve, reject) => {
      skipDocument()
        .then(async function(skip: boolean) {
          if (populateFunctions && populateFunctions.length > 0) {
            for (const populateFunction of populateFunctions) {
              try {
                const newDoc = await populateFunction(skip, doc);
                // if return a object, we should update the doc;
                if (newDoc) {
                  doc = { ...doc, ...newDoc };
                }
              } catch (err) {
                return reject(err);
              }
            }
            return skip;
          } else {
            return skip;
          }
        })
        .then(add)
        .then((response: { message: string }) => {
          return resolve(response);
        })
        .catch((err: any) => {
          return reject(err);
        });
    });

    function skipDocument() {
      return new Promise(function(resolve, reject) {
        const { [selector]: value } = doc;
        _Model.findOne({ selector: value }).exec(function(err, existing) {
          if (err) {
            return reject(err);
          }

          if (!existing) {
            return resolve(false);
          }

          if (existing && !options.overwrite) {
            return resolve(true);
          }

          existing.remove(function(err) {
            if (err) {
              return reject(err);
            }

            return resolve(false);
          });
        });
      });
    }

    function add(skip: boolean) {
      return new Promise(async function(resolve, reject) {
        if (skip) {
          return resolve({
            message: chalk.yellow(
              `Database Seeding: ${modelName}\t\t" + doc.name + " skipped`
            )
          });
        }

        try {
          const _model = new _Model(doc);
          await _model.save();

          const { [selector]: value } = doc;
          return resolve({
            message: `Database Seeding: ${modelName}\t ${value} added`
          });
        } catch (err) {
          return reject(err);
        }
      });
    }
  };
}
