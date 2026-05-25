function formatNumber(value) {
  return new Intl.NumberFormat("pt-BR").format(value ?? 0);
}

// Registrar plugin de data labels
Chart.register(ChartDataLabels);

function renderTable(containerId, columns, rows) {
  const container = document.getElementById(containerId);
  if (!rows || rows.length === 0) {
    container.innerHTML = '<div class="empty">Sem dados para os filtros selecionados.</div>';
    return;
  }

  const header = columns
    .map((column) => `<th>${column.label}</th>`)
    .join("");

  const body = rows
    .map((row) => {
      const values = columns
        .map((column) => `<td>${column.formatter ? column.formatter(row[column.key]) : row[column.key]}</td>`)
        .join("");
      return `<tr>${values}</tr>`;
    })
    .join("");

  container.innerHTML = `<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
}

let topArtistsChart = null;
let songsByArtistsChart = null;

function buildPalette(size) {
  const base = [
    "rgba(99, 102, 241, 0.85)",
    "rgba(168, 85, 247, 0.85)",
    "rgba(236, 72, 153, 0.85)",
    "rgba(239, 68, 68, 0.85)",
    "rgba(245, 158, 11, 0.85)",
    "rgba(34, 197, 94, 0.85)",
    "rgba(59, 130, 246, 0.85)",
    "rgba(14, 165, 233, 0.85)",
    "rgba(6, 182, 212, 0.85)",
    "rgba(16, 185, 129, 0.85)",
  ];

  const colors = [...base];
  if (size > base.length) {
    for (let i = base.length; i < size; i++) {
      colors.push(`hsla(${(i * 31) % 360}, 70%, 58%, 0.85)`);
    }
  }
  return colors.slice(0, size);
}

function renderTopArtistsBarChart(canvasId, data) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !data || data.length === 0) {
    return;
  }

  const parent = ctx.parentElement;
  if (parent) {
    const dynamicHeight = Math.max(320, Math.min(760, data.length * 42));
    parent.style.height = `${dynamicHeight}px`;
  }

  const colors = buildPalette(data.length);

  const labels = data.map((item) => item.artist || "");
  const values = data.map((item) => item.plays);

  if (topArtistsChart) {
    topArtistsChart.destroy();
  }

  topArtistsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Execucoes",
          data: values,
          backgroundColor: colors,
          borderColor: "#1f2937",
          borderWidth: 1,
          borderRadius: 8,
          maxBarThickness: 34,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: "rgba(229, 231, 235, 0.12)",
          },
          ticks: {
            color: "#e5e7eb",
            callback: (value) => formatNumber(value),
          },
        },
        y: {
          grid: {
            color: "rgba(229, 231, 235, 0.08)",
          },
          ticks: {
            color: "#e5e7eb",
            autoSkip: false,
            font: { family: "'Space Grotesk', sans-serif", size: 12 },
          },
        },
      },
      plugins: {
        datalabels: {
          color: "#f3f4f6",
          anchor: "end",
          align: "right",
          clamp: true,
          font: {
            family: "'Space Grotesk', sans-serif",
            weight: "bold",
            size: 12,
          },
          formatter: (value) => formatNumber(value),
        },
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: (context) => `Execucoes: ${formatNumber(context.parsed.x)}`,
          },
          backgroundColor: "rgba(31, 41, 55, 0.9)",
          titleFont: { family: "'Space Grotesk', sans-serif" },
          bodyFont: { family: "'Space Grotesk', sans-serif" },
          titleColor: "#f3f4f6",
          bodyColor: "#e5e7eb",
          borderColor: "#4b5563",
          borderWidth: 1,
        },
      },
    },
  });
}

function renderSongsBarChart(canvasId, data) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !data || data.length === 0) {
    return;
  }

  const parent = ctx.parentElement;
  if (parent) {
    const dynamicHeight = Math.max(360, Math.min(900, data.length * 38));
    parent.style.height = `${dynamicHeight}px`;
  }

  const labels = data.map((item) => `${item.song} - ${item.artist}`);
  const values = data.map((item) => item.plays);
  const colors = buildPalette(data.length);

  if (songsByArtistsChart) {
    songsByArtistsChart.destroy();
  }

  songsByArtistsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Execucoes",
          data: values,
          backgroundColor: colors,
          borderColor: "#1f2937",
          borderWidth: 1,
          borderRadius: 8,
          maxBarThickness: 36,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: "rgba(229, 231, 235, 0.12)",
          },
          ticks: {
            color: "#e5e7eb",
            callback: (value) => formatNumber(value),
          },
        },
        y: {
          grid: {
            color: "rgba(229, 231, 235, 0.08)",
          },
          ticks: {
            color: "#e5e7eb",
            autoSkip: false,
            font: { family: "'Space Grotesk', sans-serif", size: 12 },
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        datalabels: {
          color: "#f3f4f6",
          anchor: "end",
          align: "right",
          clamp: true,
          formatter: (value) => formatNumber(value),
          font: {
            family: "'Space Grotesk', sans-serif",
            weight: "bold",
            size: 12,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => `Execucoes: ${formatNumber(context.parsed.x)}`,
          },
          backgroundColor: "rgba(31, 41, 55, 0.9)",
          titleFont: { family: "'Space Grotesk', sans-serif" },
          bodyFont: { family: "'Space Grotesk', sans-serif" },
          titleColor: "#f3f4f6",
          bodyColor: "#e5e7eb",
          borderColor: "#4b5563",
          borderWidth: 1,
        },
      },
    },
  });
}


async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Falha na consulta: ${response.status}`);
  }
  return response.json();
}

