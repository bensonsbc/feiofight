"use client";
import {useEffect,useRef,useState} from "react";
import {begin,createState,emptyInput,rematch,step,type Hero,type Input,type State} from "../lib/game";
import {Renderer} from "../lib/render";
import {RoomNetwork,roomRequest,type Session,type Member} from "../lib/network";
import { CHARACTERS, HEROES, defaultOpponent, isHero } from "../lib/characters";
const title=(h:string)=>isHero(h)?CHARACTERS[h].name:"LUTADOR";
type RoomInfo={code:string;hostName:string;hostHero:Hero;rivalName:string|null;rivalHero:Hero|null;spectators:number};
const keyMap:Record<string,keyof Input>={KeyA:"left",KeyD:"right",KeyW:"jump",KeyS:"down",KeyJ:"punch",KeyK:"kick",KeyL:"block",KeyI:"special"};
export default function Home(){
 const [hero,setHero]=useState<Hero>("marica"),[name,setName]=useState(""),[code,setCode]=useState(""),[session,setSession]=useState<Session|null>(null),[members,setMembers]=useState<Member[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(""),[copied,setCopied]=useState(""),[loaded,setLoaded]=useState(false),[sound,setSound]=useState(false),[direct,setDirect]=useState(false),[onlineError,setOnlineError]=useState(""),[fallback,setFallback]=useState(false),[view,setView]=useState<State>(createState()),[training,setTraining]=useState(false),[latency,setLatency]=useState(0),[room,setRoom]=useState<RoomInfo|null>(null);
 const held=useRef<Input>(emptyInput()),pulse=useRef<Partial<Record<keyof Input,number>>>({}); const canvas=useRef<HTMLCanvasElement>(null),stage=useRef<HTMLDivElement>(null),state=useRef<State>(createState()),input=useRef<Input>(emptyInput()),net=useRef<RoomNetwork|null>(null),renderer=useRef<Renderer|null>(null),audio=useRef<AudioContext|null>(null),soundOn=useRef(false),sessionRef=useRef<Session|null>(null),trainingRef=useRef(false),visible=useRef(true),rivalId=useRef<string|null>(null),autoWatch=useRef("");
 useEffect(()=>{soundOn.current=sound},[sound]);
 useEffect(()=>{const q=new URLSearchParams(location.search);const sala=(q.get("sala")||"").toUpperCase();if(sala)setCode(sala);if(q.get("assistir")==="1"&&/^[A-Z2-9]{8}$/.test(sala))autoWatch.current=sala;return()=>net.current?.close()},[]);
 useEffect(()=>{const r=new Renderer();renderer.current=r;let alive=true;r.load().then(()=>{if(alive)setLoaded(true)}).catch(()=>setError("Não foi possível carregar os personagens. Recarregue a página."));return()=>{alive=false}},[]);
 // A spectator link (?sala=…&assistir=1) joins the stands as soon as the art is ready.
 useEffect(()=>{if(!loaded||!autoWatch.current)return;const sala=autoWatch.current;autoWatch.current="";connect("join",true,sala)},[loaded]);
 function tone(){if(!soundOn.current)return;try{audio.current??=new AudioContext();const c=audio.current,o=c.createOscillator(),g=c.createGain();o.type="square";o.frequency.setValueAtTime(150,c.currentTime);o.frequency.exponentialRampToValueAtTime(42,c.currentTime+.09);g.gain.setValueAtTime(.045,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.1);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.11)}catch{}}
 useEffect(()=>{
  let frame=0,last=performance.now(),acc=0,lastUi=0,lastSend=0,previousHp=200;
  function tick(now:number){for(const k of Object.keys(pulse.current) as (keyof Input)[]){if(!held.current[k] && now >= (pulse.current[k]||0)){input.current[k]=false;delete pulse.current[k]}} const dt=Math.min((now-last)/1000,.1);last=now;const n=net.current,s=state.current,isHost=sessionRef.current?.slot===0;
   // A new rival (different member) always starts a fresh match, whatever hero they picked.
   if(isHost){const rival=n?.members.find(m=>m.slot===1);if(rival&&rival.id!==rivalId.current){rivalId.current=rival.id;const fresh=createState(s.fighters[0].hero,isHero(rival.hero)?rival.hero:undefined);fresh.tick=s.tick+1;Object.assign(s,fresh)}s.connected=!!n?.opponentPresent;s.paused=!visible.current||!s.connected;if(s.connected&&s.phase==="waiting")begin(s)}
   if(trainingRef.current){s.connected=true;s.paused=!visible.current;if(s.phase==="waiting")begin(s)}
   if(isHost||trainingRef.current){acc+=dt;const remote=n&&Date.now()-n.remoteAt<700?n.remoteInput:emptyInput();while(acc>=1/60){step(s,[input.current,remote]);acc-=1/60}if(n&&now-lastSend>33){n.broadcast(s);lastSend=now}}
   else if(sessionRef.current?.slot===1&&n&&now-lastSend>33){n.sendInput(input.current);lastSend=now}
   const ctx=canvas.current?.getContext("2d");if(ctx&&renderer.current?.ready)renderer.current.draw(ctx,s,now/1000);
   const hp=s.fighters[0].hp+s.fighters[1].hp;if(hp<previousHp)tone();previousHp=hp;
   if(now-lastUi>90){lastUi=now;setView({...s,fighters:s.fighters.map(f=>({...f})) as State["fighters"]})}
   frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
  const onKey=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.closest("input,textarea,select"))return;const key=keyMap[e.code];if(!key||(!sessionRef.current&& !trainingRef.current)||sessionRef.current?.slot===null)return;e.preventDefault();action(key,e.type==="keydown")};
  const reset=()=>{held.current=emptyInput();pulse.current={};input.current=emptyInput();net.current?.sendInput(input.current)};
  const visibility=()=>{visible.current=!document.hidden;reset();if(document.hidden&&sessionRef.current?.slot===0){state.current.paused=true;net.current?.broadcast(state.current)}};
  window.addEventListener("keydown",onKey);window.addEventListener("keyup",onKey);window.addEventListener("blur",reset);document.addEventListener("visibilitychange",visibility);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener("keydown",onKey);window.removeEventListener("keyup",onKey);window.removeEventListener("blur",reset);document.removeEventListener("visibilitychange",visibility)};
 },[]);
 // With a room code in hand (invite link or typed), look the room up so the lobby shows the host's pick
 // on the left and never lets the guest pick the same hero.
 useEffect(()=>{const c=code.trim().toUpperCase();if(session||training||!/^[A-Z2-9]{8}$/.test(c)){setRoom(null);return}let alive=true;const t=setTimeout(()=>{roomRequest({op:"peek",code:c}).then((info:RoomInfo)=>{if(!alive)return;setRoom(info);if(isHero(info.hostHero))setHero(h=>h===info.hostHero?defaultOpponent(info.hostHero):h)}).catch(()=>{if(alive)setRoom(null)})},250);return()=>{alive=false;clearTimeout(t)}},[code,session,training]);
 useEffect(()=>{if(session||training)return;const hostHero=room&&isHero(room.hostHero)?room.hostHero:null;state.current=hostHero?createState(hostHero,hero===hostHero?defaultOpponent(hostHero):hero):createState(hero);setView({...state.current})},[hero,session,training,room]);
 async function connect(op:"create"|"join",watch=false,roomCode=code){
  if(!loaded)return;setBusy(true);setError("");
  try{const s:Session=await roomRequest({op,name:name.trim()||(watch?"Visitante":"Jogador"),hero,code:roomCode.trim().toUpperCase(),watch});
   state.current=createState(s.hostHero,s.slot===1?s.hero!:undefined);sessionRef.current=s;rivalId.current=null;setSession(s);setTraining(false);trainingRef.current=false;input.current=emptyInput();
   const n=new RoomNetwork(s,()=>{setMembers([...n.members]);setDirect(!!n.direct);setFallback(!n.direct&&n.members.length>1);setOnlineError(n.error);setLatency(n.latency)},snapshot=>{state.current=snapshot},()=>{state.current.paused=true});net.current=n;
   history.replaceState(null,"","?sala="+s.code);canvas.current?.focus();
  }catch(e){setError(e instanceof Error?e.message:"Não foi possível entrar.")}finally{setBusy(false)}
 }
 function leave(){net.current?.close();net.current=null;sessionRef.current=null;rivalId.current=null;setSession(null);trainingRef.current=false;setTraining(false);input.current=emptyInput();state.current=createState(hero);setMembers([]);setOnlineError("");setFallback(false);history.replaceState(null,"",location.pathname)}
 function train(){setError("");trainingRef.current=true;setTraining(true);state.current=createState(hero);input.current=emptyInput();begin(state.current);canvas.current?.focus()}
 async function copy(watch:boolean){if(!session)return;const url=location.origin+location.pathname+"?sala="+session.code+(watch?"&assistir=1":"");try{await navigator.clipboard.writeText(url);setCopied(watch?"Link para assistir copiado!":"Convite copiado!");setTimeout(()=>setCopied(""),2500)}catch{setCopied("Código da sala: "+session.code)}}
 // Shared by keyboard and touch: taps on jump/attacks stay pressed for at least 120 ms so the
 // 60 Hz simulation and the 33 ms lossy network send both get to see them.
 function action(key:keyof Input,down:boolean){held.current[key]=down;if(down&&["jump","punch","kick","special"].includes(key))pulse.current[key]=performance.now()+120;input.current[key]=down||performance.now()<(pulse.current[key]||0);net.current?.sendInput(input.current)}
 const isSpectator=session?.slot===null,active=!!session||training,host=session?.slot===0;
 const overlay=active?(view.phase==="waiting"?"AGUARDANDO RIVAL":view.paused?"PARTIDA PAUSADA":view.phase==="countdown"?String(Math.max(1,Math.ceil(view.clock))):view.phase==="round"?(view.winner===-1?"EMPATE":"K.O."):view.phase==="over"?"VITÓRIA DE "+title(view.fighters[view.winner]?.hero||"marica"):null):null;
 return <main className="app-shell">
  <header className="topbar"><a className="brand" href="/" aria-label="Luta de Feio">LUTA<span>DE FEIO</span></a><span className="edition">FLIPERAMA ONLINE <span>· VOL. 01</span></span><button className="sound-button" onClick={()=>{setSound(!sound);if(!sound){audio.current??=new AudioContext();audio.current.resume()}}} aria-pressed={sound}>{sound?"SOM LIGADO":"SOM DESLIGADO"}</button></header>
  <section className="game-layout">
   <div className="arena-column">
    <div className="stage-shell" ref={stage}>
     <div className="hud">
      {[0,1].map((i)=><div key={i} className={"fighter-hud fighter-"+i}><div className="fighter-label"><strong>{title(view.fighters[i].hero)}</strong><span>{members.find(m=>m.slot===i)?.name||(active?(training?(i===1?"ALVO DE TREINO":"VOCÊ"):"Aguardando…"):room?(i===0?room.hostName:"VOCÊ"):"")}</span></div><div className="health" role="progressbar" aria-label={"Vida de "+title(view.fighters[i].hero)} aria-valuenow={Math.round(view.fighters[i].hp)} aria-valuemin={0} aria-valuemax={100}><div style={{width:view.fighters[i].hp+"%"}}/></div><div className="round-dots">{[0,1].map(n=><i key={n} className={view.fighters[i].wins>n?"won":""}/>)}</div></div>)}
      <div className="timer"><b>{active?String(Math.ceil(view.timer)).padStart(2,"0"):"99"}</b><span>ROUND {view.round}</span></div>
     </div>
     <canvas ref={canvas} width={960} height={540} tabIndex={0} className="game-canvas" aria-label="Arena de luta. Use WASD para movimentar, J para soco, K para chute, L para defesa e I para especial."/>
     {!loaded&&<div className="game-overlay"><b>CARREGANDO ARENA…</b></div>}
     {loaded&&!active&&<div className="attract"><span>{title(view.fighters[0].hero)} <em>vs</em> {title(view.fighters[1].hero)}</span><p>{room?"Sala de "+room.hostName+". Você luta do lado direito.":"Escolha seu lado. Convide seu rival."}</p></div>}
     {overlay&&<div className={"game-overlay "+(view.phase==="over"?"result":"")}><b>{overlay}</b>{view.phase==="waiting"&&<p>Compartilhe o convite com o segundo jogador.</p>}{view.paused&&view.phase!=="waiting"&&<p>Os dois jogadores precisam manter a arena aberta.</p>}{view.phase==="over"&&(host||training)&&<button className="primary-button" onClick={()=>{rematch(state.current);input.current=emptyInput()}}>JOGAR NOVAMENTE</button>}</div>}
     <div className="energy-hud">{view.fighters.map((f,i)=><div key={i} className={"energy-side energy-"+i}><div className={"energy "+(f.energy>=60?"charged":"")}><div style={{width:f.energy+"%"}}/></div><span>{f.energy>=60?"ESPECIAL PRONTO":CHARACTERS[f.hero].special.toUpperCase()}</span></div>)}</div>
    </div>
    <div className="stage-caption"><span>ETE LAURO GOMES <span className="caption-divider">/</span> MELHOR DE 3</span><button onClick={()=>stage.current?.requestFullscreen?.()} aria-label="Abrir arena em tela cheia">TELA CHEIA ⛶</button></div>
    {active&&!isSpectator&&<div className="touch-controls" aria-label="Controles de toque"><div className="dpad">{([["jump","↑"],["left","←"],["down","↓"],["right","→"]] as const).map(([key,label])=><button key={key} aria-label={key} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);action(key,true)}} onPointerUp={()=>action(key,false)} onPointerCancel={()=>action(key,false)}>{label}</button>)}</div><div className="touch-attacks">{([["punch","SOCO"],["kick","CHUTE"],["block","DEFESA"],["special","ESPECIAL"]] as const).map(([key,label])=><button key={key} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);action(key,true)}} onPointerUp={()=>action(key,false)} onPointerCancel={()=>action(key,false)}>{label}</button>)}</div></div>}
    <footer className="controls-bar"><span><kbd>A D</kbd> andar</span><span><kbd>W</kbd> pular</span><span><kbd>S</kbd> abaixar</span><span><kbd>J</kbd> soco</span><span><kbd>K</kbd> chute</span><span><kbd>L</kbd> defesa</span><span><kbd>I</kbd> especial</span></footer>
   </div>
   <aside className="lobby">
    {!active?<><p className="eyebrow">ENTRE NA LUTA</p><h1>Escolha seu<br/>personagem.</h1><div className="hero-options">{HEROES.map(h=><button key={h} aria-pressed={hero===h} className={hero===h?"selected":""} disabled={room?.hostHero===h} title={room?.hostHero===h?"Já escolhido por "+room.hostName:undefined} onClick={()=>setHero(h)}><span className="hero-number">{CHARACTERS[h].number}</span>{title(h)}</button>)}</div><div className={"special-info "+hero}><span>GOLPE ESPECIAL</span><strong>{CHARACTERS[hero].special}</strong><p>{CHARACTERS[hero].description}</p></div><label className="field-label" htmlFor="nickname">Seu apelido</label><input id="nickname" value={name} maxLength={20} onChange={e=>setName(e.target.value)} placeholder="Como a turma te chama?" autoComplete="nickname"/><button className="primary-button" disabled={busy||!loaded} onClick={()=>connect("create")}>{busy?"CONECTANDO…":"CRIAR SALA"}<span>＋</span></button><div className="or-divider"><span>JÁ TEM UM CÓDIGO?</span></div><label className="sr-only" htmlFor="room-code">Código da sala</label><input id="room-code" className="code-input" value={code} maxLength={8} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g,""))} placeholder="CÓDIGO DA SALA" autoComplete="off"/><div className="join-actions"><button disabled={busy||code.length!==8||!loaded||!!room?.rivalName} onClick={()=>connect("join")}>ENTRAR NA LUTA</button><button disabled={busy||code.length!==8||!loaded} onClick={()=>connect("join",true)}>ASSISTIR</button></div><p className="join-hint">{room?(room.rivalName?"Os dois lugares já estão ocupados. Você ainda pode assistir.":room.hostName+" já escolheu "+title(room.hostHero)+". Escolha o seu lutador e entre."):"Escolha seu lutador antes de entrar. Cada personagem ocupa uma vaga."}</p><button className="training-link" disabled={!loaded} onClick={train}>Testar os controles sozinho</button></>:<>
     <p className="eyebrow">{training?"AQUECIMENTO":isSpectator?"ARQUIBANCADA":"VOCÊ ESTÁ NA ARENA"}</p><h1>{training?"Modo treino.":isSpectator?"Só na torcida.":title(session!.hero!)+ "."}</h1>
     {session&&<><label className="field-label">CÓDIGO DA SALA</label><div className="room-code-display">{session.code}</div><div className="connection-label"><span className={onlineError?"connection-bad":"connection-good"}/>{onlineError?"Reconectando…":members.length<2?"Sala aberta":direct?"Conexão direta":"Conexão pela sala"}{direct&&<small>{latency} ms*</small>}</div><p className="connection-note">{direct?"* Tempo de resposta da sala.":fallback?"Conexão alternativa ativa; pode haver mais atraso.":"Envie o convite para começar."}</p><button className="primary-button" onClick={()=>copy(false)}>CONVIDAR RIVAL<span>↗</span></button><button className="secondary-button" onClick={()=>copy(true)}>COPIAR LINK PARA ASSISTIR</button><div className="copy-note" role="status">{copied}</div><div className="room-members"><span className="field-label">NA SALA</span>{[0,1].map(i=><div className="member" key={i}><span className="player-tag">P{i+1}</span><div><strong>{members.find(m=>m.slot===i)?.name||"Aguardando rival"}</strong><small>{title(view.fighters[i].hero)}</small></div></div>)}<div className="spectator-count">{members.filter(m=>m.slot===null).length} espectador(es) · até 20</div></div></>}
     {training&&<><p>O rival fica parado para você experimentar os golpes. Use a barra de energia para testar o especial.</p><button className="secondary-button" onClick={()=>{const t=state.current.tick;state.current=createState(hero);state.current.tick=t+1;begin(state.current)}}>REINICIAR TREINO</button></>}
     {!isSpectator&&<div className="quick-tip"><kbd>I</kbd><span>O especial usa 60 de energia.<br/>Ela recarrega durante a luta.</span></div>}
     <button className="leave-button" onClick={leave}>{training?"VOLTAR":"SAIR DA SALA"}</button></>}
    {error&&<p className="error-message" role="alert">{error}</p>}{onlineError&&<p className="error-message" role="status">{onlineError}</p>}
   </aside>
  </section>
  <div className="bottom-note"><span>LUTA DE FEIO</span><span>WASD + J K L I · Teclado recomendado</span></div>
 </main>
}




