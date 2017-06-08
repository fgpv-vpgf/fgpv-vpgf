function layerAPI() {
    class Layers {
        get rcsIds () { return ''; }
    }

    return new Layers();
}

layerAPI['$inject'] = [];

export default layerAPI;
