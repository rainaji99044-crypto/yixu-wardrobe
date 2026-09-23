export function isRecommended(outfit:any,items:any[],temperature:number|undefined,weather:string){
 if(temperature===undefined||temperature<outfit.min||temperature>outfit.max||(outfit.weather!=='不限'&&outfit.weather!==weather))return false;
 const list=outfit.items.map((id:string)=>items.find(i=>i.id===id));
 if(!list.length||list.some((i:any)=>!i||i.status!=='正常穿着'))return false;
 const clothes=list.filter((i:any)=>!['配饰','鞋包'].includes(i.category));
 if(!clothes.length)return false;
 if(temperature>=28&&clothes.some((i:any)=>i.thickness==='厚款'))return false;
 if(temperature<12&&!clothes.some((i:any)=>i.category==='外套'&&i.thickness==='厚款'))return false;
 const season=temperature>=25?'夏':temperature<10?'冬':temperature<18?'秋':'春';
 return clothes.some((i:any)=>i.seasons.includes(season)||i.seasons.includes('四季通用'));
}
