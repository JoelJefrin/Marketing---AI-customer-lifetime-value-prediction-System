const AGE_GROUPS = ["18-24", "25-34", "35-44", "45-54", "55+"];
const state = {
  customers: [],
  selectedSegment: "All",
  searchTerm: "",
  latestPrediction: null,
  simulatorBaseInput: {
    monthlySpend: 960,
    tenure: 16,
    supportTickets: 2,
    lastPurchase: 14,
    engagementScore: 74,
    planTier: "pro",
    purchaseFrequency: 4
  },
  simulatorBaselineClv: 0,
  conversionRecords: [],
  conversionFilters: {
    gender: "all",
    category: "all",
    timeRange: "30"
  },
  conversionSummary: null,
  conversionInsightsGenerated: false
};

const charts = {
  clvDistribution: null,
  churnRisk: null,
  revenueForecast: null,
  conversionRateByAge: null,
  purchaseDistributionByAge: null,
  agePurchaseProbability: null
};

const dom = {
  activeTabTitle: document.getElementById("activeTabTitle"),
  lastUpdated: document.getElementById("lastUpdated"),
  tabLinks: document.querySelectorAll(".tab-link"),
  tabPanels: document.querySelectorAll(".tab-panel"),
  predictionForm: document.getElementById("predictionForm"),
  monthlySpend: document.getElementById("monthlySpend"),
  tenure: document.getElementById("tenure"),
  supportTickets: document.getElementById("supportTickets"),
  lastPurchase: document.getElementById("lastPurchase"),
  engagementScore: document.getElementById("engagementScore"),
  engagementDisplay: document.getElementById("engagementDisplay"),
  planTier: document.getElementById("planTier"),
  purchaseFrequency: document.getElementById("purchaseFrequency"),
  predictionStatus: document.getElementById("predictionStatus"),
  predictedClv: document.getElementById("predictedClv"),
  predictedSegment: document.getElementById("predictedSegment"),
  predictedChurnRisk: document.getElementById("predictedChurnRisk"),
  predictedConfidence: document.getElementById("predictedConfidence"),
  recommendedAction: document.getElementById("recommendedAction"),
  savePredictionBtn: document.getElementById("savePredictionBtn"),
  kpiAvgClv: document.getElementById("kpiAvgClv"),
  kpiHighValue: document.getElementById("kpiHighValue"),
  kpiAtRisk: document.getElementById("kpiAtRisk"),
  kpiRevenue: document.getElementById("kpiRevenue"),
  insightsTableBody: document.getElementById("insightsTableBody"),
  insightsSearch: document.getElementById("insightsSearch"),
  segmentFilters: document.querySelectorAll(".filter-btn"),
  explainNarrative: document.getElementById("explainNarrative"),
  contributionBars: {
    monthlySpend: document.getElementById("contrib-monthlySpend"),
    engagement: document.getElementById("contrib-engagement"),
    tenure: document.getElementById("contrib-tenure"),
    frequency: document.getElementById("contrib-frequency")
  },
  contributionValues: {
    monthlySpend: document.getElementById("contrib-monthlySpend-val"),
    engagement: document.getElementById("contrib-engagement-val"),
    tenure: document.getElementById("contrib-tenure-val"),
    frequency: document.getElementById("contrib-frequency-val")
  },
  simMonthlySpend: document.getElementById("simMonthlySpend"),
  simEngagement: document.getElementById("simEngagement"),
  simFrequency: document.getElementById("simFrequency"),
  simMonthlySpendValue: document.getElementById("simMonthlySpendValue"),
  simEngagementValue: document.getElementById("simEngagementValue"),
  simFrequencyValue: document.getElementById("simFrequencyValue"),
  simBaselineClv: document.getElementById("simBaselineClv"),
  simProjectedClv: document.getElementById("simProjectedClv"),
  simUplift: document.getElementById("simUplift"),
  simInsight: document.getElementById("simInsight"),
  csvFileInput: document.getElementById("csvFileInput"),
  uploadStatus: document.getElementById("uploadStatus"),
  uploadPreviewBody: document.getElementById("uploadPreviewBody"),
  convTotalVisitors: document.getElementById("convTotalVisitors"),
  convTotalPurchases: document.getElementById("convTotalPurchases"),
  convOverallRate: document.getElementById("convOverallRate"),
  convBestAgeGroup: document.getElementById("convBestAgeGroup"),
  conversionGenderFilter: document.getElementById("conversionGenderFilter"),
  conversionCategoryFilter: document.getElementById("conversionCategoryFilter"),
  conversionTimeFilter: document.getElementById("conversionTimeFilter"),
  conversionInsightsOutput: document.getElementById("conversionInsightsOutput"),
  generateConversionInsightsBtn: document.getElementById("generateConversionInsightsBtn")
};

const tabLabels = {
  dashboard: "Dashboard",
  "prediction-studio": "Prediction Studio",
  "customer-insights": "Customer Insights",
  "conversion-insights": "Conversion Rate by Age",
  "model-pipeline": "AI Model Pipeline",
  "explainable-ai": "Explainable AI",
  "scenario-simulator": "Scenario Simulator",
  "data-upload": "Data Upload"
};

const planMultiplier = {
  basic: 0.92,
  pro: 1.12,
  enterprise: 1.32
};

const actionBySegment = {
  VIP: "Deploy premium loyalty campaign with proactive account expansion.",
  Growth: "Launch personalized cross-sell sequence and engagement journey.",
  "At Risk": "Trigger churn prevention workflow: support follow-up and retention offer."
};

