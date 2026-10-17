const cookieName='wardrobe_owner';

function readCookie(header:string|null){
  const value=header?.split(';').map(v=>v.trim()).find(v=>v.startsWith(`${cookieName}=`))?.slice(cookieName.length+1);
  return value&&/^[0-9a-f-]{36}$/i.test(value)?value:null;
}

export function deviceOwner(req:Request){return readCookie(req.headers.get('cookie'));}

export function sessionCookie(owner:string){
  return `${cookieName}=${owner}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`;
}
