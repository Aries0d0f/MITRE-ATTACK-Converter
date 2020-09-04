import * as fs from "fs";
import * as _ from "lodash";

const read$ = fs.createReadStream("mitre/enterprise-attack/enterprise-attack.json");
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
  const oldData = JSON.parse(_data);
  const data: RAWAttAckData = _.cloneDeep(oldData);

  data.objects = data.objects.filter(rawData => (!rawData.revoked && !rawData.x_mitre_deprecated));
  const write$RAW = fs.createWriteStream("out/attack.json");
  write$RAW.write(JSON.stringify(data, undefined, 2), "utf8");
  write$RAW.end();

  console.log(`[Data]: ${oldData.objects.length} -> ${data.objects.length}`);


  const revoked = oldData.objects.filter(rawData => (rawData.revoked || rawData.x_mitre_deprecated));
  console.log(`[Revoked]: ${revoked.length}`);
  revoked.map(data => console.log(`- ${data.external_references[0].external_id}`));

  console.log(`[Type]:`);

  const classified = _.groupBy(data.objects, "type");
  const oldClassified = _.groupBy(oldData.objects, "type");
  const write$Classify = fs.createWriteStream("out/attack-classified.json");
  write$Classify.write(JSON.stringify(classified, undefined, 2), "utf8");
  write$Classify.end();
  const typeList = Object.keys(classified);
  typeList.map(type => console.log(`# ${type} :: ${oldClassified[type].length} -> ${classified[type].length}`));

  typeList.map(type => {
    const write$Classify = fs.createWriteStream(`out/attack--${type}.json`);
    const dataToExport = classified[type].map(data => {
      if (data.external_references) {
        return {
          ...data,
          [`${type}-id`]: data.external_references[0].external_id
        };
      } else {
        return data;
      }
    });
    write$Classify.write(JSON.stringify(dataToExport.map(data => _(data).toPairs().sortBy(0).fromPairs().value()), undefined, 2), "utf8");
    write$Classify.end();
  })
}