const categoryList = ["electronics", "clothing", "accessories"];
const genderList = ["male", "female"];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercent(value) {
  return `${Math.round(value)}%`;
}

function formatOneDecimal(value) {
  return `${value.toFixed(1)}%`;
}

function formatInteger(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function normalizeHeader(header) {
  return String(header || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizePlanTier(value) {
  const normalized = String(value || "pro").toLowerCase().trim();
  if (normalized === "enterprise") return "enterprise";
  if (normalized === "basic") return "basic";
  return "pro";
}

function normalizeGender(value) {
  const normalized = String(value || "male").toLowerCase().trim();
  if (normalized === "female") return "female";
  return "male";
}

function normalizeCategory(value) {
  const normalized = String(value || "electronics").toLowerCase().trim();
  if (categoryList.includes(normalized)) return normalized;
  return "electronics";
}

function parseBoolean(value, fallback = true) {
  const normalized = String(value || "").toLowerCase().trim();
  if (["1", "true", "yes", "y", "purchased"].includes(normalized)) return true;
  if (["0", "false", "no", "n", "not_purchased"].includes(normalized)) return false;
  return fallback;
}

function parseDateValue(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date();
  return parsed;
}

function classifyAgeGroup(age) {
  const numericAge = toNumber(age, 0);
  if (numericAge >= 18 && numericAge <= 24) return "18-24";
  if (numericAge <= 34) return "25-34";
  if (numericAge <= 44) return "35-44";
  if (numericAge <= 54) return "45-54";
  return "55+";
}

function seededRandom(seed = 20260306) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function predictCustomer(input) {
  const monthlySpend = clamp(toNumber(input.monthlySpend, 0), 10, 100000);
  const tenure = clamp(toNumber(input.tenure, 1), 1, 240);
  const supportTickets = clamp(toNumber(input.supportTickets, 0), 0, 100);
  const lastPurchase = clamp(toNumber(input.lastPurchase, 30), 0, 365);
  const engagementScore = clamp(toNumber(input.engagementScore, 50), 1, 100);
  const purchaseFrequency = clamp(toNumber(input.purchaseFrequency, 3), 1, 30);
  const planTier = normalizePlanTier(input.planTier);

  const planBoost = planMultiplier[planTier] || 1;
  const recencyFactor = clamp(1 - lastPurchase / 210, 0.35, 1.03);
  const supportFactor = clamp(1 - supportTickets * 0.045, 0.62, 1.02);
  const engagementFactor = 0.72 + engagementScore / 185;
  const tenureFactor = 0.7 + Math.log1p(tenure) / Math.log(30);
  const frequencyFactor = 0.75 + purchaseFrequency * 0.07;

  const retentionFactor = clamp(recencyFactor * supportFactor * (0.74 + engagementScore / 250), 0.28, 1.52);
  const annualRevenuePotential = monthlySpend * 12 * planBoost * frequencyFactor;
  const predictedClv = annualRevenuePotential * tenureFactor * retentionFactor;

  const churnRaw =
    64 -
    engagementScore * 0.34 -
    tenure * 0.22 +
    supportTickets * 4.7 +
    lastPurchase * 0.19 -
    purchaseFrequency * 3.8 -
    (planTier === "enterprise" ? 7 : planTier === "pro" ? 3 : 0);
  const churnRisk = clamp(churnRaw, 5, 95);

  const confidenceRaw = 72 + tenure * 0.35 + purchaseFrequency * 1.1 + engagementScore * 0.08 - supportTickets * 0.8;
  const confidence = clamp(confidenceRaw, 73, 98);

  let segment = "Growth";
  if (predictedClv >= 28000 && churnRisk < 25) segment = "VIP";
  if (predictedClv < 12000 || churnRisk >= 50) segment = "At Risk";

  const action = actionBySegment[segment];

  const rawContributions = {
    monthlySpend: (monthlySpend / 2500) * 0.37,
    engagement: (engagementScore / 100) * 0.27,
    tenure: (tenure / 36) * 0.2,
    frequency: (purchaseFrequency / 8) * 0.16
  };
  const sum = Object.values(rawContributions).reduce((acc, value) => acc + value, 0) || 1;

  const contributions = {
    monthlySpend: Math.round((rawContributions.monthlySpend / sum) * 100),
    engagement: Math.round((rawContributions.engagement / sum) * 100),
    tenure: Math.round((rawContributions.tenure / sum) * 100),
    frequency: Math.round((rawContributions.frequency / sum) * 100)
  };

  return {
    predictedClv,
    segment,
    churnRisk,
    confidence,
    action,
    contributions,
    modelInput: {
      monthlySpend,
      tenure,
      supportTickets,
      lastPurchase,
      engagementScore,
      planTier,
      purchaseFrequency
    }
  };
}

function buildSeedData() {
  const base = [
    { customerId: "VP-1001", monthlySpend: 1650, tenure: 29, supportTickets: 1, lastPurchase: 5, engagementScore: 87, planTier: "enterprise", purchaseFrequency: 6 },
    { customerId: "VP-1002", monthlySpend: 540, tenure: 11, supportTickets: 4, lastPurchase: 32, engagementScore: 52, planTier: "basic", purchaseFrequency: 2 },
    { customerId: "VP-1003", monthlySpend: 1180, tenure: 21, supportTickets: 2, lastPurchase: 10, engagementScore: 79, planTier: "pro", purchaseFrequency: 4 },
    { customerId: "VP-1004", monthlySpend: 2320, tenure: 35, supportTickets: 0, lastPurchase: 3, engagementScore: 93, planTier: "enterprise", purchaseFrequency: 7 },
    { customerId: "VP-1005", monthlySpend: 790, tenure: 14, supportTickets: 3, lastPurchase: 26, engagementScore: 61, planTier: "pro", purchaseFrequency: 3 },
    { customerId: "VP-1006", monthlySpend: 420, tenure: 8, supportTickets: 5, lastPurchase: 45, engagementScore: 44, planTier: "basic", purchaseFrequency: 2 },
    { customerId: "VP-1007", monthlySpend: 1390, tenure: 24, supportTickets: 1, lastPurchase: 8, engagementScore: 84, planTier: "pro", purchaseFrequency: 5 },
    { customerId: "VP-1008", monthlySpend: 980, tenure: 16, supportTickets: 2, lastPurchase: 13, engagementScore: 74, planTier: "pro", purchaseFrequency: 4 },
    { customerId: "VP-1009", monthlySpend: 2680, tenure: 40, supportTickets: 0, lastPurchase: 2, engagementScore: 96, planTier: "enterprise", purchaseFrequency: 8 },
    { customerId: "VP-1010", monthlySpend: 610, tenure: 9, supportTickets: 4, lastPurchase: 36, engagementScore: 49, planTier: "basic", purchaseFrequency: 2 },
    { customerId: "VP-1011", monthlySpend: 1520, tenure: 27, supportTickets: 1, lastPurchase: 6, engagementScore: 88, planTier: "enterprise", purchaseFrequency: 6 },
    { customerId: "VP-1012", monthlySpend: 860, tenure: 15, supportTickets: 3, lastPurchase: 18, engagementScore: 67, planTier: "pro", purchaseFrequency: 3 },
    { customerId: "VP-1013", monthlySpend: 370, tenure: 5, supportTickets: 6, lastPurchase: 58, engagementScore: 33, planTier: "basic", purchaseFrequency: 1 },
    { customerId: "VP-1014", monthlySpend: 1240, tenure: 19, supportTickets: 2, lastPurchase: 11, engagementScore: 76, planTier: "pro", purchaseFrequency: 4 }
  ];

  return base.map((row) => ({ ...row, ...predictCustomer(row) }));
}

function buildConversionSeedData(count = 480) {
  const random = seededRandom(921337);
  const baseByAgeGroup = {
    "18-24": 0.21,
    "25-34": 0.42,
    "35-44": 0.36,
    "45-54": 0.3,
    "55+": 0.24
  };

  const records = [];

  for (let i = 0; i < count; i += 1) {
    const age = 18 + Math.floor(random() * 52);
    const ageGroup = classifyAgeGroup(age);
    const gender = genderList[Math.floor(random() * genderList.length)];
    const category = categoryList[Math.floor(random() * categoryList.length)];

    let purchaseProbability = baseByAgeGroup[ageGroup];
    if (category === "electronics") purchaseProbability += 0.03;
    if (category === "clothing") purchaseProbability += 0.01;
    if (category === "accessories") purchaseProbability -= 0.02;
    if (gender === "female" && category === "clothing") purchaseProbability += 0.03;
    if (gender === "male" && category === "electronics") purchaseProbability += 0.015;

    const purchased = random() < clamp(purchaseProbability, 0.05, 0.82);
    const daysAgo = Math.floor(random() * 130);
    const visitDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

    records.push({
      visitorId: `VIS-${10000 + i}`,
      age,
      ageGroup,
      gender,
      category,
      visitDate,
      purchased
    });
  }

  return records;
}

function getFilteredConversionRecords() {
  const now = Date.now();
  const dayWindow = state.conversionFilters.timeRange === "all" ? null : Number(state.conversionFilters.timeRange);
  const cutoff = dayWindow ? now - dayWindow * 24 * 60 * 60 * 1000 : null;

  return state.conversionRecords.filter((record) => {
    const genderMatch = state.conversionFilters.gender === "all" || record.gender === state.conversionFilters.gender;
    const categoryMatch =
      state.conversionFilters.category === "all" || record.category === state.conversionFilters.category;
    const dateMatch = !cutoff || new Date(record.visitDate).getTime() >= cutoff;
    return genderMatch && categoryMatch && dateMatch;
  });
}

function summarizeConversionRecords(records) {
  const metrics = AGE_GROUPS.map((ageGroup) => ({
    ageGroup,
    visitors: 0,
    purchases: 0,
    conversionRate: 0
  }));

  const metricMap = Object.fromEntries(metrics.map((item) => [item.ageGroup, item]));

  records.forEach((record) => {
    const ageGroup = classifyAgeGroup(record.age);
    const target = metricMap[ageGroup];
    target.visitors += 1;
    if (record.purchased) target.purchases += 1;
  });

  metrics.forEach((item) => {
    item.conversionRate = item.visitors > 0 ? (item.purchases / item.visitors) * 100 : 0;
  });

  const totalVisitors = metrics.reduce((sum, item) => sum + item.visitors, 0);
  const totalPurchases = metrics.reduce((sum, item) => sum + item.purchases, 0);
  const overallRate = totalVisitors > 0 ? (totalPurchases / totalVisitors) * 100 : 0;

  const bestMetric = metrics.reduce(
    (best, current) => {
      if (current.visitors === 0) return best;
      if (current.conversionRate > best.conversionRate) return current;
      return best;
    },
    { ageGroup: "-", conversionRate: -1, visitors: 0, purchases: 0 }
  );

  return {
    metrics,
    totalVisitors,
    totalPurchases,
    overallRate,
    bestAgeGroup: bestMetric.ageGroup,
    bestConversionRate: bestMetric.conversionRate
  };
}

function buildRevenueForecast(customers) {
  if (!customers.length) {
    return {
      labels: Array.from({ length: 12 }, (_, idx) => `M${idx + 1}`),
      values: Array.from({ length: 12 }, () => 0),
      totalRevenue: 0
    };
  }

  const monthlyBase = customers.reduce((sum, customer) => sum + customer.monthlySpend, 0);
  const avgChurn = customers.reduce((sum, customer) => sum + customer.churnRisk, 0) / customers.length / 100;
  const vipShare = customers.filter((customer) => customer.segment === "VIP").length / customers.length;
  const growthRate = 0.007 + vipShare * 0.012;

  const labels = [];
  const values = [];

  for (let month = 1; month <= 12; month += 1) {
    const seasonality = 1 + Math.sin((month + 2) / 2.2) * 0.03;
    const retentionCurve = clamp(1 - avgChurn * (month - 1) * 0.07, 0.5, 1);
    const projected = monthlyBase * Math.pow(1 + growthRate, month - 1) * seasonality * retentionCurve;
    labels.push(`M${month}`);
    values.push(Math.max(0, projected));
  }

  return {
    labels,
    values,
    totalRevenue: values.reduce((sum, value) => sum + value, 0)
  };
}

function updateLastUpdatedStamp() {
  const label = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  });
  dom.lastUpdated.textContent = `Last updated: ${label}`;
}

function updateDashboard() {
  if (!state.customers.length) return;

  const avgClv = state.customers.reduce((sum, customer) => sum + customer.predictedClv, 0) / state.customers.length;
  const highValuePct =
    (state.customers.filter((customer) => customer.segment === "VIP").length / state.customers.length) * 100;
  const atRiskPct =
    (state.customers.filter((customer) => customer.segment === "At Risk").length / state.customers.length) * 100;

  const revenueForecast = buildRevenueForecast(state.customers);

  dom.kpiAvgClv.textContent = formatCurrency(avgClv);
  dom.kpiHighValue.textContent = formatPercent(highValuePct);
  dom.kpiAtRisk.textContent = formatPercent(atRiskPct);
  dom.kpiRevenue.textContent = formatCurrency(revenueForecast.totalRevenue);

  renderDashboardCharts(revenueForecast);
  updateLastUpdatedStamp();
}

function renderDashboardCharts(revenueForecast) {
  if (typeof Chart === "undefined") return;

  const clvBins = [0, 0, 0, 0, 0];
  state.customers.forEach((customer) => {
    const value = customer.predictedClv;
    if (value < 10000) clvBins[0] += 1;
    else if (value < 20000) clvBins[1] += 1;
    else if (value < 30000) clvBins[2] += 1;
    else if (value < 45000) clvBins[3] += 1;
    else clvBins[4] += 1;
  });

  const churnMix = [0, 0, 0];
  state.customers.forEach((customer) => {
    if (customer.churnRisk < 25) churnMix[0] += 1;
    else if (customer.churnRisk < 50) churnMix[1] += 1;
    else churnMix[2] += 1;
  });

  const clvCtx = document.getElementById("clvDistributionChart");
  const churnCtx = document.getElementById("churnRiskChart");
  const revenueCtx = document.getElementById("revenueForecastChart");

  const commonOptions = {
    plugins: {
      legend: {
        labels: {
          color: "#355577"
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  if (charts.clvDistribution) {
    charts.clvDistribution.data.datasets[0].data = clvBins;
    charts.clvDistribution.update();
  } else {
    charts.clvDistribution = new Chart(clvCtx, {
      type: "bar",
      data: {
        labels: ["<10k", "10-20k", "20-30k", "30-45k", "45k+"],
        datasets: [
          {
            label: "Customers",
            data: clvBins,
            borderRadius: 10,
            backgroundColor: ["#b8d8ff", "#92c3ff", "#6dabff", "#4e95fa", "#287ef4"]
          }
        ]
      },
      options: {
        ...commonOptions,
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#4e6e91" }
          },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              color: "#4e6e91"
            },
            grid: {
              color: "rgba(78,110,145,0.15)"
            }
          }
        }
      }
    });
  }

  if (charts.churnRisk) {
    charts.churnRisk.data.datasets[0].data = churnMix;
    charts.churnRisk.update();
  } else {
    charts.churnRisk = new Chart(churnCtx, {
      type: "pie",
      data: {
        labels: ["Low Risk", "Medium Risk", "High Risk"],
        datasets: [
          {
            data: churnMix,
            backgroundColor: ["#2fbf83", "#f7b957", "#ea6666"],
            borderColor: "#ffffff",
            borderWidth: 2
          }
        ]
      },
      options: commonOptions
    });
  }

  if (charts.revenueForecast) {
    charts.revenueForecast.data.labels = revenueForecast.labels;
    charts.revenueForecast.data.datasets[0].data = revenueForecast.values;
    charts.revenueForecast.update();
  } else {
    charts.revenueForecast = new Chart(revenueCtx, {
      type: "line",
      data: {
        labels: revenueForecast.labels,
        datasets: [
          {
            label: "Projected Revenue",
            data: revenueForecast.values,
            borderColor: "#0f91d4",
            backgroundColor: "rgba(15,145,212,0.18)",
            borderWidth: 3,
            pointRadius: 2.5,
            pointBackgroundColor: "#0f91d4",
            tension: 0.35,
            fill: true
          }
        ]
      },
      options: {
        ...commonOptions,
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#4e6e91" }
          },
          y: {
            beginAtZero: true,
            ticks: {
              color: "#4e6e91",
              callback: (value) => `$${Math.round(value / 1000)}k`
            },
            grid: {
              color: "rgba(78,110,145,0.15)"
            }
          }
        }
      }
    });
  }
}

