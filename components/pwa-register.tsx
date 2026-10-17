'use client';
import {useEffect,useState} from 'react';

export function PwaRegister(){
  const [waiting,setWaiting]=useState<ServiceWorker|null>(null);
  useEffect(()=>{if(!('serviceWorker'in navigator))return;let refreshing=false;const changed=()=>{if(refreshing)return;refreshing=true;location.reload();};navigator.serviceWorker.addEventListener('controllerchange',changed);navigator.serviceWorker.register('/sw.js').then(reg=>{if(reg.waiting)setWaiting(reg.waiting);reg.addEventListener('updatefound',()=>{const worker=reg.installing;if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)setWaiting(worker);});});}).catch(()=>{});return()=>navigator.serviceWorker.removeEventListener('controllerchange',changed);},[]);
  return waiting?<div className="update-banner">衣序有新版本可用。<button onClick={()=>waiting.postMessage('SKIP_WAITING')}>立即更新</button></div>:null;
}
