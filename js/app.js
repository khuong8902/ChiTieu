// ===== Chi Tieu V1.1 =====

const $ = id => document.getElementById(id)

const today = () => new Date().toISOString().slice(0,10)

//------------------ DATABASE ------------------

let names = JSON.parse(localStorage.getItem("names") ||
'["Cá hồi","Cà chua","Cam","Chuối","Gạo","Sữa","Trứng","Thịt heo"]')

let data = JSON.parse(localStorage.getItem("expenses") || "[]")

$("date").value = today()

$("currency").value =
localStorage.getItem("lastCurrency") || "VND"

$("unit").value =
localStorage.getItem("lastUnit") || "g"

function saveDB(){

    localStorage.setItem("names",JSON.stringify(names))
    localStorage.setItem("expenses",JSON.stringify(data))

    localStorage.setItem(
      "lastCurrency",
      $("currency").value
    )

    localStorage.setItem(
      "lastUnit",
      $("unit").value
    )
}

//------------------ NORMALIZE ------------------

function normalize(str){

    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")

}

//------------------ SUGGEST ------------------

function renderSuggestions(){

    const q = normalize($("name").value)

    const box = $("suggestions")

    box.innerHTML = ""

    if(q===""){
        box.style.display="none"
        return
    }

    const list = names.filter(item =>
        normalize(item).includes(q)
    )

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

$("name").addEventListener(
"input",
renderSuggestions
)

//------------------ TABLE ------------------

function renderTable(){

    const q = normalize($("search").value)

    $("rows").innerHTML=""

    data
    .filter(i=>normalize(i.name).includes(q))
    .forEach(i=>{

        $("rows").innerHTML+=`
        <tr>
            <td>${i.date}</td>
            <td>${i.name}</td>
            <td>${Number(i.price).toLocaleString()} ${i.currency}</td>
        </tr>`

    })

}

$("search").addEventListener(
"input",
renderTable
)

//------------------ HIDE SUGGEST ------------------

document.addEventListener("click",e=>{

    if(!e.target.closest(".field"))
        $("suggestions").style.display="none"

})

//------------------ SAVE ------------------

$("save").onclick=()=>{

    const n=$("name").value.trim()

    if(n==="") return

    if(!names.includes(n)){

        names.push(n)

        names.sort()

    }

    data.unshift({

        date:$("date").value,

        name:n,

        price:$("price").value || 0,

        currency:$("currency").value,

        weight:$("weight").value || 0,

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

//------------------ IMPORT TXT ------------------

$("txt").onchange=async e=>{

    const f=e.target.files[0]

    if(!f) return

    const txt=await f.text()

    txt.split(/\r?\n/)
    .map(s=>s.trim())
    .filter(Boolean)
    .forEach(v=>{

        if(!names.includes(v))
            names.push(v)

    })

    names.sort()

    saveDB()

    alert("Đã cập nhật NameList!")

}

//------------------ EXPORT CSV ------------------

$("excel").onclick=()=>{

    const rows=[

        ["Ngày nhập","Tên sản phẩm","Giá","Trọng lượng"]

    ]

    data.forEach(i=>{

        rows.push([

            i.date,

            i.name,

            `${i.price} ${i.currency}`,

            `${i.weight} ${i.unit}`

        ])

    })

    const csv=rows
      .map(r=>r.join(","))
      .join("\n")

    const blob=new Blob(

      ["\ufeff"+csv],

      {type:"text/csv;charset=utf-8;"}

    )

    const a=document.createElement("a")

    a.href=URL.createObjectURL(blob)

    a.download="DuLieuChiTieu.csv"

    a.click()

}

//------------------

renderTable()
