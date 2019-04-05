#!/bin/bash

for file in node_modules/@fgpv/rv-plugins/dist/**/*; do
    nosamplefile=${file//samples\//}
    DIR=$(dirname "src/content/samples/plugins${nosamplefile#node_modules/@fgpv/rv-plugins/dist}")
    mkdir -p "$DIR"
    cp -r "./$file" "src/content/samples/plugins${nosamplefile#node_modules/@fgpv/rv-plugins/dist}"

    if [ ${file: -3} == ".js" ] || [ ${file: -4} == ".css" ]; then
        DIR=$(dirname "build/plugins${file#node_modules/@fgpv/rv-plugins/dist}")
        mkdir -p "$DIR"
        cp -r "./$file" "build/plugins${file#node_modules/@fgpv/rv-plugins/dist}"
    fi
done