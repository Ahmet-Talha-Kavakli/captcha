const [url, cookie, out, aria] = process.argv.slice(2);
const targets = await (await fetch("http://127.0.0.1:9222/json")).json();
let t = targets.find(x => x.type === "page");
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id=0; const pending=new Map();
const send=(m,p={})=>new Promise(res=>{const i=++id;pending.set(i,res);ws.send(JSON.stringify({id:i,method:m,params:p}));});
await new Promise(r=>ws.onopen=r);
ws.onmessage=(e)=>{const m=JSON.parse(e.data);if(m.id&&pending.has(m.id)){pending.get(m.id)(m.result);pending.delete(m.id);}};
await send("Network.enable");
await send("Network.setCookie",{name:"specter_session",value:cookie,domain:"127.0.0.1",path:"/"});
await send("Runtime.evaluate",{expression:`try{localStorage.setItem('specter_onboarding_kapali','1')}catch(e){}`});
await send("Page.enable");
await send("Page.navigate",{url});
await new Promise(r=>setTimeout(r,4500));
await send("Runtime.enable");
const r = await send("Runtime.evaluate",{expression:`
  const svg=[...document.querySelectorAll('svg')].find(s=>(s.getAttribute('aria-label')||'').includes('${aria}'));
  svg?JSON.stringify((b=>({x:b.x,y:b.y+window.scrollY,w:b.width,h:b.height}))(svg.getBoundingClientRect())):JSON.stringify({yok:1});
`,returnByValue:true});
const box=JSON.parse(r.result.value);
if(box.yok){console.log("svg yok");ws.close();process.exit(0);}
const {data}=await send("Page.captureScreenshot",{format:"png",captureBeyondViewport:true,clip:{x:Math.max(0,box.x-20),y:Math.max(0,box.y-30),width:box.w+40,height:box.h+80,scale:1.5}});
const fs=await import("fs"); fs.writeFileSync(out,Buffer.from(data,"base64"));
console.log("ok",out); ws.close();
