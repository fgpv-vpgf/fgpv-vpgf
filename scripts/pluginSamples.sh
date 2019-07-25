#!/bin/bash

for dir in node_modules/@fgpv/rv-plugins/dist/*/; do
    # check if last folder is samples, if it is skip..
    # samples should end up in their parents copy, not on their own
    if [[ ${dir#$(dirname $dir)} != '/samples/' ]]; then
        cp -R --remove-destination ${dir} "src/content/samples/plugins/"
    fi
    # Replace all /rv-main.js and /rv-styles.css with: ../../../../rv-main.js|rv-styles.css
    find "src/content/samples/plugins" -name '*.html' | while read line; do
        sed -i -e "s+\"/rv-main.js\"+\"../../../../rv-main.js\"+g" "$line"
        sed -i -e "s+\"/rv-styles.css\"+\"../../../../rv-styles.css\"+g" "$line"
        sed -i -e "s+\"/legacy-api.js\"+\"../../../../legacy-api.js\"+g" "$line"
    done
done
