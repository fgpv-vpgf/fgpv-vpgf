#!/bin/bash

for file in node_modules/@fgpv/rv-plugins/dist/**/*; do
    nosamplefile=${file//samples\//}
    DIR=$(dirname "src/content/samples/plugins${nosamplefile#node_modules/@fgpv/rv-plugins/dist}")
    mkdir -p "$DIR"
    cp -r "./$file" "src/content/samples/plugins${nosamplefile#node_modules/@fgpv/rv-plugins/dist}"
    # Replace all /rv-main.js and /rv-styles.css with: ../../../../rv-main.js|rv-styles.css
    find "src/content/samples/plugins${nosamplefile#node_modules/@fgpv/rv-plugins/dist}" -name '*.html' | while read line; do
        sed -i -e "s+/rv-main.js+../../../../rv-main.js+g" "$line"
        sed -i -e "s+/rv-styles.css+../../../../rv-styles.css+g" "$line"
    done
    if [ ${file: -3} == ".js" ] || [ ${file: -4} == ".css" ]; then
        DIR=$(dirname "build/plugins${file#node_modules/@fgpv/rv-plugins/dist}")
        mkdir -p "$DIR"
        cp -r "./$file" "build/plugins${file#node_modules/@fgpv/rv-plugins/dist}"
    fi
done