function renderInsightsTable() {
  const term = state.searchTerm.trim().toLowerCase();
  const filtered = state.customers
    .filter((customer) => {
      const segmentMatch = state.selectedSegment === "All" || customer.segment === state.selectedSegment;
      const searchMatch =
        term.length === 0 ||
        customer.customerId.toLowerCase().includes(term) ||
        customer.action.toLowerCase().includes(term);
      return segmentMatch && searchMatch;
    })
    .sort((a, b) => b.predictedClv - a.predictedClv);

  if (!filtered.length) {
    dom.insightsTableBody.innerHTML =
      '<tr><td colspan="5" class="empty-state">No customers match this filter.</td></tr>';
    return;
  }

  dom.insightsTableBody.innerHTML = filtered
    .map((customer) => {
      const tagClass = customer.segment === "At Risk" ? "at-risk" : customer.segment.toLowerCase();
      return `
        <tr>
          <td>${customer.customerId}</td>
          <td>${formatCurrency(customer.predictedClv)}</td>
          <td><span class="tag ${tagClass}">${customer.segment}</span></td>
          <td>${formatPercent(customer.churnRisk)}</td>
          <td>${customer.action}</td>
        </tr>
      `;
    })
    .join("");
}

function setActiveTab(tabId) {
  dom.tabLinks.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabId);
  });

  dom.tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });

  dom.activeTabTitle.textContent = tabLabels[tabId] || "Dashboard";
}

