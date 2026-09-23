import { env } from 'cloudflare:workers';
export function database(): D1Database { const db=(env as unknown as {DB:D1Database}).DB; if(!db) throw new Error('数据库暂不可用'); return db; }
export function bucket(): R2Bucket {return (env as unknown as {BUCKET:R2Bucket}).BUCKET;}
