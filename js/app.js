
document.addEventListener("DOMContentLoaded",()=>{

const $=id=>document.getElementById(id);

const today=()=>new Date().toISOString().slice(0,10);

const splash=$("splash");
const app=$("app");

const name=$("name");
const price=$("price");
const weight=$("weight");
const currency=$("currency");
const date=$("date");

const search=$("search");
const rows=$("rows");
const suggestions=$("suggestions");

let names=JSON.parse(
localStorage.getItem("names")||
'["Cá hồi","Cà chua","Cam","Chuối","Gạo","Sữa","Trứng","Thịt heo"]'
);

let data=JSON.parse(
localStorage.getItem("expenses")||"[]"
);

date.value=today();

currency.value=
localStorage.getItem("lastCurrency")||"VND";

function saveDB(){

localStorage.setItem("names",JSON.stringify(names));

localStorage.setItem("expenses",JSON.stringify(data));

localStorage.setItem("lastCurrency",currency.value);

}

function normalize(str){

return str
.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g,"");

}

async function syncNameList(){

try{

const res=await fetch("NameList.txt");

const txt=await res.text();

const fileNames=txt
.split(/\r?\n/)
.map(i=>i.trim())
.filter(Boolean);

names=[...new Set([...names,...fileNames])].sort();

saveDB();

}catch(e){

console.log("NameList không đọc được");

}

}

function renderSuggestions(){

const q=normalize(name.value);

suggestions.innerHTML="";

if(q===""){

suggestions.style.display="none";

return;

}

const list=names.filter(i=>
normalize(i).includes(q)
);

list.forEach(v=>{

const div=document.createElement("div");

div.className="item";

div.textContent=v;

div.onclick=()=>{

name.value=v;

suggestions.style.display="none";

};

suggestions.appendChild(div);

});

suggestions.style.display=
list.length?"block":"none";

}

function renderTable(){

const q=normalize(search.value);

rows.innerHTML="";

data
.filter(i=>normalize(i.name).includes(q))
.forEach(i=>{

rows.innerHTML+=`
<tr>
<td>${i.date}</td>
<td>${i.name}</td>
<td>${Number(i.price).toLocaleString()} ${i.currency}</td>
</tr>`;

});

}

name.addEventListener("input",renderSuggestions);

search.addEventListener("input",renderTable);

document.addEventListener("click",e=>{

if(!e.target.closest(".field"))

suggestions.style.display="none";

});

$("save").onclick=()=>{

const n=name.value.trim();

if(n==="") return;

if(!names.includes(n)){

names.push(n);

names.sort();

}

data.unshift({

date:date.value,

name:n,

price:price.value||0,

currency:currency.value,

weight:weight.value||0

});

saveDB();

name.value="";

price.value="";

weight.value="";

date.value=today();

renderTable();

suggestions.style.display="none";

};

$("txt").onchange=async e=>{

const f=e.target.files[0];

if(!f) return;

const txt=await f.text();

txt
.split(/\r?\n/)
.map(i=>i.trim())
.filter(Boolean)
.forEach(v=>{

if(!names.includes(v))

names.push(v);

});

names.sort();

saveDB();

alert("Đã cập nhật NameList!");

};

$("excel").onclick=()=>{

const table=[

["Ngày nhập","Tên sản phẩm","Giá","Trọng lượng","Tiền tệ"]

];

data.forEach(i=>{

table.push([

i.date,

i.name,

i.price,

i.weight,

i.currency

]);

});

const csv=table
.map(r=>r.join(","))
.join("\n");

const blob=new Blob(

["\ufeff"+csv],

{type:"text/csv;charset=utf-8;"}

);

const a=document.createElement("a");

a.href=URL.createObjectURL(blob);

a.download="DuLieuChiTieu.csv";

a.click();

};

(async()=>{

await syncNameList();

renderTable();

setTimeout(()=>{

splash.style.display="none";

app.classList.remove("hidden");

},600);

})();

});
