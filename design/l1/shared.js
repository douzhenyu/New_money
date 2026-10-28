/* 设计原型共用显示与焦点辅助；不连接生产数据。 */
window.L1={
 money:cents=>(cents/100).toLocaleString("zh-CN",{minimumFractionDigits:2,maximumFractionDigits:2}),
 num:value=>Number(value).toLocaleString("zh-CN",{maximumFractionDigits:4}),
 el:(tag,cls,text)=>{const node=document.createElement(tag);node.className=cls;node.textContent=text;return node},
 read:(key,fallback,status)=>{try{return JSON.parse(localStorage.getItem(key)||"null")??fallback}catch{status.textContent="本机记录暂不能读取，先显示示例。";return fallback}},
 save:(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}},
 trap:dialog=>dialog.addEventListener("keydown",event=>{
  if(event.key!=="Tab")return;
  const items=[...dialog.querySelectorAll("input,select,button,summary")].filter(el=>el.getClientRects().length&&!el.disabled);
  const first=items[0],last=items[items.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
 })
};