function setupTabs() {
  dom.tabLinks.forEach((tab) => {
    tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
  });
}

function renderPrediction(result) {
  dom.predictionStatus.textContent = "Prediction ready";
  dom.predictedClv.textContent = formatCurrency(result.predictedClv);
  dom.predictedSegment.textContent = result.segment;
  dom.predictedChurnRisk.textContent = formatPercent(result.churnRisk);
  dom.predictedConfidence.textContent = formatPercent(result.confidence);
  dom.recommendedAction.textContent = result.action;

  if (result.segment === "VIP") dom.predictedSegment.style.color = "#17935a";
  else if (result.segment === "At Risk") dom.predictedSegment.style.color = "#cb4343";
  else dom.predictedSegment.style.color = "#1f63cb";

  if (result.churnRisk >= 50) dom.predictedChurnRisk.style.color = "#cb4343";
  else if (result.churnRisk >= 25) dom.predictedChurnRisk.style.color = "#c18221";
  else dom.predictedChurnRisk.style.color = "#17935a";
}

function updateExplainableAI(result) {
  const sortedFeatures = Object.entries(result.contributions)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => key);

  const topFeatureMap = {
    monthlySpend: "monthly spend",
    engagement: "engagement score",
    tenure: "customer tenure",
    frequency: "purchase frequency"
  };

  const topOne = topFeatureMap[sortedFeatures[0]];
  const topTwo = topFeatureMap[sortedFeatures[1]];

  const recencyFlag = result.modelInput.lastPurchase > 25 ? "longer recency window" : "recent purchase behavior";
  const supportFlag =
    result.modelInput.supportTickets >= 4
      ? "higher support ticket volume"
      : "stable post-sale support interactions";

  dom.explainNarrative.textContent =
    `The model predicted ${formatCurrency(result.predictedClv)} mainly from ${topOne} and ${topTwo}. ` +
    `Churn risk is estimated at ${formatPercent(result.churnRisk)} due to ${recencyFlag} and ${supportFlag}. ` +
    `Confidence is ${formatPercent(result.confidence)} based on signal completeness and customer tenure.`;

  dom.contributionBars.monthlySpend.style.width = `${result.contributions.monthlySpend}%`;
  dom.contributionBars.engagement.style.width = `${result.contributions.engagement}%`;
  dom.contributionBars.tenure.style.width = `${result.contributions.tenure}%`;
  dom.contributionBars.frequency.style.width = `${result.contributions.frequency}%`;

  dom.contributionValues.monthlySpend.textContent = `${result.contributions.monthlySpend}%`;
  dom.contributionValues.engagement.textContent = `${result.contributions.engagement}%`;
  dom.contributionValues.tenure.textContent = `${result.contributions.tenure}%`;
  dom.contributionValues.frequency.textContent = `${result.contributions.frequency}%`;
}

