import {getChatGPTUser} from '@/app/chatgpt-auth';
import {database} from '@/lib/storage';
const categories=['上衣','长裤','短裤','半身短裙','连衣裙','外套','配饰','鞋包'];
const seasons=['春','夏','秋','冬','四季通用'];
const statuses=['正常穿着','收纳闲置','淘汰丢弃'];
const string=(v:unknown,max=80)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
export async function GET(){const u=await getChatGPTUser();if(!u)return Response.json({error:'请登录后打开衣橱'},{status:401});try{const r=await database().prepare('SELECT kind,id,data FROM records WHERE owner = ?').bind(u.userId).all();return Response.json(r.results.map((x:any)=>({...JSON.parse(x.data),kind:x.kind,id:x.id})),{headers:{'Cache-Control':'no-store'}});}catch(e){console.error(e);return Response.json({error:'衣橱读取失败，请稍后重试'},{status:503});}}
export async function POST(req:Request){
 const u=await getChatGPTUser();if(!u)return Response.json({error:'请先登录'},{status:401});
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'来源无效'},{status:403});
 try{
 const {kind,id,data}=await req.json() as any;
 if(!['item','outfit','checkin'].includes(kind)||!string(id)||!data||typeof data!=='object'||Array.isArray(data)||JSON.stringify(data).length>15000)throw Error('数据格式不正确');
 if(kind==='item'){
 if(!categories.includes(data.category)||!statuses.includes(data.status)||!Array.isArray(data.seasons)||!data.seasons.length||data.seasons.some((s:string)=>!seasons.includes(s))||!string(data.name,60)||!string(data.color,20)||!string(data.style,30)||!['薄款','适中','厚款'].includes(data.thickness)||!/^\/api\/photo\?id=[\w-]+$/.test(data.photo))throw Error('请完整填写衣物标签并上传白底图');
 }
 if(kind==='outfit'){
 if(!string(data.name,60)||!Array.isArray(data.items)||!data.items.length||data.items.length>100||data.items.some((i:unknown)=>!string(i))||!Number.isFinite(data.min)||!Number.isFinite(data.max)||data.min>data.max||data.min< -50||data.max>60||!['通勤','约会','居家','出游'].includes(data.scene)||!['不限','晴天','多云','雨天','雪天','雾天'].includes(data.weather)||(data.rating!==undefined&&(!Number.isInteger(data.rating)||data.rating<1||data.rating>5)))throw Error('请检查搭配名称、单品和温度范围');
 const rows=await database().prepare('SELECT id FROM records WHERE owner=? AND kind=?').bind(u.userId,'item').all();
 if(data.items.some((id:string)=>!rows.results.some((r:any)=>r.id===id)))throw Error('搭配中有不存在的衣物');
 }
 if(kind==='checkin'){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(id)||!string(data.outfit)||!Number.isFinite(Date.parse(id))||new Date(id).toISOString().slice(0,10)!==id||Date.parse(id)>Date.now()+86400000)throw Error('打卡日期无效');
 const r=await database().prepare('SELECT id FROM records WHERE owner=? AND kind=? AND id=?').bind(u.userId,'outfit',data.outfit).first();if(!r)throw Error('穿搭不存在');
 }
 await database().prepare('INSERT INTO records(owner,kind,id,data) VALUES(?,?,?,?) ON CONFLICT(owner,kind,id) DO UPDATE SET data=excluded.data').bind(u.userId,kind,id,JSON.stringify(data)).run();
 return Response.json({ok:true});
 }catch(e){console.error(e);return Response.json({error:e instanceof Error?e.message:'保存失败'},{status:400});}
}