function getRangeValues() {
  const startDate = document.getElementById("startDate").value;
  const endDate = document.getElementById("endDate").value;
  return { startDate, endDate };
}

async function loadTopArtists() {
  const { startDate, endDate } = getRangeValues();
  const limit = document.getElementById("topArtistsLimit").value;
  const url = `/api/stats/top-artists?start_date=${startDate}&end_date=${endDate}&limit=${limit}`;
  const data = await fetchJson(url);
  renderTopArtistsBarChart("topArtistsChart", data);
}

async function loadSongsByTopArtists() {
  const { startDate, endDate } = getRangeValues();
  const artistLimit = document.getElementById("artistLimit").value;
  const songLimit = document.getElementById("songLimit").value;
  const url = `/api/stats/top-songs-by-top-artists?start_date=${startDate}&end_date=${endDate}&artist_limit=${artistLimit}&song_limit=${songLimit}`;
  const data = await fetchJson(url);

  renderSongsBarChart("songsByArtistsChart", data);
}

async function loadTopArtistOnDate() {
  const refDate = document.getElementById("singleDate").value;
  const data = await fetchJson(`/api/stats/top-artist-on-date?ref_date=${refDate}`);
  const rows = data.artist ? [data] : [];

  renderTable(
    "topArtistOnDateResults",
    [
      { key: "artist", label: "Artista" },
      { key: "plays", label: "Execucoes", formatter: formatNumber },
    ],
    rows
  );
}

async function loadTopSongOnDate() {
  const refDate = document.getElementById("singleDate").value;
  const data = await fetchJson(`/api/stats/top-song-on-date?ref_date=${refDate}`);
  const rows = data.song ? [data] : [];

  renderTable(
    "topSongOnDateResults",
    [
      { key: "song", label: "Musica" },
      { key: "artist", label: "Artista" },
      { key: "plays", label: "Execucoes", formatter: formatNumber },
    ],
    rows
  );
}

async function runIngestion() {
  const status = document.getElementById("ingestionStatus");
  status.textContent = "Executando ingestao de ontem...";
  try {
    const data = await fetchJson("/api/ingest/yesterday", { method: "POST" });
    status.textContent = `Ingestao concluida: ${data.total_inserted} novos registros para ${data.date}.`;
  } catch (error) {
    status.textContent = "Falha na ingestao.";
  }
}

async function initDashboard() {
  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);
  const start = new Date();
  start.setDate(start.getDate() - 30);
  const startDate = start.toISOString().slice(0, 10);

  document.getElementById("startDate").value = startDate;
  document.getElementById("endDate").value = endDate;
  document.getElementById("singleDate").value = endDate;

  await Promise.all([loadTopArtists(), loadSongsByTopArtists(), loadTopArtistOnDate(), loadTopSongOnDate()]);
}

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loadTopArtists").addEventListener("click", loadTopArtists);
  document.getElementById("loadSongsByArtists").addEventListener("click", loadSongsByTopArtists);
  document.getElementById("loadDateStats").addEventListener("click", async () => {
    await Promise.all([loadTopArtistOnDate(), loadTopSongOnDate()]);
  });
  document.getElementById("runIngestion").addEventListener("click", runIngestion);

  initDashboard().catch(() => {
    document.getElementById("ingestionStatus").textContent = "Erro ao carregar dados iniciais.";
  });
});
