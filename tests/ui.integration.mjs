import fs from "node:fs";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";

// Reutiliza o roteiro completo de CRUD contra um broker exclusivamente em memória.
// Nunca lê o endereço compartilhado nem envia requisições fora do loopback.
const entities = new Map();
const methods = new Set();
const broker = createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  const send = (status, body) => {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(body === undefined ? undefined : JSON.stringify(body));
  };
  try {
    assert.equal(request.headers["fiware-service"], "farolamigo");
    assert.equal(request.headers["fiware-servicepath"], "/");
    if (["POST", "PATCH"].includes(request.method)) assert.equal(request.headers["content-type"], "application/json");
    methods.add(request.method);
    const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
    if (parts[0] !== "v2" || parts[1] !== "entities") return send(404);
    const id = parts[2];
    const current = entities.get(id);
    const type = url.searchParams.get("type");
    if (request.method === "GET") {
      let values = id ? (current && (!type || current.type === type) ? [current] : []) : [...entities.values()].filter((entity) => !type || entity.type === type).sort((a, b) => a.id.localeCompare(b.id));
      if (id && values.length === 0) return send(404);
      if (url.searchParams.get("options") === "keyValues") values = values.map((entity) => Object.fromEntries(Object.entries(entity).map(([key, value]) => [key, ["id", "type"].includes(key) ? value : value.value])));
      const offset = Number(url.searchParams.get("offset") ?? 0);
      const limit = Number(url.searchParams.get("limit") ?? 20);
      return send(200, id ? values[0] : values.slice(offset, offset + limit));
    }
    if (request.method === "DELETE") {
      if (!current) return send(404);
      if (parts[3] === "attrs") { delete current[parts[4]]; return send(204); }
      entities.delete(id);
      return send(204);
    }
    let raw = "";
    for await (const chunk of request) raw += chunk;
    const body = JSON.parse(raw);
    if (request.method === "POST" && !id) {
      if (entities.has(body.id)) return send(422);
      entities.set(body.id, body);
      return send(201);
    }
    if (["PATCH", "POST"].includes(request.method) && parts[3] === "attrs") {
      if (!current) return send(404);
      entities.set(id, { ...current, ...body });
      return send(204);
    }
    return send(400);
  } catch {
    return send(400);
  }
});
broker.listen(0, "127.0.0.1");
await once(broker, "listening");
const field=(value,type="Text")=>({type,value});
const crossingCases = [
  {code:'C01',width:30,current:20,senior:40,especial:50},
  {code:'C02',width:27.4,current:35,senior:37,especial:46},
  {code:'C03',width:36.96,current:47,senior:50,especial:62},
  {code:'C04',width:19.5,current:24,senior:26,especial:33},
  {code:'C05',width:27.82,current:36,senior:38,especial:47},
];
for(const row of crossingCases) {
  const {code,width,current}=row;
  const entity={id:'urn:ngsi-ld:Cruzamento:'+code,type:'Cruzamento',codigo:field(code),nome:field(code === 'C01' ? 'Av. Paulista x Al. Joaquim Eugênio de Lima' : code === 'C04' ? 'Av. Paulista x Av. Brigadeiro Luís Antônio' : 'Av. Paulista '+code),largura_m:field(width,'Number'),verde_atual_s:field(current,'Number')};
  if(code==='C01')Object.assign(entity,{estado:field('FALHA'),extensao_s:field(15,'Number'),leitura_valida:field(false,'Boolean')});
  entities.set(entity.id,entity);
}
const probe=createServer();probe.listen(0,"127.0.0.1");await once(probe,"listening");
const port=probe.address().port;await new Promise(r=>probe.close(r));
const base=`http://127.0.0.1:${port}`;
const token="isolated-ui-operator-test-with-32-characters";
const app=spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port",String(port)],{windowsHide:true,stdio:"ignore",env:{...process.env,CROSSINGS_SOURCE:"orion",ORION_URL:`http://127.0.0.1:${broker.address().port}`,ORION_AUTH_TOKEN:"",ORION_CROSSING_TYPE:"Cruzamento",ORION_REQUEST_TYPE:"PedidoRevisao",ORION_CODE_ATTRIBUTE:"codigo",ORION_ADDRESS_ATTRIBUTE:"nome",ORION_WIDTH_ATTRIBUTE:"largura_m",ORION_TIME_ATTRIBUTE:"verde_atual_s",ADMIN_API_TOKEN:token,REQUEST_PROTOCOL_SECRET:"isolated-ui-request-secret-with-32-characters"}});
async function checkContrast(page) {
  const failures=await page.evaluate(()=>{
    const rgb=color=>(color.match(/[\d.]+/g)||[]).map(Number);
    const luminance=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
    return [...document.querySelectorAll('body *')].filter(e=>[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())&&e.getBoundingClientRect().width&&e.getBoundingClientRect().height&&!e.closest('[disabled]')&&getComputedStyle(e).visibility!=='hidden').flatMap(e=>{
      const fg=rgb(getComputedStyle(e).color);let bg=[255,255,255];
      for(let parent=e;parent;parent=parent.parentElement){const c=rgb(getComputedStyle(parent).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}}
      const a=luminance(fg),b=luminance(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      return ratio<4.5?[{text:e.textContent.trim().slice(0,65),ratio}]:[];
    });
  });
  assert.deepEqual(failures,[],"Contraste mínimo de 4,5:1 nos textos renderizados");
}
let browser;
try {
  let ready=false;
  for(let i=0;i<60;i++){try{if((await fetch(base+"/painel")).ok){ready=true;break;}}catch{}if(app.exitCode!==null)break;await new Promise(r=>setTimeout(r,250));}
  assert.ok(ready,"Servidor de teste deve iniciar");
  browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||"msedge"});
  const page=await browser.newPage({viewport:{width:1280,height:900}});page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/cruzamentos/C01');
  await checkContrast(page);
  const senior=page.getByRole('radio',{name:'Pessoa idosa',exact:true});
  assert.ok(await senior.isChecked());
  await page.getByText('Sem o Farol Amigo, o tempo de hoje é 20 s para atravessar.',{exact:true}).waitFor();
  assert.equal((await page.locator('.comparison-summary > strong').innerText()).trim(),'20 s');
  assert.ok((await page.locator('.comparison-panel').innerText()).includes('15 m'));
  await senior.focus();await page.keyboard.press('ArrowDown');
  await page.getByText('Sem o Farol Amigo, o tempo de hoje é 20 s para atravessar.',{exact:true}).waitFor();
  assert.equal((await page.locator('.comparison-summary > strong').innerText()).trim(),'20 s');
  assert.ok(await page.getByRole('radio',{name:'Pessoa com deficiência',exact:true}).isChecked());
  assert.ok((await page.locator('.comparison-panel').innerText()).includes('12 m'));
  assert.equal(await page.locator('.comparison-summary').getAttribute('aria-live'),'polite');
  const touch=await page.locator('.profile-choice label').first().boundingBox();assert.ok(touch.width>=44&&touch.height>=44);
  assert.notEqual(await page.locator('.profile-choice label').nth(1).evaluate(e=>getComputedStyle(e).outlineWidth),'0px');
  const withFarol=page.getByRole('button',{name:'Com o Farol Amigo',exact:true});
  const withoutFarol=page.getByRole('button',{name:'Sem o Farol Amigo',exact:true});
  assert.equal(await withoutFarol.getAttribute('aria-pressed'),'true');
  await withFarol.focus();await page.keyboard.press('Enter');
  await page.getByText('20 s de hoje + 30 s acrescentados = 50 s para atravessar.',{exact:true}).waitFor();
  await page.getByText('Com o Bilhete Único Especial, você tem 50 s para atravessar.',{exact:true}).waitFor();
  assert.equal(await withFarol.getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.reference-lane .pedestrian-marker').evaluate(e=>e.style.left),'100%');
  assert.ok((await page.locator('.comparison-panel').innerText()).includes('Você chega ao outro lado.'));
  await checkContrast(page);
  fs.mkdirSync('tmp',{recursive:true});await page.screenshot({path:'tmp/cruzamento-com-farol.png',fullPage:true});
  await senior.check();
  await page.getByText('20 s de hoje + 20 s acrescentados = 40 s para atravessar.',{exact:true}).waitFor();
  await withoutFarol.click();
  assert.ok((await page.locator('.comparison-panel').innerText()).includes('15 m'));
  await page.getByRole('radio',{name:'Pessoa com deficiência',exact:true}).check();
  await page.getByRole('button',{name:'Letra maior'}).click();
  assert.ok(await page.locator('html').evaluate(e=>e.classList.contains('large-text')));
  fs.mkdirSync('tmp',{recursive:true});await page.screenshot({path:'tmp/cruzamento-pcd.png',fullPage:true});
  await page.getByRole('link',{name:'Pedir revisão do tempo'}).click();
  assert.ok(await page.getByRole('radio',{name:'Pessoa com deficiência',exact:true}).isChecked());
  await checkContrast(page);
  await page.getByRole('radio',{name:'O tempo acaba antes de eu terminar de atravessar'}).check();
  await page.getByRole('button',{name:'Conferir pedido'}).click();
  await page.getByRole('button',{name:'Enviar pedido'}).click();
  await page.getByRole('heading',{name:'Pedido enviado',exact:true}).waitFor();
  const saved=[...entities.values()].find(e=>e.type==='PedidoRevisao');assert.equal(saved.perfil.value,'pcd');
  await page.getByRole('link',{name:'Acompanhar pedido'}).click();
  await page.getByRole('button',{name:'Editar pedido',exact:true}).click();
  await page.getByRole('radio',{name:'Prefiro não dizer',exact:true}).check();
  await page.getByRole('button',{name:'Salvar alterações'}).click();
  await page.getByRole('heading',{name:'Pedido encontrado',exact:true}).waitFor();
  assert.equal(entities.get(saved.id).perfil.value,'outro');
  await page.getByRole('button',{name:'Editar pedido',exact:true}).click();
  await page.getByRole('radio',{name:'Pessoa com deficiência',exact:true}).check();
  await page.getByRole('button',{name:'Salvar alterações'}).click();
  await page.getByRole('heading',{name:'Pedido encontrado',exact:true}).waitFor();
  await page.goto(base+'/painel');
  await page.getByLabel('Código de acesso').fill(token);
  await page.getByRole('button',{name:'Entrar no painel',exact:true}).click();
  await page.getByText('Sem farol conectado',{exact:true}).first().waitFor();
  assert.equal(await page.getByText('Sem farol conectado',{exact:true}).count(),4);
  assert.ok(!(await page.locator('main').innerText()).includes('undefined'));
  await page.getByText('Sensor com leitura impossível. Ciclo fixo de 50 s ativo.',{exact:true}).waitFor();
  assert.equal(await page.locator('.operator-alerts li').filter({hasText:/C0[2-5]/}).count(),0);
  await checkContrast(page);
  await page.screenshot({path:'tmp/painel.png',fullPage:true});
  // O menu acompanha a rolagem com amortecimento e permanece dentro do painel.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => document.querySelector('.operator-nav')?.dataset.followScroll === 'true');
  const menuPositions = await page.evaluate(async () => {
    window.scrollTo(0, 700);
    const positions = [];
    for (let frame = 0; frame < 6; frame++) {
      await new Promise(requestAnimationFrame);
      positions.push(document.querySelector('.operator-nav').getBoundingClientRect().top);
    }
    return positions;
  });
  assert.ok(Math.max(...menuPositions) - Math.min(...menuPositions) > 1, 'Menu deve acompanhar o scroll progressivamente');
  const menuSettled = () => {
    const nav = document.querySelector('.operator-nav');
    const rail = document.querySelector('.operator-nav-rail').getBoundingClientRect();
    const inset = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const expected = rail.top + Math.max(0, Math.min(inset - rail.top, rail.height - nav.offsetHeight));
    return Math.abs(nav.getBoundingClientRect().top - expected) < 1;
  };
  await page.waitForFunction(menuSettled);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForFunction(menuSettled);
  assert.ok(await page.locator('.operator-nav').evaluate(nav => nav.getBoundingClientRect().bottom <= nav.parentElement.getBoundingClientRect().bottom + 1));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(() => !document.querySelector('.operator-nav').hasAttribute('data-follow-scroll'));
  assert.equal(await page.locator('.operator-nav').evaluate(nav => nav.style.transform), '');
  assert.equal(await page.locator('.operator-nav').evaluate(nav => getComputedStyle(nav).position), 'sticky');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.getByRole('button',{name:'Responder pedido',exact:true}).click();
  await page.getByLabel('Resposta ao pedido (obrigatória)').fill('Vamos avaliar o tempo deste cruzamento.');
  await page.getByRole('button',{name:'Registrar resposta',exact:true}).click();
  await page.getByText('Resposta registrada',{exact:true}).waitFor();
  const anonymous=await browser.newContext(),citizen=await anonymous.newPage();citizen.setDefaultTimeout(15000);
  await citizen.goto(base+'/pedidos?protocolo='+saved.protocolo.value);
  await citizen.getByText('Vamos avaliar o tempo deste cruzamento.',{exact:true}).waitFor();
  assert.equal(await citizen.getByRole('button',{name:'Editar pedido',exact:true}).count(),0);
  assert.equal((await anonymous.cookies()).length,0);
  await checkContrast(citizen);
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(() => !document.querySelector('.operator-nav').hasAttribute('data-follow-scroll'));
  assert.equal(await page.locator('.operator-nav').evaluate(nav => getComputedStyle(nav).position), 'static');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'tmp/painel-mobile.png',fullPage:true});
  for(const row of crossingCases) {
    await page.goto(base+'/cruzamentos/'+row.code);
    if(['C01','C04'].includes(row.code)) {
      const map = page.locator('.crossing-location iframe');
      assert.equal(await map.count(),1);
      const embed=new URL(await map.getAttribute('src'));
      const link=new URL(await page.getByRole('link',{name:'Abrir localização no mapa',exact:true}).getAttribute('href'));
      assert.equal(embed.hostname,'www.openstreetmap.org');
      assert.equal(link.hostname,'www.openstreetmap.org');
      assert.equal(embed.searchParams.get('marker'),link.searchParams.get('mlat')+','+link.searchParams.get('mlon'));
      assert.ok(Number(link.searchParams.get('mlat')) < -23.56 && Number(link.searchParams.get('mlat')) > -23.57);
      await page.locator('.crossing-location').scrollIntoViewIfNeeded();
      await page.screenshot({path:'tmp/mapa-'+row.code+'.png',fullPage:true});
    }
    for(const [label,total] of [['Pessoa idosa',row.senior],['Pessoa com deficiência',row.especial]]) {
      await page.getByRole('radio',{name:label,exact:true}).check();
      assert.equal((await page.locator('.comparison-summary > strong').innerText()).trim(),row.current+' s',row.code+' sem Farol deve manter o tempo atual para '+label);
      assert.ok((await page.locator('.comparison-summary').innerText()).includes('Sem o Farol Amigo'));
      if(row.code==='C04'&&label==='Pessoa com deficiência')await page.screenshot({path:'tmp/c04-sem-farol.png',fullPage:true});
      await page.getByRole('button',{name:'Com o Farol Amigo',exact:true}).click();
      assert.equal((await page.locator('.comparison-summary > strong').innerText()).trim(),total+' s');
      await page.getByText(row.current+' s de hoje + '+(total-row.current)+' s acrescentados = '+total+' s para atravessar.',{exact:true}).waitFor();
      assert.equal(await page.locator('.reference-lane .pedestrian-marker').evaluate(e=>e.style.left),'100%',row.code+' '+label+' deve completar a travessia');
      assert.ok((await page.locator('.comparison-panel').innerText()).includes('Você chega ao outro lado.'));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      if(row.code==='C04'&&label==='Pessoa com deficiência')await page.screenshot({path:'tmp/c04-com-farol.png',fullPage:true});
      await page.getByRole('button',{name:'Sem o Farol Amigo',exact:true}).click();
      assert.equal((await page.locator('.comparison-summary > strong').innerText()).trim(),row.current+' s');
    }
  }
  const sufficient=entities.get('urn:ngsi-ld:Cruzamento:C05');sufficient.verde_atual_s=field(60,'Number');
  await page.reload();
  await page.getByRole('button',{name:'Com o Farol Amigo',exact:true}).click();
  await page.getByRole('radio',{name:'Pessoa com deficiência',exact:true}).check();
  await page.getByText('O tempo de hoje já é suficiente. Nenhum segundo precisa ser acrescentado.',{exact:true}).waitFor();
  await page.getByText('Tempo acrescentado: +0 s',{exact:true}).waitFor();
  await page.getByText('Total: 60 s',{exact:true}).waitFor();
  await checkContrast(page);
  assert.deepEqual(errors,[]);
  console.log('OK: navegador — comparação sem/com Farol Amigo em C01–C05, tempo atual invariável sem Farol nos dois perfis, 10 travessias completas com Farol, acréscimos por cartão, zero acréscimo quando suficiente; teclado, perfil, painel, consulta anônima, mapas C01/C04 com botão, contraste e mobile.');
} finally {
  await browser?.close();app.kill();if(app.exitCode===null)await once(app,'exit');
  broker.closeAllConnections();await new Promise(r=>broker.close(r));
}
