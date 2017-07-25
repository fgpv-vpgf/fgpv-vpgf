import "babel-polyfill";
import './ie-svg.contains';
import './ie-outer.HTML';

import { TextDecoder } from 'text-encoding';
window.TextDecoder = TextDecoder;

import { init } from 'canvas-to-blob';
init();
