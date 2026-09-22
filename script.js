(function () {
  "use strict";

  var DARK = "#544349";
  var LIGHT = "#F3E7D9";
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var SAMPLE_CALCULATOR_CATALOG = {
    DDR4: {
      8: { previous: 28.5, current: 32.0 },
      16: { previous: 48.0, current: 56.0 },
      32: { previous: 82.0, current: 94.0 }
    },
    DDR5: {
      8: { previous: 36.0, current: 44.0 },
      16: { previous: 62.0, current: 78.0 },
      32: { previous: 118.0, current: 148.0 }
    }
  };

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function initNavigation() {
    var header = document.getElementById("site-header");
    var nav = document.getElementById("main-nav");
    var toggle = document.getElementById("nav-toggle");
    var links = document.querySelectorAll(".nav-list a");
    var sections = [];

    links.forEach(function (link) {
      var id = link.getAttribute("href");
      if (id && id.charAt(0) === "#") {
        var section = document.querySelector(id);
        if (section) {
          sections.push({ link: link, section: section });
        }
      }
    });

    if (toggle && header && nav) {
      toggle.addEventListener("click", function () {
        var open = header.classList.toggle("nav-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    links.forEach(function (link) {
      link.addEventListener("click", function (event) {
        var href = link.getAttribute("href");
        if (!href || href.charAt(0) !== "#") {
          return;
        }
        var target = document.querySelector(href);
        if (!target) {
          return;
        }
        event.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        if (header) {
          header.classList.remove("nav-open");
        }
        if (toggle) {
          toggle.setAttribute("aria-expanded", "false");
        }
      });
    });

    function updateActive() {
      var fromTop = window.scrollY + 120;
      var current = sections[0];
      sections.forEach(function (item) {
        if (item.section.offsetTop <= fromTop) {
          current = item;
        }
      });
      links.forEach(function (link) {
        link.classList.remove("is-active");
      });
      if (current) {
        current.link.classList.add("is-active");
      }
      if (header) {
        header.classList.toggle("is-sticky-shadow", window.scrollY > 12);
      }
    }

    window.addEventListener("scroll", updateActive, { passive: true });
    updateActive();
  }

  function initReveal() {
    var nodes = document.querySelectorAll(
      "section, .info-card, .manufacturer-card, .chart-placeholder, .timeline-list li, .flow-step"
    );
    if (!("IntersectionObserver" in window) || reducedMotion) {
      nodes.forEach(function (node) {
        node.classList.add("is-visible");
      });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    nodes.forEach(function (node) {
      node.classList.add("js-reveal");
      observer.observe(node);
    });
  }

  function animateCount(el, target) {
    var end = Number(target);
    if (!isFinite(end)) {
      return;
    }
    if (reducedMotion) {
      el.textContent = String(Math.round(end));
      return;
    }
    var start = 0;
    var duration = 900;
    var started = null;
    function step(stamp) {
      if (!started) {
        started = stamp;
      }
      var progress = Math.min((stamp - started) / duration, 1);
      el.textContent = String(Math.round(start + (end - start) * progress));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    }
    window.requestAnimationFrame(step);
  }

  function initCounters() {
    var counters = document.querySelectorAll("[data-count]");
    if (!("IntersectionObserver" in window)) {
      counters.forEach(function (el) {
        animateCount(el, el.getAttribute("data-count"));
      });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target, entry.target.getAttribute("data-count"));
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) {
      observer.observe(el);
    });
  }

  function meterClass(label) {
    if (label === "NORMAL") {
      return "meter-normal";
    }
    if (label === "SHORTAGE") {
      return "meter-shortage";
    }
    if (label === "CRISIS") {
      return "meter-crisis";
    }
    return "meter-tight";
  }

  window.updateCrisisMeter = function (state) {
    var wrap = document.getElementById("crisis-meter-hero");
    var status = document.getElementById("crisis-indicator-status");
    var fill = document.getElementById("crisis-meter-fill");
    if (!state) {
      return;
    }
    var label = state.label || state.id || "TIGHT SUPPLY";
    var index = typeof state.index === "number" ? state.index : 48;
    if (wrap) {
      wrap.classList.remove("meter-normal", "meter-tight", "meter-shortage", "meter-crisis");
      wrap.classList.add(meterClass(label), "is-animated");
    }
    if (status) {
      status.textContent = "Sample status: " + label + " (index " + index + "). Not live data.";
    }
    if (fill) {
      fill.style.width = Math.max(8, Math.min(index, 100)) + "%";
    }
  };

  function initCrisisMeter() {
    window.updateCrisisMeter({ label: "TIGHT SUPPLY", index: 48 });
  }

  function initCalculator() {
    var typeEl = document.getElementById("calc-type");
    var capEl = document.getElementById("calc-capacity");
    var qtyEl = document.getElementById("calc-qty");
    var form = document.getElementById("ram-calculator");
    var totalEl = document.getElementById("calc-total");
    var unitEl = document.getElementById("calc-unit");
    var changeEl = document.getElementById("calc-change");
    var noteEl = document.getElementById("calc-note");

    if (!typeEl || !capEl || !qtyEl || !form) {
      return;
    }

    function fillCapacities() {
      var type = typeEl.value;
      var options = SAMPLE_CALCULATOR_CATALOG[type] || {};
      var current = capEl.value;
      capEl.innerHTML = "";
      Object.keys(options).forEach(function (size) {
        var option = document.createElement("option");
        option.value = size;
        option.textContent = size + "GB";
        capEl.appendChild(option);
      });
      if (options[current]) {
        capEl.value = current;
      }
    }

    function calculate() {
      var type = typeEl.value;
      var capacity = capEl.value;
      var qty = Math.max(1, parseInt(qtyEl.value, 10) || 1);
      qtyEl.value = String(qty);
      var row = SAMPLE_CALCULATOR_CATALOG[type] && SAMPLE_CALCULATOR_CATALOG[type][capacity];
      if (!row) {
        return;
      }
      var unit = row.current;
      var total = unit * qty;
      var change = ((row.current - row.previous) / row.previous) * 100;
      if (totalEl) {
        totalEl.textContent = "$" + total.toFixed(2);
      }
      if (unitEl) {
        unitEl.textContent = "$" + unit.toFixed(2);
      }
      if (changeEl) {
        changeEl.textContent = (change >= 0 ? "+" : "") + change.toFixed(1) + "%";
      }
      if (noteEl) {
        noteEl.textContent =
          "Sample estimate for " + qty + " × " + type + " " + capacity + "GB. Replace catalog with API data later.";
      }
    }

    typeEl.addEventListener("change", function () {
      fillCapacities();
      calculate();
    });
    capEl.addEventListener("change", calculate);
    qtyEl.addEventListener("input", calculate);
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      calculate();
    });

    fillCapacities();
    calculate();
  }

  function chartColors() {
    return {
      dark: DARK,
      light: LIGHT,
      grid: "rgba(84, 67, 73, 0.12)",
      fillA: "rgba(84, 67, 73, 0.22)",
      fillB: "rgba(84, 67, 73, 0.10)"
    };
  }

  function baseOptions() {
    var colors = chartColors();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: DARK, font: { family: "Manrope, sans-serif" } }
        },
        tooltip: {
          callbacks: {
            footer: function () {
              return "Sample data only";
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: DARK },
          grid: { color: colors.grid }
        },
        y: {
          ticks: { color: DARK },
          grid: { color: colors.grid }
        }
      }
    };
  }

  function initCharts() {
    if (typeof window.Chart === "undefined") {
      return;
    }
    var sample = window.RAM_CRISIS_SAMPLE || {};
    var history = sample.priceHistory || {};
    var supply = sample.supplyDemand || {};
    var types = sample.memoryTypes || {};
    var makers = sample.manufacturersShare || {};
    var colors = chartColors();
    var charts = [];

    function make(id, config) {
      var canvas = document.getElementById(id);
      if (!canvas) {
        return;
      }
      charts.push(new window.Chart(canvas, config));
    }

    make("priceChartCanvas", {
      type: "line",
      data: {
        labels: history.labels || [],
        datasets: [
          {
            label: "DDR4 (sample)",
            data: history.ddr4 || [],
            borderColor: DARK,
            backgroundColor: colors.fillA,
            tension: 0.35,
            fill: true
          },
          {
            label: "DDR5 (sample)",
            data: history.ddr5 || [],
            borderColor: "rgba(84, 67, 73, 0.55)",
            backgroundColor: colors.fillB,
            tension: 0.35,
            fill: true
          }
        ]
      },
      options: baseOptions()
    });

    make("supplyDemandChartCanvas", {
      type: "bar",
      data: {
        labels: supply.labels || [],
        datasets: [
          { label: "Consumer demand (sample)", data: supply.consumer || [], backgroundColor: "rgba(84, 67, 73, 0.35)" },
          { label: "AI / data-center demand (sample)", data: supply.ai || [], backgroundColor: "rgba(84, 67, 73, 0.62)" },
          { label: "Available supply (sample)", data: supply.supply || [], backgroundColor: "rgba(243, 231, 217, 0.95)", borderColor: DARK, borderWidth: 1 }
        ]
      },
      options: baseOptions()
    });

    make("dashboardPriceChart", {
      type: "line",
      data: {
        labels: history.labels || [],
        datasets: [
          { label: "DDR4", data: history.ddr4 || [], borderColor: DARK, tension: 0.3 },
          { label: "DDR5", data: history.ddr5 || [], borderColor: "rgba(84,67,73,0.5)", tension: 0.3 }
        ]
      },
      options: baseOptions()
    });

    make("dashboardSupplyChart", {
      type: "bar",
      data: {
        labels: supply.labels || [],
        datasets: [{ label: "Supply (sample)", data: supply.supply || [], backgroundColor: DARK }]
      },
      options: baseOptions()
    });

    make("dashboardDemandChart", {
      type: "bar",
      data: {
        labels: supply.labels || [],
        datasets: [
          { label: "Consumer", data: supply.consumer || [], backgroundColor: "rgba(84,67,73,0.4)" },
          { label: "AI", data: supply.ai || [], backgroundColor: DARK }
        ]
      },
      options: baseOptions()
    });

    make("memoryTypeChartCanvas", {
      type: "bar",
      data: {
        labels: types.labels || ["DDR4", "DDR5", "HBM"],
        datasets: [
          {
            label: "Sample tightness index",
            data: types.values || [28, 46, 72],
            backgroundColor: [colors.fillA, "rgba(84,67,73,0.5)", DARK]
          }
        ]
      },
      options: baseOptions()
    });

    make("dashboardManufacturerChart", {
      type: "doughnut",
      data: {
        labels: makers.labels || [],
        datasets: [
          {
            data: makers.values || [],
            backgroundColor: [
              DARK,
              "rgba(84,67,73,0.7)",
              "rgba(84,67,73,0.45)",
              LIGHT
            ],
            borderColor: LIGHT
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: DARK } },
          tooltip: {
            callbacks: {
              footer: function () {
                return "Sample illustration only";
              }
            }
          }
        }
      }
    });

    make("dashboardCrisisMeter", {
      type: "doughnut",
      data: {
        labels: ["Sample index", "Remaining"],
        datasets: [
          {
            data: [48, 52],
            backgroundColor: [DARK, "rgba(243,231,217,0.65)"],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "72%",
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              footer: function () {
                return "Sample crisis index";
              }
            }
          }
        }
      }
    });
  }

  function initCardMotion() {
    var cards = document.querySelectorAll(".info-card, .manufacturer-card, .flow-step");
    cards.forEach(function (card) {
      card.addEventListener("pointerenter", function () {
        card.classList.add("is-hover");
      });
      card.addEventListener("pointerleave", function () {
        card.classList.remove("is-hover");
      });
    });
  }

  function afterAngularRender(fn) {
    function run() {
      if (window.angular) {
        try {
          var injector = window.angular.element(document.body).injector();
          if (injector) {
            injector.invoke([
              "$timeout",
              function ($timeout) {
                $timeout(fn, 0);
              }
            ]);
            return;
          }
        } catch (err) {
        }
        window.setTimeout(fn, 120);
        return;
      }
      fn();
    }
    window.setTimeout(run, 0);
  }

  ready(function () {
    initNavigation();
    initCrisisMeter();
    initCalculator();
    afterAngularRender(function () {
      initReveal();
      initCounters();
      initCardMotion();
      initCharts();
    });
  });
})();
