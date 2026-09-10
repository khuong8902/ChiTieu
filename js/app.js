/*=========================================
  Chi Tiêu V3.2 Stable
  app.js (Part 1)
=========================================*/

document.addEventListener("DOMContentLoaded", async ()=>{

const $ = id => document.getElementById(id);

const today = ()=> new Date().toISOString().slice(0,10);

const money = n => Number(n||0).toLocaleString("en-US");

/* =========================
   DATABASE
========================= */

let setting = JSON.parse(
    localStorage.getItem("setting") ||
    '{"currency":"JPY","lastBackup":""}'
);

let names = JSON.parse(
    localStorage.getItem("nameList") || "[]"
);

let rows = JSON.parse(
    localStorage.getItem("expenseData") || "[]"
);

let editIndex = -1;
let chartMode = "month";
let selectedDate = "";
let currentYear = new Date().getFullYear();
// Ghi nhớ năm trong 1 lần mở app
let sessionYear = currentYear;
/* =========================
   ELEMENT
========================= */

const productName = $("productName");
const price = $("price");
const quantity = $("quantity");
const weight = $("weight");
const inputDate = $("inputDate");

const totalPrice = $("totalPrice");
const suggestBox = $("suggestBox");
const tableBody = $("tableBody");

inputDate.value = today();

/* =========================
   LOAD NAMELIST
========================= */

try{

    const txt = await fetch("NameList.txt").then(r=>r.text());

    txt.split(/\r?\n/)
        .map(v=>v.trim())
        .filter(Boolean)
        .forEach(v=>{

            if(!names.includes(v))
                names.push(v);

        });

}catch(e){}

/* =========================
   SAVE DATABASE
========================= */

function saveDB(){

    localStorage.setItem("setting",JSON.stringify(setting));
    localStorage.setItem("nameList",JSON.stringify(names));
    localStorage.setItem("expenseData",JSON.stringify(rows));

}

/* =========================
   TOAST
========================= */

function showToast(text){

    $("toastText").textContent = text;

    $("toast").classList.remove("hidden");

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(()=>{

        $("toast").classList.add("hidden");

    },1800);

}

/* =========================
   NORMALIZE
========================= */

function normalize(str){

    return (str||"")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g,"");

}

/* =========================
   SUGGEST
========================= */

function renderSuggest(){

    const key = normalize(productName.value);

    suggestBox.innerHTML = "";

    if(key===""){

        suggestBox.style.display="none";
        return;

    }

    const result = names
        .filter(v=>normalize(v).includes(key))
        .sort((a,b)=>{

            const ca = rows.filter(i=>i.name===a).length;
            const cb = rows.filter(i=>i.name===b).length;

            return cb-ca;

        })
        .slice(0,8);

    result.forEach(v=>{

        const div=document.createElement("div");

        div.className="item";

        div.textContent=v;

        div.onclick=()=>{

            productName.value=v;

            suggestBox.style.display="none";

        };

        suggestBox.appendChild(div);

    });

    suggestBox.style.display=result.length?"block":"none";

}

productName.oninput=renderSuggest;

document.addEventListener("click",e=>{

    if(!e.target.closest(".fieldWrap"))
        suggestBox.style.display="none";

});

/* =========================
   TOTAL
========================= */

function updateTotal(){

    const p = Number(price.value)||0;
    const q = Number(quantity.value)||1;

    totalPrice.textContent =
        money(p*q)+" "+setting.currency;

}

price.oninput=updateTotal;
quantity.oninput=updateTotal;

/* =========================
   SUMMARY
========================= */

function renderSummary(){

    const td = today();

    const month = td.slice(0,7);

    let todayMoney = 0;
    let monthMoney = 0;

    rows.forEach(r=>{

        if(r.date===td)
            todayMoney+=r.total;

        if(r.date.startsWith(month))
            monthMoney+=r.total;

    });

    $("todayTotal").textContent =
        money(todayMoney)+" "+setting.currency;

    $("monthTotal").textContent =
        money(monthMoney)+" "+setting.currency;

}

/* =========================
   TABLE
========================= */

function renderTable(){

    tableBody.innerHTML="";

    const key = normalize($("search").value);

    rows
    .filter(r=>normalize(r.name).includes(key))
    .forEach((item,index)=>{

        const tr=document.createElement("tr");

        tr.innerHTML=`
<td colspan="3" style="padding:0;border:none">

<div class="swipeRow">

<div class="deleteBtn">🗑 Xóa</div>

<div class="rowContent">

<div>${item.date}</div>

<div>${item.name}</div>

<div class="money">${money(item.total)}</div>

</div>

</div>

</td>`;

        const rowContent=tr.querySelector(".rowContent");
        const deleteBtn=tr.querySelector(".deleteBtn");

        let startX=0;
        let lastTap=0;
        let opened=false;

        tr.addEventListener("touchstart",(e)=>{

            startX=e.touches[0].clientX;

        });

        tr.addEventListener("touchend",(e)=>{

            const dx=e.changedTouches[0].clientX-startX;

            if(dx<-45){

                rowContent.style.transform="translateX(-88px)";
                opened=true;
                return;

            }

            if(dx>45){

                rowContent.style.transform="translateX(0)";
                opened=false;
                return;

            }

            if(opened) return;

            const now=Date.now();

            if(now-lastTap<300){

                loadEdit(index);

            }

            lastTap=now;

        });

        deleteBtn.onclick=()=>{

            rows.splice(index,1);

            saveDB();

            renderTable();
            renderSummary();
            renderStatistic();

        };

        tableBody.appendChild(tr);

    });

}

/* =========================
   LOAD EDIT
========================= */

function loadEdit(index){

    const r=rows[index];

    editIndex=index;

    productName.value=r.name;

    price.value=r.price===0?"":r.price;

    quantity.value=r.qty===1?"":r.qty;

    weight.value=r.weight===0?"":r.weight;

    inputDate.value=r.date;

    $("btnSave").textContent="CẬP NHẬT";

    updateTotal();

    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

}

/* =========================
   CLEAR
========================= */

function clearForm(){

    productName.value="";
    price.value="";
    quantity.value="";
    weight.value="";

    inputDate.value=today();

    editIndex=-1;

    $("btnSave").textContent="ENTER";

    updateTotal();

    setTimeout(()=>productName.focus(),100);

}

/* =========================
   SAVE DATA
========================= */

$("btnSave").onclick=()=>{

    if(productName.value.trim()===""){

        alert("Vui lòng nhập tên sản phẩm");
        return;

    }

    const obj={

        date:inputDate.value,

        name:productName.value.trim(),

        price:Number(price.value)||0,

        qty:Number(quantity.value)||1,

        weight:Number(weight.value)||0

    };

    obj.total=obj.price*obj.qty;

    if(editIndex===-1){

        rows.unshift(obj);

        if(!names.includes(obj.name))
            names.push(obj.name);

    }else{

        rows[editIndex]=obj;

    }

    saveDB();

    clearForm();

    renderTable();
    renderSummary();
    renderStatistic();

};

$("search").oninput=renderTable;
/*=========================================
  Chi Tiêu V3.2 Stable
  app.js (Part 2)
=========================================*/

/* =========================
   YEAR WHEEL (iOS)
========================= */

const yearWheel = $("yearWheel");

function buildYearWheel(){

    yearWheel.innerHTML="";

    for(let y=2000;y<=2100;y++){

        const div=document.createElement("div");

        div.className="wheelItem";

        div.dataset.year=y;

        div.textContent=y;

        yearWheel.appendChild(div);

    }


}

function scrollToYear(year, smooth = true){

    currentYear = Number(year);

    const top = (currentYear - 2000) * 36;

    yearWheel.scrollTo({
        top: top,
        behavior: smooth ? "smooth" : "auto"
    });

    setTimeout(() => {
        updateWheelActive();
    }, smooth ? 180 : 0);

}

function updateWheelActive(){

    const center = yearWheel.scrollTop + 70;

    let best = null;
    let diff = Infinity;

    yearWheel.querySelectorAll(".wheelItem").forEach(el=>{

        const d = Math.abs(el.offsetTop - center);

        if(d < diff){
            diff = d;
            best = el;
        }

        el.classList.remove("active");

    });

    if(best){
        best.classList.add("active");
        currentYear = Number(best.dataset.year);
    }

}

let wheelTimer=null;

yearWheel.addEventListener("scroll",()=>{

    updateWheelActive();

    clearTimeout(wheelTimer);

    wheelTimer=setTimeout(()=>{

        renderStatistic();

    },120);

});

/* =========================
   STATISTIC
========================= */

$("monthPicker").value=today().slice(0,7);

$("monthPicker").onchange=renderStatistic;

function renderStatistic(){

    const month=$("monthPicker").value;
    const year=String(currentYear);

    if(chartMode==="month"){

        renderMonthBars(month);

    }else{

        renderYearBars(year);

    }

}

/* =========================
   MONTH BAR
========================= */

function renderMonthBars(month){

    const left=$("leftBars");
    const right=$("rightBars");

    left.innerHTML="";
    right.innerHTML="";

    let daily=Array(31).fill(0);

    rows.forEach(r=>{

        if(r.date.startsWith(month)){

            const d=Number(r.date.slice(8));

            daily[d-1]+=r.total;

        }

    });

    const max=Math.max(...daily,1);

    daily.forEach((value,i)=>{

        const day=i+1;

        const bar=document.createElement("div");

        bar.className="dayBar";

        bar.dataset.date=
            `${month}-${String(day).padStart(2,"0")}`;

        bar.innerHTML=`
<div class="dayNo">${String(day).padStart(2,"0")}</div>

<div class="barBg">
<div class="barFill"
style="width:${value/max*100}%"></div>
</div>`;

        bar.onclick=()=>showDayDetail(bar.dataset.date);

        if(day<=15)
            left.appendChild(bar);
        else
            right.appendChild(bar);

    });

    const list=rows.filter(r=>r.date.startsWith(month));

    const total=list.reduce((s,i)=>s+i.total,0);

    $("statTotal").textContent=
        money(total)+" "+setting.currency;

    $("statCount").textContent=list.length;

    const days=new Date(
        Number(month.slice(0,4)),
        Number(month.slice(5)),
        0
    ).getDate();

    $("statAvg").textContent=
        money(Math.round(total/Math.max(days,1)));

}

/* =========================
   YEAR BAR
========================= */

function renderYearBars(year){

    const wrap=$("yearChart");

    wrap.innerHTML="";

    let monthly=Array(12).fill(0);

    rows.forEach(r=>{

        if(r.date.startsWith(year)){

            const m=Number(r.date.slice(5,7));

            monthly[m-1]+=r.total;

        }

    });

    const max=Math.max(...monthly,1);

    monthly.forEach((v,i)=>{

        const row=document.createElement("div");

        row.className="dayBar";

        row.innerHTML=`
<div class="dayNo">T${i+1}</div>

<div class="barBg">
<div class="barFill"
style="width:${v/max*100}%"></div>
</div>`;

        row.onclick=()=>{

            chartMode="month";

            $("tabMonth").classList.add("active");
            $("tabYear").classList.remove("active");

            $("monthPanel").classList.remove("hidden");
            $("yearPanel").classList.add("hidden");

            $("monthChart").classList.remove("hidden");
            wrap.classList.add("hidden");

            const mm=String(i+1).padStart(2,"0");

            $("monthPicker").value=`${year}-${mm}`;

            renderStatistic();

        };

        wrap.appendChild(row);

    });

    const list=rows.filter(r=>r.date.startsWith(year));

    const total=list.reduce((s,i)=>s+i.total,0);

    $("statTotal").textContent=
        money(total)+" "+setting.currency;

    $("statCount").textContent=list.length;

    $("statAvg").textContent=
        money(Math.round(total/12));

}

/* =========================
   DETAIL
========================= */

function showDayDetail(date){

    selectedDate=date;

    document.querySelectorAll(".dayBar")
    .forEach(i=>i.classList.remove("active"));

    const active=document.querySelector(
        `[data-date="${date}"]`
    );

    if(active) active.classList.add("active");

    const list=rows.filter(r=>r.date===date);

    const map={};

    list.forEach(r=>{

        if(!map[r.name]){

            map[r.name]={
                name:r.name,
                qty:0,
                weight:0,
                total:0
            };

        }

        map[r.name].qty+=r.qty;
        map[r.name].weight+=r.weight;
        map[r.name].total+=r.total;

    });

    const result=Object.values(map)
        .sort((a,b)=>b.total-a.total);

    const total=result.reduce((s,i)=>s+i.total,0);

    $("detailPanel").classList.remove("hidden");

    $("detailDate").textContent=date;

    $("detailTotal").textContent=
        money(total)+" "+setting.currency;

    $("detailInfo").textContent=
        `${list.length} lượt mua • ${result.length} sản phẩm`;

    const wrap=$("detailList");

    wrap.innerHTML="";

    result.forEach((item,index)=>{

        const medal=["🥇","🥈","🥉"][index]||"🏅";

        const percent=Math.round(item.total/total*100);

        const div=document.createElement("div");

        div.className="detailItem";

        div.innerHTML=`
<div class="rank">${medal}</div>

<div class="info">

<div class="name">${item.name}</div>

<div class="sub">
SL: ${item.qty} · ${item.weight} g
</div>

<div class="percentBar">
<div class="percentFill"
style="width:${percent}%"></div>
</div>

</div>

<div class="price">

${money(item.total)}

<div class="sub">${percent}%</div>

</div>`;

        wrap.appendChild(div);

    });

}

/* =========================
   BACKUP
========================= */

$("btnBackup").onclick=()=>{

    const backup={

        version:"3.2",

        build:"2026.09.10",

        backupDate:new Date().toISOString(),

        setting,

        nameList:names,

        expenseData:rows

    };

    const blob=new Blob(
        [JSON.stringify(backup,null,2)],
        {type:"application/json"}
    );

    const url=URL.createObjectURL(blob);

    const a=document.createElement("a");

    a.href=url;

    a.download="ChiTieu_Backup.json";

    a.click();

    URL.revokeObjectURL(url);

    const now=new Date();

    setting.lastBackup=
        now.toLocaleDateString("vi-VN")+" "+
        now.toLocaleTimeString("vi-VN",{
            hour:"2-digit",
            minute:"2-digit"
        });

    saveDB();

    $("lastBackup").textContent=setting.lastBackup;

    showToast("Đã sao lưu vào bộ máy");

};

/* =========================
   RESTORE
========================= */

$("btnRestore").onclick=()=>{

    $("restoreFile").click();

};

$("restoreFile").onchange=async(e)=>{

    const file=e.target.files[0];

    if(!file) return;

    try{

        const text=await file.text();

        const data=JSON.parse(text);

        rows=data.expenseData||[];
        names=data.nameList||[];
        setting=data.setting||setting;

        saveDB();

        renderTable();
        renderSummary();
        renderStatistic();

        updateTotal();

        $("lastBackup").textContent=
            setting.lastBackup||"Chưa sao lưu";

        showToast("Khôi phục thành công");

    }catch{

        alert("File Backup không hợp lệ");

    }

    e.target.value="";

};

/* =========================
   EXCEL
========================= */

$("btnExcel").onclick=()=>{

    const data=rows.map(r=>({

        "Ngày nhập":r.date,
        "Tên sản phẩm":r.name,
        "Giá":r.price,
        "Số lượng":r.qty,
        "Tổng tiền":r.total,
        "Trọng lượng(g)":r.weight,
        "Tiền tệ":setting.currency

    }));

    data.push({

        "Ngày nhập":"",
        "Tên sản phẩm":"TỔNG",
        "Giá":"",
        "Số lượng":"",
        "Tổng tiền":rows.reduce((s,i)=>s+i.total,0),
        "Trọng lượng(g)":"",
        "Tiền tệ":setting.currency

    });

    const wb=XLSX.utils.book_new();

    const ws=XLSX.utils.json_to_sheet(data);

    ws["!cols"]=[
        {wch:13},
        {wch:22},
        {wch:10},
        {wch:10},
        {wch:14},
        {wch:15},
        {wch:10}
    ];

    XLSX.utils.book_append_sheet(
        wb,ws,"ChiTieu"
    );

    XLSX.writeFile(
        wb,
        "DuLieuChiTieu.xlsx"
    );

};

/* =========================
   PAGE
========================= */

$("btnStatistic").onclick=()=>{

    $("homePage").classList.add("hidden");
    $("statPage").classList.remove("hidden");

    // Chỉ lần đầu trong phiên mới đưa về năm hiện tại
    currentYear = sessionYear;

    scrollToYear(currentYear,false);

    renderStatistic();

};

$("btnBack").onclick=()=>{

    $("statPage").classList.add("hidden");
    $("homePage").classList.remove("hidden");

};

$("tabMonth").onclick=()=>{

    chartMode="month";

    $("tabMonth").classList.add("active");
    $("tabYear").classList.remove("active");

    $("monthPanel").classList.remove("hidden");
    $("yearPanel").classList.add("hidden");

    $("monthChart").classList.remove("hidden");
    $("yearChart").classList.add("hidden");

    renderStatistic();

};

$("tabYear").onclick=()=>{

    chartMode="year";

    $("tabYear").classList.add("active");
    $("tabMonth").classList.remove("active");

    $("monthPanel").classList.add("hidden");
    $("yearPanel").classList.remove("hidden");

    $("monthChart").classList.add("hidden");
    $("yearChart").classList.remove("hidden");

    requestAnimationFrame(()=>{

        scrollToYear(currentYear,false);

        renderStatistic();

    });

};

/* =========================
   SETTING
========================= */

$("btnSetting").onclick=()=>{

    $("settingModal").classList.remove("hidden");

    $("lastBackup").textContent=
        setting.lastBackup||"Chưa sao lưu";

};

$("btnCloseSetting").onclick=()=>{

    $("settingModal").classList.add("hidden");

};

document.querySelectorAll(".settingCurrency")
.forEach(btn=>{

    if(btn.dataset.value===setting.currency)
        btn.classList.add("active");

    btn.onclick=()=>{

        setting.currency=btn.dataset.value;

        document.querySelectorAll(".settingCurrency")
        .forEach(i=>i.classList.remove("active"));

        btn.classList.add("active");

        saveDB();

        updateTotal();
        renderSummary();
        renderStatistic();

    };

});

/* =========================
   START
========================= */

function buildYearWheel(){

    yearWheel.innerHTML = "";

    for(let y=2000;y<=2100;y++){

        const div=document.createElement("div");

        div.className="wheelItem";

        div.dataset.year=y;

        div.textContent=y;

        yearWheel.appendChild(div);

    }

    // KHÔNG gọi updateWheelActive ở đây nữa
}
