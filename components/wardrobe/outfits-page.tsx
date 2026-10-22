'use client';
import {useMemo,useState} from 'react';
import {Heart,Plus,Save,Shirt,Trash2} from 'lucide-react';
import type {ClothingItem,Outfit} from '@/lib/models';
import {put,remove} from '@/lib/db';
import {BlobImage,EmptyState,Modal} from './common';
import {useWardrobe} from './app';

const GROUPS=[['上装',['上衣']],['下装',['裤装','半身裙','连衣裙']],['外套',['外套']],['鞋包配饰',['鞋履','包袋','配饰']]] as const;

export function OutfitsPage(){
  const {clothing,outfits,reload,notice}=useWardrobe(); const [creating,setCreating]=useState(false); const [selected,setSelected]=useState<string[]>([]);
  const chosen=useMemo(()=>selected.map(id=>clothing.find(x=>x.id===id)).filter(Boolean) as ClothingItem[],[selected,clothing]);
  function pick(item:ClothingItem){const group=GROUPS.find(([,cats])=>(cats as readonly string[]).includes(item.category))?.[0];setSelected(current=>{const without=group?current.filter(id=>{const old=clothing.find(x=>x.id===id);return !old||GROUPS.find(([,cats])=>(cats as readonly string[]).includes(old.category))?.[0]!==group;}):current;return current.includes(item.id)?current.filter(id=>id!==item.id):[...without,item.id];});}
  async function save(){if(!selected.length)return notice('请先选择衣物');const now=new Date().toISOString();const outfit:Outfit={id:crypto.randomUUID(),name:'我的穿搭',itemIds:selected,scene:'',colorScheme:'',styles:[],comfort:0,effect:'',rating:0,notes:'',photos:{},feedback:{tall:false,slim:false,comfortable:false,expected:false,rewear:false,improve:''},favorite:false,createdAt:now,updatedAt:now};await put('outfits',outfit);await reload();setCreating(false);setSelected([]);notice('穿搭方案已保存');}
  return <><div className="page-heading"><div><span className="eyebrow">OUTFITS</span><h1>穿搭试衣间</h1><p>从衣橱选择单品，在虚拟小人上预览组合。</p></div><button className="button primary" onClick={()=>setCreating(true)}><Plus/>创建穿搭</button></div>
    {outfits.length?<div className="outfit-grid">{outfits.map(outfit=><article className="outfit-card" key={outfit.id}><div className="outfit-collage">{outfit.itemIds.map(id=>{const item=clothing.find(x=>x.id===id);return item?<BlobImage key={id} blob={item.image} alt={item.category}/>:null})}</div><div className="card-body"><div className="card-title"><h3>{outfit.itemIds.length} 件单品</h3><Heart/></div><div className="card-actions"><button className="danger-text" onClick={async()=>{await remove('outfits',outfit.id);await reload();notice('穿搭已删除')}}><Trash2/>删除</button></div></div></article>)}</div>:<EmptyState icon={<Shirt/>} title="还没有穿搭方案" body="选择上衣、下装、外套和鞋包配饰，保存你的第一套组合。" action={<button className="button primary" onClick={()=>setCreating(true)}><Plus/>开始搭配</button>}/>} 
    {creating&&<Modal title="虚拟试衣" description="衣物图片会叠放在虚拟小人周围，方便快速比较整体组合。" onClose={()=>setCreating(false)}><div className="tryon-layout"><div className="mannequin-stage"><img className="mannequin-base" src="/mannequin.png" alt="虚拟试衣小人"/>{chosen.map((item,index)=><BlobImage key={item.id} blob={item.image} alt={item.category} className={`tryon-item layer-${index}`}/>)}</div><div className="tryon-picker">{GROUPS.map(([label,cats])=><section key={label}><h3>{label}</h3><div className="mini-picker">{clothing.filter(item=>(cats as readonly string[]).includes(item.category)).map(item=><button key={item.id} className={selected.includes(item.id)?'selected':''} onClick={()=>pick(item)}><BlobImage blob={item.image} alt={item.category}/><span>{item.category}</span></button>)}</div></section>)}</div></div><div className="dialog-actions"><button className="button secondary" onClick={()=>setCreating(false)}>取消</button><button className="button primary" onClick={()=>void save()}><Save/>保存方案</button></div></Modal>}
  </>;
}
