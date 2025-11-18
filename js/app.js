class RestaurantDashboard {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 50;
    this.filters = {};
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadData();
  }

  async loadData() {
    await this.updateStats();
    await this.loadPageData(1);
    this.renderCharts();
  }

  async loadPageData(page = 1) {
    const result = await window.dataLoader.getPageData(
      page,
      this.pageSize,
      this.filters
    );
    this.currentPage = page;
    this.renderTable(result.data);
    this.updatePagination(result.pagination);
  }

  async updateStats() {
    const stats = await window.dataLoader.getStatistics(this.filters);
    document.getElementById("total-orders").textContent =
      stats.totalOrders.toLocaleString();
    document.getElementById(
      "total-revenue"
    ).textContent = `¥${stats.totalRevenue.toFixed(2)}`;
  }

  renderTable(data) {
    const tbody = document.getElementById("orders-tbody");
    tbody.innerHTML = data.length
      ? data
          .map(
            (order) => `
      <tr>
        <td>${order.order_id}</td>
        <td>${order.date}</td>
        <td>${order.time}</td>
        <td>${order.item_name}</td>
        <td>${order.item_type}</td>
        <td>¥${order.transaction_amount?.toFixed(2)}</td>
        <td><span class="order-type ${order.order_type}">${
              order.order_type
            }</span></td>
        <td>${order.customer_id}</td>
        <td class="rating">${order.taste_rating || "-"}</td>
        <td class="rating">${order.delivery_speed_rating || "-"}</td>
        <td class="rating">${order.environment_rating || "-"}</td>
        <td class="rating">${order.service_rating || "-"}</td>
      </tr>
    `
          )
          .join("")
      : '<tr><td colspan="12" class="no-data">没有找到匹配的数据</td></tr>';
  }

  updatePagination(pagination) {
    document.getElementById("record-count").textContent =
      pagination.totalCount.toLocaleString();
    document.getElementById(
      "page-info"
    ).textContent = `第 ${pagination.currentPage} 页，共 ${pagination.totalPages} 页`;
    document.getElementById("prev-page").disabled = !pagination.hasPrev;
    document.getElementById("next-page").disabled = !pagination.hasNext;
  }

  async applyFilters() {
    this.filters = {
      orderType: document.getElementById("order-type-filter").value || null,
      itemType: document.getElementById("item-type-filter").value || null,
      searchText: document.getElementById("search-input").value || null,
    };
    await this.loadData();
  }

  setupEventListeners() {
    ["order-type-filter", "item-type-filter"].forEach((id) =>
      document
        .getElementById(id)
        .addEventListener("change", () => this.applyFilters())
    );
    document
      .getElementById("search-input")
      .addEventListener("input", () => this.applyFilters());
    document.getElementById("reset-filters").addEventListener("click", () => {
      document.getElementById("order-type-filter").value = "";
      document.getElementById("item-type-filter").value = "";
      document.getElementById("search-input").value = "";
      this.applyFilters();
    });

    document
      .getElementById("prev-page")
      .addEventListener(
        "click",
        () => this.currentPage > 1 && this.loadPageData(this.currentPage - 1)
      );
    document
      .getElementById("next-page")
      .addEventListener("click", () => this.loadPageData(this.currentPage + 1));
    document.getElementById("refresh-btn").addEventListener("click", () => {
      window.dataLoader.allData = null;
      this.loadData();
    });
  }

  async renderCharts() {
    const result = await window.dataLoader.getPageData(1, 1000, this.filters);
    this.renderSalesChart(result.data);
    this.renderRatingChart(result.data);
  }

  renderSalesChart(data) {
    const ctx = document.getElementById("salesChart").getContext("2d");
    const salesByType = data.reduce((acc, order) => {
      acc[order.item_type] =
        (acc[order.item_type] || 0) + order.transaction_amount;
      return acc;
    }, {});

    if (this.salesChart) this.salesChart.destroy();
    this.salesChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(salesByType),
        datasets: [
          {
            data: Object.values(salesByType),
            backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { title: { display: true, text: "销售额分布" } },
      },
    });
  }

  renderRatingChart(data) {
    const ctx = document.getElementById("ratingChart").getContext("2d");
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    data.forEach((order) => {
      [
        order.taste_rating,
        order.delivery_speed_rating,
        order.environment_rating,
        order.service_rating,
      ].forEach((rating) => rating && ratingCounts[rating]++);
    });

    if (this.ratingChart) this.ratingChart.destroy();
    this.ratingChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["1星", "2星", "3星", "4星", "5星"],
        datasets: [
          {
            label: "评分数量",
            data: Object.values(ratingCounts),
            backgroundColor: "#4BC0C0",
          },
        ],
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true } },
        plugins: { title: { display: true, text: "评分分布" } },
      },
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.dashboard = new RestaurantDashboard();
});
