export type LocalRecord={id:string;kind:'item'|'outfit'|'checkin';[key:string]:unknown};
const DB='yixu-offline',STORE='records';
function open(){return new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open(DB,1);request.onupgradeneeded=()=>request.result.createObjectStore(STORE,{keyPath:'key'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
export async function localAll(){const db=await open();return new Promise<LocalRecord[]>((resolve,reject)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result.map(({key,...record})=>record));r.onerror=()=>reject(r.error);});}
export async function localPut(record:LocalRecord){const db=await open();return new Promise<void>((resolve,reject)=>{const r=db.transaction(STORE,'readwrite').objectStore(STORE).put({...record,key:`${record.kind}:${record.id}`});r.onsuccess=()=>resolve();r.onerror=()=>reject(r.error);});}
