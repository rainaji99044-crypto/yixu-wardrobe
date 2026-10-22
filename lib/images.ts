export async function compressImage(file:File,max=1600,quality=.82){if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('请选择 JPG、PNG 或 WebP 图片');if(file.size>20*1024*1024)throw new Error('图片不能超过 20MB');const bitmap=await createImageBitmap(file);const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('图片处理失败')),'image/webp',quality));}
export function objectUrl(blob?:Blob){return blob?URL.createObjectURL(blob):'';}

type AutoTags={category:string;color:string;seasons:string[];styles:string[];thickness:string};
const COLOR_SWATCHES=[
  ['黑色',[28,28,31]],['白色',[235,235,232]],['灰色',[135,135,138]],['米色',[210,195,165]],
  ['棕色',[115,74,48]],['红色',[180,55,58]],['粉色',[220,145,165]],['橙色',[220,115,45]],
  ['黄色',[220,190,55]],['绿色',[70,130,85]],['蓝色',[65,105,170]],['紫色',[120,80,145]],
] as const;

function canvasBlob(canvas:HTMLCanvasElement,type='image/png',quality=.9){return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('图片处理失败')),type,quality));}

export async function processGarmentImage(file:File):Promise<{image:Blob;tags:AutoTags}> {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('请选择 JPG、PNG 或 WebP 图片');
  if(file.size>20*1024*1024) throw new Error('图片不能超过 20MB');
  const bitmap=await createImageBitmap(file);
  const scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(bitmap.width*scale)); canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext('2d',{willReadFrequently:true})!; ctx.drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
  const data=ctx.getImageData(0,0,canvas.width,canvas.height); const p=data.data; const w=canvas.width,h=canvas.height;
  const corners=[[0,0],[w-1,0],[0,h-1],[w-1,h-1]]; const bg=[0,1,2].map(c=>corners.reduce((s,[x,y])=>s+p[(y*w+x)*4+c],0)/4);
  let sr=0,sg=0,sb=0,count=0,minX=w,maxX=0,minY=h,maxY=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;const d=Math.hypot(p[i]-bg[0],p[i+1]-bg[1],p[i+2]-bg[2]);const edgeFade=Math.min(x,y,w-1-x,h-1-y)<3?1:0; if(d<34||(edgeFade&&d<55)){p[i+3]=0;}else{sr+=p[i];sg+=p[i+1];sb+=p[i+2];count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}
  ctx.putImageData(data,0,0);
  const r=sr/Math.max(1,count),g=sg/Math.max(1,count),b=sb/Math.max(1,count);
  const color=COLOR_SWATCHES.reduce((best,item)=>Math.hypot(r-item[1][0],g-item[1][1],b-item[1][2])<best.d?{name:item[0],d:Math.hypot(r-item[1][0],g-item[1][1],b-item[1][2])}:best,{name:'多色',d:Infinity}).name;
  const ratio=(maxX-minX+1)/Math.max(1,maxY-minY+1); const lower=file.name.toLowerCase();
  let category=ratio>1.35?'配饰':ratio<.42?'裤装':'上衣';
  if(/dress|连衣/.test(lower))category='连衣裙'; else if(/skirt|半身裙/.test(lower))category='半身裙'; else if(/coat|jacket|外套/.test(lower))category='外套'; else if(/shoe|鞋/.test(lower))category='鞋履'; else if(/bag|包/.test(lower))category='包袋'; else if(/pants|trouser|裤/.test(lower))category='裤装';
  const brightness=(r+g+b)/3; const style=brightness>190?'简约':brightness<75?'通勤':Math.max(r,g,b)-Math.min(r,g,b)>70?'休闲':'优雅';
  const thickness=category==='外套'?'厚实':category==='连衣裙'||category==='半身裙'?'轻薄':'适中';
  const seasons=thickness==='厚实'?['秋季','冬季']:thickness==='轻薄'?['春季','夏季']:['春季','秋季'];
  return {image:await canvasBlob(canvas),tags:{category,color,seasons,styles:[style],thickness}};
}
