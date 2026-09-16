import {env} from "cloudflare:workers";

const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{"Cache-Control":"no-store"}});
type Row={id:string;room:string;secret:string;name:string;slot:number|null;hero:string;seen:number;input:string|null;offer:string|null;answer:string|null};
type Room={code:string;host:string;expires:number;state:string|null;updated:number};
const parse=(s:string|null)=>{try{return s?JSON.parse(s):null}catch{return null}};
async function digest(s:string){return [...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s)))].map(v=>v.toString(16).padStart(2,"0")).join("")}
function cleanInput(v:any){const o:Record<string,boolean>={};for(const k of ["left","right","jump","down","punch","kick","block","special"])o[k]=v?.[k]===true;return JSON.stringify(o)}
export async function POST(req:Request){
 try{
  if(req.headers.get("origin")&&new URL(req.headers.get("origin")!).host!==new URL(req.url).host)return json({error:"Origem inválida."},403);
  const raw=await req.text();if(raw.length>24000)return json({error:"Pedido muito grande."},413);
  const b=JSON.parse(raw);const db=env.DB;if(!db)return json({error:"As salas estão temporariamente indisponíveis."},503);
  const now=Date.now();const op=b.op;
  if(op==="create"||op==="join"){
   const name=String(b.name||"Jogador").trim().slice(0,20)||"Jogador";
   const hero=b.hero==="hiro"?"hiro":"marica";
   const id=crypto.randomUUID(),token=crypto.randomUUID()+crypto.randomUUID(),secret=await digest(token);
   if(op==="create"){
    const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";const code=[...crypto.getRandomValues(new Uint8Array(8))].map(n=>alphabet[n%32]).join("");
    await db.batch([db.prepare("DELETE FROM rooms WHERE expires < ?").bind(now),db.prepare("INSERT INTO rooms(code,host,created,expires,updated) VALUES(?,?,?,?,?)").bind(code,id,now,now+14400000,now),db.prepare("INSERT INTO members(id,room,secret,name,slot,hero,seen) VALUES(?,?,?,?,0,?,?)").bind(id,code,secret,name,hero,now)]);
    return json({code,id,token,slot:0,hero,name,host:id});
   }
   const code=String(b.code||"").toUpperCase();if(!/^[A-Z2-9]{8}$/.test(code))return json({error:"Use o código de 8 caracteres da sala."},400);
   const room=await db.prepare("SELECT * FROM rooms WHERE code=? AND expires>?").bind(code,now).first<Room>();
   if(!room)return json({error:"Sala não encontrada ou encerrada."},404);
   const host=await db.prepare("SELECT * FROM members WHERE id=? AND seen>?").bind(room.host,now-30000).first<Row>();
   if(!host)return json({error:"O criador da sala está desconectado."},409);
   await db.prepare("DELETE FROM members WHERE room=? AND slot IS NOT 0 AND seen<?").bind(code,now-30000).run();
   const total=await db.prepare("SELECT COUNT(*) AS n FROM members WHERE room=?").bind(code).first<{n:number}>();
   if((total?.n||0)>=22)return json({error:"A sala atingiu o limite de 20 espectadores."},409);
   const slot=b.watch===true?null:1;const assigned=slot===null?null:host.hero==="marica"?"hiro":"marica";
   try{await db.prepare("INSERT INTO members(id,room,secret,name,slot,hero,seen) VALUES(?,?,?,?,?,?,?)").bind(id,code,secret,name,slot,assigned,now).run()}catch(e){if(String(e).includes("UNIQUE"))return json({error:"Os dois lugares já estão ocupados. Entre para assistir."},409);throw e}
   return json({code,id,token,slot,hero:assigned,name,host:room.host});
  }
  const id=String(b.id||""),token=String(req.headers.get("authorization")||"").replace(/^Bearer /,"");
  if(!token)return json({error:"Sessão inválida. Entre novamente."},401);
  const me=await db.prepare("SELECT * FROM members WHERE id=? AND secret=?").bind(id,await digest(token)).first<Row>();
  if(!me)return json({error:"Sua sessão terminou. Entre novamente."},401);
  const room=await db.prepare("SELECT * FROM rooms WHERE code=? AND expires>?").bind(me.room,now).first<Room>();if(!room)return json({error:"A sala foi encerrada."},410);
  if(op==="leave"){
   if(me.slot===0)await db.prepare("DELETE FROM rooms WHERE code=?").bind(me.room).run();else await db.prepare("DELETE FROM members WHERE id=?").bind(id).run();
   return json({ok:true});
  }
  if(op==="signal"){
   const s=JSON.stringify(b.sdp);if(s.length>14000||!b.sdp?.sdp||!["offer","answer"].includes(b.sdp?.type))return json({error:"Conexão inválida."},400);
   if(me.slot===0&&b.sdp.type==="offer")await db.prepare("UPDATE members SET offer=?,answer=NULL WHERE id=? AND room=? AND slot IS NOT 0").bind(s,String(b.target),me.room).run();
   else if(me.slot!==0&&b.sdp.type==="answer")await db.prepare("UPDATE members SET answer=? WHERE id=?").bind(s,id).run();
   else return json({error:"Ação não permitida."},403);
   return json({ok:true});
  }
  if(op!=="sync")return json({error:"Pedido inválido."},400);
  if(b.state!==undefined&&me.slot!==0)return json({error:"Somente o criador pode sincronizar a partida."},403);
  if(b.input!==undefined&&me.slot!==1)return json({error:"Espectadores não controlam lutadores."},403);
  const writes=[db.prepare("UPDATE members SET seen=? WHERE id=?").bind(now,id)];
  if(me.slot===1&&b.input!==undefined)writes.push(db.prepare("UPDATE members SET input=? WHERE id=?").bind(cleanInput(b.input),id));
  if(me.slot===0&&b.state!==undefined){const s=JSON.stringify(b.state);if(s.length>12000||!Array.isArray(b.state?.fighters)||b.state.fighters.length!==2)return json({error:"Estado inválido."},400);writes.push(db.prepare("UPDATE rooms SET state=?,updated=? WHERE code=?").bind(s,now,me.room))}
  await db.batch(writes);
  const list=await db.prepare("SELECT id,name,slot,hero,seen,input,offer,answer FROM members WHERE room=? AND seen>? ORDER BY slot").bind(me.room,now-30000).all<Row>();
  return json({members:list.results.map(m=>({id:m.id,name:m.name,slot:m.slot,hero:m.hero,seen:m.seen,...(me.slot===0?{input:parse(m.input),answer:parse(m.answer)}:{} )})),offer:me.slot===0?null:parse(me.offer),state:me.slot===0?null:parse(room.state),updated:room.updated,host:room.host});
 }catch(e){console.error("Room request failed",e);return json({error:"Não foi possível conectar à sala. Tente novamente."},500)}
}