function syncSimulatorFromPrediction(result) {
  state.simulatorBaseInput = { ...result.modelInput };
  state.simulatorBaselineClv = result.predictedClv;

  dom.simMonthlySpend.value = String(result.modelInput.monthlySpend);
  dom.simEngagement.value = String(result.modelInput.engagementScore);
  dom.simFrequency.value = String(result.modelInput.purchaseFrequency);

  updateSimulatorDisplays();
  runScenarioSimulation();
}

function runPredictionFromForm() {
  const input = {
    monthlySpend: toNumber(dom.monthlySpend.value, 0),
    tenure: toNumber(dom.tenure.value, 1),
    supportTickets: toNumber(dom.supportTickets.value, 0),
    lastPurchase: toNumber(dom.lastPurchase.value, 0),
    engagementScore: toNumber(dom.engagementScore.value, 50),
    planTier: dom.planTier.value,
    purchaseFrequency: toNumber(dom.purchaseFrequency.value, 1)
  };

  const result = predictCustomer(input);
  state.latestPrediction = {
    customerId: `LIVE-${String(Date.now()).slice(-6)}`,
    ...input,
    ...result
  };

  renderPrediction(result);
  updateExplainableAI(result);
  syncSimulatorFromPrediction(result);
}

function setupPredictionStudio() {
  dom.engagementScore.addEventListener("input", () => {
    dom.engagementDisplay.textContent = dom.engagementScore.value;
  });

  dom.predictionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runPredictionFromForm();
  });

  dom.savePredictionBtn.addEventListener("click", () => {
    if (!state.latestPrediction) return;
    state.customers.unshift({ ...state.latestPrediction });
    updateDashboard();
    renderInsightsTable();
    dom.predictionStatus.textContent = "Added to insights";
    setActiveTab("customer-insights");
  });
}

