async page => {
 const checks=[],errors=[],remote=[];page.on("pageerror",e=>errors.push(e.message));page.on("request",r=>{if(!r.url().startsWith("http://127.0.0.1:8764/"))remote.push(r.url())});
 const assert=(name,ok,detail)=>{if(!ok)throw Error(name+": "+JSON.stringify(detail));checks.push(name)};
 const root="http://127.0.0.1:8764/design/l1/",text=id=>page.locator("#"+id).textContent(),fill=(id,value)=>page.locator("#"+id).fill(value);
 const submit=()=>page.getByRole("button",{name:"保存资产",exact:true}).click();
 const add=async(name,category,value)=>{await page.locator("#add-asset").click();await fill("asset-name",name);await page.locator("#asset-category").selectOption(category);await fill("asset-amount",value);await submit()};
 for(const width of [375,1440]){
  await page.setViewportSize({width,height:width===375?812:900});await page.emulateMedia({colorScheme:"light",reducedMotion:"reduce"});
  await page.goto(root+"index.html?state=empty");
  assert(width+" empty assets",await text("total-value")==="0.00"&&await page.locator(".allocation-item").count()===0&&await page.locator("#asset-empty").isVisible());
  await page.locator("#empty-add-asset").click();assert(width+" single click opens name input",await page.evaluate(()=>document.activeElement.id)==="asset-name");
  await submit();assert(width+" name validation",await text("form-error")==="请填写资产名称。"&&await page.locator("#asset-dialog").evaluate(d=>d.open));
  await fill("asset-name","测试其他资产");await page.locator("#asset-category").selectOption("其他");await fill("asset-amount","-1");await submit();
  assert(width+" invalid amount stays in panel",await text("form-error").then(t=>t.includes("大于或等于 0"))&&await page.locator("#asset-dialog").evaluate(d=>d.open));
  await fill("asset-amount","10000");await submit();assert(width+" create updates all outputs",await text("total-value")==="10,000.00"&&await page.locator(".allocation-percent").textContent()==="100%"&&await page.locator(".asset-row").count()===1);
  await add("测试现金","现金","10000");assert(width+" two categories sum and ratios",await text("total-value")==="20,000.00"&&JSON.stringify(await page.locator(".allocation-percent").allTextContents())===JSON.stringify(["50%","50%"]));
  await page.getByRole("button",{name:"编辑测试其他资产",exact:true}).click();await fill("asset-amount","15000");await submit();
  assert(width+" edit updates ratios in place",await text("total-value")==="25,000.00"&&JSON.stringify(await page.locator(".allocation-percent").allTextContents())===JSON.stringify(["40%","60%"])&&page.url().includes("index.html"));
  await page.getByRole("button",{name:"编辑测试其他资产",exact:true}).click();await page.locator("#delete-asset").click();
  assert(width+" deleting last category removes it",await text("total-value")==="10,000.00"&&await page.locator(".allocation-item").count()===1&&await page.locator(".allocation-item").textContent().then(t=>!t.includes("其他")));
  await page.getByRole("button",{name:"撤销",exact:true}).click();assert(width+" undo restores record and allocation",await text("total-value")==="25,000.00"&&await page.locator(".allocation-item").count()===2);
  await page.goto(root+"index.html");await page.reload();assert(width+" asset persistence",await text("total-value")==="25,000.00"&&await page.locator(".asset-row").count()===2);
  await add("空余额","债券","0");assert(width+" zero balance no NaN",await text("total-value")==="25,000.00"&&await page.locator(".asset-row").count()===3&&await page.locator(".allocation-item").count()===2&&!await page.locator("body").textContent().then(t=>t.includes("NaN")));
  await page.locator("#add-asset").click();await fill("asset-name","取消的记录");await page.keyboard.press("Escape");assert(width+" cancel restores focus without write",await page.locator(".asset-row").count()===3&&await page.evaluate(()=>document.activeElement.id)==="add-asset");
  await page.locator("#add-asset").click();let trapped=true;for(let i=0;i<12;i++){await page.keyboard.press("Tab");trapped=trapped&&await page.evaluate(()=>document.querySelector("#asset-dialog").contains(document.activeElement))}
  assert(width+" Tab stays within dialog",trapped);await page.keyboard.press("Escape");
  await page.goto(root+"index.html?state=edit");assert(width+" optional data filled",await page.locator("#asset-quantity").inputValue()==="1000"&&await page.locator("#asset-price").inputValue()==="65"&&await page.locator("#asset-optional").getAttribute("open")!==null);
  await page.keyboard.press("Escape");assert(width+" optional and plain rows coexist",await page.locator(".asset-extra").count()===3&&await page.locator(".asset-row").count()===7);
  const target=await page.locator(".row-edit").first().boundingBox();assert(width+" edit target 44px",target.width>=44&&target.height>=44,target);
  await page.locator('.main-nav [data-route="market"]').click();assert(width+" navigate market",page.url().endsWith("watch.html")&&await page.locator(".main-nav a").count()===2);
  await page.goto(root+"watch.html?state=filled&palette=cn");
  assert(width+" prices and sparklines",await page.locator(".quote-row").count()===5&&await page.locator(".quote-row svg").count()===5&&await page.locator(".quote-row svg line").count()===0);
  const heights=await page.locator(".quote-row").evaluateAll(rows=>rows.map(r=>r.getBoundingClientRect().height));assert(width+" row height 56 to 64px",heights.every(h=>h>=56&&h<=64),heights);
  const pills=await page.locator(".quote-pill").first().evaluate(el=>({color:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor}));assert(width+" solid white text pill",pills.color==="rgb(255, 255, 255)"&&pills.background!=="rgba(0, 0, 0, 0)",pills);
  if(width===375){const peek=await page.locator("#index-strip").evaluate(el=>{const cards=el.children;return(el.getBoundingClientRect().right-cards[2].getBoundingClientRect().left)/cards[2].getBoundingClientRect().width});assert("mobile half third index card",Math.abs(peek-.5)<.03,peek);await page.locator("#index-strip").focus();await page.keyboard.press("ArrowRight");await page.waitForFunction(()=>document.getElementById("index-strip").scrollLeft>0);assert("index strip keyboard scroll",await page.locator("#index-strip").evaluate(el=>el.scrollLeft)>0)}
  const values=await page.locator(".quote-price,.quote-row .quote-pill").allTextContents(),cn=await page.locator(".quote-row.up .quote-pill").first().evaluate(el=>getComputedStyle(el).backgroundColor);
  await page.locator("#quote-palette").selectOption("us");const us=await page.locator(".quote-row.up .quote-pill").first().evaluate(el=>getComputedStyle(el).backgroundColor);
  assert(width+" color flips without numeric changes",cn!==us&&JSON.stringify(values)===JSON.stringify(await page.locator(".quote-price,.quote-row .quote-pill").allTextContents()));
  await page.goto(root+"watch.html");await page.reload();assert(width+" palette persists",await page.locator("#quote-palette").inputValue()==="us");
  await page.locator("#view-holdings").click();assert(width+" holdings subset",await page.locator(".quote-row").count()===2&&await page.locator("#index-region").isHidden());
  await page.goto(root+"watch.html?state=empty");assert(width+" empty wording and three suggestions",await page.locator("#watch-empty h2").textContent()==="还没有关注任何标的"&&await page.locator("#suggestions button").count()===3);
  await page.locator("#suggestions button").first().click();assert(width+" suggestion adds watch",await page.locator(".quote-row").count()===1&&await page.locator("#watch-empty").isHidden());
  await page.locator("#add-watch").click();await page.getByRole("button",{name:"远山能源 ＋",exact:true}).click();assert(width+" picker adds watch",await page.locator(".quote-row").count()===2&&!await page.locator("#watch-dialog").evaluate(d=>d.open));
  await page.goto(root+"watch.html");await page.reload();assert(width+" watchlist persists",await page.locator(".quote-row").count()===2);
  await page.locator('.main-nav [data-route="assets"]').click();assert(width+" return assets",page.url().endsWith("index.html"));
  const pos=await page.locator(".main-nav").evaluate(el=>getComputedStyle(el).position);assert(width+" responsive navigation",width===375?pos==="fixed":pos==="static",pos);
 }
 await page.setViewportSize({width:375,height:812});await page.goto(root+"index.html?state=empty");await add("大额示例","其他","1000000000000");
 assert("large asset amount uses 亿",await text("total-unit")==="亿元"&&!await text("total-value").then(t=>/[0-9]e[+-]/i.test(t))&&await page.evaluate(()=>document.documentElement.scrollWidth)===375);
 await page.goto(root+"index.html?state=add");await submit();await page.screenshot({path:"New_money/design/l1/screenshots/assets-error-375-light.png"});
 await page.keyboard.press("Escape");await page.goto(root+"index.html?state=filled");await page.getByRole("button",{name:"编辑定期存款",exact:true}).click();await page.locator("#delete-asset").click();await page.screenshot({path:"New_money/design/l1/screenshots/assets-deleted-375-light.png"});
 await page.goto(root+"watch.html?state=empty");await page.locator("#empty-add-watch").click();await page.screenshot({path:"New_money/design/l1/screenshots/market-picker-375-light.png"});
 await page.goto(root+"index.html?state=empty");await page.evaluate(()=>Object.defineProperty(Storage.prototype,"setItem",{value(){throw Error("design storage failure")}}));
 await add("保存失败示例","现金","1");assert("storage error retains visible record",await text("total-value")==="1.00"&&await text("asset-status").then(t=>t.includes("本机保存失败")));
 assert("no remote or quote requests",remote.length===0,remote);assert("no page JavaScript errors",errors.length===0,errors);
 return {count:checks.length,checks,errors,remote};
}
