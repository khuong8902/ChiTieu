document.addEventListener("DOMContentLoaded",()=>{

const $=id=>document.getElementById(id)

const today=()=>new Date().toISOString().slice(0,10)

let settings=JSON.parse(localStorage.settings||'{"currency":"JPY"}')

let names=JSON.parse(localStorage.names||
'["Sữa","Trứng","Cà chua","Chuối","Cá hồi"]')

let data=JSON.parse(localStorage.data||"[]")

let edit=-1

date.value=today()

//================== SAVE ==================

function saveDB(){

localStorage.settings=JSON.stringify(settings)
localStorage.names=JSON.stringify(names)
localStorage.data=JSON.stringify(data)

}

//================== NAME ==================

async function syncName(){

try{

const t=await (await fetch("NameList.txt")).text()

t.split(/\r?\n/)
.filter(Boolean)
.forEach(i=>{
if(!names.includes(i)) names.push(i)
})

saveDB()

}catch{}

}

function normalize(s){

return s.toLowerCase()
.normalize("NFD")
.replace(/[\u0300-\u036f]/g,"")

}

name.oninput=()=>{

const q=normalize(name.value)

suggestions.innerHTML=""

if(!q){
suggestions.style.display="none"
return
}

names.filter(i=>normalize(i).includes(q))
.forEach(v=>{

const d=document.createElement("div")

d.className="item"

d.textContent=v

d.onclick=()=>{
name.value=v
suggestions.style.display="none"
}

suggestions.appendChild(d)

})

suggestions.style.display="block"

}

//================ TOTAL ===================

function calc(){

const p=Number(price.value)||0
const q=Number(qty.value)||1

totalMoney.textContent=
(p*q).toLocaleString()+" "+settings.currency

}

price.oninput=calc
qty.oninput=calc

//================ TABLE ===================

function render(){

rows.innerHTML=""

const q=normalize(search.value)

data
.filter(i=>normalize(i.name).includes(q))
.forEach((r,i)=>{

const tr=document.createElement("tr")

tr.innerHTML=`
<td>${r.date}</td>
<td>${r.name}</td>
<td>${Number(r.total).toLocaleString()}</td>`

let start=0

tr.ontouchstart=e=>start=e.touches[0].clientX

tr.ontouchend=e=>{

const dx=e.changedTouches[0].clientX-start

if(dx<-70){

if(confirm("Xóa mục này?")){

data.splice(i,1)
saveDB()
render()
renderStat()

}

}else{

loadEdit(i)

}

}

tr.onclick=()=>loadEdit(i)

rows.appendChild(tr)

})

}

function loadEdit(i){

const r=data[i]

edit=i

name.value=r.name
price.value=r.price
qty.value=r.qty
weight.value=r.weight
date.value=r.date

calc()

save.textContent="CẬP NHẬT"

}

//=============== SAVE =====================

save.onclick=()=>{

const obj={

date:date.value,

name:name.value,

price:Number(price.value),

qty:Number(qty.value),

total:Number(price.value)*Number(qty.value),

weight:Number(weight.value)

}

if(!obj.name) return

if(edit==-1){

data.unshift(obj)

if(!names.includes(obj.name)) names.push(obj.name)

}else{

data[edit]=obj

edit=-1

save.textContent="ENTER"

}

saveDB()

name.value=""
price.value=""
qty.value=1
weight.value=""
date.value=today()

calc()

render()

renderStat()

}

//============== EXCEL =====================

excel.onclick=()=>{

const rowsData=[
["Ngày nhập","Tên","Giá","Số lượng","Tổng tiền","Trọng lượng","Tiền tệ"]
]

data.forEach(i=>{

rowsData.push([
i.date,
i.name,
i.price,
i.qty,
i.total,
i.weight,
settings.currency
])

})

const csv=rowsData.map(r=>r.join(",")).join("\n")

const blob=new Blob(["\ufeff"+csv],{type:"text/csv"})

const a=document.createElement("a")

a.href=URL.createObjectURL(blob)

a.download="DuLieuChiTieu.csv"

a.click()

}

//============ STAT =======================

function renderStat(){

const now=new Date()

const t=today()

const m=t.slice(0,7)

let td=0,th=0

data.forEach(i=>{

if(i.date==t) td+=i.total

if(i.date.startsWith(m)) th+=i.total

})

todayValue.textContent=td.toLocaleString()+" "+settings.currency

monthValue.textContent=th.toLocaleString()+" "+settings.currency

drawChart("week")

}

let currentCur="JPY"

document.querySelectorAll(".cur").forEach(b=>{

b.onclick=()=>{

document.querySelectorAll(".cur").forEach(i=>i.classList.remove("active"))

b.classList.add("active")

currentCur=b.dataset.cur

drawChart(document.querySelector(".tab.active").dataset.mode)

}

})

document.querySelectorAll(".tab").forEach(b=>{

b.onclick=()=>{

document.querySelectorAll(".tab").forEach(i=>i.classList.remove("active"))

b.classList.add("active")

drawChart(b.dataset.mode)

}

})

function drawChart(mode){

const c=chart.getContext("2d")

c.clearRect(0,0,320,180)

c.strokeStyle="#2563EB"
c.lineWidth=3

let arr=[]

if(mode=="week") arr=[1200,800,1600,900,1800,1400,2200]
if(mode=="month") arr=[3500,5200,4800,6300]
if(mode=="year") arr=[4,6,5,8,7,9,10,11,9,12,13,15].map(i=>i*1000)

const max=Math.max(...arr)

c.beginPath()

arr.forEach((v,i)=>{

const x=30+i*(260/(arr.length-1))

const y=150-(v/max)*110

if(i==0) c.moveTo(x,y)
else c.lineTo(x,y)

c.fillStyle="#2563EB"
c.beginPath()
c.arc(x,y,4,0,6.28)
c.fill()

})

c.stroke()

}

//============ PAGE =======================

statBtn.onclick=()=>{

home.classList.add("hidden")
stat.classList.remove("hidden")

drawChart("week")

}

back.onclick=()=>{

stat.classList.add("hidden")
home.classList.remove("hidden")

}

const settingModal = $("setting");
const closeSetting = $("closeSetting");

settingBtn.onclick = () => {
    settingModal.classList.remove("hidden");
};

closeSetting.onclick = () => {
    settingModal.classList.add("hidden");
};

/* Bấm ra vùng tối cũng đóng popup */
settingModal.addEventListener("click",(e)=>{
    if(e.target===settingModal){
        settingModal.classList.add("hidden");
    }
});

document.querySelectorAll(".setCurrency").forEach(b=>{

b.onclick=()=>{

settings.currency=b.dataset.value

saveDB()

renderStat()

calc()

setting.classList.add("hidden")

}

})

search.oninput=render

//=========== START =======================

syncName()

calc()

render()

renderStat()

setTimeout(()=>{

splash.style.display="none"

home.classList.remove("hidden")

},600)

})