function setupInsightsControls() {
  dom.segmentFilters.forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedSegment = button.dataset.segment;
      dom.segmentFilters.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      renderInsightsTable();
    });
  });

  dom.insightsSearch.addEventListener("input", () => {
    state.searchTerm = dom.insightsSearch.value;
    renderInsightsTable();
  });
}

function updateSimulatorDisplays() {
  dom.simMonthlySpendValue.textContent = formatCurrency(toNumber(dom.simMonthlySpend.value, 0));
  dom.simEngagementValue.textContent = String(toNumber(dom.simEngagement.value, 0));
  dom.simFrequencyValue.textContent = String(toNumber(dom.simFrequency.value, 0));
}

function runScenarioSimulation() {
  const scenarioInput = {
    ...state.simulatorBaseInput,
    monthlySpend: toNumber(dom.simMonthlySpend.value, state.simulatorBaseInput.monthlySpend),
    engagementScore: toNumber(dom.simEngagement.value, state.simulatorBaseInput.engagementScore),
    purchaseFrequency: toNumber(dom.simFrequency.value, state.simulatorBaseInput.purchaseFrequency)
  };

  const scenarioResult = predictCustomer(scenarioInput);
  const baselineClv = state.simulatorBaselineClv || scenarioResult.predictedClv;
  const upliftPct = ((scenarioResult.predictedClv - baselineClv) / baselineClv) * 100;

  dom.simBaselineClv.textContent = formatCurrency(baselineClv);
  dom.simProjectedClv.textContent = formatCurrency(scenarioResult.predictedClv);
  dom.simUplift.textContent = `${upliftPct >= 0 ? "+" : ""}${Math.round(upliftPct)}%`;

  if (upliftPct >= 12) {
    dom.simInsight.textContent =
      "Strong upside detected. This scenario can materially increase customer value with focused retention marketing.";
  } else if (upliftPct >= 0) {
    dom.simInsight.textContent =
      "Moderate uplift expected. Combine campaign personalization with success team outreach for better impact.";
  } else {
    dom.simInsight.textContent =
      "Scenario decreases value potential. Consider improving engagement and purchase frequency before scaling spend.";
  }
}

function setupScenarioSimulator() {
  [dom.simMonthlySpend, dom.simEngagement, dom.simFrequency].forEach((input) => {
    input.addEventListener("input", () => {
      updateSimulatorDisplays();
      runScenarioSimulation();
    });
  });

  updateSimulatorDisplays();
  runScenarioSimulation();
}

function renderConversionCharts(summary) {
  if (typeof Chart === "undefined") return;

  const labels = summary.metrics.map((metric) => metric.ageGroup);
  const rateData = summary.metrics.map((metric) => Number(metric.conversionRate.toFixed(2)));
  const purchaseData = summary.metrics.map((metric) => metric.purchases);

  const tooltipLabel = (context) => {
    const metric = summary.metrics[context.dataIndex];
    return [
      `Visitors: ${formatInteger(metric.visitors)}`,
      `Purchases: ${formatInteger(metric.purchases)}`,
      `Conversion Rate: ${formatOneDecimal(metric.conversionRate)}`
    ];
  };

  const commonOptions = {
    plugins: {
      legend: {
        labels: {
          color: "#355577"
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false
  };

  const rateCtx = document.getElementById("conversionRateByAgeChart");
  const purchaseCtx = document.getElementById("purchaseDistributionByAgeChart");
  const probabilityCtx = document.getElementById("agePurchaseProbabilityChart");

  if (charts.conversionRateByAge) {
    charts.conversionRateByAge.data.labels = labels;
    charts.conversionRateByAge.data.datasets[0].data = rateData;
    charts.conversionRateByAge.update();
  } else {
    charts.conversionRateByAge = new Chart(rateCtx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Conversion Rate %",
            data: rateData,
            borderRadius: 10,
            backgroundColor: ["#7bb6ff", "#539fff", "#2f88f2", "#2aaea0", "#56c47a"]
          }
        ]
      },
      options: {
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins,
          tooltip: {
            callbacks: {
              label: tooltipLabel
            }
          }
        },
        scales: {
          x: {
            ticks: { color: "#4e6e91" },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: "#4e6e91",
              callback: (value) => `${value}%`
            },
            grid: {
              color: "rgba(78,110,145,0.15)"
            }
          }
        }
      }
    });
  }

  if (charts.purchaseDistributionByAge) {
    charts.purchaseDistributionByAge.data.labels = labels;
    charts.purchaseDistributionByAge.data.datasets[0].data = purchaseData;
    charts.purchaseDistributionByAge.update();
  } else {
    charts.purchaseDistributionByAge = new Chart(purchaseCtx, {
      type: "pie",
      data: {
        labels,
        datasets: [
          {
            data: purchaseData,
            backgroundColor: ["#87bcff", "#5aa2ff", "#2f88f2", "#44b7a8", "#7fd48d"],
            borderWidth: 2,
            borderColor: "#ffffff"
          }
        ]
      },
      options: {
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins,
          tooltip: {
            callbacks: {
              label: tooltipLabel
            }
          }
        }
      }
    });
  }

  if (charts.agePurchaseProbability) {
    charts.agePurchaseProbability.data.labels = labels;
    charts.agePurchaseProbability.data.datasets[0].data = rateData;
    charts.agePurchaseProbability.update();
  } else {
    charts.agePurchaseProbability = new Chart(probabilityCtx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Purchase Probability %",
            data: rateData,
            borderColor: "#0c98d0",
            backgroundColor: "rgba(12,152,208,0.18)",
            borderWidth: 3,
            pointRadius: 3,
            pointBackgroundColor: "#0c98d0",
            tension: 0.32,
            fill: true
          }
        ]
      },
      options: {
        ...commonOptions,
        plugins: {
          ...commonOptions.plugins,
          tooltip: {
            callbacks: {
              label: tooltipLabel
            }
          }
        },
        scales: {
          x: {
            ticks: { color: "#4e6e91" },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: "#4e6e91",
              callback: (value) => `${value}%`
            },
            grid: {
              color: "rgba(78,110,145,0.15)"
            }
          }
        }
      }
    });
  }
}

