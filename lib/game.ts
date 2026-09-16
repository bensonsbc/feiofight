import { defaultOpponent, type Hero } from "./characters.ts";
export type { Hero } from "./characters.ts";
export type Input={left:boolean;right:boolean;jump:boolean;down:boolean;punch:boolean;kick:boolean;block:boolean;special:boolean};
export const emptyInput=():Input=>({left:false,right:false,jump:false,down:false,punch:false,kick:false,block:false,special:false});
export type Action="idle"|"walk"|"jump"|"crouch"|"punch"|"kick"|"special"|"block"|"hurt";
export type Fighter={hero:Hero;x:number;y:number;vy:number;face:number;hp:number;energy:number;wins:number;action:Action;time:number;lock:number;hit:boolean;stun:number;flash:number;steps:number};
export type Projectile={id:number;owner:number;x:number;y:number;dir:number;life:number;hero:Hero};
export type State={fighters:[Fighter,Fighter];projectiles:Projectile[];phase:"waiting"|"countdown"|"fight"|"round"|"over";timer:number;clock:number;round:number;winner:number;tick:number;connected:boolean;paused:boolean;hitFx:{x:number;y:number;life:number;block:boolean}|null};
function fighter(hero:Hero,x:number,face:number):Fighter{return {hero,x,y:0,vy:0,face,hp:100,energy:35,wins:0,action:"idle",time:0,lock:0,hit:false,stun:0,flash:0,steps:0}}
export function createState(hero:Hero="marica",opponent:Hero=defaultOpponent(hero)):State{return {fighters:[fighter(hero,270,1),fighter(opponent,690,-1)],projectiles:[],phase:"waiting",timer:99,clock:0,round:1,winner:-1,tick:0,connected:false,paused:false,hitFx:null}}
export function begin(s:State){if(s.phase!=="waiting")return;s.phase="countdown";s.clock=3;s.connected=true}
export function rematch(s:State){const n=createState(s.fighters[0].hero,s.fighters[1].hero);n.tick=s.tick+1;Object.assign(s,n);begin(s)}
function newRound(s:State){const wins=s.fighters.map(f=>f.wins);s.fighters=[fighter(s.fighters[0].hero,270,1),fighter(s.fighters[1].hero,690,-1)];s.fighters.forEach((f,i)=>f.wins=wins[i]);s.projectiles=[];s.timer=99;s.round++;s.phase="countdown";s.clock=3;s.winner=-1}
function damage(s:State,owner:number,value:number,x:number,y:number,projectile=false){const f=s.fighters[owner],t=s.fighters[1-owner];const blocked=t.action==="block"&&t.face===Math.sign(f.x-t.x)&&t.y<10;const amount=blocked?Math.max(1,Math.round(value*.12)):value;t.hp=Math.max(0,t.hp-amount);t.energy=Math.min(100,t.energy+5);f.energy=Math.min(100,f.energy+(projectile?0:7));t.flash=.13;t.stun=blocked?.1:.22;t.x=Math.max(50,Math.min(910,t.x+f.face*(blocked?7:18)));if(!blocked){t.action="hurt";t.lock=0} s.hitFx={x,y,life:.16,block:blocked}}
export function step(s:State,inputs:[Input,Input],dt=1/60){
 s.tick++;if(s.hitFx){s.hitFx.life-=dt;if(s.hitFx.life<=0)s.hitFx=null}if(s.phase==="waiting"||s.paused||!s.connected)return;
 if(s.phase==="countdown"){s.clock-=dt;if(s.clock<=0)s.phase="fight";return}
 if(s.phase==="round"){s.clock-=dt;if(s.clock<=0){if(s.fighters.some(f=>f.wins>=2))s.phase="over";else newRound(s)}return}
 if(s.phase==="over")return;s.timer=Math.max(0,s.timer-dt);
 s.fighters.forEach((f,i)=>{
  const input=inputs[i],t=s.fighters[1-i];f.face=f.x<t.x?1:-1;f.time+=dt;f.flash=Math.max(0,f.flash-dt);f.stun=Math.max(0,f.stun-dt);f.energy=Math.min(100,f.energy+dt*4.5);
  if(f.y>0||f.vy>0){f.y+=f.vy*dt;f.vy-=1450*dt;if(f.y<=0){f.y=0;f.vy=0}}
  if(f.stun>0)return;
  if(f.lock>0){f.lock-=dt;const impact=f.action==="punch"?.12:f.action==="kick"?.22:.33;
   if(!f.hit&&f.time>=impact){f.hit=true;if(f.action==="special"){s.projectiles.push({id:s.tick*2+i,owner:i,x:f.x+f.face*55,y:f.y+65,dir:f.face,life:2,hero:f.hero})}else{const range=f.action==="kick"?140:100;const crouched=t.action==="crouch";if(Math.abs(t.x-f.x)<range&&Math.abs(t.y-f.y)<(crouched?80:125)&&!(f.action==="punch"&&crouched&&f.y===0))damage(s,i,f.action==="kick"?13:8,t.x,t.y+100)}}
   return;
  }
  if(input.block&&f.y===0){f.action="block";return}
  if(input.special&&f.energy>=60){f.energy-=60;f.action="special";f.lock=.95;f.time=0;f.hit=false;return}
  if(input.kick||input.punch){f.action=input.kick?"kick":"punch";f.lock=input.kick?.58:.36;f.time=0;f.hit=false;return}
  if(input.jump&&f.y===0){f.vy=650;f.y=.1;f.time=0}
  if(input.down&&f.y===0){f.action="crouch";return}
  const dir=Number(input.right)-Number(input.left);if(dir){f.x=Math.max(50,Math.min(910,f.x+dir*235*dt));f.steps+=dt}f.action=f.y>0?"jump":dir?"walk":"idle";
 });
 const [a,b]=s.fighters;const gap=b.x-a.x;if(Math.abs(gap)<68&&Math.abs(a.y-b.y)<110){const dir=gap>=0?1:-1,overlap=68-Math.abs(gap);a.x=Math.max(50,Math.min(910,a.x-dir*overlap/2));b.x=Math.max(50,Math.min(910,b.x+dir*overlap/2))}
 s.projectiles=s.projectiles.filter(p=>{p.x+=p.dir*470*dt;p.life-=dt;const t=s.fighters[1-p.owner];if(Math.abs(p.x-t.x)<48&&p.y>t.y+5&&p.y<t.y+(t.action==="crouch"?90:165)){damage(s,p.owner,23,t.x,p.y,true);return false}return p.life>0&&p.x>0&&p.x<960});
 if(a.hp===0||b.hp===0||s.timer===0){s.winner=a.hp===b.hp?-1:a.hp>b.hp?0:1;if(s.winner>=0)s.fighters[s.winner].wins++;s.phase="round";s.clock=3.2;s.projectiles=[]}
}
