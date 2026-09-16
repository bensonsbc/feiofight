import type {Action,Hero,State,Fighter} from "./game";
type Sprite={canvas:HTMLCanvasElement;anchor:number;base:number;scale:number};
type Atlas=Record<Hero,Record<string,Sprite[]>>;
const image=(src:string)=>new Promise<HTMLImageElement>((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src});
function cut(im:HTMLImageElement,rect:number[],refW:number,refH:number,standing:number,anchor:number,baseline:number):Sprite{
 const sx=im.naturalWidth/refW,sy=im.naturalHeight/refH;const [x,y,w,h]=rect;const c=document.createElement("canvas");c.width=Math.round(w*sx);c.height=Math.round(h*sy);const g=c.getContext("2d",{willReadFrequently:true})!;g.drawImage(im,x*sx,y*sy,w*sx,h*sy,0,0,c.width,c.height);
 const data=g.getImageData(0,0,c.width,c.height),p=data.data,W=c.width,H=c.height;const seen=new Uint8Array(W*H),q=new Int32Array(W*H);let head=0,tail=0;
 function add(n:number){if(n<0||n>=W*H||seen[n])return;seen[n]=1;const i=n*4,r=p[i],b=p[i+2],gg=p[i+1];if(Math.max(r,gg,b)-Math.min(r,gg,b)<30&&Math.min(r,gg,b)>100){q[tail++]=n;p[i+3]=0}}
 for(let x=0;x<W;x++){add(x);add((H-1)*W+x)}for(let y=0;y<H;y++){add(y*W);add(y*W+W-1)}
 // A painted floor line can enclose the background between the legs.
 for(let y=Math.round(H*.58);y<Math.round(baseline*sy)-8;y++)for(let x=0;x<W;x++)add(y*W+x);
 while(head<tail){const n=q[head++];if(n%W>0)add(n-1);if(n%W<W-1)add(n+1);add(n-W);add(n+W)}
 // Ignore the original ground shadow: the game places its own at a fixed floor.
 for(let y=Math.round(baseline*sy);y<H;y++)for(let x=0;x<W;x++)p[(y*W+x)*4+3]=0;
 g.putImageData(data,0,0);return {canvas:c,anchor:anchor*sx,base:baseline*sy,scale:176/(standing*sy)};
}
export class Renderer{
 atlas!:Atlas;bg!:HTMLImageElement;chicken!:Sprite;wolf!:Sprite;ready=false;
 async load(){const [hiro,marica,defense,lobao,bg]=await Promise.all([image("/assets/hiro-sheet.png"),image("/assets/marica-sheet.png"),image("/assets/marica-defense.png"),image("/assets/lobao-sheet.png"),image("/assets/arena.png")]);this.bg=bg;this.atlas={hiro:{},marica:{},lobao:{}};
  const names=["walk","jump","crouch","kick","punch","special","block"];
  const hx=[135,333,530,775],hy=[45,256,477,682,890,1080,1290],hb=[248,457,660,874,1071,1268,1485];
  for(let row=0;row<7;row++)this.atlas.hiro[names[row]]=[0,1,2,3].map(col=>{const x=hx[col],w=col===3?245:row===5&&col===2?245:col===2?245:200;return cut(hiro,[x,hy[row],w,hb[row]-hy[row]+1],1024,1536,177,col===3?76:110,hb[row]-hy[row])});
  const mx=[244,548,846,1160],my=[45,211,375,522,683,830],mb=[205,374,520,675,827,1006];
  for(let row=0;row<6;row++)this.atlas.marica[names[row]]=[0,1,2,3].map(col=>cut(marica,[mx[col],my[row],col===3?294:row===5&&col===2?320:290,mb[row]-my[row]+1],1536,1024,148,130,mb[row]-my[row]));
  this.atlas.marica.block=[0,1,2,3].map(col=>cut(defense,[col*512+24,174,480,410],2048,683,380,235,407));
  const lx=[140,334,529,785],ly=[58,279,489,689,896,1086,1293],lb=[264,475,677,883,1077,1288,1493],lw=[194,195,256,239],la=[110,120,121,87];
  for(let row=0;row<7;row++)this.atlas.lobao[names[row]]=[0,1,2,3].map(col=>cut(lobao,[lx[col],ly[row],row===5&&col===2?140:row===5&&col===3?145:lw[col],lb[row]-ly[row]+1],1024,1536,182,la[col],lb[row]-ly[row]));
  this.wolf=cut(lobao,[922,1124,96,92],1024,1536,92,48,91);
  this.chicken=cut(hiro,[661,1100,112,154],1024,1536,160,55,153);this.ready=true;
 }
 sprite(f:Fighter,s:State){let key:Action=f.action;let frame=0;if(key==="walk")frame=Math.floor(f.steps*9)%4;else if(key==="jump")frame=f.vy>100?1:2;else if(key==="crouch")frame=2;else if(key==="block")frame=f.flash>0?2:1;else if(["punch","kick","special"].includes(key)){const length=key==="punch"?.36:key==="kick"?.58:.95;frame=Math.min(3,Math.floor(f.time/length*4))}else{key="crouch";frame=0}if(s.phase==="over"&&f.hp===0)frame=2;return this.atlas[f.hero][key][frame]}
 draw(ctx:CanvasRenderingContext2D,s:State,time:number){const W=960,H=540;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,W,H);if(this.bg){ctx.drawImage(this.bg,0,0,W,H);ctx.fillStyle="rgba(3,7,19,.13)";ctx.fillRect(0,0,W,H)}if(!this.ready)return;
  for(const f of s.fighters){ctx.save();ctx.fillStyle="rgba(0,0,0,.45)";ctx.beginPath();ctx.ellipse(f.x,485,49,9,0,0,Math.PI*2);ctx.fill();const sp=this.sprite(f,s),breathe=f.action==="idle"?Math.sin(time*3)*1.3:0;ctx.translate(f.x,485-f.y+breathe);ctx.scale(f.face,1);if(f.flash>0)ctx.filter=f.action==="block"?"brightness(1.6)":"brightness(2) sepia(.7)";ctx.drawImage(sp.canvas,-sp.anchor*sp.scale,-sp.base*sp.scale,sp.canvas.width*sp.scale,sp.canvas.height*sp.scale);ctx.restore()}
  for(const p of s.projectiles){ctx.save();ctx.translate(p.x,485-p.y);ctx.scale(p.dir,1);if(p.hero==="hiro"){const sp=this.chicken;ctx.shadowColor="#bb68ff";ctx.shadowBlur=18;ctx.drawImage(sp.canvas,-32,-45,76,98)}else if(p.hero==="lobao"){ctx.shadowColor="#9cdbff";ctx.shadowBlur=18;ctx.drawImage(this.wolf.canvas,-40,-46,104,100)}else{ctx.shadowColor="#ffcb53";ctx.shadowBlur=18;ctx.strokeStyle="#ffdc6f";ctx.lineWidth=9;ctx.beginPath();ctx.arc(-12,0,39,-1.25,1.25);ctx.stroke();ctx.strokeStyle="#fff3b2";ctx.lineWidth=3;ctx.beginPath();ctx.arc(-7,0,31,-1.15,1.15);ctx.stroke()}ctx.restore()}
  if(s.hitFx){const fx=s.hitFx;ctx.save();ctx.translate(fx.x,485-fx.y);ctx.strokeStyle=fx.block?"#91e0ff":"#ffdc73";ctx.lineWidth=4;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*8,Math.sin(a)*8);ctx.lineTo(Math.cos(a)*27,Math.sin(a)*27);ctx.stroke()}ctx.restore()}
 }
}
