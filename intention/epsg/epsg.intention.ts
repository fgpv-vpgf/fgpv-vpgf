function lookup(lookup: string | number) {
    const urnRegex = /urn:ogc:def:crs:EPSG::(\d+)/;
    const epsgRegex = /EPSG:(\d+)/;
    let matcher = String(lookup).match(urnRegex) || String(lookup).match(epsgRegex) || [];

    if (!matcher || matcher.length < 2) {
        throw new Error('Invalid lookup string provided.');
    }

    return new Promise((resolve, reject) => {
        $.get(`http://epsg.io/${matcher[1]}.proj4`)
            .done(resolve)
            .fail(reject);
    });
}

export default {
    preInit: () => {
        console.log('Intention: epsg pre-initialized');
        return lookup;
    }
}
