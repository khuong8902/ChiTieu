
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
const saveBtn=$("save");

let editIndex=-1;

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

}catch(e){}

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

suggestions.style.display=list.length?"block":"none";

}

function renderTable(){

const q=normalize(search.value);

rows.innerHTML="";

data
.filter(i=>normalize(i.name).includes(q))
.forEach(item=>{

const index=data.indexOf(item);

const tr=document.createElement("tr");

tr.innerHTML=`
<td>${item.date}</td>
<td>${item.name}</td>
<td>${Number(item.price).toLocaleString()} ${item.currency}</td>`;

tr.onclick=()=>loadForEdit(index);

rows.appendChild(tr);

});

}

function loadForEdit(index){

const item=data[index];

editIndex=index;

name.value=item.name;
price.value=item.price;
weight.value=item.weight;
currency.value=item.currency;
date.value=item.date;

saveBtn.textContent="CẬP NHẬT";

window.scrollTo({
top:0,
behavior:"smooth"
});

}

function clearForm(){

name.value="";
price.value="";
weight.value="";
date.value=today();

editIndex=-1;

saveBtn.textContent="ENTER";

}

name.addEventListener("input",renderSuggestions);

search.addEventListener("input",renderTable);

document.addEventListener("click",e=>{

if(!e.target.closest(".field"))
suggestions.style.display="none";

});

saveBtn.onclick=()=>{

const obj={

date:date.value,
name:name.value.trim(),
price:price.value||0,
weight:weight.value||0,
currency:currency.value

};

if(obj.name==="") return;

if(editIndex==-1){

data.unshift(obj);

if(!names.includes(obj.name)){

names.push(obj.name);
names.sort();

}

}else{

data[editIndex]=obj;

}

saveDB();

clearForm();

renderTable();

suggestions.style.display="none";

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

const csv=table.map(r=>r.join(",")).join("\n");

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
