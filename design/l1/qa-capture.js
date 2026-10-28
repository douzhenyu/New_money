async page => {
 const results=[];
 for (const direction of ["a","b","c"]) for (const state of ["empty","filled","zero-rate","no-saving"]) for (const width of [375,1440]) for (const theme of ["light","dark"]) {
  await page.setViewportSize({width,height:width===375?812:900});
  await page.emulateMedia({colorScheme:theme,reducedMotion:"reduce"});
  await page.goto("http://127.0.0.1:8764/design/l1/"+direction+".html?state="+state);
  const info=await page.evaluate(() => {
   const text=id=>document.getElementById(id).textContent;
   const rgb=c=>c.match(/[0-9.]+/g).slice(0,3).map(Number);
   const lum=c=>rgb(c).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
   const contrast=[];
   for (const el of document.querySelectorAll("body *")) {
    if (!el.getClientRects().length || getComputedStyle(el).visibility==="hidden") continue;
    if (!(el.tagName==="INPUT"||Array.from(el.childNodes).some(n=>n.nodeType===3&&n.textContent.trim()))) continue;
    let parent=el, bg;
    while(parent){bg=getComputedStyle(parent).backgroundColor;if(bg!=="rgba(0, 0, 0, 0)"&&bg!=="transparent")break;parent=parent.parentElement}
    if(!parent)continue;
    const fg=getComputedStyle(el).color,a=lum(fg),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    contrast.push({text:(el.textContent||el.value||"").slice(0,35),ratio:Math.round(ratio*100)/100});
   }
   return {scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,
    targets:[0,1,2].map(i=>text("target-"+i)),progress:[0,1,2].map(i=>text("percent-"+i)),years:[0,1,2].map(i=>text("years-"+i)),
    minTextContrast:Math.min(...contrast.map(c=>c.ratio)),contrastFailures:contrast.filter(c=>c.ratio<4.5),
    footerBottom:document.querySelector("footer").getBoundingClientRect().bottom};
  });
  const file=direction+"-"+state+"-"+width+"-"+theme+".png";
  await page.screenshot({path:"New_money/design/l1/screenshots/"+file,fullPage:true});
  results.push({file,...info});
 }
 return results;
}
