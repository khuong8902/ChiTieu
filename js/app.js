/*=========================================
  Chi Tiêu V3.2 Stable
  app.js  (Part 1/2)
=========================================*/

document.addEventListener("DOMContentLoaded", async () => {

const $ = id => document.getElementById(id);

const today = () => new Date().toISOString().slice(0,10);

const formatMoney = n =>
    Number(n||0).toLocaleString("en-US");

/*=========================
  DATABASE
=========================*/

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
let currentYear = new Date().getFullYear();
let selectedDate = "";

/*=========================
  ELEMENT
=========================*/

const productName = $("productName");
const price = $("price");
const quantity = $("quantity");
const weight = $("weight");
const inputDate = $("inputDate");

const totalPrice = $("totalPrice");
const suggestBox = $("suggestBox");
const tableBody = $("tableBody");

inputDate.value = today();

/*=========================
  LOAD NAMELIST
=========================*/

try{

    const txt = await fetch("NameList.txt").then(r=>r.text());

    txt.split(/\r?\n/)
       .map(v=>v.trim())
       .filter(Boolean)
       .forEach(v=>{
            if(!names.includes(v)) names.push(v);
       });

}catch(e){}

/*=========================
  SAVE
=========================*/

function saveDB(){

    localStorage.setItem("setting",JSON.stringify(setting));
    localStorage.setItem("nameList",JSON.stringify(names));
    localStorage.setItem("expenseData",JSON.stringify(rows));

}

/*=========================
  TOAST
=========================*/

function showToast(text){

    $("toastText").textContent = text;

    $("toast").classList.remove("hidden");

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(()=>{

        $("toast").classList.add("hidden");

    },1800);

}

/*=========================
  NORMALIZE
=========================*/

function normalize(str){

    return (str||"")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g,"");

}

/*=========================
  SUGGEST
=========================*/

function renderSuggest(){

    const key = normalize(productName.value);

    suggestBox.innerHTML="";

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

productName.oninput = renderSuggest;

document.addEventListener("click",e=>{

    if(!e.target.closest(".fieldWrap"))
        suggestBox.style.display="none";

});

/*=========================
  TOTAL
=========================*/

function updateTotal(){

    const p = Number(price.value)||0;
    const q = Number(quantity.value)||1;

    totalPrice.textContent =
        formatMoney(p*q)+" "+setting.currency;

}

price.oninput = updateTotal;
quantity.oninput = updateTotal;

/*=========================
  SUMMARY
=========================*/

function renderSummary(){

    const td = today();
    const month = td.slice(0,7);

    let todayMoney = 0;
    let monthMoney = 0;

    rows.forEach(r=>{

        if(r.date===td)
            todayMoney += r.total;

        if(r.date.startsWith(month))
            monthMoney += r.total;

    });

    $("todayTotal").textContent =
        formatMoney(todayMoney)+" "+setting.currency;

    $("monthTotal").textContent =
        formatMoney(monthMoney)+" "+setting.currency;

}

/*=========================
  TABLE
=========================*/

function renderTable(){

    tableBody.innerHTML="";

    const keyword = normalize($("search").value);

    rows
    .filter(r=>normalize(r.name).includes(keyword))
    .forEach((item,index)=>{

        const tr=document.createElement("tr");

        tr.innerHTML=`
<td colspan="3" style="padding:0;border:none">

<div class="swipeRow">

    <div class="deleteBtn">🗑 Xóa</div>

    <div class="rowContent">

        <div>${item.date}</div>

        <div>${item.name}</div>

        <div class="money">${formatMoney(item.total)}</div>

    </div>

</div>

</td>`;

        const rowContent=tr.querySelector(".rowContent");
        const deleteBtn=tr.querySelector(".deleteBtn");

        let startX=0;
        let lastTap=0;
        let opened=false;

        tr.addEventListener("touchstart",e=>{

            startX=e.touches[0].clientX;

        });

        tr.addEventListener("touchend",e=>{

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

        };

        tableBody.appendChild(tr);

    });

}

/*=========================
  LOAD EDIT
=========================*/

function loadEdit(index){

    const r = rows[index];

    editIndex = index;

    productName.value = r.name;

    price.value = r.price===0 ? "" : r.price;

    quantity.value = r.qty===1 ? "" : r.qty;

    weight.value = r.weight===0 ? "" : r.weight;

    inputDate.value = r.date;

    $("btnSave").textContent="CẬP NHẬT";

    updateTotal();

    window.scrollTo({
        top:0,
        behavior:"smooth"
    });

}

/*=========================
  CLEAR FORM
=========================*/

function clearForm(){

    productName.value="";
    price.value="";
    quantity.value="";
    weight.value="";

    inputDate.value=today();

    editIndex=-1;

    $("btnSave").textContent="ENTER";

    updateTotal();

}

/*=========================
  SAVE ITEM
=========================*/

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

};

$("search").oninput=renderTable;
/*=========================
  YEAR WHEEL
=========================*/

const yearWheel = $("yearWheel");
let wheelReady = false;

function buildYearWheel(){

    yearWheel.innerHTML = "";

    for(let y=2000;y<=2100;y++){

        const div=document.createElement("div");
        div.className="wheelItem";
        div.dataset.year=y;
        div.textContent=y;

        yearWheel.appendChild(div);

    }

    wheelReady = true;

}

function setWheelYear(year){

    if(!wheelReady) return;

    currentYear = Number(year);

    const top = (currentYear-2000)*36;

    yearWheel.scrollTop = top;

    updateWheelActive();

}

function updateWheelActive(){

    const center = yearWheel.scrollTop + 80;

    let best = null;
    let diff = Infinity;

    yearWheel.querySelectorAll(".wheelItem")
    .forEach(el=>{

        const d=Math.abs(el.offsetTop-center);

        el.classList.remove("active");

        if(d<diff){

            diff=d;
            best=el;

        }

    });

    if(best){

        best.classList.add("active");

        currentYear=Number(best.dataset.year);

    }

}

let wheelTimer;

yearWheel.addEventListener("scroll",()=>{

    updateWheelActive();

    clearTimeout(wheelTimer);

    wheelTimer=setTimeout(()=>{

        if(chartMode==="year")
            renderStatistic();

    },120);

});

/*=========================
  STATISTIC
=========================*/

$("monthPicker").value=today().slice(0,7);

$("monthPicker").onchange=renderStatistic;

function renderStatistic(){

    if(chartMode==="month"){

        renderMonthBars($("monthPicker").value);

    }else{

        renderYearBars(String(currentYear));

    }

}

/*=========================
  MONTH BAR
=========================*/

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

        if(day<=15) left.appendChild(bar);
        else right.appendChild(bar);

    });

    const list=rows.filter(r=>r.date.startsWith(month));

    const total=list.reduce((s,i)=>s+i.total,0);

    $("statTotal").textContent=
        formatMoney(total)+" "+setting.currency;

    $("statCount").textContent=list.length;

    const days=new Date(
        Number(month.slice(0,4)),
        Number(month.slice(5)),
        0
    ).getDate();

    $("statAvg").textContent=
        formatMoney(Math.round(total/Math.max(days,1)));

}

