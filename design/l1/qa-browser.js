async page => {
 const checks=[]; const errors=[];page.on("pageerror",e=>errors.push(e.message));
 const assert=(name,condition,detail)=>{if(!condition)throw new Error(name+": "+JSON.stringify(detail));checks.push(name)};
 const read=()=>page.evaluate(()=>({targets:[...document.querySelectorAll(".amount")].map(x=>x.textContent),progress:[...document.querySelectorAll(".percent")].map(x=>x.textContent),years:[...document.querySelectorAll(".years")].map(x=>x.textContent),width:document.documentElement.scrollWidth}));
 const fill=async(id,value)=>page.locator("#"+id).fill(value);
 for(const d of ["a","b","c"]) {
  await page.setViewportSize({width:375,height:812});await page.emulateMedia({colorScheme:"light",reducedMotion:"reduce"});
  const reset=()=>page.goto("http://127.0.0.1:8764/design/l1/"+d+".html?state=filled");
  await reset();let v=await read();assert(d+" test vector",JSON.stringify(v.years)===JSON.stringify(["已达成 · 0 年","5 年","12 年"]),v);
  await fill("r","0");v=await read();assert(d+" r=0 stops all",v.progress.every(x=>x==="暂停测算"),v);
  await fill("r","31");assert(d+" r upper bound",await page.locator("#r-error").textContent()==="收益率需不高于 30%");
  await reset();await fill("E","0");v=await read();assert(d+" E=0",v.progress[1]==="未填开销"&&v.progress[2]==="未填开销",v);
  await reset();await fill("A","0");v=await read();assert(d+" A=0",v.progress.every(x=>x==="0%")&&JSON.stringify(v.years)===JSON.stringify(["8 年","12 年","19 年"]),v);
  await fill("A","");v=await read();assert(d+" blank distinct from zero",v.progress.every(x=>x==="未计算"),v);
  await reset();await fill("E","");v=await read();assert(d+" partial dependencies",v.progress[0].includes("已达成")&&v.progress[1]==="未计算",v);
  await reset();await fill("S","-10000");v=await read();assert(d+" negative savings",v.targets[0]==="-10 万元"&&v.years[1]==="按当前储蓄无法到达"&&v.years[2]==="按当前储蓄无法到达",v);
  await reset();await page.locator("summary").click();await fill("w","2");v=await read();assert(d+" w lower bound",v.progress[2]==="未计算"&&await page.locator("#w-error").textContent()==="提款率需在 2.5%–5%",v);
  await reset();await fill("A","0");await fill("S","1");await fill("E","100000000");await fill("r","0.1");v=await read();assert(d+" over 60 years",v.years[1]==="60 年以上"&&v.years[2]==="60 年以上",v);
  await reset();await fill("A","9000000000000");await fill("S","1000000000000");await fill("E","2000000000000");v=await read();assert(d+" large values no exponent or overflow",v.width===375&&v.targets.every(x=>x.includes("亿")&&!/[0-9]e[+-]/i.test(x)),v);
  await page.goto("http://127.0.0.1:8764/design/l1/"+d+".html");await fill("A","123456");await page.reload();assert(d+" storage reload",await page.locator("#A").inputValue()==="123456");
  await reset();await page.keyboard.press("Tab");let focus=await page.evaluate(()=>({id:document.activeElement.id,outline:getComputedStyle(document.activeElement.parentElement).outlineWidth}));assert(d+" keyboard input focus",focus.id==="A"&&focus.outline==="3px",focus);
  await page.keyboard.press("Tab");await page.keyboard.press("Tab");await page.keyboard.press("Tab");await page.keyboard.press("Tab");assert(d+" keyboard summary",await page.evaluate(()=>document.activeElement.tagName)==="SUMMARY");
  await page.keyboard.press("Enter");assert(d+" keyboard expands assumptions",await page.locator("details").getAttribute("open")!==null);
  await page.keyboard.press("Tab");assert(d+" keyboard withdrawal field",await page.evaluate(()=>document.activeElement.id)==="w");
  if(d==="a")await page.screenshot({path:"New_money/design/l1/screenshots/a-assumptions-focus-375-light.png",fullPage:true});
  assert(d+" reduced motion",await page.locator(".fill").first().evaluate(el=>getComputedStyle(el).transitionDuration)==="0s");
 }
 assert("no page JavaScript errors",errors.length===0,errors);
 return {count:checks.length,checks,errors};
}
