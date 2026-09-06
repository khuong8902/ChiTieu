
const $=id=>document.getElementById(id)

const today=()=>new Date().toISOString().slice(0,10)

let names=JSON.parse(localStorage.getItem("names")||
'["Cá hồi","Cà chua","Cam","Chuối","Gạo"]')

let data=JSON.parse(localStorage.getItem("expenses")||"[]")

$("date").value=today()

setTimeout(()=>{
  $("splash").style.display="none"
  $("app").classList.remove("hidden")
},800)

function saveDB(){
 localStorage.setItem("names",JSON.stringify(names))
 localStorage.setItem("expenses",JSON.stringify(data))
}

function renderSuggestions(){

 const q=$("name").value.toLowerCase()

 const box=$("suggestions")

 box.innerHTML=""

 if(!q){
   box.style.display="none"
   return
 }

 const list=names.filter(n=>n.toLowerCase().startsWith(q))

 list.forEach(v=>{
   const div=document.createElement("div")
   div.className="item"
   div.textContent=v

   div.onclick=()=>{
      $("name").value=v
      box.style.display="none"
   }

   box.appendChild(div)
 })

 box.style.display=list.length?"block":"none"
}

function renderTable(){

 const q=$("search").value.toLowerCase()

 $("rows").innerHTML=""

 data
 .filter(i=>i.name.toLowerCase().includes(q))
 .forEach(i=>{

   $("rows").innerHTML+=`
   <tr>
      <td>${i.date}</td>
      <td>${i.name}</td>
      <td>${Number(i.price).toLocaleString()} ${i.currency}</td>
   </tr>`

 })

}

$("name").addEventListener("input",renderSuggestions)

$("search").addEventListener("input",renderTable)

document.addEventListener("click",e=>{
 if(!e.target.closest(".field"))
    $("suggestions").style.display="none"
})

$("save").onclick=()=>{

 const n=$("name").value.trim()

 if(!n) return

 if(!names.includes(n)){
   names.push(n)
   names.sort()
 }

 data.unshift({
   date:$("date").value,
   name:n,
   price:$("price").value||0,
   currency:$("currency").value,
   weight:$("weight").value||0,
   unit:$("unit").value
 })

 saveDB()

 $("name").value=""
 $("price").value=""
 $("weight").value=""
 $("date").value=today()

 renderTable()

 $("suggestions").style.display="none"

}

$("txt").onchange=async e=>{

 const f=e.target.files[0]

 if(!f) return

 const text=await f.text()

 text
 .split(/\r?\n/)
 .map(s=>s.trim())
 .filter(Boolean)
 .forEach(v=>{
   if(!names.includes(v)) names.push(v)
 })

 names.sort()

 saveDB()

 alert("Đã cập nhật NameList!")

}

$("excel").onclick=()=>{

 const html=
 `<table border=1>
 <tr>
 <th>Ngày</th>
 <th>Tên</th>
 <th>Giá</th>
 <th>Trọng lượng</th>
 </tr>

 ${data.map(i=>`
 <tr>
 <td>${i.date}</td>
 <td>${i.name}</td>
 <td>${i.price} ${i.currency}</td>
 <td>${i.weight} ${i.unit}</td>
 </tr>`).join("")}

 </table>`

 const blob=new Blob([html],{
   type:"application/vnd.ms-excel"
 })

 const a=document.createElement("a")

 a.href=URL.createObjectURL(blob)

 a.download="DuLieuChiTieu.xls"

 a.click()

}

renderTable()
