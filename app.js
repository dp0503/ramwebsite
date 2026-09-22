(function () {
  "use strict";

  var SAMPLE_STATUS_CARDS = [
    { id: "status", label: "Current Status", value: "Tight supply (sample)", number: 62 },
    { id: "cause", label: "Main Cause", value: "AI and data-center demand (sample)", number: null },
    { id: "memory", label: "Most Affected Memory", value: "DDR5 / HBM (sample)", number: null },
    { id: "consumer", label: "Consumer Impact", value: "Higher upgrade costs (sample)", number: 18 },
    { id: "ai", label: "AI Demand", value: "Strong (sample index)", number: 84 }
  ];

  var SAMPLE_PRICE_ROWS = [
    { memory: "DDR4", capacity: "8GB", previous: 28.5, current: 32.0, change: 12.3, status: "Watch" },
    { memory: "DDR4", capacity: "16GB", previous: 48.0, current: 56.0, change: 16.7, status: "Tight" },
    { memory: "DDR5", capacity: "8GB", previous: 36.0, current: 44.0, change: 22.2, status: "Tight" },
    { memory: "DDR5", capacity: "16GB", previous: 62.0, current: 78.0, change: 25.8, status: "Shortage" },
    { memory: "DDR5", capacity: "32GB", previous: 118.0, current: 148.0, change: 25.4, status: "Shortage" },
    { memory: "HBM", capacity: "Various", previous: 100.0, current: 142.0, change: 42.0, status: "Crisis" }
  ];

  var SAMPLE_MANUFACTURERS = [
    {
      id: "samsung",
      name: "Samsung",
      country: "South Korea",
      memoryTypes: "DRAM, HBM, NAND",
      mainProducts: "DDR4, DDR5, LPDDR, HBM",
      description: "A major global memory producer for consumer, mobile, server, and high-bandwidth products. Sample profile for this college project."
    },
    {
      id: "skhynix",
      name: "SK hynix",
      country: "South Korea",
      memoryTypes: "DRAM, HBM",
      mainProducts: "DDR4, DDR5, HBM",
      description: "A leading supplier of DRAM and high-bandwidth memory used in PCs, servers, and AI accelerators. Sample profile for this college project."
    },
    {
      id: "micron",
      name: "Micron",
      country: "United States",
      memoryTypes: "DRAM, HBM, NAND",
      mainProducts: "DDR4, DDR5, LPDDR, HBM",
      description: "A U.S. memory manufacturer serving client, mobile, automotive, and data-center markets. Sample profile for this college project."
    },
    {
      id: "cxmt",
      name: "CXMT",
      country: "China",
      memoryTypes: "DRAM",
      mainProducts: "DDR4, LPDDR, DDR5 (expanding)",
      description: "ChangXin Memory Technologies is a DRAM producer focused on expanding domestic memory capacity. Sample profile for this college project."
    },
    {
      id: "nanya",
      name: "Nanya",
      country: "Taiwan",
      memoryTypes: "DRAM",
      mainProducts: "DDR3, DDR4, DDR5",
      description: "A DRAM specialist serving consumer, industrial, and some server-related memory needs. Sample profile for this college project."
    },
    {
      id: "winbond",
      name: "Winbond",
      country: "Taiwan",
      memoryTypes: "Specialty DRAM, Flash",
      mainProducts: "Low-density DRAM, Code Storage Flash, specialty memory",
      description: "A specialty memory company rather than a high-volume commodity DRAM leader. Sample profile for this college project."
    }
  ];

  var SAMPLE_RAM_TYPES = [
    {
      id: "DDR4",
      name: "DDR4",
      typicalUse: "Existing desktops, laptops, and some servers",
      speed: "Previous-generation bandwidth (sample: lower than DDR5)",
      purpose: "Main system memory for many current and older PCs",
      usage: "Consumer and remaining server installs",
      marketRole: "Still common in upgrades; sample data only"
    },
    {
      id: "DDR5",
      name: "DDR5",
      typicalUse: "Newer PCs and many servers",
      speed: "Higher bandwidth than DDR4 (sample comparison)",
      purpose: "Current mainstream DRAM standard for new systems",
      usage: "Consumer kits and server DIMMs",
      marketRole: "Key product line in the sample 2026 discussion"
    },
    {
      id: "HBM",
      name: "HBM",
      typicalUse: "AI GPUs and accelerators",
      speed: "Very high bandwidth stacked memory (sample)",
      purpose: "Move large data sets next to processors",
      usage: "Mostly data-center / AI, not typical PC DIMMs",
      marketRole: "Competes for advanced packaging and DRAM capacity (sample)"
    }
  ];

  var SAMPLE_TIMELINE = [
    {
      id: "2024",
      year: "2024",
      summary: "Inventory, pricing cycles, and early AI-related demand (placeholder).",
      details: "Sample note: 2024 is used here as a baseline year for later comparison. Replace with sourced events and citations."
    },
    {
      id: "2025",
      year: "2025",
      summary: "Capacity mix, HBM focus, and tighter consumer kits (placeholder).",
      details: "Sample note: 2025 can describe factory allocation shifts toward server and AI memory. Replace with sourced reports."
    },
    {
      id: "2026",
      year: "2026",
      summary: "Current project year: competing demand and supply pressure (placeholder).",
      details: "Sample note: 2026 is the focus year of this college project. Do not treat these sentences as live market facts."
    },
    {
      id: "future",
      year: "Future",
      summary: "Watch capacity, AI demand, and new technology (placeholder).",
      details: "Sample note: Future conditions depend on manufacturing, AI, data centers, consumers, and new memory types. This is not a prediction."
    }
  ];

  var SAMPLE_FLOW_STEPS = [
    {
      id: "ai",
      title: "AI Growth",
      text: "More AI training and inference work increases the need for accelerators and memory. Sample explanation."
    },
    {
      id: "dc",
      title: "More Data Centers",
      text: "Cloud and AI companies expand buildings and racks, which need large amounts of server memory. Sample explanation."
    },
    {
      id: "gpu",
      title: "Higher GPU Demand",
      text: "AI servers use GPUs and similar chips that are typically paired with fast memory. Sample explanation."
    },
    {
      id: "hbm",
      title: "Higher HBM Demand",
      text: "High Bandwidth Memory is used close to many AI accelerators, adding pressure on advanced DRAM supply. Sample explanation."
    },
    {
      id: "supply",
      title: "Memory Supply Pressure",
      text: "Factory output is limited in the short term, so extra AI demand can tighten overall DRAM availability. Sample explanation."
    },
    {
      id: "consumer",
      title: "Consumer RAM Pressure",
      text: "If more output goes to servers and HBM, consumer DDR4/DDR5 kits can become harder to find or more expensive. Sample explanation. Not a forecast."
    }
  ];

  var CRISIS_STATES = [
    { id: "NORMAL", label: "NORMAL", index: 22 },
    { id: "TIGHT SUPPLY", label: "TIGHT SUPPLY", index: 48 },
    { id: "SHORTAGE", label: "SHORTAGE", index: 72 },
    { id: "CRISIS", label: "CRISIS", index: 92 }
  ];

  window.RAM_CRISIS_SAMPLE = {
    priceHistory: {
      labels: ["Q1", "Q2", "Q3", "Q4", "Q1", "Q2"],
      ddr4: [30, 29, 31, 33, 34, 36],
      ddr5: [42, 44, 48, 52, 58, 64]
    },
    supplyDemand: {
      labels: ["2024", "2025", "2026"],
      consumer: [40, 42, 44],
      ai: [18, 28, 38],
      supply: [62, 64, 66]
    },
    memoryTypes: {
      labels: ["DDR4", "DDR5", "HBM"],
      values: [28, 46, 72]
    },
    manufacturersShare: {
      labels: ["Samsung", "SK hynix", "Micron", "Others"],
      values: [32, 28, 22, 18]
    },
    note: "All chart numbers are sample placeholders for Chart.js demos."
  };

  var app = angular.module("ramCrisisApp", []);

  app.controller("MainController", [
    "$scope",
    function ($scope) {
      $scope.searchQuery = "";
      $scope.statusCards = SAMPLE_STATUS_CARDS;
      $scope.priceRows = SAMPLE_PRICE_ROWS;
      $scope.manufacturers = SAMPLE_MANUFACTURERS;
      $scope.ramTypes = SAMPLE_RAM_TYPES;
      $scope.timelineItems = SAMPLE_TIMELINE;
      $scope.flowSteps = SAMPLE_FLOW_STEPS;
      $scope.crisisStates = CRISIS_STATES;
      $scope.selectedRamType = SAMPLE_RAM_TYPES[1];
      $scope.selectedYear = SAMPLE_TIMELINE[2];
      $scope.selectedFlow = SAMPLE_FLOW_STEPS[0];
      $scope.crisisLevel = CRISIS_STATES[1];
      $scope.dataNotice = "Sample / placeholder data only. Replace later with API JSON.";

      $scope.selectRamType = function (type) {
        $scope.selectedRamType = type;
      };

      $scope.selectYear = function (item) {
        $scope.selectedYear = item;
      };

      $scope.selectFlow = function (step) {
        $scope.selectedFlow = step;
      };

      $scope.setCrisisLevel = function (state) {
        $scope.crisisLevel = state;
        if (typeof window.updateCrisisMeter === "function") {
          window.updateCrisisMeter(state);
        }
      };

      $scope.formatMoney = function (value) {
        return "$" + Number(value).toFixed(2);
      };

      $scope.formatChange = function (value) {
        var sign = value > 0 ? "+" : "";
        return sign + Number(value).toFixed(1) + "%";
      };

      $scope.filteredManufacturers = function () {
        var q = ($scope.searchQuery || "").toLowerCase().trim();
        if (!q) {
          return $scope.manufacturers;
        }
        return $scope.manufacturers.filter(function (item) {
          return (
            item.name.toLowerCase().indexOf(q) !== -1 ||
            item.country.toLowerCase().indexOf(q) !== -1 ||
            item.memoryTypes.toLowerCase().indexOf(q) !== -1 ||
            item.mainProducts.toLowerCase().indexOf(q) !== -1
          );
        });
      };

      $scope.filteredRamTypes = function () {
        var q = ($scope.searchQuery || "").toLowerCase().trim();
        if (!q) {
          return $scope.ramTypes;
        }
        return $scope.ramTypes.filter(function (item) {
          return (
            item.name.toLowerCase().indexOf(q) !== -1 ||
            item.typicalUse.toLowerCase().indexOf(q) !== -1 ||
            item.purpose.toLowerCase().indexOf(q) !== -1
          );
        });
      };

      $scope.filteredPriceRows = function () {
        return $scope.priceRows;
      };
    }
  ]);
})();
