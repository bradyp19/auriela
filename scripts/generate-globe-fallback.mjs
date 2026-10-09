import fs from 'node:fs';
import {geoOrthographic,geoPath,geoGraticule10} from 'd3-geo';
const land=JSON.parse(fs.readFileSync('public/geography/land.json','utf8'));
const projection=geoOrthographic().scale(204).translate([240,240]).rotate([23,-23]);
const path=geoPath(projection);
fs.writeFileSync('public/globe-static.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 480"><defs><pattern id="dots" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".8" fill="#ddd"/></pattern></defs><circle cx="240" cy="240" r="204" fill="#000" stroke="#555" stroke-width=".5"/><path d="${path(geoGraticule10())}" fill="none" stroke="#444" stroke-width=".35"/><path d="${path(land)}" fill="url(#dots)" stroke="#aaa" stroke-width=".25"/></svg>`);
