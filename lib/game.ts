import { defaultOpponent, shotOf, statsOf, type Hero } from "./characters.ts";
export type { Hero } from "./characters.ts";
export const INPUT_KEYS=["left","right","jump","down","punch","kick","block","special","grab"] as const;
export type Input=Record<(typeof INPUT_KEYS)[number],boolean>;
export const emptyInput=():Input=>({left:false,right:false,jump:false,down:false,punch:false,kick:false,block:false,special:false,grab:false});
export type Action="idle"|"walk"|"jump"|"crouch"|"punch"|"kick"|"special"|"block"|"hurt"|"grab"|"thrown"|"down";
/** Sounds and effects the page reacts to; the list only holds what happened during the last step. */
export type GameEvent="punch"|"kick"|"grab"|"throw"|"special"|"hit"|"heavy"|"block"|"jump"|"land"|"ko"|"round"|"fight"|"over";
export type Fighter={hero:Hero;x:number;y:number;vy:number;vx:number;face:number;hp:number;maxHp:number;energy:number;wins:number;action:Action;time:number;lock:number;hit:boolean;stun:number;flash:number;steps:number;air:boolean;combo:number;comboTime:number;landed:boolean;attackHeld:boolean};
export type Projectile={id:number;owner:number;x:number;y:number;dir:number;life:number;hero:Hero;speed:number;damage:number};
export type State={fighters:[Fighter,Fighter];projectiles:Projectile[];phase:"waiting"|"countdown"|"fight"|"round"|"over";timer:number;clock:number;round:number;winner:number;tick:number;connected:boolean;paused:boolean;hitFx:{x:number;y:number;life:number;block:boolean}|null;events:GameEvent[];shake:number;freeze:number;flashFx:number};
function fighter(hero:Hero,x:number,face:number):Fighter{const hp=statsOf(hero).hp;return {hero,x,y:0,vy:0,vx:0,face,hp,maxHp:hp,energy:35,wins:0,action:"idle",time:0,lock:0,hit:false,stun:0,flash:0,steps:0,air:false,combo:0,comboTime:0,landed:false,attackHeld:false}}
export function createState(hero:Hero="marica",opponent:Hero=defaultOpponent(hero)):State{return {fighters:[fighter(hero,270,1),fighter(opponent,690,-1)],projectiles:[],phase:"waiting",timer:99,clock:0,round:1,winner:-1,tick:0,connected:false,paused:false,hitFx:null,events:[],shake:0,freeze:0,flashFx:0}}
export function begin(s:State){if(s.phase!=="waiting")return;s.phase="countdown";s.clock=3;s.connected=true;s.events.push("round")}
export function rematch(s:State){const n=createState(s.fighters[0].hero,s.fighters[1].hero);n.tick=s.tick+1;Object.assign(s,n);begin(s)}
function newRound(s:State){const wins=s.fighters.map(f=>f.wins);s.fighters=[fighter(s.fighters[0].hero,270,1),fighter(s.fighters[1].hero,690,-1)];s.fighters.forEach((f,i)=>f.wins=wins[i]);s.projectiles=[];s.timer=99;s.round++;s.phase="countdown";s.clock=3;s.winner=-1;s.events.push("round")}
const clampX=(x:number)=>Math.max(50,Math.min(910,x));
/** Gravity for an airborne fighter; a thrown one lands hurt, a knocked-out one stays down. */
function fly(s:State,f:Fighter,dt:number){if(f.y>0||f.vy>0){f.y+=f.vy*dt;f.vy-=1450*dt;if(f.vx)f.x=clampX(f.x+f.vx*dt);if(f.y<=0){f.y=0;f.vy=0;f.vx=0;if(f.action==="thrown"){f.action=f.hp===0?"down":"hurt";f.stun=f.hp===0?9:.35;s.shake=Math.max(s.shake,5);s.events.push("land")}else if(f.air){s.events.push("land");if(f.lock>0&&(f.action==="punch"||f.action==="kick"))f.lock=Math.min(f.lock,.08)}f.air=false}}}
/**
 * Apply a hit from `owner` to the other fighter. Blocking cuts damage to 12% unless the hit is a
 * throw. Heavy hits (kicks, throws, projectiles, the third hit of a combo) shake the screen and
 * push farther. A knockout freezes the action for a moment before the round ends.
 */
