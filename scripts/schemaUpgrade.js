const ZS = require('z-schema');
const util = require('util');
const upg = require('../src/app/core/schema-upgrade.service.js');

const schema = require(process.env.PWD + '/schema.json');

let cfg = require(process.env.PWD + '/' + process.argv[2]);
let errs;

const validator = new ZS({
    noEmptyArrays: true,
    noTypeless: true,
    assumeAdditional: true,
    // forceProperties: true, // TODO we probably want this at some point but too many errors right now
    forceItems: true,
    breakOnFirstError: false
    // forceAdditional: true
});

// upstream draft04 schema probably doesn't validate under strict conditions so remove it
if (schema.hasOwnProperty('$schema')) {
    delete schema.$schema;
}

validator.validateSchema(schema);
errs = validator.getLastErrors();
if (errs) {
    console.log('Schema is invalid');
    console.log(errs);
    return;
} else {
    console.log('Schema is valid');
}

if (upg.V1_SCHEMA_VERSIONS.indexOf(cfg.version) > -1) {
    cfg = upg.oneToTwo(cfg);
} else {
    console.log('No schema conversion required');
}

validator.validate(cfg, schema);
console.log();
errs = validator.getLastErrors();
if (errs) {
    console.log('Converted config is invalid');
    console.log(errs);
} else {
    console.log('Converted config is valid');
}