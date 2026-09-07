// =============================
// Chi Tieu V2.1 Stable
// Part 1/2
// =============================

document.addEventListener("DOMContentLoaded", async () => {

const $ = (id) => document.getElementById(id);

const today = () => new Date().toISOString().slice(0,10);

const format = (num)=>{
    return Number(num || 0).toLocaleString("en-US");
};

//=======================
// Elements
//=======================

const splash = $("splash");

const homePage = $("homePage");
const statPage = $("statPage");

const productName = $("productName");
const price = $("price");
const quantity = $("quantity");
const weight = $("weight");
const inputDate = $("inputDate");

const suggestBox = $("suggestBox");

const tableBody = $("tableBody");

const totalPrice = $("totalPrice");

const todayTotal = $("todayTotal");
const monthTotal = $("monthTotal");

const search = $("search");

const btnSave = $("btnSave");

//=======================
// Local Storage
//=======================

let setting = JSON.parse(
    localStorage.getItem("setting") ||
    '{"currency":"JPY"}'
);

let nameList = JSON.parse(
    localStorage.getItem("nameList") ||
    "[]"
);

let expenseData = JSON.parse(
    localStorage.getItem("expenseData") ||
    "[]"
);

let editIndex = -1;

//=======================
// Default Date
//=======================

inputDate.value = today();

//=======================
// Read NameList.txt
//=======================

try{

    const txt = await fetch("NameList.txt").then(r=>r.text());

    txt.split(/\r?\n/)
       .map(i=>i.trim())
       .filter(Boolean)
       .forEach(v=>{

            if(!nameList.includes(v)){
                nameList.push(v);
            }

       });

}catch(e){
    console.log("Không đọc được NameList.txt");
}

//=======================
// Save Local
//=======================

function saveDB(){

    localStorage.setItem(
        "setting",
        JSON.stringify(setting)
    );

    localStorage.setItem(
        "nameList",
        JSON.stringify(nameList)
    );

    localStorage.setItem(
        "expenseData",
        JSON.stringify(expenseData)
    );

}

//=======================
// Normalize
//=======================

function normalize(str){

    return (str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g,"");

}

//=======================
// Suggest
//=======================

function renderSuggest(){

    const key = normalize(productName.value);

    suggestBox.innerHTML = "";

    if(key===""){

        suggestBox.style.display="none";
        return;

    }

    const result = nameList
        .filter(i=>normalize(i).includes(key))
        .sort((a,b)=>{

            const ca = expenseData.filter(x=>x.name===a).length;
            const cb = expenseData.filter(x=>x.name===b).length;

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

    suggestBox.style.display =
        result.length ? "block":"none";

}

productName.addEventListener("input",renderSuggest);

document.addEventListener("click",(e)=>{

    if(!e.target.closest(".field")){

        suggestBox.style.display="none";

    }

});

//=======================
// Total Money
//=======================

function updateTotal(){

    const p = Number(price.value)||0;

    const q = Number(quantity.value)||1;

    const total = p*q;

    totalPrice.textContent =
        format(total)+" "+setting.currency;

}

price.oninput=updateTotal;

quantity.oninput=updateTotal;

//=======================
// Summary
//=======================

function renderSummary(){

    const td = today();

    const month = td.slice(0,7);

    let todayMoney=0;

    let monthMoney=0;

    expenseData.forEach(i=>{

        if(i.date===td){

            todayMoney+=i.total;

        }

        if(i.date.startsWith(month)){

            monthMoney+=i.total;

        }

    });

    todayTotal.textContent =
        format(todayMoney)+" "+setting.currency;

    monthTotal.textContent =
        format(monthMoney)+" "+setting.currency;

}

//=======================
// Table
//=======================

function renderTable(){

    tableBody.innerHTML="";

    const key = normalize(search.value);

    expenseData
        .filter(i=>normalize(i.name).includes(key))
        .forEach((item,index)=>{

        const tr=document.createElement("tr");

tr.innerHTML=`
<td colspan="3" style="padding:0;border:none">

<div class="swipeRow">

    <div class="deleteBtn">
        🗑 Xóa
    </div>

    <div class="rowContent">

        <div class="cell date">${item.date}</div>

        <div class="cell name">${item.name}</div>

        <div class="cell money">${format(item.total)}</div>

    </div>

</div>

</td>
`;

        // Touch Delete

const rowContent = tr.querySelector(".rowContent");
const deleteBtn = tr.querySelector(".deleteBtn");

let startX = 0;
let lastTap = 0;
let opened = false;

tr.addEventListener("touchstart",(e)=>{

    startX = e.touches[0].clientX;

});

tr.addEventListener("touchend",(e)=>{

    const dx = e.changedTouches[0].clientX - startX;

    // Vuốt trái mở nút Xóa
    if(dx < -45){

        rowContent.style.transform = "translateX(-88px)";
        opened = true;
        return;

    }

    // Vuốt phải đóng lại
    if(dx > 45){

        rowContent.style.transform = "translateX(0)";
        opened = false;
        return;

    }

    // Nếu nút đỏ đang mở thì không sửa
    if(opened) return;

    const now = Date.now();

    if(now - lastTap < 300){
        loadEdit(index);
    }

    lastTap = now;

});

// Bấm nút đỏ để xóa
deleteBtn.addEventListener("click",()=>{

    expenseData.splice(index,1);

    saveDB();

    renderTable();

    renderSummary();

    drawChart();

});



        tableBody.appendChild(tr);

    });

}

//=======================
// Edit
//=======================

function loadEdit(index){

    const item = expenseData[index];

    editIndex=index;

    productName.value=item.name;

    price.value=item.price;

    quantity.value=item.qty===0?"":item.qty;

    weight.value=item.weight;

    inputDate.value=item.date;

    btnSave.textContent="CẬP NHẬT";

    updateTotal();

    window.scrollTo({

        top:0,

        behavior:"smooth"

    });

}

//=======================
// Clear
//=======================

function clearForm(){

    productName.value="";

    price.value="";

    quantity.value="";

    weight.value="";

    inputDate.value=today();

    editIndex=-1;

    btnSave.textContent="ENTER";

    updateTotal();

}

//=======================
// Save Button
//=======================

btnSave.onclick=()=>{

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

        expenseData.unshift(obj);

        if(!nameList.includes(obj.name)){

            nameList.push(obj.name);

        }

    }else{

        expenseData[editIndex]=obj;

    }

    saveDB();

    clearForm();

    renderTable();

    renderSummary();

    drawChart();

};

//=======================
// Search
//=======================

search.oninput=renderTable;
  //=======================
// ===== PART 2/2 ======
//=======================

// ---------- Setting ----------

const settingModal = $("settingModal");

$("btnSetting").onclick = () => {
    settingModal.classList.remove("hidden");
};

$("btnCloseSetting").onclick = () => {
    settingModal.classList.add("hidden");
};

settingModal.onclick = (e) => {
    if (e.target === settingModal) {
        settingModal.classList.add("hidden");
    }
};

document.querySelectorAll(".settingCurrency").forEach(btn => {

    if(btn.dataset.value===setting.currency){
        btn.classList.add("active");
    }

    btn.onclick = () => {

        setting.currency = btn.dataset.value;

        document
            .querySelectorAll(".settingCurrency")
            .forEach(i=>i.classList.remove("active"));

        btn.classList.add("active");

        saveDB();

        updateTotal();

        renderSummary();

    };

});

//=======================
// Statistic Page
//=======================

const monthPicker = $("monthPicker");
const yearPicker = $("yearPicker");

monthPicker.value = today().slice(0,7);

// Tạo danh sách năm

const currentYear = new Date().getFullYear();

for(let y=currentYear-5;y<=currentYear+2;y++){

    const op=document.createElement("option");

    op.value=y;

    op.textContent=y;

    yearPicker.appendChild(op);

}

yearPicker.value=currentYear;

//=======================
// Tabs
//=======================

let chartMode="month";

$("tabMonth").onclick=()=>{

    chartMode="month";

    $("monthPanel").classList.remove("hidden");
    $("yearPanel").classList.add("hidden");

    $("tabMonth").classList.add("active");
    $("tabYear").classList.remove("active");

    drawChart();

};

$("tabYear").onclick=()=>{

    chartMode="year";

    $("yearPanel").classList.remove("hidden");
    $("monthPanel").classList.add("hidden");

    $("tabYear").classList.add("active");
    $("tabMonth").classList.remove("active");

    drawChart();

};

monthPicker.onchange=drawChart;
yearPicker.onchange=drawChart;

//=======================
// Line Chart
//=======================

function drawChart(){

    const canvas = $("lineChart");

    const ctx = canvas.getContext("2d");

    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Grid

    ctx.strokeStyle="#E5E7EB";

    ctx.lineWidth=1;

    for(let i=0;i<5;i++){

        const y=20+i*45;

        ctx.beginPath();

        ctx.moveTo(30,y);

        ctx.lineTo(330,y);

        ctx.stroke();

    }

    let data=[];

    if(chartMode==="month"){

        data=new Array(31).fill(0);

        expenseData.forEach(item=>{

            if(item.date.startsWith(monthPicker.value)){

                const d=Number(item.date.slice(8));

                data[d-1]+=item.total;

            }

        });

    }else{

        data=new Array(12).fill(0);

        expenseData.forEach(item=>{

            if(item.date.startsWith(yearPicker.value)){

                const m=Number(item.date.slice(5,7));

                data[m-1]+=item.total;

            }

        });

    }

    const max=Math.max(...data,1);

    // Line

    ctx.strokeStyle="#2563EB";
    ctx.lineWidth=3;

    ctx.beginPath();

    data.forEach((v,i)=>{

        const x=30+i*(300/(data.length-1));

        const y=190-(v/max)*150;

        if(i===0){

            ctx.moveTo(x,y);

        }else{

            ctx.lineTo(x,y);

        }

    });

    ctx.stroke();

    // Points

    ctx.fillStyle="#2563EB";

    data.forEach((v,i)=>{

        const x=30+i*(300/(data.length-1));

        const y=190-(v/max)*150;

        ctx.beginPath();

        ctx.arc(x,y,4,0,Math.PI*2);

        ctx.fill();

    });

    // Labels

    ctx.fillStyle="#64748B";

    ctx.font="10px sans-serif";

    if(chartMode==="month"){

        for(let i=0;i<31;i+=5){

            const x=30+i*(300/30);

            ctx.fillText(i+1,x-5,210);

        }

    }else{

        for(let i=0;i<12;i++){

            const x=30+i*(300/11);

            ctx.fillText(i+1,x-3,210);

        }

    }

}

//=======================
// Page Switch
//=======================

$("btnStatistic").onclick=()=>{

    homePage.classList.add("hidden");

    statPage.classList.remove("hidden");

    drawChart();

};

$("btnBack").onclick=()=>{

    statPage.classList.add("hidden");

    homePage.classList.remove("hidden");

};

//=======================
// Export Excel (.xlsx)
//=======================

$("btnExcel").onclick=()=>{

    const excelData=expenseData.map(i=>({

        "Ngày nhập":i.date,

        "Tên sản phẩm":i.name,

        "Giá":i.price,

        "Số lượng":i.qty,

        "Tổng tiền":i.total,

        "Trọng lượng (g)":i.weight,

        "Tiền tệ":setting.currency

    }));

    const wb=XLSX.utils.book_new();

    const ws=XLSX.utils.json_to_sheet(excelData);

    // Độ rộng cột

    ws["!cols"]=[

        {wch:14},
        {wch:24},
        {wch:12},
        {wch:10},
        {wch:14},
        {wch:16},
        {wch:10}

    ];

    XLSX.utils.book_append_sheet(
        wb,
        ws,
        "ChiTieu"
    );

    XLSX.writeFile(
        wb,
        "DuLieuChiTieu.xlsx"
    );

};

//=======================
// START APP
//=======================

updateTotal();

renderTable();

renderSummary();

drawChart();

setTimeout(()=>{

    splash.style.display="none";

    homePage.classList.remove("hidden");

},600);

});