function damage(s:State,owner:number,value:number,x:number,y:number,opts:{projectile?:boolean;heavy?:boolean;unblockable?:boolean}={}){
 const f=s.fighters[owner],t=s.fighters[1-owner];const blocked=!opts.unblockable&&t.action==="block"&&t.face===Math.sign(f.x-t.x)&&t.y<10;
 const amount=blocked?Math.max(1,Math.round(value*.12)):Math.round(value);
 t.hp=Math.max(0,t.hp-amount);t.energy=Math.min(100,t.energy+5);f.energy=Math.min(100,f.energy+(opts.projectile?0:7));
 t.flash=.13;t.stun=blocked?.1:opts.heavy?.3:.22;t.x=clampX(t.x+f.face*(blocked?7:opts.heavy?30:18));
 if(!blocked&&t.action!=="thrown"){t.action="hurt";t.lock=0;t.combo=0}
 s.hitFx={x,y,life:.16,block:blocked};s.events.push(blocked?"block":opts.heavy?"heavy":"hit");
 if(!blocked&&opts.heavy)s.shake=Math.max(s.shake,opts.projectile?5:4);
 // Knockout: the loser is launched away from the winner and lands on their back.
 if(t.hp===0){s.freeze=.42;s.shake=10;s.events.push("ko");t.action="thrown";t.stun=9;t.y=Math.max(t.y,.1);t.vy=430;t.vx=f.face*250;t.lock=0}
 return !blocked;
}
function startAttack(f:Fighter,kind:"punch"|"kick",s:State){f.action=kind;f.lock=kind==="kick"?.58:.36;f.time=0;f.hit=false;f.landed=false;if(f.y>0)f.air=true;s.events.push(kind)}
export function step(s:State,inputs:[Input,Input],dt=1/60){
 s.tick++;s.events=[];if(s.hitFx){s.hitFx.life-=dt;if(s.hitFx.life<=0)s.hitFx=null}s.shake=Math.max(0,s.shake-dt*28);s.flashFx=Math.max(0,s.flashFx-dt);
 if(s.phase==="waiting"||s.paused||!s.connected)return;
 if(s.freeze>0){s.freeze-=dt;return}
 if(s.phase==="countdown"){s.clock-=dt;if(s.clock<=0){s.phase="fight";s.events.push("fight")}return}
 if(s.phase==="round"){s.clock-=dt;for(const f of s.fighters)fly(s,f,dt);if(s.clock<=0){if(s.fighters.some(f=>f.wins>=2)){s.phase="over";s.events.push("over")}else newRound(s)}return}
 if(s.phase==="over"){for(const f of s.fighters)fly(s,f,dt);return}s.timer=Math.max(0,s.timer-dt);
 s.fighters.forEach((f,i)=>{
  const input=inputs[i],t=s.fighters[1-i],st=statsOf(f.hero);if(f.action!=="thrown")f.face=f.x<t.x?1:-1;f.time+=dt;f.flash=Math.max(0,f.flash-dt);f.stun=Math.max(0,f.stun-dt);f.energy=Math.min(100,f.energy+dt*4.5);
  f.comboTime=Math.max(0,f.comboTime-dt);if(f.comboTime===0)f.combo=0;
  fly(s,f,dt);
  const pressed=(input.punch||input.kick)&&!f.attackHeld;f.attackHeld=input.punch||input.kick;
  if(f.stun>0)return;
  if(f.lock>0){f.lock-=dt;const impact=f.action==="punch"?.12:f.action==="kick"?.22:f.action==="grab"?.14:f.hero==="ratao"?.55:.33;
   if(!f.hit&&f.time>=impact){f.hit=true;
    if(f.action==="special"){const shot=shotOf(f.hero);s.projectiles.push({id:s.tick*2+i,owner:i,x:f.x+f.face*55,y:f.y+shot.height,dir:f.face,life:2.2,hero:f.hero,speed:shot.speed,damage:Math.round(shot.damage*st.power)});s.events.push("special")}
    else if(f.action==="grab"){
     // A throw ignores the guard but only works on a grounded rival at arm's length; missing it leaves the grabber open.
     if(Math.abs(t.x-f.x)<88&&t.y<10&&f.y===0&&t.action!=="thrown"){damage(s,i,12*st.power,t.x,t.y+90,{heavy:true,unblockable:true});t.action="thrown";t.stun=.75;t.y=.1;t.vy=390;t.vx=f.face*270;t.lock=0;s.events.push("throw");f.landed=true}else f.lock=.62;
    }else{
     const range=f.action==="kick"?(f.air?120:140):100,crouched=t.action==="crouch",targetTop=t.y+(crouched?90:165);
     const overlap=targetTop>f.y+20&&f.y+120>t.y;
     if(Math.abs(t.x-f.x)<range&&overlap&&!(f.action==="punch"&&crouched&&f.y===0)){
      const third=f.combo>=2,base=(f.action==="kick"?13:8)*st.power+(third?4:0);
      if(damage(s,i,base,t.x,t.y+100,{heavy:f.action==="kick"||third})){f.combo++;f.comboTime=1.1;f.landed=true}
     }
    }
   }
   // Chain: a landed punch or kick can be cancelled into the next attack, up to three hits.
   if(f.hit&&f.landed&&!f.air&&f.lock<.2&&f.combo<3&&f.action!=="grab"&&pressed)startAttack(f,input.kick?"kick":"punch",s);
   return;
  }
  if(input.block&&f.y===0){f.action="block";return}
  if(input.special&&f.energy>=60){f.energy-=60;f.action="special";f.lock=.95;f.time=0;f.hit=false;return}
  if(input.grab&&f.y===0){f.action="grab";f.lock=.5;f.time=0;f.hit=false;f.landed=false;s.events.push("grab");return}
  if(input.kick||input.punch){startAttack(f,input.kick?"kick":"punch",s);return}
  if(input.jump&&f.y===0){f.vy=650;f.y=.1;f.time=0;f.air=true;s.events.push("jump")}
  if(input.down&&f.y===0){f.action="crouch";return}
  const dir=Number(input.right)-Number(input.left);if(dir){f.x=clampX(f.x+dir*235*st.speed*dt);f.steps+=dt}f.action=f.y>0?"jump":dir?"walk":"idle";
 });
 const [a,b]=s.fighters;const gap=b.x-a.x;if(Math.abs(gap)<68&&Math.abs(a.y-b.y)<110){const dir=gap>=0?1:-1,overlap=68-Math.abs(gap);a.x=clampX(a.x-dir*overlap/2);b.x=clampX(b.x+dir*overlap/2)}
 s.projectiles=s.projectiles.filter(p=>{p.x+=p.dir*p.speed*dt;p.life-=dt;const t=s.fighters[1-p.owner],height=(t.action==="crouch"?90:165)*statsOf(t.hero).height;if(Math.abs(p.x-t.x)<48&&p.y>t.y+5&&p.y<t.y+height){damage(s,p.owner,p.damage,t.x,p.y,{projectile:true,heavy:true});s.flashFx=.12;return false}return p.life>0&&p.x>0&&p.x<960});
 if(a.hp===0||b.hp===0||s.timer===0){s.winner=a.hp===b.hp?-1:a.hp>b.hp?0:1;if(s.winner>=0)s.fighters[s.winner].wins++;s.phase="round";s.clock=3.2;s.projectiles=[]}
}
