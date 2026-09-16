import assert from "node:assert/strict";
import {createState,emptyInput,begin,step} from "../lib/game.ts";
import {createBrain,think,ladder,levelFor,DIFFICULTIES} from "../lib/ai.ts";
{
 assert.deepEqual(ladder("marica"),["hiro","lobao","ratao","bale","veio","catlaca"],"ladder follows the catalog and skips the player");
 assert.equal(ladder("catlaca").length,6);assert.ok(!ladder("catlaca").includes("catlaca"));
 assert.deepEqual(ladder("elvis-presley"),["jim-morrison","john-lennon","kurt-cobain","ozzy-osbourne","lemmy-kilmister","sid-vicious","keith-richards","robert-smith","joey-ramone","iggy-pop","sergey","rogerio-skylab"],"rock star ladder stays inside its roster and ends with the boss");
 assert.equal(ladder("rogerio-skylab").length,12);assert.ok(!ladder("rogerio-skylab").includes("rogerio-skylab"));
 const shuffled=ladder("elvis-presley",createBrain(42).rng);
 assert.deepEqual([...shuffled].sort(),[...ladder("elvis-presley")].sort(),"a shuffled ladder is a permutation of the roster");
 assert.equal(shuffled.at(-1),"rogerio-skylab","the boss stays last after the shuffle");
 assert.deepEqual(ladder("elvis-presley",createBrain(42).rng),shuffled,"same seed, same order");
 assert.ok([1,2,3,4,5].some(seed=>ladder("marica",createBrain(seed).rng).join()!==ladder("marica").join()),"the shuffle changes the order");
}
{
 assert.ok(levelFor(5).reaction<levelFor(0).reaction,"later stages react faster");
 assert.ok(levelFor(5).block>levelFor(0).block,"later stages block more");
 assert.ok(levelFor(9,true).reaction<levelFor(9).reaction&&levelFor(9,true).block>levelFor(9).block,"the boss is harder than the top stage");
 assert.ok(levelFor(0,false,"facil").reaction>levelFor(0).reaction&&levelFor(3,false,"facil").block<levelFor(3).block,"easy is slower and blocks less");
 assert.ok(levelFor(0,false,"dificil").block>=levelFor(5).block,"hard starts where normal peaks");
 assert.equal(DIFFICULTIES.length,3);
 {const s=createState("hiro","veio");begin(s);const easy=createBrain(7,"facil");for(let i=0;i<60*40&&(s.phase==="fight"||s.phase==="countdown");i++)step(s,[emptyInput(),think(s,1,easy,1/60,0)]);assert.ok(s.fighters[0].hp<100,"easy AI still lands hits")}
}
{
 const s=createState("hiro","veio");begin(s);const b=createBrain(7);
 for(let i=0;i<60*40&&s.phase==="fight"||s.phase==="countdown";i++)step(s,[emptyInput(),think(s,1,b,1/60,5)]);
 assert.equal(s.fighters[0].hp,0,"top-stage AI knocks out an idle target within 40 s");
 assert.equal(s.fighters[1].wins,1);
}
{
 const s=createState("marica","lobao");begin(s);const a=createBrain(3),b=createBrain(11);
 for(let i=0;i<60*110&&s.phase!=="over";i++)step(s,[think(s,0,a,1/60,2),think(s,1,b,1/60,2)]);
 assert.ok(s.fighters[0].hp<100||s.fighters[0].wins>0,"AI vs AI: fighter 0 gets hit or wins a round");
 assert.ok(s.fighters[1].hp<100||s.fighters[1].wins>0,"AI vs AI: fighter 1 gets hit or wins a round");
}
{
 const s=createState();begin(s);const b=createBrain(2);
 let grabs=0;for(let i=0;i<900;i++){const inp=think(s,1,b,1/60,3);assert.ok(!(inp.left&&inp.right),"never walks both ways");if(inp.grab)grabs++;step(s,[emptyInput(),{...inp}])}
 {const g=createState();begin(g);const gb=createBrain(5);let tried=0;for(let i=0;i<60*30;i++){if(g.phase==="fight"){g.fighters[0].action="block";g.fighters[0].x=g.fighters[1].x-60}const inp=think(g,1,gb,1/60,5);if(inp.grab)tried++;step(g,[{...emptyInput(),block:true},inp])}assert.ok(tried>0,"top-stage AI grabs a turtling rival")}
 assert.deepEqual(think(createState(),1,createBrain(),1/60,0),emptyInput(),"idle while waiting");
}
console.log("AI checks passed: ladder, stage scaling, difficulties, knockout of an idle target, AI vs AI exchange, grabs against a guard, consistent input.");
