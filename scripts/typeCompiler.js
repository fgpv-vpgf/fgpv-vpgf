const fetch = require('node-fetch');
const fs = require('fs');
const types = {
    "en": {
        FSA: "Forward Sortation Area",
        NTS: "National Topographic System",
        COORD: "Latitude/Longitude",
        SCALE: "Scale"
    },
    "fr": {
        FSA: "Région De Tri D'Acheminement",
        NTS: "Système National De Référence Cartographique",
        COORD: "Latitude/Longitude",
        SCALE: "Échelle"
    }
};

function fetchConsise(lang) {
    return fetch(`https://geogratis.gc.ca/services/geoname/${lang}/codes/concise.json`)
        .then(res => res.json())
        .then(json => json.definitions.forEach(type => types[lang][type.code] = type.term));
}

module.exports = Promise.all([fetchConsise('en'), fetchConsise('fr')]).then(() => {
    fs.writeFileSync('data/types.json', JSON.stringify(types));
    return types;
});
