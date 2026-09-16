import {emptyInput,type Input,type State} from "./game.ts";
import {heroesOf,isBoss,rosterOf,type Hero} from "./characters.ts";

export type Difficulty="facil"|"normal"|"dificil";
export const DIFFICULTIES:{id:Difficulty;name:string;hint:string}[]=[{id:"facil",name:"FÁCIL",hint:"Reage devagar e defende pouco."},{id:"normal",name:"NORMAL",hint:"A curva padrão do fliperama."},{id:"dificil",name:"DIFÍCIL",hint:"Começa como a etapa cinco do normal."}];

/**
 * Opponents a solo player must beat: the rest of their roster. With a generator the order is
 * shuffled (Fisher–Yates), so every run is a different sequence; the roster boss always comes last.
 * Difficulty is tied to the stage, not the opponent, so it still rises fight by fight.
 */
export function ladder(hero:Hero,rng?:()=>number):Hero[]{
 const all=heroesOf(rosterOf(hero)).filter(h=>h!==hero),boss=all.filter(isBoss),rest=all.filter(h=>!isBoss(h));
 if(rng)for(let i=rest.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]]}
 return [...rest,...boss];
}

/**
 * Stage n → reaction time and odds. Later stages react faster, block more and use specials more;
 * the boss goes one level beyond the top stage. Easy shifts the curve two stages down and slows
 * the reaction; hard starts where normal peaks.
 */
export function levelFor(stage:number,boss=false,difficulty:Difficulty="normal"){
 const shift=difficulty==="facil"?-2:difficulty==="dificil"?5:0;
 const l=boss?(difficulty==="facil"?5:6):Math.max(0,Math.min(difficulty==="dificil"?6:5,stage+shift));
 const slow=difficulty==="facil"?.08:0;
 return {reaction:Math.max(.08,.34-.04*l)+slow,block:Math.min(.95,.25+.11*l),special:Math.min(.95,.35+.1*l),aggression:Math.min(.98,.5+.08*l),dodge:Math.min(.92,.2+.12*l),grab:Math.min(.6,.1+.08*l)};
}

export type Brain={rng:()=>number;plan:Input;until:number;difficulty:Difficulty};

/** Small deterministic generator (xorshift32) so tests are reproducible. */
export function createBrain(seed=1,difficulty:Difficulty="normal"):Brain{let s=(seed>>>0)||1;const rng=()=>{s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return (s%100000)/100000};return {rng,plan:emptyInput(),until:0,difficulty}}

/**
 * Decide the computer fighter's input for this simulation step. A decision is held for one
 * reaction interval so the fighter does not jitter; the interval shrinks with the stage.
 */
export function think(s:State,i:number,b:Brain,dt:number,stage:number):Input{
 const me=s.fighters[i],foe=s.fighters[1-i];
 if(s.phase!=="fight"){b.plan=emptyInput();b.until=0;return b.plan}
 b.until-=dt;if(b.until>0)return b.plan;
 const L=levelFor(stage,isBoss(me.hero),b.difficulty),r=b.rng,dist=Math.abs(foe.x-me.x),toward=foe.x>me.x?1:-1,plan=emptyInput();
 const forward=()=>{if(toward>0)plan.right=true;else plan.left=true},back=()=>{if(toward>0)plan.left=true;else plan.right=true};
 b.until=L.reaction*(.7+.6*r());
 const incoming=s.projectiles.some(p=>p.owner!==i&&Math.sign(me.x-p.x)===p.dir&&Math.abs(p.x-me.x)<300);
 const low=s.projectiles.some(p=>p.owner!==i&&Math.sign(me.x-p.x)===p.dir&&Math.abs(p.x-me.x)<300&&p.y<40);
 const foeAttacking=(foe.action==="punch"||foe.action==="kick")&&foe.lock>0&&dist<190;
 if(me.y>0){if(dist<130&&r()<L.aggression)plan.kick=true;else forward()}
 else if(incoming&&r()<L.dodge){if(low||r()<.5)plan.jump=true;else plan.block=true}
 else if(foeAttacking&&r()<L.block)plan.block=true;
 else if(foe.action==="block"&&dist<80&&r()<L.grab)plan.grab=true;
 else if(me.energy>=60&&dist>200&&r()<L.special)plan.special=true;
 else if(dist<100){if(r()<L.aggression){if(r()<.6)plan.punch=true;else plan.kick=true}else{back();b.until=.25}}
 else if(dist<150){if(r()<L.aggression*.8)plan.kick=true;else forward()}
 else{forward();if(me.y===0&&r()<.06)plan.jump=true}
 b.plan=plan;return plan;
}
