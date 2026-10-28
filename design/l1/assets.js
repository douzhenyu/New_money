/* 仅用于资产页设计演示；所有写入使用独立 namespace。 */
(() => {
 const {el,money,num,read,save,trap}=L1,key="new-money-design-assets-v3",params=new URLSearchParams(location.search);
 const categories=["现金","存款","货币基金","股票","基金","债券","其他"];
 const seed=[
  {id:"cash",name:"日常备用金",category:"现金",cents:4000000},
  {id:"deposit",name:"定期存款",category:"存款",cents:26000000},
  {id:"money",name:"现金管理",category:"货币基金",cents:15000000},
  {id:"stock-one",name:"海川科技",category:"股票",cents:6500000,quantity:"1000",price:"65"},
  {id:"stock-two",name:"远山能源",category:"股票",cents:18500000,quantity:"5000",price:"37"},
  {id:"fund",name:"宽基基金",category:"基金",cents:20000000,quantity:"50000",price:"4"},
  {id:"bond",name:"国债",category:"债券",cents:10000000}
 ];
 const status=document.getElementById("asset-status"),dialog=document.getElementById("asset-dialog"),form=document.getElementById("asset-form");
 const error=document.getElementById("form-error"),name=document.getElementById("asset-name"),amount=document.getElementById("asset-amount"),category=document.getElementById("asset-category"),optional=document.getElementById("asset-optional");
 let assets=params.get("state")==="empty"?[]:params.has("state")?seed:read(key,seed,status),editing=null,deleted=null;
 if(!Array.isArray(assets)||assets.some(a=>!a||typeof a.id!=="string"||typeof a.name!=="string"||!categories.includes(a.category)||!Number.isSafeInteger(a.cents)||a.cents<0)){assets=seed;status.textContent="本机记录格式异常，先显示示例。"}
 function render(){
  const total=assets.reduce((sum,a)=>sum+a.cents,0),big=total>=1e10;
  document.getElementById("total-value").textContent=big?(total/1e10).toLocaleString("zh-CN",{minimumFractionDigits:2,maximumFractionDigits:2}):money(total);
  document.getElementById("total-unit").textContent=big?"亿元":"元";
  const allocation=document.getElementById("allocation"),groups=document.getElementById("asset-groups");allocation.replaceChildren();groups.replaceChildren();
  document.getElementById("asset-empty").hidden=assets.length>0;
  document.getElementById("allocation-empty").hidden=total>0;
  for(const cat of categories){
   const rows=assets.filter(a=>a.category===cat);if(!rows.length)continue;
   const sum=rows.reduce((s,a)=>s+a.cents,0);
   if(sum>0&&total>0){
    const percent=sum/total*100,item=el("div","allocation-item",""),head=el("div","allocation-head","");
    const figures=el("span","allocation-figures","");figures.append(el("span","number","¥"+money(sum)),el("span","number allocation-percent",percent.toFixed(1).replace(/[.]0$/,"")+"%"));
    head.append(el("strong","",cat),figures);
    const track=el("div","allocation-track",""),fill=el("div","allocation-fill","");fill.style.width=percent+"%";track.append(fill);
    item.append(head,track);allocation.append(item);
   }
   const group=el("section","asset-group",""),head=el("header","asset-group-head","");
   head.append(el("h3","",cat),el("span","number","¥"+money(sum)));group.append(head);
   for(const a of rows){
    const row=el("div","asset-row",""),copy=el("div","","");copy.append(el("div","asset-name",a.name));
    const details=[];if(a.quantity)details.push(num(a.quantity)+(cat==="股票"?" 股":" 份"));if(a.price)details.push("现价 ¥"+num(a.price));
    if(details.length)copy.append(el("p","asset-extra",details.join(" · ")));
    const edit=el("button","row-edit","");edit.type="button";edit.dataset.edit=a.id;edit.setAttribute("aria-label","编辑"+a.name);
    edit.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>';
    edit.addEventListener("click",()=>open(a.id));row.append(copy,el("span","asset-amount number","¥"+money(a.cents)),edit);group.append(row);
   }
   groups.append(group);
  }
 }
 const optionalState=()=>{optional.hidden=!["股票","基金"].includes(category.value)};
 function open(id=null){
  editing=id;const a=assets.find(a=>a.id===id);form.reset();error.textContent="";name.removeAttribute("aria-invalid");amount.removeAttribute("aria-invalid");
  name.value=a?.name||"";category.value=a?.category||"现金";amount.value=a?String(a.cents/100):"";
  document.getElementById("asset-quantity").value=a?.quantity||"";document.getElementById("asset-price").value=a?.price||"";
  optionalState();optional.open=Boolean(a?.quantity||a?.price);
  document.getElementById("dialog-title").textContent=a?"编辑资产":"添加资产";document.getElementById("delete-asset").hidden=!a;dialog.showModal();name.focus();
 }
 function dismissible(){
  const close=el("button","feedback-dismiss","×");close.type="button";close.setAttribute("aria-label","关闭提示");close.addEventListener("click",()=>status.replaceChildren());status.append(close);
 }
 function persist(message){
  deleted=null;render();status.textContent=message+(save(key,assets)?" 本机已保存。":" 本机保存失败，请先保留本页。");dismissible();
 }
 document.getElementById("add-asset").addEventListener("click",()=>open());
 document.getElementById("empty-add-asset").addEventListener("click",()=>open());
 document.getElementById("cancel-asset").addEventListener("click",()=>dialog.close());
 category.addEventListener("change",optionalState);trap(dialog);
 dialog.addEventListener("close",()=>{const target=[...document.querySelectorAll("[data-edit]")].find(el=>el.dataset.edit===editing);(target||document.getElementById("add-asset")).focus()});
 form.addEventListener("submit",event=>{
  event.preventDefault();error.textContent="";name.removeAttribute("aria-invalid");amount.removeAttribute("aria-invalid");
  if(!name.value.trim()){error.textContent="请填写资产名称。";name.setAttribute("aria-invalid","true");name.focus();return}
  const raw=amount.value.trim();if(!/^[0-9]+([.][0-9]{1,2})?$/.test(raw)||Number(raw)>1e12){error.textContent="请填写大于或等于 0、最多两位小数的金额（不超过 1 万亿元）。";amount.setAttribute("aria-invalid","true");amount.focus();return}
  const [whole,fraction=""]=raw.split("."),cents=Number(whole)*100+Number(fraction.padEnd(2,"0"));
  const quantity=document.getElementById("asset-quantity").value.trim(),price=document.getElementById("asset-price").value.trim();
  if(!optional.hidden)for(const [id,value] of [["asset-quantity",quantity],["asset-price",price]])if(value&&(!/^[0-9]+([.][0-9]{1,4})?$/.test(value)||Number(value)>1e12||(id==="asset-quantity"&&Number(value)<=0))){error.textContent="数量需大于 0；现价可为 0，均最多四位小数。";optional.open=true;document.getElementById(id).focus();return}
  const next={id:editing||crypto.randomUUID(),name:name.value.trim(),category:category.value,cents,...(!optional.hidden?{quantity,price}:{})};
  const total=assets.filter(a=>a.id!==editing).reduce((s,a)=>s+a.cents,0)+cents;
  if(!Number.isSafeInteger(total)){error.textContent="总金额过大，请检查输入。";amount.focus();return}
  const index=assets.findIndex(a=>a.id===editing);if(index>=0)assets[index]=next;else assets.push(next);
  persist(index>=0?"资产已更新。":"资产已添加。");dialog.close();
 });
 document.getElementById("delete-asset").addEventListener("click",()=>{
  const item=assets.find(a=>a.id===editing),position=assets.indexOf(item);if(!item)return;
  assets=assets.filter(a=>a.id!==editing);render();const ok=save(key,assets);deleted={item,position};status.textContent="已删除「"+item.name+"」。"+(ok?"":" 本机保存失败。");
  const undo=el("button","quiet","撤销");undo.type="button";undo.addEventListener("click",()=>{if(!deleted)return;assets.splice(deleted.position,0,deleted.item);persist("已撤销删除。")});status.append(undo);dismissible();dialog.close();
 });
 render();if(status.textContent)dismissible();if(params.get("state")==="add")open();if(params.get("state")==="edit")open("stock-one");
})();
