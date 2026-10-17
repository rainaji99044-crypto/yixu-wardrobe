import sharp from 'sharp';
import {join} from 'node:path';
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="118" fill="#653557"/><path d="M205 145a51 51 0 1 1 102 51v45l132 91H73l132-91" fill="none" stroke="#fff" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/><path d="M145 352h222" stroke="#dcbfd3" stroke-width="18" stroke-linecap="round"/></svg>`;
for(const size of [192,512])await sharp(Buffer.from(svg)).resize(size,size).png().toFile(join('public',`icon-${size}.png`));