/*=========================
  YEAR BAR
=========================*/

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

            $("monthPicker").value=
                `${year}-${String(i+1).padStart(2,"0")}`;

            renderStatistic();

        };

        wrap.appendChild(row);

    });

    const list=rows.filter(r=>r.date.startsWith(year));

    const total=list.reduce((s,i)=>s+i.total,0);

    $("statTotal").textContent=
        formatMoney(total)+" "+setting.currency;

    $("statCount").textContent=list.length;

    $("statAvg").textContent=
        formatMoney(Math.round(total/12));

}

/*=========================
  DAY DETAIL
=========================*/

function showDayDetail(date){

    selectedDate=date;

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

    $("detailInfo").textContent=
        `${list.length} lượt mua • ${result.length} sản phẩm`;

    $("detailTotal").textContent=
        formatMoney(total)+" "+setting.currency;

    const wrap=$("detailList");

    wrap.innerHTML="";

    result.forEach((item,index)=>{

        const medal=["🥇","🥈","🥉"][index]||"🏅";

        const percent=Math.round(item.total/Math.max(total,1)*100);

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

${formatMoney(item.total)}

<div class="sub">${percent}%</div>

</div>`;

        wrap.appendChild(div);

    });

}

/*=========================
  BACKUP
=========================*/

$("btnBackup").onclick=()=>{

    const backup={

        version:"3.2",

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

    setting.lastBackup=
        new Date().toLocaleString("vi-VN");

    saveDB();

    $("lastBackup").textContent=
        setting.lastBackup;

    showToast("Đã sao lưu vào bộ máy");

};

/*=========================
  RESTORE
=========================*/

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

        $("lastBackup").textContent=
            setting.lastBackup||"Chưa sao lưu";

        showToast("Khôi phục thành công");

    }catch{

        alert("File Backup không hợp lệ");

    }

    e.target.value="";

};

/*=========================
  EXCEL
=========================*/

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

    const wb=XLSX.utils.book_new();

    const ws=XLSX.utils.json_to_sheet(data);

    XLSX.utils.book_append_sheet(
        wb,ws,"ChiTieu"
    );

    XLSX.writeFile(
        wb,
        "DuLieuChiTieu.xlsx"
    );

};

/*=========================
  PAGE
=========================*/

$("btnStatistic").onclick=()=>{

    $("homePage").classList.add("hidden");
    $("statPage").classList.remove("hidden");

    chartMode="month";

    $("tabMonth").classList.add("active");
    $("tabYear").classList.remove("active");

    $("monthPanel").classList.remove("hidden");
    $("yearPanel").classList.add("hidden");

    $("monthChart").classList.remove("hidden");
    $("yearChart").classList.add("hidden");

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

        setWheelYear(new Date().getFullYear());

        renderStatistic();

    });

};

/*=========================
  SETTING
=========================*/

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

/*=========================
  START
=========================*/

buildYearWheel();

renderTable();
renderSummary();
updateTotal();

$("lastBackup").textContent=
    setting.lastBackup||"Chưa sao lưu";

setTimeout(()=>{

    $("splash").style.display="none";

},350);

});
