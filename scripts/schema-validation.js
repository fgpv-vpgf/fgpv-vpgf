const Validator = require('jsonschema').Validator;
const fs        = require('fs');
const path      = require('path');

const configPath = '../src/content/samples/config';

const v         = new Validator();

fs.readFile(path.resolve(__dirname, '../', 'schema.json'), 'utf8', function (err, schema) {

    if (err) {
        console.log('Failed to load the schema file');
        return;
    }

    schema = JSON.parse(schema);

    fs
        .readdirSync(path.resolve(__dirname, configPath))
        .filter(fName => /\.json$/.test(fName))
        .forEach(fName => {
            fs.readFile(path.resolve(__dirname, configPath, fName), 'utf8', function (err, config) {
                config = JSON.parse(config);
                const result = v.validate(config, schema);

                if (result.errors) {
                    console.log(`Validation for ${fName} has failed:`);
                    result.errors.forEach(vError => {
                        console.log(`\t - ${vError.property} ${vError.message}`);
                    });
                    console.log('\n\n');
                    process.exit(1);
                } else {
                    console.log(`Validation for ${fName} has passed!\n`);
                }
            });
        });
});
