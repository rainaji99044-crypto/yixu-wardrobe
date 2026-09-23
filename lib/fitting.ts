export type FitLayer = {itemId:string;src:string;x:number;y:number;w:number;h:number;rotation:number};
export type Fitting = {version:1;layers:FitLayer[]};
export function defaultPlacement(category:string):Omit<FitLayer,'itemId'|'src'>{
 const p:Record<string,number[]>={'上衣':[28,16,44,29],'长裤':[34,42,32,49],'短裤':[33,42,34,20],'半身短裙':[29,42,42,25],'连衣裙':[28,16,44,69],'外套':[25,15,50,44],'鞋包':[33,87,34,12],'配饰':[59,40,23,20]};
 const [x,y,w,h]=p[category]||p['配饰'];return {x,y,w,h,rotation:0};
}
export function isValidFitting(value:any,ids:string[]):value is Fitting{
 return Array.isArray(ids)&&value?.version===1&&Array.isArray(value.layers)&&value.layers.length<=12&&new Set(value.layers.map((l:any)=>l?.itemId)).size===value.layers.length&&value.layers.every((l:any)=>l&&ids.includes(l.itemId)&&typeof l.src==='string'&&/^\/api\/photo\?id=[\w-]+$/.test(l.src)&&['x','y','w','h','rotation'].every(k=>Number.isFinite(l[k]))&&l.x>=-50&&l.x<=100&&l.y>=-50&&l.y<=100&&l.w>=5&&l.w<=120&&l.h>=5&&l.h<=120&&Math.abs(l.rotation)<=180);
}


