const fetch = require('node-fetch');
const fs = require('fs');
const provinces = {
    "en": {},
    "fr": {}
};

function fetchProvinces(lang) {
    return fetch(`https://geogratis.gc.ca/services/geoname/${lang}/codes/province.json`)
    .then(res => res.json())
    .then(json => json.definitions.forEach(type => provinces[lang][type.code] = type.description));
}

module.exports = Promise.all([fetchProvinces('en'), fetchProvinces('fr')]).then(() => {
    fs.writeFileSync('data/provinces.json', JSON.stringify(provinces));
    return provinces;
});