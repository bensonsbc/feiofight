import type {Action,Hero,State,Fighter} from "./game";
type Sprite={canvas:HTMLCanvasElement;anchor:number;base:number;scale:number};
type Atlas=Record<Hero,Record<string,Sprite[]>>;
const image=(src:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src});
function cut(im:HTMLImageElement,rect:number[],refW:number,refH:number,standing:number,anchor:number,baseline:number):Sprite{
 const sx=im.naturalWidth/refW,sy=im.naturalHeight/refH;const [x,y,w,h]=rect;const c=document.createElement("canvas");c.width=Math.round(w*sx);c.height=Math.round(h*sy);const g=c.getContext("2d")!;g.drawImage(im,x*sx,y*sy,w*sx,h*sy,0,0,c.width,c.height);
 // The sheets already carry a transparent background, baked by scripts/prepare-sheets.py.
 // Only the painted floor shadow is dropped here: the game draws its own at a fixed floor.
 g.clearRect(0,Math.round(baseline*sy),c.width,c.height);
 return {canvas:c,anchor:anchor*sx,base:baseline*sy,scale:176/(standing*sy)};
}
export class Renderer{
 atlas!:Atlas;bg!:HTMLImageElement;chicken!:Sprite;wolf!:Sprite;bike!:Sprite;miners!:Sprite;miner!:Sprite;skull!:Sprite;bats!:Sprite;ready=false;
 async load(){const [hiro,marica,defense,lobao,ratao,bale,veio,catlaca,bg]=await Promise.all([image("/assets/hiro-sheet.png"),image("/assets/marica-sheet.png"),image("/assets/marica-defense.png"),image("/assets/lobao-sheet.png"),image("/assets/ratao-sheet.png"),image("/assets/bale-sheet.png"),image("/assets/veio-sheet.png"),image("/assets/catlaca-sheet.png"),image("/assets/arena.png")]);this.bg=bg;this.atlas={hiro:{},marica:{},lobao:{},ratao:{},bale:{},veio:{},catlaca:{}};
  const names=["walk","jump","crouch","kick","punch","special","block"];
  const hx=[135,333,530,775],hy=[45,256,477,682,890,1080,1290],hb=[248,457,660,874,1071,1268,1485];
  for(let row=0;row<7;row++)this.atlas.hiro[names[row]]=[0,1,2,3].map(col=>{const x=hx[col],w=col===3?245:row===5&&col===2?245:col===2?245:200;return cut(hiro,[x,hy[row],w,hb[row]-hy[row]+1],1024,1536,177,col===3?76:110,hb[row]-hy[row])});
  const mx=[244,548,846,1160],my=[45,211,375,522,683,830],mb=[205,374,520,675,827,1006];
  for(let row=0;row<6;row++)this.atlas.marica[names[row]]=[0,1,2,3].map(col=>cut(marica,[mx[col],my[row],col===3?294:row===5&&col===2?320:290,mb[row]-my[row]+1],1536,1024,148,130,mb[row]-my[row]));
  this.atlas.marica.block=[0,1,2,3].map(col=>cut(defense,[col*512+24,174,480,410],2048,683,380,235,407));
  const lx=[140,334,529,785],ly=[58,279,489,689,896,1086,1293],lb=[264,475,677,883,1077,1288,1493],lw=[194,195,256,239],la=[110,120,121,87];
  for(let row=0;row<7;row++)this.atlas.lobao[names[row]]=[0,1,2,3].map(col=>cut(lobao,[lx[col],ly[row],row===5&&col===2?140:row===5&&col===3?145:lw[col],lb[row]-ly[row]+1],1024,1536,182,la[col],lb[row]-ly[row]));
  const rx=[150,337,528,775],ry=[55,270,476,682,889,1085,1295],rb=[264,473,677,882,1078,1289,1496],rw=[197,200,268,239],ra=[95,96,122,89];
  for(let row=0;row<7;row++)this.atlas.ratao[names[row]]=[0,1,2,3].map(col=>cut(ratao,[rx[col],ry[row],row===5&&col===2?145:row===5&&col===3?145:rw[col],rb[row]-ry[row]+1],1024,1536,183,ra[col],rb[row]-ry[row]));
  this.bike=cut(ratao,[884,1128,138,126],1024,1536,126,68,125);
  const bx=[150,337,528,775],by=[65,292,523,727,938,1145,1320],bb=[272,506,710,920,1133,1306,1511],bw=[197,200,260,245],ba=[106,96,131,91];
  for(let row=0;row<7;row++)if(row!==5)this.atlas.bale[names[row]]=[0,1,2,3].map(col=>cut(bale,[bx[col],by[row],bw[col],bb[row]-by[row]+1],1024,1536,171,ba[col],bb[row]-by[row]));
  const baleCall=cut(bale,[120,1145,145,162],1024,1536,171,72,161),baleRecover=cut(bale,[670,1145,115,162],1024,1536,171,58,161);
  this.atlas.bale.special=[baleCall,baleCall,baleRecover,baleRecover];
  this.miners=cut(bale,[778,1158,246,148],1024,1536,148,123,147);
  this.miner=cut(bale,[610,1158,67,148],1024,1536,148,33,147);
  const vx=[145,345,535,780],vy=[82,290,525,730,935,1140,1324],vb=[274,510,716,923,1136,1316,1520],vw=[195,190,245,210],va=[96,95,120,95];
  for(let row=0;row<7;row++)this.atlas.veio[names[row]]=[0,1,2,3].map(col=>cut(veio,[vx[col],vy[row],row===5&&col===2?125:row===5&&col===3?145:vw[col],vb[row]-vy[row]+1],1024,1536,184,va[col],vb[row]-vy[row]));
  this.skull=cut(veio,[650,1150,128,115],1024,1536,115,64,114);
  const cx=[120,330,530,780],cy=[78,292,518,724,930,1128,1325],cb=[284,510,714,920,1124,1320,1520],cw=[205,210,250,205],ca=[98,105,120,94];
  for(let row=0;row<7;row++)this.atlas.catlaca[names[row]]=[0,1,2,3].map(col=>cut(catlaca,[cx[col],cy[row],row===5&&col===2?160:row===5&&col===3?145:cw[col],cb[row]-cy[row]+1],1024,1536,185,ca[col],cb[row]-cy[row]));
  this.bats=cut(catlaca,[895,1148,125,140],1024,1536,140,62,139);
  this.wolf=cut(lobao,[922,1124,96,92],1024,1536,92,48,91);
  this.chicken=cut(hiro,[661,1100,112,154],1024,1536,160,55,153);this.ready=true;
 }
 sprite(f:Fighter,s:State){let key:Action=f.action;let frame=0;if(key==="walk")frame=Math.floor(f.steps*9)%4;else if(key==="jump")frame=f.vy>100?1:2;else if(key==="crouch")frame=2;else if(key==="block")frame=f.flash>0?2:1;else if(["punch","kick","special"].includes(key)){const length=key==="punch"?.36:key==="kick"?.58:.95;frame=Math.min(3,Math.floor(f.time/length*4))}else{key="crouch";frame=0}if(s.phase==="over"&&f.hp===0)frame=2;return this.atlas[f.hero][key][frame]}
 draw(ctx:CanvasRenderingContext2D,s:State,time:number){const W=960,H=540;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,W,H);if(this.bg){ctx.drawImage(this.bg,0,0,W,H);ctx.fillStyle="rgba(3,7,19,.13)";ctx.fillRect(0,0,W,H)}if(!this.ready)return;
  for(const f of s.fighters){ctx.save();const size=f.hero==="bale"?.78:1;ctx.fillStyle="rgba(0,0,0,.45)";ctx.beginPath();ctx.ellipse(f.x,485,49*size,9*size,0,0,Math.PI*2);ctx.fill();const sp=this.sprite(f,s),breathe=f.action==="idle"?Math.sin(time*3)*1.3:0;ctx.translate(f.x,485-f.y+breathe);ctx.scale(f.face,1);if(f.flash>0)ctx.filter=f.action==="block"?"brightness(1.6)":"brightness(2) sepia(.7)";ctx.drawImage(sp.canvas,-sp.anchor*sp.scale*size,-sp.base*sp.scale*size,sp.canvas.width*sp.scale*size,sp.canvas.height*sp.scale*size);ctx.restore()}
  for(const p of s.projectiles){ctx.save();ctx.translate(p.x,485-p.y);ctx.scale(p.dir,1);if(p.hero==="hiro"){const sp=this.chicken;ctx.shadowColor="#bb68ff";ctx.shadowBlur=18;ctx.drawImage(sp.canvas,-32,-45,76,98)}else if(p.hero==="lobao"){ctx.shadowColor="#9cdbff";ctx.shadowBlur=18;ctx.drawImage(this.wolf.canvas,-40,-46,104,100)}else if(p.hero==="ratao"){ctx.rotate(time*10*p.dir);ctx.shadowColor="#ff9c70";ctx.shadowBlur=14;ctx.drawImage(this.bike.canvas,-58,-52,116,104)}else if(p.hero==="bale"){ctx.shadowColor="#8ff0a4";ctx.shadowBlur=12;ctx.drawImage(this.miners.canvas,-88,-45,176,106);ctx.drawImage(this.miner.canvas,75,-38,42,84)}else if(p.hero==="veio"){ctx.shadowColor="#62ff55";ctx.shadowBlur=22;ctx.drawImage(this.skull.canvas,-55,-50,110,100)}else if(p.hero==="catlaca"){ctx.shadowColor="#c874ff";ctx.shadowBlur=18;ctx.drawImage(this.bats.canvas,-60,-50,120,100)}else{ctx.shadowColor="#ffcb53";ctx.shadowBlur=18;ctx.strokeStyle="#ffdc6f";ctx.lineWidth=9;ctx.beginPath();ctx.arc(-12,0,39,-1.25,1.25);ctx.stroke();ctx.strokeStyle="#fff3b2";ctx.lineWidth=3;ctx.beginPath();ctx.arc(-7,0,31,-1.15,1.15);ctx.stroke()}ctx.restore()}
  if(s.hitFx){const fx=s.hitFx;ctx.save();ctx.translate(fx.x,485-fx.y);ctx.strokeStyle=fx.block?"#91e0ff":"#ffdc73";ctx.lineWidth=4;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*8,Math.sin(a)*8);ctx.lineTo(Math.cos(a)*27,Math.sin(a)*27);ctx.stroke()}ctx.restore()}
 }
}
