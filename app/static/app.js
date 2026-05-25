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

function renderPieChart(canvasId, data, chartInstance) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !data || data.length === 0) {
    return;
  }

  const colors = [
    "rgba(99, 102, 241, 0.8)",
    "rgba(168, 85, 247, 0.8)",
    "rgba(236, 72, 153, 0.8)",
    "rgba(239, 68, 68, 0.8)",
    "rgba(245, 158, 11, 0.8)",
    "rgba(34, 197, 94, 0.8)",
    "rgba(59, 130, 246, 0.8)",
    "rgba(14, 165, 233, 0.8)",
    "rgba(6, 182, 212, 0.8)",
    "rgba(34, 197, 94, 0.8)",
  ];

  // Para gráfico de músicas, usar mais cores
  if (data.length > 10) {
    for (let i = 10; i < data.length; i++) {
      colors.push(`hsla(${(i * 36) % 360}, 70%, 60%, 0.8)`);
    }
  }

  const labels = data.map((item) => item.artist || item.song || "");
  const values = data.map((item) => item.plays);

  if (chartInstance === "topArtists" && topArtistsChart) {
    topArtistsChart.destroy();
  } else if (chartInstance === "songsByArtists" && songsByArtistsChart) {
    songsByArtistsChart.destroy();
  }

  const chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors.slice(0, data.length),
          borderColor: "#1f2937",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        datalabels: {
          color: "#f3f4f6",
          font: {
            family: "'Space Grotesk', sans-serif",
            weight: "bold",
            size: 13,
          },
          formatter: (value) => formatNumber(value),
          anchor: "center",
          align: "center",
        },
        legend: {
          position: "right",
          labels: {
            font: { family: "'Space Grotesk', sans-serif", size: 14 },
            color: "#e5e7eb",
            padding: 20,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.label || "";
              const value = formatNumber(context.parsed);
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            },
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

  if (chartInstance === "topArtists") {
    topArtistsChart = chart;
  } else if (chartInstance === "songsByArtists") {
    songsByArtistsChart = chart;
  }
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
  renderPieChart("topArtistsChart", data, "topArtists");
  renderTable(
    "topArtistsResults",
    [
      { key: "artist", label: "Artista" },
      { key: "plays", label: "Execucoes", formatter: formatNumber },
    ],
    data
  );
}

async function loadSongsByTopArtists() {
  const { startDate, endDate } = getRangeValues();
  const artistLimit = document.getElementById("artistLimit").value;
  const songLimit = document.getElementById("songLimit").value;
  const url = `/api/stats/top-songs-by-top-artists?start_date=${startDate}&end_date=${endDate}&artist_limit=${artistLimit}&song_limit=${songLimit}`;
  const data = await fetchJson(url);

  renderPieChart("songsByArtistsChart", data, "songsByArtists");
  renderTable(
    "songsByArtistsResults",
    [
      { key: "artist", label: "Artista" },
      { key: "song", label: "Musica" },
      { key: "plays", label: "Execucoes", formatter: formatNumber },
    ],
    data
  );
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

async function loadArtistOnDate() {
  const artist = document.getElementById("artistName").value;
  const refDate = document.getElementById("artistDate").value;
  const data = await fetchJson(`/api/stats/artist-on-date?artist=${encodeURIComponent(artist)}&ref_date=${refDate}`);

  document.getElementById("artistTotal").textContent = `${data.artist} teve ${formatNumber(data.plays)} execucoes em ${data.date}.`;

  renderTable(
    "artistSongsResults",
    [
      { key: "song", label: "Musica" },
      { key: "plays", label: "Execucoes", formatter: formatNumber },
    ],
    data.top_songs
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
  document.getElementById("artistDate").value = endDate;

  await Promise.all([loadTopArtists(), loadSongsByTopArtists(), loadTopArtistOnDate(), loadTopSongOnDate()]);
}

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loadTopArtists").addEventListener("click", loadTopArtists);
  document.getElementById("loadSongsByArtists").addEventListener("click", loadSongsByTopArtists);
  document.getElementById("loadDateStats").addEventListener("click", async () => {
    await Promise.all([loadTopArtistOnDate(), loadTopSongOnDate()]);
  });
  document.getElementById("loadArtistDate").addEventListener("click", loadArtistOnDate);
  document.getElementById("runIngestion").addEventListener("click", runIngestion);

  initDashboard().catch(() => {
    document.getElementById("topArtistsResults").innerHTML = '<div class="empty">Erro ao carregar dados iniciais.</div>';
  });
});
