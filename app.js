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
    dashboardTab: document.querySelector("#dashboardTab"),
    reportTab: document.querySelector("#reportTab"),
    dashboardView: document.querySelector("#dashboardView"),
    reportView: document.querySelector("#reportView"),
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
    activePeriod: document.querySelector("#activePeriod"),
    activeFilterCount: document.querySelector("#activeFilterCount"),
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
    periodHeatmapSubtitle: document.querySelector("#periodHeatmapSubtitle"),
    periodHeatmap: document.querySelector("#periodHeatmap"),
    serviceRanking: document.querySelector("#serviceRanking"),
    rankingCount: document.querySelector("#rankingCount"),
    annualLeaders: document.querySelector("#annualLeaders"),
    exportCsv: document.querySelector("#exportCsv"),
    detailsTable: document.querySelector("#detailsTable"),
    reportPeriodLabel: document.querySelector("#reportPeriodLabel"),
    reportGeneratedAt: document.querySelector("#reportGeneratedAt"),
    reportAccumulated: document.querySelector("#reportAccumulated"),
    reportCurrentYear: document.querySelector("#reportCurrentYear"),
    printReport: document.querySelector("#printReport"),
    reportSummary: document.querySelector("#reportSummary"),
    reportTotal: document.querySelector("#reportTotal"),
    reportTotalChange: document.querySelector("#reportTotalChange"),
    reportDigital: document.querySelector("#reportDigital"),
    reportDigitalChange: document.querySelector("#reportDigitalChange"),
    reportTopService: document.querySelector("#reportTopService"),
    reportTopServiceMeta: document.querySelector("#reportTopServiceMeta"),
    reportTopSystem: document.querySelector("#reportTopSystem"),
    reportTopSystemMeta: document.querySelector("#reportTopSystemMeta"),
    reportGrowthChannel: document.querySelector("#reportGrowthChannel"),
    reportGrowthChannelMeta: document.querySelector("#reportGrowthChannelMeta"),
    reportActiveSystems: document.querySelector("#reportActiveSystems"),
    reportActiveSystemsMeta: document.querySelector("#reportActiveSystemsMeta"),
    reportTimelineSubtitle: document.querySelector("#reportTimelineSubtitle"),
    reportTimelineChart: document.querySelector("#reportTimelineChart"),
    reportTimelineNote: document.querySelector("#reportTimelineNote"),
    reportChannelChart: document.querySelector("#reportChannelChart"),
    reportChannelInsight: document.querySelector("#reportChannelInsight"),
    reportSystemsChart: document.querySelector("#reportSystemsChart"),
    reportSystemsInsight: document.querySelector("#reportSystemsInsight"),
    reportServicesTable: document.querySelector("#reportServicesTable"),
    reportAttentionList: document.querySelector("#reportAttentionList"),
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

  function periodKey(item) {
    return `${item.year}-${String(item.month).padStart(2, "0")}`;
  }

  function periodLabel(year, month) {
    return `${monthShortName(month)}/${year}`;
  }

  function selectedYears() {
    return uniqueSorted("year").filter((year) => !state.years.size || state.years.has(String(year)));
  }

  function selectedMonths() {
    return availableMonths().filter((month) => !state.months.size || state.months.has(String(month)));
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

  function availablePeriods() {
    const periods = new Map();
    records.forEach((item) => {
      const yearOk = !state.years.size || state.years.has(String(item.year));
      const monthOk = !state.months.size || state.months.has(String(item.month));
      if (yearOk && monthOk) {
        periods.set(periodKey(item), { key: periodKey(item), year: item.year, month: item.month });
      }
    });
    return [...periods.values()].sort((a, b) => a.year - b.year || a.month - b.month);
  }

  function selectedSummary(set, allLabel, labeler) {
    if (!set.size) return allLabel;

    const values = [...set].sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
      return String(a).localeCompare(String(b), "pt-BR");
    });
    const labels = values.map((value) => labeler ? labeler(value) : value);
    return labels.length <= 3 ? labels.join(", ") : `${labels.length} selecionados`;
  }

  function renderFilterSummary(list) {
    const period = `${selectedSummary(state.years, "Todos os anos")} | ${selectedSummary(state.months, "Todos os meses", monthName)}`;
    const extraFilters = [
      state.apps.size ? "sistema" : "",
      state.channels.size ? "canal" : "",
      state.services.size ? "servico" : "",
    ].filter(Boolean);
    const suffix = extraFilters.length ? ` com filtro de ${extraFilters.join(", ")}` : "";

    els.activePeriod.textContent = period;
    els.activeFilterCount.textContent = `${formatNumber(totalOf(list))} solicitacoes em ${formatNumber(list.length)} linhas agregadas${suffix}`;
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

  function timelineMode() {
    if (state.years.size === 1 || state.months.size || (state.years.size > 1 && state.years.size <= 2)) {
      return "period";
    }
    return "year";
  }

  function niceMax(value) {
    if (!value) return 1;

    const magnitude = 10 ** Math.floor(Math.log10(value));
    const normalized = value / magnitude;
    const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return nice * magnitude;
  }

  function renderYearChart(list) {
    if (!list.length) {
      els.timelineSubtitle.textContent = "Total de solicitacoes no periodo selecionado";
      els.yearChart.innerHTML = '<div class="empty-state">Nenhum dado encontrado</div>';
      return;
    }

    const mode = timelineMode();
    const grouped = new Map(groupBy(list, (item) => mode === "period" ? periodKey(item) : item.year));
    const labels = mode === "period"
      ? availablePeriods().map((period) => ({
        key: period.key,
        axisLabel: periodLabel(period.year, period.month),
        title: `${monthName(period.month)} de ${period.year}`,
      }))
      : selectedYears().map((year) => ({
        key: year,
        axisLabel: year,
        title: year,
      }));
    const values = labels.map((label) => grouped.get(label.key) || 0);
    const maxRaw = Math.max(...values, 1);
    const max = niceMax(maxRaw);
    const width = 980;
    const height = 360;
    const pad = { top: 26, right: 28, bottom: mode === "period" && labels.length > 12 ? 72 : 48, left: 78 };
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const baseline = pad.top + innerH;
    const xStep = labels.length > 1 ? innerW / (labels.length - 1) : innerW;
    const points = labels.map((label, index) => {
      const x = pad.left + (labels.length > 1 ? index * xStep : innerW / 2);
      const y = baseline - (values[index] / max) * innerH;
      return { ...label, value: values[index], x, y };
    });

    const line = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
    const area = `${line} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const averageY = baseline - (average / max) * innerH;
    const labelStep = Math.max(1, Math.ceil(points.length / 14));
    const pointRadius = points.length > 20 ? 4 : 6;
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((tick) => {
      const y = baseline - tick * innerH;
      const value = Math.round(max * tick);
      return `<g><line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" class="grid-line"/><text x="${pad.left - 12}" y="${y + 4}" text-anchor="end" class="axis-label">${compact(value)}</text></g>`;
    }).join("");
    const selectedYear = [...state.years][0];
    els.timelineSubtitle.textContent = mode === "period"
      ? state.years.size === 1 ? `Total de solicitacoes por mes em ${selectedYear}` : "Total de solicitacoes por mes/ano"
      : "Total de solicitacoes por ano";
    const axisLabels = points.map((point, index) => {
      const isVisible = index % labelStep === 0 || index === points.length - 1;
      if (!isVisible) return "";

      const rotate = mode === "period" && points.length > 12;
      const transform = rotate ? ` transform="rotate(-36 ${point.x} ${height - 18})"` : "";
      const anchor = rotate ? "end" : "middle";
      return `<text x="${point.x}" y="${height - 18}" text-anchor="${anchor}" class="axis-label"${transform}>${escapeHtml(point.axisLabel)}</text>`;
    }).join("");
    const circles = points.map((point) => {
      const topClass = point.value === maxRaw ? " is-top" : "";
      return `<g><circle class="point${topClass}" cx="${point.x}" cy="${point.y}" r="${pointRadius}"/><title>${escapeHtml(point.title)}: ${formatNumber(point.value)} solicitacoes</title></g>`;
    }).join("");
    const valueLabels = points.map((point, index) => {
      const shouldShow = points.length <= 12 || point.value === maxRaw || index === points.length - 1;
      if (!shouldShow) return "";
      return `<text x="${point.x}" y="${Math.max(point.y - 14, 14)}" text-anchor="middle" class="value-label">${compact(point.value)}</text>`;
    }).join("");

    els.yearChart.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="timelineGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="rgba(0, 90, 169, 0.24)"></stop>
            <stop offset="100%" stop-color="rgba(0, 90, 169, 0.02)"></stop>
          </linearGradient>
        </defs>
        ${ticks}
        <line x1="${pad.left}" y1="${averageY}" x2="${width - pad.right}" y2="${averageY}" class="average-line"></line>
        <text x="${width - pad.right}" y="${averageY - 7}" text-anchor="end" class="average-label">Media ${compact(average)}</text>
        <path class="area-path" d="${area}"></path>
        <path class="line-path" d="${line}"></path>
        ${circles}
        ${valueLabels}
        ${axisLabels}
      </svg>
    `;
  }

  function compact(value) {
    if (value >= 1000000) return `${String((value / 1000000).toFixed(1)).replace(".", ",")} mi`;
    if (value >= 1000) return `${Math.round(value / 1000)} mil`;
    return formatNumber(value);
  }

  function renderBarList(container, data, colorClass, limit) {
    if (!data.length) {
      container.innerHTML = '<div class="empty-state">Nenhum dado encontrado</div>';
      return;
    }

    const rows = limit ? data.slice(0, limit) : data;
    const total = data.reduce((sum, item) => sum + item[1], 0);
    const max = Math.max(...rows.map((item) => item[1]), 1);
    container.innerHTML = rows.map(([name, value]) => `
      <div class="bar-row" title="${escapeHtml(name)}: ${formatNumber(value)} solicitacoes (${formatPercent(total ? (value / total) * 100 : 0)} do total)">
        <div class="row-head">
          <span class="row-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
          <span class="row-value">${formatNumber(value)} <small>${formatPercent(total ? (value / total) * 100 : 0)}</small></span>
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
    renderBarList(els.appChart, data, "amber", 8);
  }

  function renderPeriodHeatmap(list) {
    const years = selectedYears();
    const months = selectedMonths();

    if (!list.length || !years.length || !months.length) {
      els.periodHeatmapSubtitle.textContent = "Intensidade de solicitacoes por periodo";
      els.periodHeatmap.innerHTML = '<div class="empty-state">Nenhum dado encontrado</div>';
      return;
    }

    const grouped = new Map(groupBy(list, (item) => periodKey(item)));
    const max = Math.max(...years.flatMap((year) => months.map((month) => grouped.get(`${year}-${String(month).padStart(2, "0")}`) || 0)), 1);
    const header = `
      <div class="heatmap-row heatmap-head" style="--month-count: ${months.length}">
        <span>Ano</span>
        ${months.map((month) => `<span>${escapeHtml(monthShortName(month))}</span>`).join("")}
      </div>
    `;
    const rows = years.map((year) => `
      <div class="heatmap-row" style="--month-count: ${months.length}">
        <strong>${year}</strong>
        ${months.map((month) => {
          const key = `${year}-${String(month).padStart(2, "0")}`;
          const value = grouped.get(key) || 0;
          const ratio = value / max;
          const heat = `${Math.max(ratio * 76, value ? 12 : 0).toFixed(1)}%`;
          const hotClass = ratio > 0.58 ? " is-hot" : "";
          const title = `${monthName(month)} de ${year}: ${formatNumber(value)} solicitacoes`;
          return `<span class="heatmap-cell${hotClass}" style="--heat: ${heat}" title="${escapeHtml(title)}">${value ? compact(value) : "-"}</span>`;
        }).join("")}
      </div>
    `).join("");

    els.periodHeatmapSubtitle.textContent = `${years.length} ano(s) x ${months.length} mes(es) no recorte selecionado`;
    els.periodHeatmap.innerHTML = header + rows;
  }

  function renderRanking(list) {
    const data = groupBy(list, (item) => item.service).slice(0, 10);
    els.rankingCount.textContent = `Top ${data.length}`;
    if (!data.length) {
      els.serviceRanking.innerHTML = '<div class="empty-state">Nenhum dado encontrado</div>';
      return;
    }

    const total = totalOf(list);
    const max = Math.max(...data.map((item) => item[1]), 1);
    els.serviceRanking.innerHTML = data.map(([name, value], index) => `
      <div class="ranking-row" title="${escapeHtml(name)}: ${formatNumber(value)} solicitacoes (${formatPercent(total ? (value / total) * 100 : 0)} do total)">
        <span class="rank-number">${index + 1}</span>
        <div>
          <div class="row-head">
            <span class="row-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
            <span class="row-value">${formatNumber(value)} <small>${formatPercent(total ? (value / total) * 100 : 0)}</small></span>
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
      <div class="leader-row" title="${escapeHtml(item.name)} liderou em ${item.year}, com ${formatNumber(item.value)} solicitacoes">
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

  function matchesDimensionFilters(item) {
    return (!state.apps.size || state.apps.has(item.app_name))
      && (!state.channels.size || state.channels.has(item.demand_channel))
      && (!state.services.size || state.services.has(item.service));
  }

  function digitalShare(list) {
    const total = totalOf(list);
    if (!total) return 0;
    const digitalTotal = list
      .filter((item) => item.demand_channel === "Digital" || item.demand_channel === "App")
      .reduce((sum, item) => sum + item.total, 0);
    return (digitalTotal / total) * 100;
  }

  function monthRangeLabel(months) {
    if (!months.length) return "";
    if (months.length === 1) return monthShortName(months[0]).toLowerCase();
    const sorted = [...months].sort((a, b) => a - b);
    return `${monthShortName(sorted[0]).toLowerCase()}–${monthShortName(sorted[sorted.length - 1]).toLowerCase()}`;
  }

  function reportPeriodText() {
    const years = [...state.years].map(Number).sort((a, b) => a - b);
    const months = [...state.months].map(Number).sort((a, b) => a - b);
    const allYears = uniqueSorted("year");
    const firstYear = allYears[0];
    const lastYear = allYears[allYears.length - 1];
    const lastMonths = [...new Set(records.filter((item) => item.year === lastYear).map((item) => item.month))].sort((a, b) => a - b);

    if (!years.length && !months.length) {
      return `Acumulado ${firstYear}–${monthShortName(lastMonths[lastMonths.length - 1]).toLowerCase()}/${lastYear}`;
    }
    if (years.length === 1 && !months.length) {
      const yearMonths = [...new Set(records.filter((item) => item.year === years[0]).map((item) => item.month))].sort((a, b) => a - b);
      return yearMonths.length < 12
        ? `${years[0]} · ${monthRangeLabel(yearMonths)}`
        : `Ano ${years[0]}`;
    }
    const yearText = years.length ? (years.length === 1 ? String(years[0]) : `${years[0]}–${years[years.length - 1]}`) : `${firstYear}–${lastYear}`;
    return `${monthRangeLabel(months) || "todos os meses"}/${yearText}`;
  }

  function comparisonContext() {
    const dimensionRecords = records.filter(matchesDimensionFilters);
    const selectedYearValues = [...state.years].map(Number).sort((a, b) => a - b);
    const selectedMonthValues = [...state.months].map(Number).sort((a, b) => a - b);
    const allYears = uniqueSorted("year");
    let currentYear;
    let previousYear;
    let currentMonths;
    let previousMonths;
    let label;

    if (selectedYearValues.length === 1 && selectedMonthValues.length === 1) {
      currentYear = selectedYearValues[0];
      currentMonths = selectedMonthValues;
      const currentMonth = selectedMonthValues[0];
      previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      previousMonths = [currentMonth === 1 ? 12 : currentMonth - 1];
      label = `vs. ${monthShortName(previousMonths[0]).toLowerCase()}/${previousYear}`;
    } else {
      currentYear = selectedYearValues.length === 1
        ? selectedYearValues[0]
        : (selectedYearValues[selectedYearValues.length - 1] || allYears[allYears.length - 1]);
      previousYear = currentYear - 1;
      currentMonths = selectedMonthValues.length
        ? selectedMonthValues
        : [...new Set(records.filter((item) => item.year === currentYear).map((item) => item.month))].sort((a, b) => a - b);
      previousMonths = currentMonths;
      const range = monthRangeLabel(currentMonths);
      label = selectedYearValues.length === 1
        ? `vs. ${previousYear}${currentMonths.length < 12 ? ` · ${range}` : ""}`
        : `${currentYear} vs. ${previousYear} · ${range}`;
    }

    const currentList = dimensionRecords.filter((item) => item.year === currentYear && currentMonths.includes(item.month));
    const previousList = dimensionRecords.filter((item) => item.year === previousYear && previousMonths.includes(item.month));
    const currentTotal = totalOf(currentList);
    const previousTotal = totalOf(previousList);
    return {
      currentList,
      previousList,
      currentTotal,
      previousTotal,
      label,
      hasComparison: previousTotal > 0 && currentTotal > 0,
    };
  }

  function percentChange(current, previous) {
    return previous ? ((current - previous) / previous) * 100 : null;
  }

  function changeSentence(value) {
    if (value === null || !Number.isFinite(value)) return "sem base comparável";
    if (Math.abs(value) < 0.05) return "estabilidade";
    return `${value > 0 ? "alta" : "queda"} de ${formatPercent(Math.abs(value))}`;
  }

  function setChangeBadge(element, value, suffix) {
    element.classList.remove("is-positive", "is-negative", "is-neutral");
    if (value === null || !Number.isFinite(value)) {
      element.classList.add("is-neutral");
      element.textContent = "Sem base comparável";
      return;
    }
    const direction = value > 0.05 ? "is-positive" : value < -0.05 ? "is-negative" : "is-neutral";
    element.classList.add(direction);
    const arrow = value > 0.05 ? "↑" : value < -0.05 ? "↓" : "→";
    element.textContent = `${arrow} ${formatPercent(Math.abs(value))} ${suffix}`;
  }

  function setPointChangeBadge(element, value, suffix) {
    element.classList.remove("is-positive", "is-negative", "is-neutral");
    if (value === null || !Number.isFinite(value)) {
      element.classList.add("is-neutral");
      element.textContent = "Sem base comparável";
      return;
    }
    const direction = value > 0.05 ? "is-positive" : value < -0.05 ? "is-negative" : "is-neutral";
    element.classList.add(direction);
    const arrow = value > 0.05 ? "↑" : value < -0.05 ? "↓" : "→";
    element.textContent = `${arrow} ${percentFmt.format(Math.abs(value))} p.p. ${suffix}`;
  }

  function relativeGrowthLeader(currentList, previousList, keyFn) {
    const current = new Map(groupBy(currentList, keyFn));
    const previous = new Map(groupBy(previousList, keyFn));
    return [...current.entries()]
      .filter(([name, value]) => previous.has(name) && previous.get(name) > 0 && value > 0)
      .map(([name, value]) => ({
        name,
        value,
        growth: percentChange(value, previous.get(name)),
      }))
      .sort((a, b) => b.growth - a.growth)[0] || null;
  }

  function renderReportKpis(list, comparison) {
    const total = totalOf(list);
    const serviceTop = groupBy(list, (item) => item.service)[0] || ["—", 0];
    const systemTop = groupBy(list, (item) => item.app_name)[0] || ["—", 0];
    const currentDigital = digitalShare(list);
    const comparableDigital = digitalShare(comparison.currentList);
    const previousDigital = digitalShare(comparison.previousList);
    const totalChange = comparison.hasComparison
      ? percentChange(comparison.currentTotal, comparison.previousTotal)
      : null;
    const digitalChange = comparison.previousTotal
      ? comparableDigital - previousDigital
      : null;
    const channelGrowth = relativeGrowthLeader(
      comparison.currentList,
      comparison.previousList,
      (item) => item.demand_channel,
    );
    const systems = new Set(list.map((item) => item.app_name));
    const channels = new Set(list.map((item) => item.demand_channel));

    els.reportTotal.textContent = formatNumber(total);
    setChangeBadge(els.reportTotalChange, totalChange, comparison.label);
    els.reportDigital.textContent = formatPercent(currentDigital);
    setPointChangeBadge(els.reportDigitalChange, digitalChange, comparison.label);
    els.reportTopService.textContent = truncate(serviceTop[0], 64);
    els.reportTopService.title = serviceTop[0];
    els.reportTopServiceMeta.textContent = `${formatNumber(serviceTop[1])} · ${formatPercent(total ? (serviceTop[1] / total) * 100 : 0)} do total`;
    els.reportTopSystem.textContent = appName(systemTop[0]);
    els.reportTopSystemMeta.textContent = `${formatNumber(systemTop[1])} · ${formatPercent(total ? (systemTop[1] / total) * 100 : 0)} do total`;
    els.reportGrowthChannel.textContent = channelGrowth ? channelGrowth.name : "—";
    els.reportGrowthChannelMeta.textContent = channelGrowth
      ? `${channelGrowth.growth >= 0 ? "+" : ""}${formatPercent(channelGrowth.growth)} ${comparison.label}`
      : "Sem base comparável";
    els.reportActiveSystems.textContent = formatNumber(systems.size);
    els.reportActiveSystemsMeta.textContent = `sistemas · ${formatNumber(channels.size)} canais`;

    const comparisonQualifier = state.years.size > 1 || !state.years.size
      ? ` Na janela comparável (${comparison.label}), houve ${changeSentence(totalChange)}.`
      : ` O volume representa ${changeSentence(totalChange)} ${comparison.label}.`;
    const digitalDirection = digitalChange === null || Math.abs(digitalChange) < 0.05
      ? "permaneceu estável"
      : `${digitalChange > 0 ? "subiu" : "caiu"} ${percentFmt.format(Math.abs(digitalChange))} pontos percentuais na janela comparável`;
    els.reportSummary.textContent = total
      ? `O período reúne ${formatNumber(total)} solicitações.${comparisonQualifier} O serviço líder foi “${serviceTop[0]}”, e ${appName(systemTop[0])} concentrou o maior volume entre os sistemas. Os canais Digital e App responderam por ${formatPercent(currentDigital)} dos atendimentos; essa participação ${digitalDirection} em relação ao período anterior.`
      : "Não há solicitações para o recorte selecionado. Ajuste os filtros globais para gerar a síntese executiva.";
  }

  function renderReportTimeline(list) {
    const monthly = state.years.size === 1;
    const grouped = groupBy(list, (item) => monthly ? item.month : item.year)
      .sort((a, b) => Number(a[0]) - Number(b[0]));

    if (!grouped.length) {
      els.reportTimelineChart.innerHTML = '<div class="empty-state">Nenhum dado encontrado</div>';
      els.reportTimelineNote.textContent = "Sem série temporal para o recorte selecionado.";
      return;
    }

    const max = Math.max(...grouped.map((item) => item[1]), 1);
    els.reportTimelineSubtitle.textContent = monthly ? "Total de solicitações por mês" : "Total de solicitações por ano";
    els.reportTimelineChart.innerHTML = `<div class="executive-bars" style="--bar-count: ${grouped.length}">${grouped.map(([key, value]) => `
      <div class="executive-bar-item" title="${escapeHtml(monthly ? monthName(key) : key)}: ${formatNumber(value)} solicitações">
        <span class="executive-bar-value">${compact(value)}</span>
        <div class="executive-bar-column"><span style="height: ${Math.max((value / max) * 100, 2)}%"></span></div>
        <span class="executive-bar-label">${escapeHtml(monthly ? monthShortName(key) : key)}</span>
      </div>
    `).join("")}</div>`;

    let growthData = grouped;
    let partialNote = "";
    if (!monthly && grouped.length > 2) {
      const lastYear = Number(grouped[grouped.length - 1][0]);
      const monthCounts = grouped.map(([year]) => new Set(records.filter((item) => item.year === Number(year)).map((item) => item.month)).size);
      const fullCount = Math.max(...monthCounts);
      if (monthCounts[monthCounts.length - 1] < fullCount) {
        growthData = grouped.slice(0, -1);
        partialNote = `${lastYear} é um ano parcial e não entra no cálculo da média. `;
      }
    }
    const growthRates = growthData.slice(1).map((item, index) => percentChange(item[1], growthData[index][1])).filter(Number.isFinite);
    if (growthRates.length) {
      const averageGrowth = growthRates.reduce((sum, value) => sum + value, 0) / growthRates.length;
      els.reportTimelineNote.textContent = `${partialNote}${averageGrowth >= 0 ? "Crescimento médio" : "Redução média"} de ${formatPercent(Math.abs(averageGrowth))} por ${monthly ? "mês" : "ano"} na série comparável.`;
    } else {
      els.reportTimelineNote.textContent = `${partialNote}O recorte ainda não possui períodos suficientes para calcular uma tendência.`;
    }
  }

  function channelClass(name) {
    const normalized = normalizeText(name);
    if (normalized === "digital") return "is-digital";
    if (normalized === "app") return "is-app";
    if (normalized === "presencial") return "is-presential";
    return "is-other";
  }

  function renderReportChannels(list, comparison) {
    const channels = groupBy(list, (item) => item.demand_channel);
    const total = totalOf(list);
    const digital = digitalShare(list);
    const comparableDigital = digitalShare(comparison.currentList);
    const previousDigital = digitalShare(comparison.previousList);
    if (!channels.length) {
      els.reportChannelChart.innerHTML = '<div class="empty-state">Nenhum dado encontrado</div>';
      els.reportChannelInsight.textContent = "Sem composição de canais para o recorte.";
      return;
    }
    els.reportChannelChart.innerHTML = `
      <div class="composition-track">${channels.map(([name, value]) => `<span class="${channelClass(name)}" style="width: ${(value / total) * 100}%" title="${escapeHtml(name)}: ${formatPercent((value / total) * 100)}"></span>`).join("")}</div>
      <div class="composition-legend">${channels.map(([name, value]) => `
        <div><span class="legend-swatch ${channelClass(name)}"></span><span>${escapeHtml(name)}</span><strong>${formatPercent((value / total) * 100)}</strong></div>
      `).join("")}</div>`;
    els.reportChannelInsight.textContent = comparison.previousTotal
      ? `${formatPercent(digital)} dos atendimentos do recorte ocorrem por canais digitais; na janela comparável, são ${formatPercent(comparableDigital)}, ante ${formatPercent(previousDigital)} no período anterior.`
      : `${formatPercent(digital)} dos atendimentos já ocorrem por canais digitais.`;
  }

  function renderReportSystems(list, comparison) {
    const systems = groupBy(list, (item) => item.app_name).slice(0, 3);
    const total = totalOf(list);
    const max = Math.max(...systems.map((item) => item[1]), 1);
    if (!systems.length) {
      els.reportSystemsChart.innerHTML = '<div class="empty-state">Nenhum dado encontrado</div>';
      els.reportSystemsInsight.textContent = "Sem sistemas ativos no recorte.";
      return;
    }
    els.reportSystemsChart.innerHTML = systems.map(([name, value], index) => `
      <div class="executive-rank-row">
        <span class="executive-rank-number">${index + 1}</span>
        <div>
          <div class="row-head"><span class="row-name">${escapeHtml(appName(name))}</span><span class="row-value">${formatNumber(value)} · ${formatPercent((value / total) * 100)}</span></div>
          <div class="bar-track"><div class="bar-fill" style="width: ${Math.max((value / max) * 100, 1)}%"></div></div>
        </div>
      </div>
    `).join("");
    const growthLeader = relativeGrowthLeader(comparison.currentList, comparison.previousList, (item) => item.app_name);
    els.reportSystemsInsight.textContent = growthLeader
      ? `${appName(growthLeader.name)} apresentou o maior crescimento relativo entre os sistemas: ${growthLeader.growth >= 0 ? "+" : ""}${formatPercent(growthLeader.growth)} ${comparison.label}.`
      : "Não há base comparável suficiente para apontar crescimento relativo por sistema.";
  }

  function renderReportServices(list) {
    const total = totalOf(list);
    const services = groupBy(list, (item) => item.service).slice(0, 5);
    if (!services.length) {
      els.reportServicesTable.innerHTML = '<tr><td colspan="4" class="empty-state">Nenhum dado encontrado</td></tr>';
      return;
    }
    els.reportServicesTable.innerHTML = services.map(([service, value]) => {
      const system = groupBy(list.filter((item) => item.service === service), (item) => item.app_name)[0] || ["—", 0];
      return `<tr>
        <td>${escapeHtml(service)}</td>
        <td>${escapeHtml(appName(system[0]))}</td>
        <td>${formatNumber(value)}</td>
        <td>${formatPercent(total ? (value / total) * 100 : 0)}</td>
      </tr>`;
    }).join("");
  }

  function renderReportAttention(list, comparison) {
    const total = totalOf(list);
    if (!total) {
      els.reportAttentionList.innerHTML = "<li>Não há dados suficientes para gerar pontos de atenção neste recorte.</li>";
      return;
    }
    const serviceTop = groupBy(list, (item) => item.service)[0];
    const serviceShare = (serviceTop[1] / total) * 100;
    const currentDigital = digitalShare(list);
    const historical = records.filter(matchesDimensionFilters);
    const historicalDigital = digitalShare(historical);
    const unidentifiedTotal = list
      .filter((item) => normalizeText(item.demand_channel) === "nao identificado")
      .reduce((sum, item) => sum + item.total, 0);
    const unidentifiedShare = (unidentifiedTotal / total) * 100;
    const notes = [];
    notes.push(serviceShare >= 20
      ? `O serviço “${serviceTop[0]}” representa ${formatPercent(serviceShare)} da demanda, concentração que merece avaliação de capacidade e oportunidade de automação.`
      : `A demanda está relativamente distribuída: o serviço líder representa ${formatPercent(serviceShare)} do volume total.`);
    if (unidentifiedShare >= 5) {
      notes.push(`${formatPercent(unidentifiedShare)} das solicitações não têm canal identificado, ponto relevante para a qualidade do acompanhamento gerencial.`);
    } else if (Math.abs(currentDigital - historicalDigital) >= 1) {
      notes.push(`A participação digital está ${currentDigital > historicalDigital ? "acima" : "abaixo"} da média histórica do recorte (${formatPercent(historicalDigital)}).`);
    } else if (comparison.hasComparison) {
      const change = percentChange(comparison.currentTotal, comparison.previousTotal);
      notes.push(`O volume do último período comparável indica ${changeSentence(change)}, sinal a acompanhar nos próximos ciclos.`);
    }
    els.reportAttentionList.innerHTML = notes.slice(0, 2).map((note) => `<li>${escapeHtml(note)}</li>`).join("");
  }

  function renderReport(list) {
    const comparison = comparisonContext();
    els.reportPeriodLabel.textContent = reportPeriodText();
    els.reportGeneratedAt.textContent = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date());
    els.reportAccumulated.classList.toggle("is-active", !state.years.size && !state.months.size);
    const latestYear = String(uniqueSorted("year").slice(-1)[0]);
    els.reportCurrentYear.classList.toggle("is-active", state.years.size === 1 && state.years.has(latestYear) && !state.months.size);
    els.printReport.disabled = !list.length;
    renderReportKpis(list, comparison);
    renderReportTimeline(list);
    renderReportChannels(list, comparison);
    renderReportSystems(list, comparison);
    renderReportServices(list);
    renderReportAttention(list, comparison);
  }

  function render() {
    const filtered = filterRecords();
    els.exportCsv.disabled = !filtered.length;
    updateComboSummary(els.yearFilterButton, state.years, "Todos os anos");
    updateComboSummary(els.monthFilterButton, state.months, "Todos os meses", monthName);
    updateComboSummary(els.appFilterButton, state.apps, "Todos os sistemas", appName);
    updateComboSummary(els.channelFilterButton, state.channels, "Todos os canais");
    updateComboSummary(els.serviceFilterButton, state.services, "Todos os servicos");
    renderFilterSummary(filtered);
    renderKpis(filtered);
    renderYearChart(filtered);
    renderChannels(filtered);
    renderApps(filtered);
    renderPeriodHeatmap(filtered);
    renderRanking(filtered);
    renderAnnualLeaders(filtered);
    renderTable(filtered);
    renderReport(filtered);
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

  function setActiveView(view) {
    const reportActive = view === "report";
    els.dashboardView.hidden = reportActive;
    els.reportView.hidden = !reportActive;
    els.dashboardTab.classList.toggle("is-active", !reportActive);
    els.reportTab.classList.toggle("is-active", reportActive);
    els.dashboardTab.setAttribute("aria-selected", String(!reportActive));
    els.reportTab.setAttribute("aria-selected", String(reportActive));
    document.body.classList.toggle("report-is-active", reportActive);
  }

  function openView(view) {
    setActiveView(view);
    const hash = view === "report" ? "#relatorio" : "#visao-geral";
    if (window.location.hash !== hash) window.history.replaceState(null, "", hash);
  }

  function refreshTimeFilters() {
    renderCheckboxGroup(els.yearFilter, uniqueSorted("year"), state.years, null, "year", "Todos os anos");
    syncMonthFilter();
  }

  function bindEvents() {
    els.contrastToggle.addEventListener("click", () => {
      const isActive = document.body.classList.toggle("high-contrast");
      els.contrastToggle.setAttribute("aria-pressed", String(isActive));
    });
    els.dashboardTab.addEventListener("click", () => openView("dashboard"));
    els.reportTab.addEventListener("click", () => openView("report"));
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
    els.reportAccumulated.addEventListener("click", () => {
      state.years.clear();
      state.months.clear();
      refreshTimeFilters();
      render();
    });
    els.reportCurrentYear.addEventListener("click", () => {
      const latestYear = String(uniqueSorted("year").slice(-1)[0]);
      state.years.clear();
      state.years.add(latestYear);
      state.months.clear();
      refreshTimeFilters();
      render();
    });
    els.printReport.addEventListener("click", () => window.print());
  }

  function init() {
    renderCheckboxGroup(els.yearFilter, uniqueSorted("year"), state.years, null, "year", "Todos os anos");
    syncMonthFilter();
    renderCheckboxGroup(els.appFilter, uniqueSorted("app_name"), state.apps, appName, "app", "Todos os sistemas");
    renderCheckboxGroup(els.channelFilter, uniqueSorted("demand_channel"), state.channels, null, "channel", "Todos os canais");
    renderCheckboxGroup(els.serviceFilter, uniqueSorted("service"), state.services, null, "service", "Todos os servicos");
    bindEvents();
    render();
    setActiveView(window.location.hash === "#relatorio" ? "report" : "dashboard");
  }

  init();
})();
