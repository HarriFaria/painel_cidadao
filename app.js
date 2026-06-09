(function () {
  const payload = window.PAINEL_CIDADAO_DATA || { records: [] };
  const records = payload.records || [];

  const state = {
    year: "all",
    month: "all",
    app: "all",
    channel: "all",
    search: "",
  };

  const appLabels = {
    "divida-ativa": "Divida ativa",
    "mt-saude": "MT Saude",
    "procon-consumidor": "Procon consumidor",
    autista: "Autista",
    celiaco: "Celiaco",
    cnd: "CND",
    cnh: "CNH",
    veiculo: "Veiculo",
  };

  const els = {
    contrastToggle: document.querySelector("#contrastToggle"),
    yearFilter: document.querySelector("#yearFilter"),
    monthFilter: document.querySelector("#monthFilter"),
    appFilter: document.querySelector("#appFilter"),
    channelFilter: document.querySelector("#channelFilter"),
    searchFilter: document.querySelector("#searchFilter"),
    resetFilters: document.querySelector("#resetFilters"),
    kpiTotal: document.querySelector("#kpiTotal"),
    kpiTopService: document.querySelector("#kpiTopService"),
    kpiTopServiceValue: document.querySelector("#kpiTopServiceValue"),
    kpiTopApp: document.querySelector("#kpiTopApp"),
    kpiTopAppValue: document.querySelector("#kpiTopAppValue"),
    kpiDigitalShare: document.querySelector("#kpiDigitalShare"),
    timelineSubtitle: document.querySelector("#timelineSubtitle"),
    yearChart: document.querySelector("#yearChart"),
    channelChart: document.querySelector("#channelChart"),
    appChart: document.querySelector("#appChart"),
    serviceRanking: document.querySelector("#serviceRanking"),
    rankingCount: document.querySelector("#rankingCount"),
    annualLeaders: document.querySelector("#annualLeaders"),
    exportCsv: document.querySelector("#exportCsv"),
    detailsTable: document.querySelector("#detailsTable"),
  };

  const numberFmt = new Intl.NumberFormat("pt-BR");
  const percentFmt = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Marco",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  function formatNumber(value) {
    return numberFmt.format(value || 0);
  }

  function formatPercent(value) {
    return `${percentFmt.format(value || 0)}%`;
  }

  function appName(value) {
    return appLabels[value] || value;
  }

  function monthName(value) {
    return monthNames[Number(value) - 1] || value;
  }

  function monthShortName(value) {
    return monthName(value).slice(0, 3);
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function uniqueSorted(key) {
    return [...new Set(records.map((item) => item[key]))].sort((a, b) => {
      if (typeof a === "number") return a - b;
      return String(a).localeCompare(String(b), "pt-BR");
    });
  }

  function fillSelect(select, options, allLabel, labeler) {
    select.innerHTML = "";
    select.append(new Option(allLabel, "all"));
    options.forEach((option) => {
      select.append(new Option(labeler ? labeler(option) : option, option));
    });
  }

  function availableMonths() {
    const scopedRecords = state.year === "all"
      ? records
      : records.filter((item) => String(item.year) === state.year);
    return [...new Set(scopedRecords.map((item) => item.month))].sort((a, b) => a - b);
  }

  function syncMonthFilter() {
    const months = availableMonths();
    if (state.month !== "all" && !months.some((month) => String(month) === state.month)) {
      state.month = "all";
    }
    fillSelect(els.monthFilter, months, "Todos os meses", monthName);
    els.monthFilter.value = state.month;
  }

  function groupBy(list, keyFn) {
    const map = new Map();
    list.forEach((item) => {
      const key = keyFn(item);
      map.set(key, (map.get(key) || 0) + item.total);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]), "pt-BR"));
  }

  function filterRecords() {
    const term = normalizeText(state.search);
    return records.filter((item) => {
      const yearOk = state.year === "all" || String(item.year) === state.year;
      const monthOk = state.month === "all" || String(item.month) === state.month;
      const appOk = state.app === "all" || item.app_name === state.app;
      const channelOk = state.channel === "all" || item.demand_channel === state.channel;
      const searchOk = !term || normalizeText(item.service).includes(term);
      return yearOk && monthOk && appOk && channelOk && searchOk;
    });
  }

  function totalOf(list) {
    return list.reduce((sum, item) => sum + item.total, 0);
  }

  function truncate(value, length) {
    if (!value) return "-";
    return value.length > length ? `${value.slice(0, length - 1)}...` : value;
  }

  function renderKpis(list) {
    const total = totalOf(list);
    const serviceTop = groupBy(list, (item) => item.service)[0] || ["-", 0];
    const appTop = groupBy(list, (item) => item.app_name)[0] || ["-", 0];
    const digital = list
      .filter((item) => item.demand_channel === "Digital" || item.demand_channel === "App")
      .reduce((sum, item) => sum + item.total, 0);

    els.kpiTotal.textContent = formatNumber(total);
    els.kpiTopService.textContent = truncate(serviceTop[0], 58);
    els.kpiTopService.title = serviceTop[0];
    els.kpiTopServiceValue.textContent = `${formatNumber(serviceTop[1])} solicitacoes`;
    els.kpiTopApp.textContent = appName(appTop[0]);
    els.kpiTopAppValue.textContent = `${formatNumber(appTop[1])} solicitacoes`;
    els.kpiDigitalShare.textContent = formatPercent(total ? (digital / total) * 100 : 0);
  }

  function renderYearChart(list) {
    const showMonthly = state.year !== "all";
    const grouped = new Map(groupBy(list, (item) => showMonthly ? item.month : item.year));
    const labels = showMonthly
      ? availableMonths().filter((month) => state.month === "all" || String(month) === state.month)
      : uniqueSorted("year").filter((year) => state.year === "all" || String(year) === state.year);
    const values = labels.map((label) => grouped.get(label) || 0);
    const max = Math.max(...values, 1);
    const width = 860;
    const height = 330;
    const pad = { top: 24, right: 22, bottom: 42, left: 72 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const xStep = labels.length > 1 ? innerW / (labels.length - 1) : innerW;
    const points = labels.map((label, index) => {
      const x = pad.left + (labels.length > 1 ? index * xStep : innerW / 2);
      const y = pad.top + innerH - (values[index] / max) * innerH;
      return { label, axisLabel: showMonthly ? monthShortName(label) : label, value: values[index], x, y };
    });

    if (!points.length) {
      els.yearChart.innerHTML = '<div class="empty-state">Nenhum dado encontrado</div>';
      return;
    }

    const line = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
    const area = `${line} L ${points[points.length - 1].x} ${pad.top + innerH} L ${points[0].x} ${pad.top + innerH} Z`;
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((tick) => {
      const y = pad.top + innerH - tick * innerH;
      const value = Math.round(max * tick);
      return `<g><line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" stroke="#e6ece8"/><text x="${pad.left - 12}" y="${y + 4}" text-anchor="end" class="axis-label">${compact(value)}</text></g>`;
    }).join("");
    els.timelineSubtitle.textContent = showMonthly ? `Total de solicitacoes por mes em ${state.year}` : "Total de solicitacoes por ano";
    const yearLabels = points.map((point) => `<text x="${point.x}" y="${height - 12}" text-anchor="middle" class="axis-label">${point.axisLabel}</text>`).join("");
    const circles = points.map((point) => `<g><circle class="point" cx="${point.x}" cy="${point.y}" r="6"/><title>${showMonthly ? monthName(point.label) : point.label}: ${formatNumber(point.value)}</title></g>`).join("");
    const valueLabels = points.map((point) => `<text x="${point.x}" y="${Math.max(point.y - 14, 14)}" text-anchor="middle" class="axis-label">${compact(point.value)}</text>`).join("");

    els.yearChart.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        ${ticks}
        <path class="area-path" d="${area}"></path>
        <path class="line-path" d="${line}"></path>
        ${circles}
        ${valueLabels}
        ${yearLabels}
      </svg>
    `;
  }

  function compact(value) {
    if (value >= 1000000) return `${String((value / 1000000).toFixed(1)).replace(".", ",")} mi`;
    if (value >= 1000) return `${Math.round(value / 1000)} mil`;
    return formatNumber(value);
  }

  function renderBarList(container, data, colorClass) {
    const max = Math.max(...data.map((item) => item[1]), 1);
    if (!data.length) {
      container.innerHTML = '<div class="empty-state">Nenhum dado encontrado</div>';
      return;
    }

    container.innerHTML = data.map(([name, value]) => `
      <div class="bar-row">
        <div class="row-head">
          <span class="row-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
          <span class="row-value">${formatNumber(value)}</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill ${colorClass || ""}" style="width: ${Math.max((value / max) * 100, 1)}%"></div>
        </div>
      </div>
    `).join("");
  }

  function renderChannels(list) {
    renderBarList(els.channelChart, groupBy(list, (item) => item.demand_channel), "blue");
  }

  function renderApps(list) {
    const data = groupBy(list, (item) => item.app_name).map(([name, value]) => [appName(name), value]);
    renderBarList(els.appChart, data, "amber");
  }

  function renderRanking(list) {
    const data = groupBy(list, (item) => item.service).slice(0, 10);
    els.rankingCount.textContent = `Top ${data.length}`;
    if (!data.length) {
      els.serviceRanking.innerHTML = '<div class="empty-state">Nenhum dado encontrado</div>';
      return;
    }

    const max = Math.max(...data.map((item) => item[1]), 1);
    els.serviceRanking.innerHTML = data.map(([name, value], index) => `
      <div class="ranking-row">
        <span class="rank-number">${index + 1}</span>
        <div>
          <div class="row-head">
            <span class="row-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
            <span class="row-value">${formatNumber(value)}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${Math.max((value / max) * 100, 1)}%"></div>
          </div>
        </div>
      </div>
    `).join("");
  }

  function renderAnnualLeaders(list) {
    const years = uniqueSorted("year").filter((year) => state.year === "all" || String(year) === state.year);
    const rows = years.map((year) => {
      const yearRecords = list.filter((item) => item.year === year);
      const leader = groupBy(yearRecords, (item) => item.app_name)[0] || ["-", 0];
      return { year, name: appName(leader[0]), value: leader[1] };
    }).filter((item) => item.value > 0);

    if (!rows.length) {
      els.annualLeaders.innerHTML = '<div class="empty-state">Nenhum dado encontrado</div>';
      return;
    }

    els.annualLeaders.innerHTML = rows.map((item) => `
      <div class="leader-row">
        <span class="leader-year">${item.year}</span>
        <div class="leader-meta">
          <strong>${escapeHtml(item.name)}</strong>
          <small>${formatNumber(item.value)} solicitacoes</small>
        </div>
      </div>
    `).join("");
  }

  function renderTable(list) {
    const rows = [...list].sort((a, b) => b.total - a.total).slice(0, 120);
    if (!rows.length) {
      els.detailsTable.innerHTML = '<tr><td colspan="6" class="empty-state">Nenhum dado encontrado</td></tr>';
      return;
    }

    els.detailsTable.innerHTML = rows.map((item) => `
      <tr>
        <td>${escapeHtml(item.service)}</td>
        <td>${escapeHtml(appName(item.app_name))}</td>
        <td>${item.year}</td>
        <td>${escapeHtml(monthName(item.month))}</td>
        <td>${escapeHtml(item.demand_channel)}</td>
        <td>${formatNumber(item.total)}</td>
      </tr>
    `).join("");
  }

  function csvCell(value) {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  }

  function currentCsvFileName() {
    const parts = ["painel_cidadao"];
    if (state.year !== "all") parts.push(state.year);
    if (state.month !== "all") parts.push(String(state.month).padStart(2, "0"));
    if (state.app !== "all") parts.push(state.app);
    if (state.channel !== "all") parts.push(normalizeText(state.channel).replace(/\s+/g, "-"));
    return `${parts.join("_")}.csv`;
  }

  function exportCsv() {
    const rows = [...filterRecords()].sort((a, b) => b.total - a.total);
    if (!rows.length) return;

    const header = ["Servico", "Sistema", "Ano", "Mes", "Canal", "Total"];
    const body = rows.map((item) => [
      item.service,
      appName(item.app_name),
      item.year,
      monthName(item.month),
      item.demand_channel,
      item.total,
    ].map(csvCell).join(";"));
    const csv = `\uFEFF${[header.map(csvCell).join(";"), ...body].join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = currentCsvFileName();
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function render() {
    const filtered = filterRecords();
    els.exportCsv.disabled = !filtered.length;
    renderKpis(filtered);
    renderYearChart(filtered);
    renderChannels(filtered);
    renderApps(filtered);
    renderRanking(filtered);
    renderAnnualLeaders(filtered);
    renderTable(filtered);
  }

  function bindEvents() {
    els.contrastToggle.addEventListener("click", () => {
      const isActive = document.body.classList.toggle("high-contrast");
      els.contrastToggle.setAttribute("aria-pressed", String(isActive));
    });
    els.yearFilter.addEventListener("change", (event) => {
      state.year = event.target.value;
      syncMonthFilter();
      render();
    });
    els.monthFilter.addEventListener("change", (event) => {
      state.month = event.target.value;
      render();
    });
    els.appFilter.addEventListener("change", (event) => {
      state.app = event.target.value;
      render();
    });
    els.channelFilter.addEventListener("change", (event) => {
      state.channel = event.target.value;
      render();
    });
    els.searchFilter.addEventListener("input", (event) => {
      state.search = event.target.value;
      render();
    });
    els.resetFilters.addEventListener("click", () => {
      state.year = "all";
      state.month = "all";
      state.app = "all";
      state.channel = "all";
      state.search = "";
      els.yearFilter.value = "all";
      syncMonthFilter();
      els.appFilter.value = "all";
      els.channelFilter.value = "all";
      els.searchFilter.value = "";
      render();
    });
    els.exportCsv.addEventListener("click", exportCsv);
  }

  function init() {
    fillSelect(els.yearFilter, uniqueSorted("year"), "Todos os anos");
    syncMonthFilter();
    fillSelect(els.appFilter, uniqueSorted("app_name"), "Todos os sistemas", appName);
    fillSelect(els.channelFilter, uniqueSorted("demand_channel"), "Todos os canais");
    bindEvents();
    render();
  }

  init();
})();
