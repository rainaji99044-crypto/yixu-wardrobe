// Garment segmentation runs locally in the browser; no photo is sent to a third-party AI service.
export async function prepareCutout(blob:Blob,onProgress:(message:string)=>void){
 const {removeBackground}=await import('@imgly/background-removal');
 const transparent=await removeBackground(blob,{model:'isnet_quint8',device:'cpu',proxyToWorker:false,progress:(_key,current,total)=>onProgress(`正在准备试衣素材 · ${Math.round(current/total*100)}%`)});
 return cropCutout(transparent);
}
export async function cropCutout(transparent:Blob){
 const bitmap=await createImageBitmap(transparent);const canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;const context=canvas.getContext('2d')!;context.drawImage(bitmap,0,0);bitmap.close();
 const {data}=context.getImageData(0,0,canvas.width,canvas.height);let left=canvas.width,top=canvas.height,right=0,bottom=0;
 for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){if(data[(y*canvas.width+x)*4+3]>30){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}}
 if(right<=left||bottom<=top)throw Error('未识别到完整衣物，请换用单件平铺照片');
 const output=document.createElement('canvas');output.width=right-left+1;output.height=bottom-top+1;output.getContext('2d')!.drawImage(canvas,left,top,output.width,output.height,0,0,output.width,output.height);
 return new Promise<Blob>((resolve,reject)=>output.toBlob(b=>b?resolve(b):reject(Error('试衣素材生成失败')),'image/png'));
}
export async function uploadPhoto(blob:Blob):Promise<string>{const r=await fetch('/api/photo',{method:'POST',headers:{'Content-Type':'image/png'},body:blob});const data:any=await r.json();if(!r.ok)throw Error(data.error||'图片保存失败，请重试');return data.photo;}
