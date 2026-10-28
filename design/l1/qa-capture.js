async page => {
 const cases=[
  ["assets-filled","index.html?state=filled"],["assets-empty","index.html?state=empty"],["assets-add","index.html?state=add"],["assets-edit","index.html?state=edit"],
  ["market-cn","watch.html?state=filled&palette=cn"],["market-us","watch.html?state=filled&palette=us"],["market-empty","watch.html?state=empty&palette=cn"],["market-holdings","watch.html?state=holdings&palette=cn"]
 ];
 const results=[],errors=[];page.on("pageerror",e=>errors.push(e.message));
 for(const [name,url] of cases)for(const width of [375,1440])for(const theme of ["light","dark"]){
  await page.setViewportSize({width,height:width===375?812:900});await page.emulateMedia({colorScheme:theme,reducedMotion:"reduce"});await page.goto("http://127.0.0.1:8764/design/l1/"+url);
  const result=await page.evaluate(()=>{
   const lum=c=>c.match(/[0-9.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
   const contrast=[];
   for(const element of document.querySelectorAll("body *")){
    if(!element.getClientRects().length||getComputedStyle(element).visibility==="hidden")continue;
    if(!(["INPUT","SELECT"].includes(element.tagName)||[...element.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())))continue;
    let parent=element,bg;while(parent){bg=getComputedStyle(parent).backgroundColor;if(bg!=="rgba(0, 0, 0, 0)"&&bg!=="transparent")break;parent=parent.parentElement}if(!parent)continue;
    const a=lum(getComputedStyle(element).color),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);contrast.push({text:(element.textContent||element.value||"").slice(0,30),ratio:Number(ratio.toFixed(2))});
   }
   const strip=document.getElementById("index-strip");
   return {scrollWidth:document.documentElement.scrollWidth,minTextContrast:Math.min(...contrast.map(c=>c.ratio)),contrastFailures:contrast.filter(c=>c.ratio<4.5),
    quoteRowHeights:[...document.querySelectorAll(".quote-row")].map(el=>el.getBoundingClientRect().height),
    indexViewport:strip?.clientWidth,indexContent:strip?.scrollWidth,
    total:document.getElementById("total-value")?.textContent,allocation:[...document.querySelectorAll(".allocation-percent")].map(el=>el.textContent),activeRoute:document.querySelector(".main-nav [aria-current]")?.dataset.route};
  });
  const file=name+"-"+width+"-"+theme+".png";await page.screenshot({path:"New_money/design/l1/screenshots/"+file,fullPage:width===1440});results.push({file,width,theme,...result});
 }
 for(const theme of ["light","dark"]){
  await page.setViewportSize({width:375,height:812});await page.emulateMedia({colorScheme:theme});await page.goto("http://127.0.0.1:8764/design/l1/index.html?state=filled");await page.locator(".asset-group").nth(3).evaluate(el=>el.scrollIntoView({block:"start"}));await page.screenshot({path:"New_money/design/l1/screenshots/assets-details-375-"+theme+".png"});
 }
 return {results,errors};
}
