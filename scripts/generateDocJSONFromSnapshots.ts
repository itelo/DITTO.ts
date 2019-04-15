import { getGlobbedPaths } from "../src/config/index";
import fs from "fs";
// Setting Globbed i18n files
const snapshotsGlobFilesPath = "test/modules/**/__snapshots__/**/*.snap";
// ;
const snapshotsFilesPath = getGlobbedPaths(snapshotsGlobFilesPath);

const docs = snapshotsFilesPath.map((filePath: string) => {
  const file = fs.readFileSync(filePath);
  return getDocOfSnapShot(file.toString());
});

fs.writeFileSync("myjsonfile.json", JSON.stringify(docs, undefined, 2), "utf8");

function getInputOutput(file: string, startPoint: number) {
  const restOfFile = file.slice(startPoint, file.length);

  const exportsIndexOf = restOfFile.indexOf("exports");

  if (exportsIndexOf >= 0) {
    const stringSinceExports = restOfFile.slice(exportsIndexOf, file.length);
    const firstIndexOfHeader = stringSinceExports.indexOf("`") + 1;
    const stringSinceBeginHeader = stringSinceExports.slice(
      firstIndexOfHeader,
      file.length
    );

    const lastIndexOfHeader = stringSinceBeginHeader.indexOf("`") + 1;

    const header = stringSinceBeginHeader.slice(0, lastIndexOfHeader - 2);

    const routeIndexOf = header.indexOf("route:");
    const routeEndIndexOf = header.indexOf(" ");

    console.log(header);

    const [_, path] = header.slice(routeIndexOf, routeEndIndexOf).split(":");
    const title = header.slice(routeEndIndexOf, header.length).trim();

    const stringSinceEndHeader = stringSinceBeginHeader.slice(
      lastIndexOfHeader,
      file.length
    );
    const firstIndexOfData = stringSinceEndHeader.indexOf("`") + 1;
    const stringSinceBeginData = stringSinceEndHeader.slice(
      firstIndexOfData,
      file.length
    );
    const lastIndexOfData = stringSinceBeginData.indexOf("`") + 1;
    const dataAsString = stringSinceBeginData
      .slice(0 + 2, lastIndexOfData - 3)
      .replace(/\\/g, "");
    const data = JSON.parse(dataAsString);

    return {
      content: {
        path,
        title,
        data
      },
      nextStartPoint: lastIndexOfData
    };
  }
  return {
    nextStartPoint: -1
  };
}

function getDocOfSnapShot(file: string) {
  let nextStartPoint = 0;
  const doc = [];
  while (true) {
    const info = getInputOutput(file, nextStartPoint);

    doc.push(info.content);

    if (info.nextStartPoint === -1) {
      break;
    }

    nextStartPoint = nextStartPoint + info.nextStartPoint;
  }

  return doc;
}
