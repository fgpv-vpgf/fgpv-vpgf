#!/bin/bash

if [ -d "node_modules/@fgpv/rv-plugins/dist" ]; then
    cp -R node_modules/@fgpv/rv-plugins/dist/*/ "src/content/samples/plugins/"

    # Replace all /rv-main.js and /rv-styles.css with: ../../../../rv-main.js|rv-styles.css
    find "src/content/samples/plugins" -name '*.html' | while read line; do
        sed -i -e "s+\"/rv-main.js\"+\"../../../../rv-main.js\"+g" "$line"
        sed -i -e "s+\"/rv-styles.css\"+\"../../../../rv-styles.css\"+g" "$line"
        sed -i -e "s+\"/legacy-api.js\"+\"../../../../legacy-api.js\"+g" "$line"
    done
fi
