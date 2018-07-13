// Run to create a custom build of Angular Material with the modules specified

/* Making a New Build
1.  Make modifications to configuration below
    I.E. add/remove module, change theme...
2.  Run the script using 'npm run angular-material'
3.  Ensure files were copied over correctly

**/
const MaterialTools = require('angular-material-tools');
const fs = require('fs-extra');

let tools = new MaterialTools({
  destination: './angular_material',
  version: '1.1.9',
  modules: [
    'menu',
    'menuBar',
    'checkbox',
    'dialog',
    'button',
    'progressLinear',
    'progressCircular',
    'tooltip',
    'icon',
    'divider',
    'input',
    'autocomplete',
    'checkbox',
    'select',
    'sidenav',
    'toast',
    'datepicker',
    'switch',
    'slider'
  ],
  theme: {
    primaryPalette: 'blue-grey',
    accentPalette: 'cyan'
  }
});

function moveComplete(err, name) {
  if (err) {
    console.log(`${name} could not be moved`);
    console.log(err);
  }
}

const successHandler = () => {
  console.log('Build was successful.');
  fs.copy('./angular_material/angular-material.min.js', './src/material/angular-material.min.js', {overwrite: true}, err => moveComplete(err, 'angular-material.min.js'));
  fs.copy('./angular_material/angular-material.themes.min.css', './src/material/angular-material.themes.min.css', {overwrite: true}, err => moveComplete(err, 'angular-material.themes.min.css'));
  fs.copy('./.material-cache/1.1.9/module/angular-material.scss', './src/material/angular-material.scss', {overwrite: true}, err => moveComplete(err, 'angular-material.scss'));
  fs.copy('./.material-cache/1.1.9/module/LICENSE', './src/material/LICENSE', {overwrite: true}, err => moveComplete(err, 'LICENSE'));
};
const errorHandler = error => console.error(error);

fs.removeSync('./angular_material');
fs.removeSync('./.material-cache');
fs.removeSync('./src/material');
tools.build().then(successHandler).catch(errorHandler); // Build all JS/CSS/themes
