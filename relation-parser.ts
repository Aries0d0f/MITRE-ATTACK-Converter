import * as fs from "fs";
import * as _ from "lodash";

const read$ = fs.createReadStream("out/attack--relationship.json");
read$.setEncoding("utf8");

interface RAWAttAckData {
  id: string;
  type: string;
  spec_version: string;
  objects: any[];
}

let _data: any = "";

read$.on("data", chunk => {
  _data += chunk;
});

read$.on("end", () => {
  processor();
});

const processor = () => {
  const data: RAWAttAckData = _.cloneDeep(JSON.parse(_data));

  Object.entries(_.groupBy(data, "relationship_type")).forEach(data => {
    const write$Classify = fs.createWriteStream(`out/attack--relationship-${data[0]}.json`);
    write$Classify.write(JSON.stringify(data[1], undefined, 2), "utf8");
    write$Classify.end();
  })
}
