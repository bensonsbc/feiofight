import assert from "node:assert/strict";
import {createState,emptyInput,begin,step,rematch} from "../lib/game.ts";
function ready(){const s=createState();begin(s);for(let i=0;i<181;i++)step(s,[emptyInput(),emptyInput()]);s.fighters[0].x=400;s.fighters[1].x=480;return s}
function advance(s:ReturnType<typeof ready>,a=emptyInput(),b=emptyInput(),n=25){for(let i=0;i<n;i++)step(s,[a,b])}
{
 const s=ready();advance(s,{...emptyInput(),punch:true});assert.equal(s.fighters[1].hp,92,"punch damages in range");
}
{
 const s=ready();s.fighters[1].x=700;advance(s,{...emptyInput(),punch:true});assert.equal(s.fighters[1].hp,100,"punch misses out of range");
}
{
 const s=ready();advance(s,{...emptyInput(),punch:true},{...emptyInput(),block:true});assert.equal(s.fighters[1].hp,99,"block reduces damage");
}
{
 const s=ready();advance(s,{...emptyInput(),punch:true},{...emptyInput(),down:true});assert.equal(s.fighters[1].hp,100,"crouch evades standing punch");advance(s,{...emptyInput(),kick:true},{...emptyInput(),down:true},40);assert.ok(s.fighters[1].hp<100,"kick reaches crouched fighter");
}
{
 const s=ready();advance(s,{...emptyInput(),jump:true},emptyInput(),10);assert.ok(s.fighters[0].y>50,"jump leaves ground");advance(s,emptyInput(),emptyInput(),90);assert.equal(s.fighters[0].y,0,"jump lands");
}
{
 const s=ready();s.fighters[0].energy=0;advance(s,{...emptyInput(),special:true},emptyInput(),30);assert.equal(s.fighters[1].hp,100,"special requires energy");s.fighters[0].energy=100;advance(s,{...emptyInput(),special:true},emptyInput(),50);assert.equal(s.fighters[1].hp,77,"special projectile hits");assert.ok(s.fighters[0].energy<60,"special consumes energy");
}
{
 const s=ready();s.fighters[1].hp=1;advance(s,{...emptyInput(),punch:true});assert.equal(s.phase,"round");assert.equal(s.fighters[0].wins,1);advance(s,emptyInput(),emptyInput(),380);assert.equal(s.round,2);assert.equal(s.fighters[1].hp,100);s.fighters[0].x=400;s.fighters[1].x=480;s.fighters[1].hp=1;advance(s,{...emptyInput(),punch:true});advance(s,emptyInput(),emptyInput(),200);assert.equal(s.phase,"over");const tick=s.tick;rematch(s);assert.ok(s.tick>tick,"rematch preserves network ordering");assert.equal(s.fighters[0].wins,0)
}
{
 const s=ready();s.paused=true;const x=s.fighters[0].x;advance(s,{...emptyInput(),right:true});assert.equal(s.fighters[0].x,x,"pause stops simulation")
}
console.log("Combat checks passed: range, block, crouch, kick, jump, special, rounds, rematch and pause.");
