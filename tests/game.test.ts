import assert from "node:assert/strict";
import {createState,emptyInput,begin,step,rematch,type Hero} from "../lib/game.ts";
import {shotOf,statsOf} from "../lib/characters.ts";
function ready(a:Hero="marica",b?:Hero){const s=createState(a,b);begin(s);for(let i=0;i<181;i++)step(s,[emptyInput(),emptyInput()]);s.fighters[0].x=400;s.fighters[1].x=480;return s}
function advance(s:ReturnType<typeof ready>,a=emptyInput(),b=emptyInput(),n=25){const events:string[]=[];for(let i=0;i<n;i++){step(s,[a,b]);events.push(...s.events)}return events}
const shotHit=(thrower:Hero,target:Hero)=>statsOf(target).hp-Math.round(shotOf(thrower).damage*statsOf(thrower).power);
{
 const s=ready();const ev=advance(s,{...emptyInput(),punch:true});assert.equal(s.fighters[1].hp,92,"punch damages in range");assert.ok(ev.includes("punch")&&ev.includes("hit"),"punch and hit events");
}
{
 const s=ready();s.fighters[1].x=700;advance(s,{...emptyInput(),punch:true});assert.equal(s.fighters[1].hp,100,"punch misses out of range");
}
{
 const s=ready();const ev=advance(s,{...emptyInput(),punch:true},{...emptyInput(),block:true});assert.equal(s.fighters[1].hp,99,"block reduces damage");assert.ok(ev.includes("block"));
}
{
 const s=ready();advance(s,{...emptyInput(),punch:true},{...emptyInput(),down:true});assert.equal(s.fighters[1].hp,100,"crouch evades standing punch");advance(s,{...emptyInput(),kick:true},{...emptyInput(),down:true},40);assert.ok(s.fighters[1].hp<100,"kick reaches crouched fighter");
}
{
 const s=ready();const ev=advance(s,{...emptyInput(),jump:true},emptyInput(),10);assert.ok(s.fighters[0].y>50,"jump leaves ground");assert.ok(ev.includes("jump"));const land=advance(s,emptyInput(),emptyInput(),90);assert.equal(s.fighters[0].y,0,"jump lands");assert.ok(land.includes("land"));
}
{
 const s=ready();s.fighters[0].energy=0;advance(s,{...emptyInput(),special:true},emptyInput(),30);assert.equal(s.fighters[1].hp,100,"special requires energy");s.fighters[0].energy=100;let shaken=false;const ev:string[]=[];for(let i=0;i<50;i++){step(s,[{...emptyInput(),special:true},emptyInput()]);ev.push(...s.events);if(s.shake>0&&s.flashFx>0)shaken=true}assert.equal(s.fighters[1].hp,77,"special projectile hits for its listed damage");assert.ok(s.fighters[0].energy<60,"special consumes energy");assert.ok(ev.includes("special")&&ev.includes("heavy"),"special launch and heavy hit events");assert.ok(shaken,"a special hit shakes and flashes");
}
{
 // Low shots (Marica's wave travels 26 px high) are jumped over; high ones (Véio's cloud at 110) are crouched under.
 const s=ready();s.fighters[0].energy=100;advance(s,{...emptyInput(),special:true},{...emptyInput(),jump:true},14);advance(s,emptyInput(),emptyInput(),36);assert.equal(s.fighters[1].hp,100,"a rising jump clears the low wave");
 const v=ready("veio","marica");v.fighters[0].energy=100;advance(v,{...emptyInput(),special:true},{...emptyInput(),down:true},60);assert.equal(v.fighters[1].hp,100,"crouching under the high cloud");
 const w=ready("veio","marica");w.fighters[0].energy=100;advance(w,{...emptyInput(),special:true},emptyInput(),70);assert.equal(w.fighters[1].hp,shotHit("veio","marica"),"standing takes the cloud, scaled by Véio's power");
}
{
 const s=ready();s.fighters[1].hp=1;const ev=advance(s,{...emptyInput(),punch:true});assert.equal(s.phase,"round");assert.equal(s.fighters[0].wins,1);assert.ok(ev.includes("ko"),"knockout event");assert.ok(s.freeze>0||s.clock<3.2,"knockout freezes the action for a moment");
 assert.equal(s.fighters[1].action,"thrown","the loser is launched");const x=s.fighters[1].x;advance(s,emptyInput(),emptyInput(),120);assert.equal(s.fighters[1].action,"down","and lands on the floor");assert.equal(s.fighters[1].y,0);assert.ok(s.fighters[1].x>x,"flying away from the winner");
 advance(s,emptyInput(),emptyInput(),420);assert.equal(s.round,2);assert.equal(s.fighters[1].hp,100);s.fighters[0].x=400;s.fighters[1].x=480;s.fighters[1].hp=1;advance(s,{...emptyInput(),punch:true});advance(s,emptyInput(),emptyInput(),240);assert.equal(s.phase,"over");const tick=s.tick;rematch(s);assert.ok(s.tick>tick,"rematch preserves network ordering");assert.equal(s.fighters[0].wins,0)
}
{
 const s=ready();s.paused=true;const x=s.fighters[0].x;advance(s,{...emptyInput(),right:true});assert.equal(s.fighters[0].x,x,"pause stops simulation")
}
{
 // Combo: a landed punch cancels into a second punch and a kick; the third hit is heavier. A missed punch does not chain.
 const s=ready();const p={...emptyInput(),punch:true};advance(s,p,emptyInput(),9);assert.equal(s.fighters[0].combo,1);advance(s,emptyInput(),emptyInput(),2);advance(s,p,emptyInput(),16);assert.equal(s.fighters[0].combo,2,"second punch chained on a new press");
 s.fighters[1].x=s.fighters[0].x+80;const k={...emptyInput(),kick:true};advance(s,emptyInput(),emptyInput(),1);const ev=advance(s,k,emptyInput(),20);assert.equal(s.fighters[0].combo,3,"kick finishes the chain");assert.ok(ev.includes("heavy"),"third hit is heavy");
 assert.ok(s.fighters[1].hp<=100-8-8-13-4,"combo damage adds up with the finisher bonus");
 const held=ready();advance(held,p,emptyInput(),25);assert.equal(held.fighters[1].hp,92,"holding the button does not chain");
 const m=ready();m.fighters[1].x=700;advance(m,p,emptyInput(),9);advance(m,emptyInput(),emptyInput(),2);advance(m,p,emptyInput(),16);assert.equal(m.fighters[0].combo,0,"no chain after a whiff");assert.equal(m.fighters[0].action,"punch");
}
{
 // Aerial kick: pressing kick in the air attacks on the way down; it lands on a standing rival and on a crouched one.
 const s=ready();advance(s,{...emptyInput(),jump:true},emptyInput(),6);assert.ok(s.fighters[0].y>0);advance(s,{...emptyInput(),kick:true},emptyInput(),4);assert.equal(s.fighters[0].action,"kick");assert.ok(s.fighters[0].air);
 advance(s,emptyInput(),emptyInput(),80);assert.ok(s.fighters[1].hp<100,"aerial kick connects");
 const c=ready();advance(c,{...emptyInput(),jump:true},{...emptyInput(),down:true},20);advance(c,{...emptyInput(),kick:true},{...emptyInput(),down:true},60);assert.ok(c.fighters[1].hp<100,"aerial kick reaches a crouched rival");
}
{
 // Throw: ignores the guard at arm's length, tosses the rival through the air; whiffing leaves the grabber locked longer.
 const s=ready();const ev=advance(s,{...emptyInput(),grab:true},{...emptyInput(),block:true},12);assert.ok(ev.includes("throw"),"throw connects through the block");assert.equal(s.fighters[1].hp,88,"throw damage ignores the guard");assert.equal(s.fighters[1].action,"thrown");assert.ok(s.fighters[1].y>0,"rival is airborne");
 advance(s,emptyInput(),emptyInput(),90);assert.equal(s.fighters[1].y,0);assert.ok(s.fighters[1].x>480+80,"thrown rival lands farther away");
 const m=ready();m.fighters[1].x=650;advance(m,{...emptyInput(),grab:true},emptyInput(),12);assert.equal(m.fighters[1].hp,100,"whiffed grab");assert.ok(m.fighters[0].lock>.4,"whiff recovery is long");
 const air=ready();advance(air,{...emptyInput(),grab:true},{...emptyInput(),jump:true},12);assert.equal(air.fighters[1].hp,100,"cannot grab a jumping rival");
}
{
 // Stats: heavy fighters carry more life and hit harder; light ones walk faster.
 const s=createState("lemmy-kilmister","sid-vicious");assert.equal(s.fighters[0].hp,116);assert.equal(s.fighters[0].maxHp,116);assert.equal(s.fighters[1].hp,90);
 begin(s);advance(s,emptyInput(),emptyInput(),181);const x0=s.fighters[0].x,x1=s.fighters[1].x;advance(s,{...emptyInput(),right:true},{...emptyInput(),right:true},30);
 assert.ok(s.fighters[1].x-x1>s.fighters[0].x-x0,"Sid walks faster than Lemmy");
 s.fighters[0].x=400;s.fighters[1].x=480;advance(s,{...emptyInput(),punch:true},emptyInput());assert.equal(s.fighters[1].hp,90-Math.round(8*1.1),"Lemmy's punch is scaled by his power");
}
{
 const s=createState("hiro","lobao");begin(s);advance(s,emptyInput(),emptyInput(),181);s.fighters[0].x=400;s.fighters[1].x=480;s.fighters[1].energy=100;
 advance(s,emptyInput(),{...emptyInput(),special:true},50);
 assert.equal(s.fighters[0].hp,shotHit("lobao","hiro"),"Lobão's special damages the opponent");
 assert.ok(s.fighters[1].energy<60,"Lobão's special consumes energy");
 rematch(s);assert.deepEqual(s.fighters.map(f=>f.hero),["hiro","lobao"],"rematch keeps selected roster");
 advance(s,emptyInput(),emptyInput(),181);s.fighters[0].x=400;s.fighters[1].x=480;s.fighters[0].hp=1;
 advance(s,emptyInput(),{...emptyInput(),punch:true});advance(s,emptyInput(),emptyInput(),420);
 assert.equal(s.round,2);assert.deepEqual(s.fighters.map(f=>f.hero),["hiro","lobao"],"next round keeps Lobão");
 const host=createState("lobao","marica");rematch(host);assert.equal(host.fighters[0].hero,"lobao","Lobão can be the host fighter");
}
for(const [a,b,label] of [["ratao","hiro","Ratão's bicycle"],["bale","marica","Bale's group"],["veio","bale","Véio's radioactive burp"],["catlaca","veio","Catlaca's bats"],["sergey","sid-vicious","Sergey's mushroom"],["iggy-pop","john-lennon","Iggy's dog"]] as [Hero,Hero,string][]){
 const s=ready(a,b);s.fighters[0].energy=100;advance(s,{...emptyInput(),special:true},emptyInput(),110);
 assert.equal(s.fighters[1].hp,shotHit(a,b),label+" special damages the opponent by its listed amount");
 assert.ok(s.fighters[0].energy<60,label+" special consumes energy");
 rematch(s);assert.deepEqual(s.fighters.map(f=>f.hero),[a,b],"rematch keeps "+a);
}
console.log("Combat checks passed: range, block, crouch, kick, jump, specials (low, high, heavy, light), knockout freeze, rounds, rematch, pause, combos, aerial kick, throw, stats and every roster's special.");
