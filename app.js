(function () {
  const payload = window.PAINEL_CIDADAO_DATA || { records: [] };
  const records = payload.records || [];

  const state = {
    years: new Set(),
    months: new Set(),
    apps: new Set(),
    channels: new Set(),
    services: new Set(),
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
    yearFilterButton: document.querySelector("#yearFilterButton"),
    yearFilter: document.querySelector("#yearFilter"),
    monthFilterButton: document.querySelector("#monthFilterButton"),
    monthFilter: document.querySelector("#monthFilter"),
    appFilterButton: document.querySelector("#appFilterButton"),
    appFilter: document.querySelector("#appFilter"),
    channelFilterButton: document.querySelector("#channelFilterButton"),
    channelFilter: document.querySelector("#channelFilter"),
    serviceFilterButton: document.querySelector("#serviceFilterButton"),
    serviceFilter: document.querySelector("#serviceFilter"),
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

  function availableMonths() {
    const scopedRecords = !state.years.size
      ? records
      : records.filter((item) => state.years.has(String(item.year)));
    return [...new Set(scopedRecords.map((item) => item.month))].sort((a, b) => a - b);
  }

  function syncMonthFilter() {
    const months = availableMonths();
    state.months.forEach((month) => {
      if (!months.some((availableMonth) => String(availableMonth) === month)) {
        state.months.delete(month);
      }
    });
    renderCheckboxGroup(els.monthFilter, months, state.months, monthName, "month", "Todos os meses");
    updateComboSummary(els.monthFilterButton, state.months, "Todos os meses", monthName);
    closeCombo(els.monthFilterButton, els.monthFilter);
  }

  function renderCheckboxGroup(container, options, selectedSet, labeler, name, allLabel) {
    const allOption = `
      <label class="check-option">
        <input type="checkbox" name="${name}" value="__all" data-all="true"${selectedSet.size ? "" : " checked"}>
        <span>${escapeHtml(allLabel)}</span>
      </label>
    `;
    const optionItems = options.map((option) => {
      const value = String(option);
      const checked = selectedSet.has(value) ? " checked" : "";
      return `
        <label class="check-option">
          <input type="checkbox" name="${name}" value="${escapeHtml(value)}"${checked}>
          <span>${escapeHtml(labeler ? labeler(option) : option)}</span>
        </label>
      `;
    }).join("");
    container.innerHTML = allOption + optionItems;
  }

  function updateComboSummary(button, selectedSet, allLabel, labeler) {
    if (!selectedSet.size) {
      button.textContent = allLabel;
      return;
    }

    const values = [...selectedSet].map((value) => labeler ? labeler(value) : value);
    button.textContent = values.length <= 2 ? values.join(", ") : `${values.length} selecionados`;
  }

  function closeCombo(button, container) {
    button.setAttribute("aria-expanded", "false");
    container.hidden = true;
  }

  function toggleCombo(button, container) {
    const willOpen = container.hidden;
    closeAllCombos();
    button.setAttribute("aria-expanded", String(willOpen));
    container.hidden = !willOpen;
  }

  function closeAllCombos() {
    [
      [els.yearFilterButton, els.yearFilter],
      [els.monthFilterButton, els.monthFilter],
      [els.appFilterButton, els.appFilter],
      [els.channelFilterButton, els.channelFilter],
      [els.serviceFilterButton, els.serviceFilter],
    ].forEach(([button, container]) => closeCombo(button, container));
  }

  function selectedLabel(set, labeler) {
    return [...set].map((value) => filenamePart(labeler ? labeler(value) : value)).join("-");
  }

  function filenamePart(value) {
    return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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
    return records.filter((item) => {
      const yearOk = !state.years.size || state.years.has(String(item.year));
      const monthOk = !state.months.size || state.months.has(String(item.month));
      const appOk = !state.apps.size || state.apps.has(item.app_name);
      const channelOk = !state.channels.size || state.channels.has(item.demand_channel);
      const serviceOk = !state.services.size || state.services.has(item.service);
      return yearOk && monthOk && appOk && channelOk && serviceOk;
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
    const showMonthly = state.years.size === 1;
    const grouped = new Map(groupBy(list, (item) => showMonthly ? item.month : item.year));
    const labels = showMonthly
      ? availableMonths().filter((month) => !state.months.size || state.months.has(String(month)))
      : uniqueSorted("year").filter((year) => !state.years.size || state.years.has(String(year)));
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
    const selectedYear = [...state.years][0];
    els.timelineSubtitle.textContent = showMonthly ? `Total de solicitacoes por mes em ${selectedYear}` : "Total de solicitacoes por ano";
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
    const years = uniqueSorted("year").filter((year) => !state.years.size || state.years.has(String(year)));
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
    if (state.years.size) parts.push(selectedLabel(state.years));
    if (state.months.size) parts.push(selectedLabel(state.months, (month) => String(month).padStart(2, "0")));
    if (state.apps.size) parts.push(selectedLabel(state.apps));
    if (state.channels.size) parts.push(selectedLabel(state.channels));
    if (state.services.size) parts.push(selectedLabel(state.services));
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
    updateComboSummary(els.yearFilterButton, state.years, "Todos os anos");
    updateComboSummary(els.monthFilterButton, state.months, "Todos os meses", monthName);
    updateComboSummary(els.appFilterButton, state.apps, "Todos os sistemas", appName);
    updateComboSummary(els.channelFilterButton, state.channels, "Todos os canais");
    updateComboSummary(els.serviceFilterButton, state.services, "Todos os servicos");
    renderKpis(filtered);
    renderYearChart(filtered);
    renderChannels(filtered);
    renderApps(filtered);
    renderRanking(filtered);
    renderAnnualLeaders(filtered);
    renderTable(filtered);
  }

  function bindCheckboxGroup(container, selectedSet, onChange) {
    container.addEventListener("change", (event) => {
      if (event.target.type !== "checkbox") return;

      if (event.target.dataset.all === "true") {
        selectedSet.clear();
        container.querySelectorAll('input[type="checkbox"]').forEach((input) => {
          input.checked = input.dataset.all === "true";
        });
      } else if (event.target.checked) {
        selectedSet.add(event.target.value);
      } else {
        selectedSet.delete(event.target.value);
      }

      const allInput = container.querySelector('input[data-all="true"]');
      if (allInput) allInput.checked = !selectedSet.size;

      if (onChange) onChange();
      render();
    });
  }

  function bindEvents() {
    els.contrastToggle.addEventListener("click", () => {
      const isActive = document.body.classList.toggle("high-contrast");
      els.contrastToggle.setAttribute("aria-pressed", String(isActive));
    });
    els.yearFilterButton.addEventListener("click", () => toggleCombo(els.yearFilterButton, els.yearFilter));
    els.monthFilterButton.addEventListener("click", () => toggleCombo(els.monthFilterButton, els.monthFilter));
    els.appFilterButton.addEventListener("click", () => toggleCombo(els.appFilterButton, els.appFilter));
    els.channelFilterButton.addEventListener("click", () => toggleCombo(els.channelFilterButton, els.channelFilter));
    els.serviceFilterButton.addEventListener("click", () => toggleCombo(els.serviceFilterButton, els.serviceFilter));
    document.addEventListener("click", (event) => {
      if (!event.target.closest(".check-filter")) closeAllCombos();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAllCombos();
    });
    bindCheckboxGroup(els.yearFilter, state.years, syncMonthFilter);
    bindCheckboxGroup(els.monthFilter, state.months);
    bindCheckboxGroup(els.appFilter, state.apps);
    bindCheckboxGroup(els.channelFilter, state.channels);
    bindCheckboxGroup(els.serviceFilter, state.services);
    els.resetFilters.addEventListener("click", () => {
      state.years.clear();
      state.months.clear();
      state.apps.clear();
      state.channels.clear();
      state.services.clear();
      renderCheckboxGroup(els.yearFilter, uniqueSorted("year"), state.years, null, "year", "Todos os anos");
      syncMonthFilter();
      renderCheckboxGroup(els.appFilter, uniqueSorted("app_name"), state.apps, appName, "app", "Todos os sistemas");
      renderCheckboxGroup(els.channelFilter, uniqueSorted("demand_channel"), state.channels, null, "channel", "Todos os canais");
      renderCheckboxGroup(els.serviceFilter, uniqueSorted("service"), state.services, null, "service", "Todos os servicos");
      render();
    });
    els.exportCsv.addEventListener("click", exportCsv);
  }

  function init() {
    renderCheckboxGroup(els.yearFilter, uniqueSorted("year"), state.years, null, "year", "Todos os anos");
    syncMonthFilter();
    renderCheckboxGroup(els.appFilter, uniqueSorted("app_name"), state.apps, appName, "app", "Todos os sistemas");
    renderCheckboxGroup(els.channelFilter, uniqueSorted("demand_channel"), state.channels, null, "channel", "Todos os canais");
    renderCheckboxGroup(els.serviceFilter, uniqueSorted("service"), state.services, null, "service", "Todos os servicos");
    bindEvents();
    render();
  }

  init();
})();
