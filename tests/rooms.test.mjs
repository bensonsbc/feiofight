import assert from 'node:assert/strict';
const origin=process.argv[2]||'http://localhost:5173';
async function request(body,session,expected=200){const r=await fetch(origin+'/api/room',{method:'POST',headers:{'Content-Type':'application/json',...(session?{Authorization:'Bearer '+session.token}:{})},body:JSON.stringify({...body,...(session?{id:session.id}:{})})});const d=await r.json();assert.equal(r.status,expected,JSON.stringify(d));return d}
const host=await request({op:'create',name:'QA Host',hero:'hiro'});let guest,viewer;
try{
 const joins=await Promise.allSettled([request({op:'join',name:'QA Rival A',code:host.code}),request({op:'join',name:'QA Rival B',code:host.code})]);const winners=joins.filter(x=>x.status==='fulfilled');assert.equal(winners.length,1,'only one rival wins concurrent claim');guest=winners[0].value;assert.equal(guest.hero,'marica');
 viewer=await request({op:'join',name:'QA Viewer',code:host.code,watch:true});assert.equal(viewer.slot,null);
 await request({op:'sync',input:{punch:true}},viewer,403);await request({op:'sync',state:{fighters:[{},{}]}},guest,403);
 await request({op:'sync',input:{left:true,punch:true}},guest);const h=await request({op:'sync'},host);assert.equal(h.members.length,3);assert.equal(h.members.find(m=>m.slot===1).input.punch,true);assert.equal(JSON.stringify(h).includes(guest.token),false);
 const state={fighters:[{hero:'hiro',hp:92},{hero:'marica',hp:80}],tick:15,phase:'fight'};await request({op:'sync',state},host);const v=await request({op:'sync'},viewer);assert.deepEqual(v.state,state,'viewer sees the host state');assert.equal(v.members.some(m=>'input' in m),false);
 await request({op:'sync',id:guest.id},{...guest,token:host.token},401);
 await request({op:'leave'},guest);guest=null;const next=await request({op:'join',name:'QA Rival replacement',code:host.code});guest=next;assert.equal(next.slot,1);
 await request({op:'leave'},host);await request({op:'join',code:host.code,watch:true},null,404);
 console.log('Room checks passed: exclusive second seat, spectators, role authorization, input/state relay, token isolation, replacement and room closure.');
}finally{for(const s of [guest,viewer,host].filter(Boolean))await fetch(origin+'/api/room',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+s.token},body:JSON.stringify({op:'leave',id:s.id})}).catch(()=>{})}

for(const [hostHero,guestHero] of [['marica','lobao'],['lobao','hiro']]){
 const h=await request({op:'create',name:'QA roster host',hero:hostHero});let g,v;
 try{
  await request({op:'join',name:'QA duplicate',code:h.code,hero:hostHero},null,409);
  await request({op:'join',name:'QA invalid',code:h.code,hero:'not-a-fighter'},null,400);
  g=await request({op:'join',name:'QA roster rival',code:h.code,hero:guestHero});assert.equal(g.hero,guestHero);assert.equal(g.hostHero,hostHero);
  v=await request({op:'join',name:'QA roster viewer',code:h.code,watch:true});assert.equal(v.slot,null);
  const state={fighters:[{hero:hostHero,hp:100},{hero:guestHero,hp:77}],tick:8,phase:'fight'};
  await request({op:'sync',state},h);const seen=await request({op:'sync'},v);assert.deepEqual(seen.state,state);assert.equal(seen.members.find(m=>m.slot===1).hero,guestHero);
 }finally{await request({op:'leave'},h)}
}
console.log('Roster checks passed: Lobão as host and rival, duplicate/invalid selection rejected, spectator sees chosen characters.');
