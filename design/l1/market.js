/* 全部点位、价格和走势均为虚构静态示例；无行情请求。 */
(() => {
 const {el,read,save,trap}=L1,params=new URLSearchParams(location.search),status=document.getElementById("market-status");
 const paletteKey="new-money-design-palette-v3",listKey="new-money-design-watch-v3";
 const stocks=[
  {id:"s1",name:"海川科技",full:"海川科技示例股份",code:"SIM001",price:"65.00",change:"+1.65%",type:"up",held:true,points:"2,25 12,21 22,24 32,15 42,19 52,11 62,14 72,7 82,10 96,3"},
  {id:"s2",name:"远山能源",full:"远山能源示例股份",code:"SIM002",price:"37.00",change:"−0.82%",type:"down",held:true,points:"2,5 12,8 22,6 32,13 42,10 52,19 62,16 72,22 82,19 96,27"},
  {id:"s3",name:"青禾消费",full:"青禾消费示例股份",code:"SIM003",price:"67.12",change:"+0.45%",type:"up",held:false,points:"2,22 12,19 22,22 32,14 42,18 52,17 62,10 72,14 82,8 96,7"},
  {id:"s4",name:"宽基示例",full:"宽基指数示例基金",code:"SIM004",price:"3.24",change:"0.00%",type:"flat",held:false,points:"2,16 12,15 22,17 32,15 42,16 52,15 62,17 72,15 82,16 96,16"},
  {id:"s5",name:"远航制造",full:"远航制造示例股份",code:"SIM005",price:"25.68",change:"−1.24%",type:"down",held:false,points:"2,4 12,9 22,7 32,12 42,11 52,18 62,16 72,23 82,21 96,28"}
 ];
 const indices=[{name:"沪深300",point:"4,115.84",change:"+0.68%",type:"up"},{name:"标普500",point:"6,132.42",change:"−0.41%",type:"down"},{name:"纳指100",point:"22,184.36",change:"+1.12%",type:"up"}];
 let selected=params.get("state")==="empty"?[]:params.has("state")?stocks.map(s=>s.id):read(listKey,stocks.map(s=>s.id),status);
 if(!Array.isArray(selected))selected=stocks.map(s=>s.id);selected=[...new Set(selected.filter(id=>stocks.some(s=>s.id===id)))];
 let palette=params.get("palette")||read(paletteKey,"cn",status);palette=palette==="us"?"us":"cn";
 let held=params.get("state")==="holdings";
 const dialog=document.getElementById("watch-dialog"),picker=document.getElementById("watch-options"),select=document.getElementById("quote-palette");
 function paint(){
  document.body.dataset.palette=palette;select.value=palette;
  document.getElementById("color-note").textContent="当前"+(palette==="cn"?"红涨绿跌":"绿涨红跌")+"；不同市场习惯可能相反，请核对 + / −。";
 }
 function add(id){
  if(!selected.includes(id))selected.push(id);held=false;render();
  status.textContent="已加入自选。"+(save(listKey,selected)?" 本机已保存。":" 本机保存失败，请先保留本页。");
  if(dialog.open)dialog.close();
 }
 function render(){
  document.getElementById("view-index").setAttribute("aria-pressed",String(!held));document.getElementById("view-holdings").setAttribute("aria-pressed",String(held));
  document.getElementById("index-region").hidden=held;document.getElementById("quotes-title").textContent=held?"持仓示例":"自选列表";
  const rows=stocks.filter(s=>selected.includes(s.id)&&(!held||s.held)),list=document.getElementById("quotes");list.replaceChildren();
  document.getElementById("watch-empty").hidden=rows.length>0;list.hidden=!rows.length;
  for(const s of rows){
   const row=el("article","quote-row "+s.type,"");row.setAttribute("aria-label",s.name+"，最新价 "+s.price+" 元，"+s.change);
   const copy=el("div","",""),full=el("div","quote-full",s.code+" · "+s.full);full.title=s.code+" · "+s.full;copy.append(el("div","quote-title",s.name),full);
   const spark=document.createElementNS("http://www.w3.org/2000/svg","svg");spark.classList.add("spark");spark.setAttribute("viewBox","0 0 100 32");spark.setAttribute("role","img");spark.setAttribute("aria-label","虚构走势，"+({up:"上涨",down:"下跌",flat:"平盘"}[s.type]));
   const line=document.createElementNS("http://www.w3.org/2000/svg","polyline");line.setAttribute("points",s.points);spark.append(line);
   const numbers=el("div","quote-numbers","");numbers.append(el("div","quote-price",s.price),el("span","quote-pill",s.change));row.append(copy,spark,numbers);list.append(row);
  }
  const suggestions=document.getElementById("suggestions");suggestions.replaceChildren();
  for(const s of stocks.slice(0,3)){const button=el("button","",s.name+" ＋");button.type="button";button.addEventListener("click",()=>add(s.id));suggestions.append(button)}
 }
 const indexStrip=document.getElementById("index-strip");
 for(const index of indices){const card=el("article","index-card "+index.type,""),change=el("div","index-change","");change.append(el("span","quote-pill",index.change));card.append(el("h2","index-name",index.name),el("div","index-point",index.point),change);indexStrip.append(card)}
 function openPicker(){
  picker.replaceChildren();for(const s of stocks){const button=el("button","",s.name+(selected.includes(s.id)?" · 已添加":" ＋"));button.type="button";button.disabled=selected.includes(s.id);button.addEventListener("click",()=>add(s.id));picker.append(button)}
  dialog.showModal();
 }
 document.getElementById("view-index").addEventListener("click",()=>{held=false;render()});
 document.getElementById("view-holdings").addEventListener("click",()=>{held=true;render()});
 select.addEventListener("change",()=>{palette=select.value;paint();status.textContent="配色已切换。"+(save(paletteKey,palette)?" 本机已记住。":" 本机保存失败。")});
 document.getElementById("add-watch").addEventListener("click",openPicker);document.getElementById("empty-add-watch").addEventListener("click",openPicker);
 document.getElementById("cancel-watch").addEventListener("click",()=>dialog.close());
 dialog.addEventListener("close",()=>document.getElementById("add-watch").focus());trap(dialog);paint();render();
})();
