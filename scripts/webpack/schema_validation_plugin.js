const schemaToTs = require( 'json-schema-to-typescript');
const ZSchema   = require("z-schema");
const fs        = require('fs');

class SchemaValidatorPlugin {

    constructor (opts = {}) {
        this.validator = new ZSchema({ breakOnFirstError: false });
        this.configPath = opts.configPath ? opts.configPath : 'src/content/samples/config';
        this.schemaFile = opts.schemaFile ? opts.schemaFile : 'schema.json';
        this.hasError = false;

        schemaToTs.compileFromFile(this.schemaFile).then(ts => fs.writeFileSync('api/src/schema.d.ts', ts));
    }

    apply (compiler) {
        compiler.plugin('compile', compilation => {
            console.log('\n\nSchema validation');
            this.getConfigList().forEach(this.validateConfig.bind(this));
            if (this.hasError) {
                process.exit(1);
            } else {
                console.log('\t All config files pass!\n\n');
            }
        });
    }

    get schema () {
        this._schema = this._schema ?
            this._schema :
            JSON.parse(fs.readFileSync(this.schemaFile, 'utf8'));

        return this._schema;
    }

    getConfigList () {
        return fs
            .readdirSync(this.configPath)
            .filter(fName => /\.json$/.test(fName))
    }

    validateConfig(fName) {
        const config = JSON.parse(fs.readFileSync(this.configPath + `/${fName}`, 'utf8'));

        if (!this.validator.validate(config, this.schema)) {
            this.hasError = true;
            console.log(`\t Validation for ${fName} has failed:`);
            this.validator.getLastErrors().forEach(vError => {
                console.log(`\t\t - ${vError.message} (Path: ${vError.path})`);
            });
            console.log('\n\n');
        }
    }
}

module.exports = SchemaValidatorPlugin;
