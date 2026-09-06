document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const splash = $("splash");
  const app = $("app");

  const name = $("name");
  const price = $("price");
  const weight = $("weight");
  const currency = $("currency");
  const unit = $("unit");
  const date = $("date");

  const search = $("search");
  const rows = $("rows");
  const namesList = $("names");

  let products = JSON.parse(localStorage.getItem("products") || '["Cá hồi","Cà chua","Cam"]');
  let data = JSON.parse(localStorage.getItem("expenses") || "[]");

  const today = () => new Date().toISOString().slice(0,10);
  date.value = today();

  function renderSuggest() {
    namesList.innerHTML = "";
    products.sort().forEach(p => {
      const op = document.createElement("option");
      op.value = p;
      namesList.appendChild(op);
    });
  }

  function renderTable() {
    const q = search.value.toLowerCase();
    rows.innerHTML = "";

    data
      .filter(i => i.name.toLowerCase().includes(q))
      .forEach(i => {
        rows.innerHTML += `
          <tr>
            <td>${i.date}</td>
            <td>${i.name}</td>
            <td style="text-align:right">
              ${Number(i.price).toLocaleString()} ${i.currency}
            </td>
          </tr>`;
      });
  }

  renderSuggest();
  renderTable();

  setTimeout(() => {
    splash.style.display = "none";
    app.classList.remove("hide");
  }, 900);

  $("save").onclick = () => {
    if (!name.value.trim()) return;

    if (!products.includes(name.value))
      products.push(name.value);

    data.unshift({
      date: date.value,
      name: name.value,
      price: price.value || 0,
      currency: currency.value,
      weight: weight.value || 0,
      unit: unit.value
    });

    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("expenses", JSON.stringify(data));

    name.value = "";
    price.value = "";
    weight.value = "";
    date.value = today();

    renderSuggest();
    renderTable();
  };

  search.addEventListener("input", renderTable);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
});
