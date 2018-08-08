/* Use this script to enhance all configs in src/content/samples/config/
*  This will overwrite the configs in directory dir specified below moving
*  the legend and layer map properties up after components.
*/

const fs = require('fs');

const dir = './src/content/samples/config/'
const configs = fs.readdirSync(dir);

configs.forEach(config => {
    if (fs.lstatSync(dir + config).isFile()) {
        let dataFile = JSON.parse(fs.readFileSync(dir + config));

        let map = dataFile.map;
        let mapKeys = Object.keys(map);
        const third = mapKeys[2];
        const fourth = mapKeys[3];
        mapKeys[mapKeys.indexOf("legend")] = third;
        mapKeys[mapKeys.indexOf("layers")] = fourth;
        mapKeys[2] = "legend";
        mapKeys[3] = "layers";
        let newMap = {};
        mapKeys.forEach(key => {
            newMap[key] = map[key];
        });
        dataFile.map = newMap;

        // write the sorted JSON to a new file or: console.dir(sortedData);
        fs.writeFileSync(dir + config, JSON.stringify(dataFile, null, 2));
        console.log(config + ' enhanced!');
    }
});
