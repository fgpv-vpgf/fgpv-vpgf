#!/bin/bash

# remove build and dist folders before new files are added
echo "Removing 'build' and 'dist' folders"
rm -rf ./build ./dist

# if npm module @fgpv/rv-plugins contains a dist folder, copy the samples into RAMP samples folder and find/replace src links to work with RAMP folder structure
if [ -d "node_modules/@fgpv/rv-plugins/dist" ]; then
    echo "Copying samples from @fgpv/rv-plugins to the samples/ folder."
    cp -R node_modules/@fgpv/rv-plugins/dist/*/ "src/content/samples/plugins/"

    # Replace all /rv-main.js and /rv-styles.css with: ../../../../rv-main.js|rv-styles.css
    find "src/content/samples/plugins" -name '*.html' | while read line; do
        sed -i -e "s+\"/rv-main.js\"+\"../../../../rv-main.js\"+g" "$line"
        sed -i -e "s+\"/rv-styles.css\"+\"../../../../rv-styles.css\"+g" "$line"
        sed -i -e "s+\"/legacy-api.js\"+\"../../../../legacy-api.js\"+g" "$line"
    done
fi