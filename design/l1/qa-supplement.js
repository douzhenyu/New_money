async page => {
 const root="http://127.0.0.1:8764/design/l1/",checks=[];
 await page.setViewportSize({width:375,height:812});await page.emulateMedia({colorScheme:"light"});
 await page.goto(root+"index.html?state=filled");await page.getByRole("button",{name:"编辑定期存款",exact:true}).click();await page.locator("#delete-asset").click();
 const banner=await page.locator("#asset-status").boundingBox(),nav=await page.locator(".main-nav").boundingBox();
 if(!(banner.y>0&&banner.y+banner.height<nav.y))throw Error("Undo feedback is covered");
 await page.screenshot({path:"New_money/design/l1/screenshots/assets-deleted-375-light.png"});
 await page.getByRole("button",{name:"撤销",exact:true}).click();if(await page.locator("#total-value").textContent()!=="1,000,000.00")throw Error("Undo failed");checks.push("undo visible above mobile navigation and restores total");
 await page.getByRole("button",{name:"关闭提示",exact:true}).click();if(await page.locator("#asset-status").textContent()!=="")throw Error("Dismiss failed");checks.push("feedback dismisses");
 for(const theme of ["light","dark"]){await page.emulateMedia({colorScheme:theme});await page.goto(root+"index.html?state=filled");await page.locator(".asset-group").nth(3).evaluate(el=>el.scrollIntoView({block:"start"}));await page.screenshot({path:"New_money/design/l1/screenshots/assets-details-375-"+theme+".png"})}
 await page.setViewportSize({width:1440,height:900});await page.emulateMedia({colorScheme:"light"});await page.goto(root+"review.html");
 const images=await page.locator("img").evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0));if(!images)throw Error("Missing preview");
 await page.screenshot({path:"New_money/design/l1/screenshots/review-1440.png",fullPage:true});
 return {checks,images};
}