function renderConversionKpis(summary) {
  dom.convTotalVisitors.textContent = formatInteger(summary.totalVisitors);
  dom.convTotalPurchases.textContent = formatInteger(summary.totalPurchases);
  dom.convOverallRate.textContent = formatOneDecimal(summary.overallRate);

  if (summary.bestAgeGroup === "-") {
    dom.convBestAgeGroup.textContent = "-";
  } else {
    dom.convBestAgeGroup.textContent = `${summary.bestAgeGroup} (${formatOneDecimal(summary.bestConversionRate)})`;
  }
}

function updateConversionInsights() {
  const filteredRecords = getFilteredConversionRecords();
  const summary = summarizeConversionRecords(filteredRecords);
  state.conversionSummary = summary;

  renderConversionKpis(summary);
  renderConversionCharts(summary);

  if (!state.conversionInsightsGenerated) {
    dom.conversionInsightsOutput.innerHTML =
      "<p>Filters updated. Click Generate Insights to produce AI marketing recommendations for the current data.</p>";
  }
}

function buildConversionInsightLines(summary) {
  if (summary.totalVisitors === 0) {
    return ["No visitors match the selected filters. Expand the time range or choose broader filters."];
  }

  const sortedByRate = [...summary.metrics]
    .filter((item) => item.visitors > 0)
    .sort((a, b) => b.conversionRate - a.conversionRate);

  const topGroup = sortedByRate[0];
  const lowGroup = sortedByRate[sortedByRate.length - 1];
  const avgVisitors = summary.totalVisitors / AGE_GROUPS.length;

  const highTrafficLowConv = summary.metrics
    .filter((item) => item.visitors >= avgVisitors && item.conversionRate < summary.overallRate)
    .sort((a, b) => b.visitors - a.visitors)[0];

  const insights = [];

  insights.push(
    `Customers aged ${topGroup.ageGroup} show the strongest conversion at ${formatOneDecimal(topGroup.conversionRate)}. Prioritize this segment with premium product offers and loyalty retention bundles.`
  );

  insights.push(
    `Customers aged ${lowGroup.ageGroup} currently convert at ${formatOneDecimal(lowGroup.conversionRate)}, the lowest among active groups. Test onboarding nudges, simplified checkout, and segmented discounting.`
  );

  if (highTrafficLowConv) {
    insights.push(
      `Age group ${highTrafficLowConv.ageGroup} brings high traffic (${formatInteger(highTrafficLowConv.visitors)} visitors) but underperforms on conversion. Launch targeted campaigns and product education journeys to improve purchase intent.`
    );
  } else {
    insights.push(
      "Conversion efficiency is balanced across traffic segments. Focus on expanding acquisition volume in high-converting age groups while preserving conversion quality."
    );
  }

  return insights;
}

function renderConversionInsightLines(lines) {
  dom.conversionInsightsOutput.innerHTML = `<ul>${lines.map((line) => `<li>${line}</li>`).join("")}</ul>`;
}

function setupConversionInsightsModule() {
  const onFilterChange = () => {
    state.conversionFilters.gender = dom.conversionGenderFilter.value;
    state.conversionFilters.category = dom.conversionCategoryFilter.value;
    state.conversionFilters.timeRange = dom.conversionTimeFilter.value;
    state.conversionInsightsGenerated = false;
    updateConversionInsights();
  };

  [dom.conversionGenderFilter, dom.conversionCategoryFilter, dom.conversionTimeFilter].forEach((control) => {
    control.addEventListener("change", onFilterChange);
  });

  dom.generateConversionInsightsBtn.addEventListener("click", () => {
    const summary = state.conversionSummary || summarizeConversionRecords(getFilteredConversionRecords());
    renderConversionInsightLines(buildConversionInsightLines(summary));
    state.conversionInsightsGenerated = true;
  });

  updateConversionInsights();
}

function parseCsvLine(line) {
  const output = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      output.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  output.push(current.trim());
  return output;
}

