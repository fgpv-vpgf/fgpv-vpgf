import Jasmine from 'jasmine';

const jazzy = new Jasmine();
jazzy.loadConfigFile('spec/support/jasmine.json');
jazzy.execute();
