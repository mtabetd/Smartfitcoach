// crossfit-wods-merge.js — Fusionne les 3 cycles en un seul tableau CF_WODS_FULL
(function(){
'use strict';
var c1 = window.CF_WODS_CYCLE1 || [];
var c2 = window.CF_WODS_CYCLE2 || [];
var c3 = window.CF_WODS_CYCLE3 || [];
var all = [];
var i;
for (i = 0; i < c1.length; i++) all.push(c1[i]);
for (i = 0; i < c2.length; i++) all.push(c2[i]);
for (i = 0; i < c3.length; i++) all.push(c3[i]);
window.CF_WODS_FULL = all;
if (all.length > 0) window.CF_WODS = all;
})();