function mapHeaderIndexes(headers) {
  const normalized = headers.map((header) => normalizeHeader(header));
  const pickIndex = (aliases) => normalized.findIndex((name) => aliases.includes(name));

  return {
    customerId: pickIndex(["customerid", "customer", "id"]),
    monthlySpend: pickIndex(["monthlyspend", "monthlyamount", "spend"]),
    tenure: pickIndex(["tenure", "tenuremonths"]),
    supportTickets: pickIndex(["supporttickets", "tickets", "support"]),
    lastPurchase: pickIndex(["lastpurchase", "lastpurchasedays", "recency"]),
    engagementScore: pickIndex(["engagementscore", "engagement"]),
    planTier: pickIndex(["plantier", "plan"]),
    purchaseFrequency: pickIndex(["purchasefrequency", "frequency", "orderspermonth"]),
    age: pickIndex(["age", "customerage"]),
    gender: pickIndex(["gender", "sex"]),
    category: pickIndex(["category", "productcategory", "product"]),
    visitDate: pickIndex(["visitdate", "date", "timestamp", "createdat"]),
    purchased: pickIndex(["purchased", "ispurchased", "conversion", "converted"])
  };
}

function parseCustomerCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return { records: [], conversionRecords: [], skipped: 0 };
  }

  const headers = parseCsvLine(lines[0]);
  const indexMap = mapHeaderIndexes(headers);

  if (indexMap.monthlySpend === -1) {
    return { records: [], conversionRecords: [], skipped: lines.length - 1 };
  }

  const records = [];
  const conversionRecords = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const parts = parseCsvLine(lines[i]);

    const monthlySpend = toNumber(parts[indexMap.monthlySpend], NaN);
    if (!Number.isFinite(monthlySpend) || monthlySpend <= 0) {
      skipped += 1;
      continue;
    }

    const parsed = {
      customerId:
        indexMap.customerId >= 0 && parts[indexMap.customerId]
          ? parts[indexMap.customerId]
          : `CSV-${Date.now().toString().slice(-6)}-${i}`,
      monthlySpend,
      tenure: toNumber(parts[indexMap.tenure], 12),
      supportTickets: toNumber(parts[indexMap.supportTickets], 1),
      lastPurchase: toNumber(parts[indexMap.lastPurchase], 21),
      engagementScore: toNumber(parts[indexMap.engagementScore], 65),
      planTier: normalizePlanTier(indexMap.planTier >= 0 ? parts[indexMap.planTier] : "pro"),
      purchaseFrequency: toNumber(parts[indexMap.purchaseFrequency], 3)
    };

    records.push({ ...parsed, ...predictCustomer(parsed) });

    if (indexMap.age >= 0) {
      const age = toNumber(parts[indexMap.age], NaN);
      if (Number.isFinite(age) && age >= 18) {
        conversionRecords.push({
          visitorId: parsed.customerId,
          age,
          ageGroup: classifyAgeGroup(age),
          gender: normalizeGender(indexMap.gender >= 0 ? parts[indexMap.gender] : "male"),
          category: normalizeCategory(indexMap.category >= 0 ? parts[indexMap.category] : "electronics"),
          visitDate: parseDateValue(indexMap.visitDate >= 0 ? parts[indexMap.visitDate] : new Date().toISOString()),
          purchased: parseBoolean(indexMap.purchased >= 0 ? parts[indexMap.purchased] : true, true)
        });
      }
    }
  }

  return { records, conversionRecords, skipped };
}

function renderUploadPreview(records) {
  if (!records.length) {
    dom.uploadPreviewBody.innerHTML =
      '<tr><td colspan="4" class="empty-state">Upload preview will appear here.</td></tr>';
    return;
  }

  dom.uploadPreviewBody.innerHTML = records
    .slice(0, 8)
    .map((record) => {
      const tagClass = record.segment === "At Risk" ? "at-risk" : record.segment.toLowerCase();
      return `
        <tr>
          <td>${record.customerId}</td>
          <td>${formatCurrency(record.predictedClv)}</td>
          <td><span class="tag ${tagClass}">${record.segment}</span></td>
          <td>${formatPercent(record.churnRisk)}</td>
        </tr>
      `;
    })
    .join("");
}

function setupDataUpload() {
  renderUploadPreview([]);

  dom.csvFileInput.addEventListener("change", () => {
    const file = dom.csvFileInput.files && dom.csvFileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const parsed = parseCustomerCsv(text);

      if (!parsed.records.length) {
        dom.uploadStatus.textContent =
          "Upload failed: no valid customer rows found. Ensure monthly_spend and basic fields are provided.";
        renderUploadPreview([]);
        return;
      }

      state.customers = [...parsed.records, ...state.customers];
      if (parsed.conversionRecords.length) {
        state.conversionRecords = [...parsed.conversionRecords, ...state.conversionRecords];
        state.conversionInsightsGenerated = false;
        updateConversionInsights();
      }

      updateDashboard();
      renderInsightsTable();
      renderUploadPreview(parsed.records);

      dom.uploadStatus.textContent =
        `Processed ${parsed.records.length} customer rows. Skipped ${parsed.skipped} invalid rows. Dashboard updated.`;
      setActiveTab("dashboard");
    };

    reader.readAsText(file);
  });
}

function initialize() {
  state.customers = buildSeedData();
  state.conversionRecords = buildConversionSeedData();

  setupTabs();
  setupPredictionStudio();
  setupInsightsControls();
  setupScenarioSimulator();
  setupDataUpload();
  setupConversionInsightsModule();

  updateDashboard();
  renderInsightsTable();
  runPredictionFromForm();

  setActiveTab("dashboard");
}

initialize();

















