import type {GameEvent} from "./game";
import type {Roster} from "./characters";
/**
 * Every sound is synthesised on the spot with the Web Audio API: no files to download, and the
 * chiptune feel matches the pixel art. `play` maps a game event to a short effect; `music` runs a
 * looping four-bar pattern per roster on a lookahead scheduler, the usual way to keep Web Audio
 * timing steady while the main thread is busy drawing.
 */
export class Sfx{
 ctx:AudioContext|null=null;master:GainNode|null=null;enabled=false;musicOn=false;private timer:ReturnType<typeof setInterval>|null=null;private next=0;private stepIndex=0;private roster:Roster="turma";private last:Partial<Record<GameEvent,number>>={};
 enable(on:boolean){this.enabled=on;if(on){this.context().resume().catch(()=>{})}else this.stopMusic()}
 private context(){if(!this.ctx){this.ctx=new AudioContext();this.master=this.ctx.createGain();this.master.gain.value=.5;this.master.connect(this.ctx.destination)}return this.ctx}
 private tone(freq:number,to:number,dur:number,type:OscillatorType,gain:number,at=0){const c=this.context(),o=c.createOscillator(),g=c.createGain(),t=c.currentTime+at;o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,to),t+dur);g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.0008,t+dur);o.connect(g);g.connect(this.master!);o.start(t);o.stop(t+dur+.02)}
 private noise(dur:number,gain:number,cutoff:number,at=0){const c=this.context(),n=Math.round(c.sampleRate*dur),buf=c.createBuffer(1,n,c.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);const src=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),t=c.currentTime+at;src.buffer=buf;f.type="lowpass";f.frequency.value=cutoff;g.gain.value=gain;src.connect(f);f.connect(g);g.connect(this.master!);src.start(t)}
 /** One effect per event; the same event within 40 ms is dropped so a double hit does not clip. */
 play(e:GameEvent){if(!this.enabled)return;const now=performance.now();if(now-(this.last[e]||0)<40)return;this.last[e]=now;try{switch(e){
  case "punch":this.noise(.06,.18,1800);break;
  case "kick":this.noise(.09,.22,1200);this.tone(220,90,.09,"triangle",.08);break;
  case "grab":this.tone(160,240,.08,"square",.05);break;
  case "hit":this.tone(150,42,.1,"square",.12);this.noise(.05,.15,900);break;
  case "heavy":this.tone(110,30,.18,"square",.16);this.noise(.12,.3,700);break;
  case "throw":this.tone(300,60,.25,"sawtooth",.12);this.noise(.2,.25,500,.12);break;
  case "block":this.tone(1200,900,.05,"square",.06);this.noise(.03,.1,4000);break;
  case "special":this.tone(180,720,.3,"sawtooth",.1);this.tone(90,360,.3,"square",.06);break;
  case "jump":this.tone(240,520,.12,"square",.05);break;
  case "land":this.noise(.04,.1,600);break;
  case "ko":this.tone(420,40,.9,"sawtooth",.2);this.noise(.5,.35,400);this.groan();break;
  case "round":this.tone(440,440,.1,"square",.08);this.tone(660,660,.1,"square",.08,.15);break;
  case "fight":this.tone(880,880,.18,"square",.1);break;
  case "over":this.tone(523,523,.12,"square",.09);this.tone(659,659,.12,"square",.09,.14);this.tone(784,784,.3,"square",.1,.28);break;
 }}catch{}}
 /** A wobbling voice-like groan: a sawtooth with vibrato through a vowel-shaped band-pass, sliding down. */
 private groan(){const c=this.context(),o=c.createOscillator(),lfo=c.createOscillator(),lg=c.createGain(),f=c.createBiquadFilter(),g=c.createGain(),t=c.currentTime+.05;o.type="sawtooth";o.frequency.setValueAtTime(230,t);o.frequency.exponentialRampToValueAtTime(95,t+.75);lfo.frequency.value=7;lg.gain.value=14;lfo.connect(lg);lg.connect(o.frequency);f.type="bandpass";f.frequency.setValueAtTime(700,t);f.frequency.exponentialRampToValueAtTime(380,t+.75);f.Q.value=3;g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.22,t+.06);g.gain.exponentialRampToValueAtTime(.001,t+.8);o.connect(f);f.connect(g);g.connect(this.master!);o.start(t);lfo.start(t);o.stop(t+.85);lfo.stop(t+.85)}
 /** Four bars of bass, kick, hat and a lead, different per roster, looped until `stopMusic`. */
 music(roster:Roster){this.roster=roster;if(!this.enabled||this.musicOn)return;this.musicOn=true;const c=this.context();this.next=c.currentTime+.05;this.stepIndex=0;this.timer=setInterval(()=>this.schedule(),90)}
 stopMusic(){this.musicOn=false;if(this.timer){clearInterval(this.timer);this.timer=null}}
 private schedule(){const c=this.ctx!;const rock=this.roster==="rockstar";const stepLen=60/(rock?152:118)/4;
  const bass=rock?[40,40,52,40,47,40,52,55, 40,40,52,40,47,45,43,42, 45,45,57,45,52,45,57,60, 43,43,55,43,50,48,47,45]:[36,36,48,36,43,36,48,46, 36,36,48,36,43,41,39,38, 41,41,53,41,48,41,53,51, 39,39,51,39,46,44,43,41];
  const lead=rock?[64,0,67,0,64,0,62,0, 60,0,0,62,64,0,0,0, 67,0,71,0,67,0,66,0, 64,0,0,62,60,0,0,0]:[0,60,0,64,0,67,0,72, 0,0,71,0,67,0,64,0, 0,65,0,69,0,72,0,77, 0,0,76,0,72,0,69,0];
  while(this.next<c.currentTime+.25){const i=this.stepIndex%32,t=this.next-c.currentTime;
   const hz=(n:number)=>440*Math.pow(2,(n-69)/12);
   this.tone(hz(bass[i]),hz(bass[i]),stepLen*.9,rock?"sawtooth":"triangle",rock?.07:.09,t);
   if(i%4===0)this.tone(150,40,.12,"sine",.2,t);
   if(i%2===1)this.noise(.03,rock?.07:.05,6000,t);
   if(i%8===4)this.noise(.1,.1,2500,t);
   if(lead[i])this.tone(hz(lead[i]),hz(lead[i]),stepLen*1.6,"square",.035,t);
   this.next+=stepLen;this.stepIndex++;
  }
 }
}
