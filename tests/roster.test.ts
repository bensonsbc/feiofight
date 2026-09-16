import assert from "node:assert/strict";
import {CHARACTERS,HEROES,ROSTERS,ROSTER_INFO,defaultOpponent,heroesOf,isBoss,isHero,isRoster,portrait,rosterOf,shotOf,statsOf,styleOf} from "../lib/characters.ts";
import {createState,begin,step,emptyInput} from "../lib/game.ts";
import {existsSync} from "node:fs";
import atlas from "../art/source/rockstar/atlas.json" with {type:"json"};
{
 assert.equal(ROSTERS.turma.length,7);assert.equal(ROSTERS.rockstar.length,13);
 assert.equal(HEROES.length,20,"every fighter has exactly one roster");
 assert.equal(new Set(HEROES).size,HEROES.length,"ids are unique across rosters");
 for(const h of HEROES){assert.ok(CHARACTERS[h]?.name&&CHARACTERS[h].special&&CHARACTERS[h].ending&&CHARACTERS[h].story.length>120,"catalog entry with ending and story for "+h);assert.ok(["PESO-PESADO","VELOZ","EQUILIBRADO"].includes(styleOf(h)),"style label for "+h);const st=statsOf(h),sh=shotOf(h);assert.ok(st.hp>=85&&st.hp<=125&&st.speed>.8&&st.speed<1.3&&st.power>.8&&st.power<1.2,"sane stats for "+h);assert.ok(sh.speed>=280&&sh.speed<=650&&sh.height>=20&&sh.height<=140&&sh.damage>=18&&sh.damage<=32,"sane shot for "+h);assert.ok(existsSync("public"+portrait(h))&&existsSync("public"+portrait(h,true)),"portrait files for "+h)}
}
{
 assert.ok(isRoster("rockstar")&&isRoster("turma")&&!isRoster("boss"));
 assert.ok(isHero("sid-vicious")&&isHero("rogerio-skylab")&&isHero("iggy-pop")&&isHero("sergey"));
 assert.ok(isBoss("rogerio-skylab")&&!isBoss("sid-vicious")&&!isBoss("catlaca"),"only the rock star boss is a boss");
 assert.equal(ROSTERS.rockstar.at(-1),"rogerio-skylab","the boss closes the roster so the arcade ladder ends with him");
 for(const r of Object.keys(ROSTER_INFO) as (keyof typeof ROSTER_INFO)[]){assert.ok(existsSync("public"+ROSTER_INFO[r].arena),"arena image for "+r);assert.equal(ROSTER_INFO[r].brand.length,2);assert.ok(ROSTER_INFO[r].title)}
 assert.equal(ROSTER_INFO.rockstar.title,"Clube da Luta do Rock");
 assert.equal(rosterOf("kurt-cobain"),"rockstar");assert.equal(rosterOf("marica"),"turma");
 assert.equal(defaultOpponent("jim-morrison"),"john-lennon");assert.equal(defaultOpponent("marica"),"hiro");
 for(const h of HEROES)assert.equal(rosterOf(defaultOpponent(h)),rosterOf(h),"opponent from the same roster for "+h);
 assert.deepEqual([...heroesOf("rockstar")],[...ROSTERS.rockstar]);
}
{
 // Every rock star has a measured atlas entry with 7 actions × 4 frames and a projectile.
 for(const h of ROSTERS.rockstar){
  const a=(atlas as Record<string,{frames:Record<string,number[][]>;projectile:number[];standing:number}>)[h];
  assert.ok(a,"atlas entry for "+h);
  for(const action of ["walk","jump","crouch","kick","punch","special","block"])assert.equal(a.frames[action]?.length,4,h+" "+action);
  assert.equal(a.projectile.length,6);assert.ok(a.standing>120&&a.standing<230,"plausible height for "+h);
 }
}
{
 // A rock star fight runs on the same rules: a special from range lands for the base damage.
 const s=createState("elvis-presley","ozzy-osbourne");begin(s);
 for(let i=0;i<181;i++)step(s,[emptyInput(),emptyInput()]);
 s.fighters[0].x=400;s.fighters[1].x=480;s.fighters[0].energy=100;
 for(let i=0;i<50;i++)step(s,[{...emptyInput(),special:true},emptyInput()]);
 assert.equal(s.fighters[1].hp,100-Math.round(shotOf("elvis-presley").damage*statsOf("elvis-presley").power),"Elvis's seismic wave hits for its listed damage");
}
{
 // The boss throws too: his special lands from range like any rock star projectile.
 const s=createState("rogerio-skylab","joey-ramone");begin(s);
 for(let i=0;i<181;i++)step(s,[emptyInput(),emptyInput()]);
 s.fighters[0].x=400;s.fighters[1].x=480;s.fighters[0].energy=100;
 for(let i=0;i<50;i++)step(s,[{...emptyInput(),special:true},emptyInput()]);
 assert.ok(s.fighters[1].hp<100,"Skylab's throw hits");
}
console.log("Roster checks passed: two rosters, unique ids, catalog with stats, shots, endings and portraits, same-roster opponents, per-roster arena, boss, measured atlas and a rock star fight.");
