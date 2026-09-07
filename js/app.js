document.addEventListener("DOMContentLoaded", async ()=>{

const $ = id => document.getElementById(id);
const today = ()=> new Date().toISOString().slice(0,10);

// ===== Elements =====
const splash = $("splash");
const home = $("homePage");
const stat = $("statPage");

const name = $("productName");
const price = $("price");
const qty = $("quantity");
const weight = $("weight");
const date = $("inputDate");

const suggest = $("suggestBox");
const tbody = $("tableBody");

const totalPrice = $("totalPrice");
const todayTotal = $("todayTotal");
const monthTotal = $("monthTotal");

const search = $("search");
const saveBtn = $("btnSave");

const settingModal = $("settingModal");

// ===== Data =====
let editIndex = -1;

let setting = JSON.parse(
localStorage.getItem("setting") ||
'{"currency":"JPY"}'
);

let names = JSON.parse(
localStorage.getItem("names") ||
'[]'
);

let expenses = JSON.parse(
localStorage.getItem("expenses") ||
"[]"
);

// ===== Date =====
date.value = today();

// ===== Save =====
function saveDB(){

localStorage.setItem("setting",JSON.stringify(setting));
localStorage.setItem("names",JSON.stringify(names));
localStorage.setItem("expenses",JSON.stringify(expenses));

}

// ===== Read NameList =====
try{

const txt = await fetch("NameList.txt").then(r=>r.text());

txt.split(/\r?\n/)
.map(i=>i.trim())
.filter(Boolean)
.forEach(v=>{

if(!names.includes(v))
names.push(v);

});

saveDB();

}catch(e){

console.log("Không đọc được NameList");

}

// ===== Normalize =====

function normalize(str){

return str
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g,"");

}

// ===== Suggest =====

function renderSuggest(){

const q = normalize(name.value);

suggest.innerHTML="";

if(q===""){

suggest.style.display="none";
return;

}

const list = names.filter(i=>
normalize(i).includes(q)
);

list.forEach(v=>{

const div=document.createElement("div");

div.className="item";

div.textContent=v;

div.onclick=()=>{

name.value=v;
suggest.style.display="none";

};

suggest.appendChild(div);

});

suggest.style.display=
list.length ? "block":"none";

}

name.addEventListener("input",renderSuggest);

// ===== Total =====

function calcTotal(){

const p=Number(price.value)||0;
const q=Number(qty.value)||1;

const total=p*q;

totalPrice.textContent=
total.toLocaleString()+" "+setting.currency;

}

price.oninput=calcTotal;
qty.oninput=calcTotal;

// ===== Summary =====

function renderSummary(){

const t=today();
const month=t.slice(0,7);

let td=0;
let mt=0;

expenses.forEach(i=>{

if(i.date===t)
td+=i.total;

if(i.date.startsWith(month))
mt+=i.total;

});

todayTotal.textContent=
td.toLocaleString()+" "+setting.currency;

monthTotal.textContent=
mt.toLocaleString()+" "+setting.currency;

}

// ===== Table =====

function renderTable(){

tbody.innerHTML="";

const q=normalize(search.value);

expenses
.filter(i=>normalize(i.name).includes(q))
.forEach((item,index)=>{

const tr=document.createElement("tr");

tr.innerHTML=`
<td>${item.date}</td>
<td>${item.name}</td>
<td>${item.total.toLocaleString()}</td>`;

let startX=0;

tr.addEventListener("touchstart",e=>{

startX=e.touches[0].clientX;

});

tr.addEventListener("touchend",e=>{

const dx=e.changedTouches[0].clientX-startX;

if(dx<-70){

if(confirm("Xóa mục này?")){

expenses.splice(index,1);

saveDB();

renderTable();

renderSummary();

drawChart(currentMode);

}

}else{

loadEdit(index);

}

});

tr.onclick=()=>loadEdit(index);

tbody.appendChild(tr);

});

}

// ===== Load Edit =====

function loadEdit(index){

const item=expenses[index];

editIndex=index;

name.value=item.name;
price.value=item.price;
qty.value=item.qty;
weight.value=item.weight;
date.value=item.date;

calcTotal();

saveBtn.textContent="CẬP NHẬT";

window.scrollTo({
top:0,
behavior:"smooth"
});

}

// ===== Clear =====

function clearForm(){

name.value="";
price.value="";
qty.value=1;
weight.value="";
date.value=today();

editIndex=-1;

saveBtn.textContent="ENTER";

calcTotal();

}

// ===== Save Button =====

saveBtn.onclick=()=>{

const obj={

date:date.value,

name:name.value.trim(),

price:Number(price.value)||0,

qty:Number(qty.value)||1,

weight:Number(weight.value)||0,

total:(Number(price.value)||0)*(Number(qty.value)||1)

};

if(obj.name==="") return;

if(editIndex===-1){

expenses.unshift(obj);

if(!names.includes(obj.name)){

names.push(obj.name);
names.sort();

}

}else{

expenses[editIndex]=obj;

}

saveDB();

clearForm();

renderTable();

renderSummary();

drawChart(currentMode);

};

// ===== Search =====

search.oninput=renderTable;

// ===== Excel =====

$("btnExcel").onclick=()=>{

let csv="Ngày nhập,Tên sản phẩm,Giá,Số lượng,Tổng tiền,Trọng lượng,Tiền tệ\n";

expenses.forEach(i=>{

csv+=`${i.date},${i.name},${i.price},${i.qty},${i.total},${i.weight},${setting.currency}\n`;

});

const blob=new Blob(
["\ufeff"+csv],
{type:"text/csv;charset=utf-8;"}
);

const a=document.createElement("a");

a.href=URL.createObjectURL(blob);

a.download="DuLieuChiTieu.csv";

a.click();

};

// ===== Setting =====

$("btnSetting").onclick=()=>{

settingModal.classList.remove("hidden");

};

$("btnCloseSetting").onclick=()=>{

settingModal.classList.add("hidden");

};

settingModal.onclick=e=>{

if(e.target===settingModal){

settingModal.classList.add("hidden");

}

};

document.querySelectorAll(".settingCurrency").forEach(btn=>{

if(btn.dataset.value===setting.currency)
btn.classList.add("active");
else
btn.classList.remove("active");

btn.onclick=()=>{

setting.currency=btn.dataset.value;

document.querySelectorAll(".settingCurrency")
.forEach(i=>i.classList.remove("active"));

btn.classList.add("active");

saveDB();

calcTotal();

renderSummary();

};

});

// ===== Page =====

$("btnStatistic").onclick=()=>{

home.classList.add("hidden");

stat.classList.remove("hidden");

drawChart(currentMode);

};

$("btnBack").onclick=()=>{

stat.classList.add("hidden");

home.classList.remove("hidden");

};

// ===== Currency Switch =====

let currentCurrency="JPY";

document.querySelectorAll(".currencyBtn").forEach(btn=>{

btn.onclick=()=>{

document.querySelectorAll(".currencyBtn")
.forEach(i=>i.classList.remove("active"));

btn.classList.add("active");

currentCurrency=btn.dataset.cur;

drawChart(currentMode);

};

});

// ===== Mode =====

let currentMode="week";

document.querySelectorAll(".modeBtn").forEach(btn=>{

btn.onclick=()=>{

document.querySelectorAll(".modeBtn")
.forEach(i=>i.classList.remove("active"));

btn.classList.add("active");

currentMode=btn.dataset.mode;

drawChart(currentMode);

};

});

// ===== Chart =====

function drawChart(mode){

const canvas=$("lineChart");

const ctx=canvas.getContext("2d");

ctx.clearRect(0,0,360,200);

// grid
ctx.strokeStyle="#E5E7EB";
ctx.lineWidth=1;

for(let i=0;i<4;i++){

const y=30+i*40;

ctx.beginPath();
ctx.moveTo(30,y);
ctx.lineTo(330,y);
ctx.stroke();

}

let arr=[];

const now=new Date();

if(mode==="week"){

arr=new Array(7).fill(0);

expenses.forEach(i=>{

const d=new Date(i.date);

const day=(d.getDay()+6)%7;

arr[day]+=i.total;

});

}

if(mode==="month"){

arr=[0,0,0,0,0];

expenses.forEach(i=>{

const d=new Date(i.date);

if(d.getMonth()===now.getMonth()){

const w=Math.min(4,Math.floor((d.getDate()-1)/7));

arr[w]+=i.total;

}

});

}

if(mode==="year"){

arr=new Array(12).fill(0);

expenses.forEach(i=>{

const d=new Date(i.date);

if(d.getFullYear()===now.getFullYear()){

arr[d.getMonth()]+=i.total;

}

});

}

const max=Math.max(...arr,1);

ctx.strokeStyle="#2563EB";
ctx.lineWidth=3;

ctx.beginPath();

arr.forEach((v,i)=>{

const x=30+i*(300/(arr.length-1));
const y=170-(v/max)*120;

if(i===0)
ctx.moveTo(x,y);
else
ctx.lineTo(x,y);

});

ctx.stroke();

// points
ctx.fillStyle="#2563EB";

arr.forEach((v,i)=>{

const x=30+i*(300/(arr.length-1));
const y=170-(v/max)*120;

ctx.beginPath();
ctx.arc(x,y,4,0,Math.PI*2);
ctx.fill();

});

}

// ===== Start =====

calcTotal();

renderTable();

renderSummary();

drawChart("week");

setTimeout(()=>{

splash.style.display="none";

home.classList.remove("hidden");

},600);

});
