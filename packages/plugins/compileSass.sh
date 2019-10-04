# Directory names of plugins with sass to compile
plugins=("enhancedTable")

for plugin in "${plugins}"
do
    node-sass ./"$plugin"/main.scss ./lib/"$plugin"/main.css --importer node_modules/node-sass-import
done