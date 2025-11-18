class RestaurantDashboard {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 50;
    this.filters = {};
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadInitialData();
  }

  async loadInitialData() {
    await this.updateStats();
    await this.loadPageData(1);
    setTimeout(() => this.renderCharts(), 1000);
  }

  async loadPageData(page = 1) {
    try {
      const result = await window.dataLoader.getPageData(
        page,
        this.pageSize,
        this.filters
      );
      this.currentPage = page;
      this.renderTable(result.data);
      this.updatePagination(result.pagination);
      this.updateStats();
    } catch (error) {
      console.error("加载数据失败:", error);
    }
  }

  async updateStats() {
    try {
      const stats = await window.dataLoader.getStatistics(this.filters);
      document.getElementById("total-orders").textContent =
        stats.totalOrders.toLocaleString();
      document.getElementById(
        "total-revenue"
      ).textContent = `¥${stats.totalRevenue.toFixed(2)}`;
      document.getElementById("avg-rating").textContent = stats.avgRating;
      document.getElementById(
        "delivery-ratio"
      ).textContent = `${stats.deliveryRatio}%`;
    } catch (error) {
      console.error("更新统计信息失败:", error);
    }
  }

  renderTable(data) {
    const tbody = document.getElementById("orders-tbody");

    if (data.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="12" class="no-data">没有找到匹配的数据</td></tr>';
      return;
    }

    tbody.innerHTML = data
      .map(
        (order) => `
      <tr>
        <td>${order.order_id}</td>
        <td>${order.date}</td>
        <td>${order.time}</td>
        <td>${order.item_name}</td>
        <td>${order.item_type}</td>
        <td>¥${order.transaction_amount.toFixed(2)}</td>
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
      .join("");
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
    this.currentPage = 1;
    await this.loadPageData(1);
    await this.updateStats();
    setTimeout(() => this.renderCharts(), 500);
  }

  async resetFilters() {
    document.getElementById("order-type-filter").value = "";
    document.getElementById("item-type-filter").value = "";
    document.getElementById("search-input").value = "";
    await this.applyFilters();
  }

  setupEventListeners() {
    document
      .getElementById("order-type-filter")
      .addEventListener("change", () => this.applyFilters());
    document
      .getElementById("item-type-filter")
      .addEventListener("change", () => this.applyFilters());
    document
      .getElementById("search-input")
      .addEventListener("input", () => this.applyFilters());
    document
      .getElementById("reset-filters")
      .addEventListener("click", () => this.resetFilters());

    document.getElementById("prev-page").addEventListener("click", () => {
      if (this.currentPage > 1) this.loadPageData(this.currentPage - 1);
    });

    document.getElementById("next-page").addEventListener("click", () => {
      this.loadPageData(this.currentPage + 1);
    });

    document.getElementById("refresh-btn").addEventListener("click", () => {
      window.dataLoader.allData = null;
      this.loadInitialData();
    });
  }

  async renderCharts() {
    try {
      const sampleData = await this.getChartSampleData();
      this.renderSalesChart(sampleData);
      this.renderRatingChart(sampleData);
    } catch (error) {
      console.error("渲染图表失败:", error);
    }
  }

  async getChartSampleData() {
    const result = await window.dataLoader.getPageData(1, 1000, this.filters);
    return result.data;
  }

  renderSalesChart(data) {
    const ctx = document.getElementById("salesChart").getContext("2d");

    const salesByType = {};
    data.forEach((order) => {
      salesByType[order.item_type] =
        (salesByType[order.item_type] || 0) + order.transaction_amount;
    });

    if (this.salesChart) this.salesChart.destroy();

    this.salesChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(salesByType),
        datasets: [
          {
            data: Object.values(salesByType),
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "bottom" },
          title: { display: true, text: "各类型菜品销售额分布" },
        },
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
      ].forEach((rating) => {
        if (rating !== null) ratingCounts[rating]++;
      });
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
            borderColor: "#36A2EB",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, title: { display: true, text: "评分数量" } },
        },
        plugins: {
          title: { display: true, text: "客户评分分布" },
        },
      },
    });
  }
}

// 基础样式
const style = document.createElement("style");
style.textContent = `
  .order-type {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: bold;
  }
  .order-type.外卖 { background-color: #e3f2fd; color: #1976d2; }
  .order-type.堂食 { background-color: #e8f5e8; color: #2e7d32; }
  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background-color: #f8f9fa;
    border-bottom: 1px solid #dee2e6;
  }
  .table-actions { display: flex; align-items: center; gap: 10px; }
  .table-actions button {
    padding: 6px 12px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
    cursor: pointer;
  }
  .table-actions button:disabled { opacity: 0.5; cursor: not-allowed; }
  .loading, .no-data {
    text-align: center;
    padding: 40px;
    color: #666;
    font-style: italic;
  }
  .rating { font-weight: bold; color: #ffc107; }
  .filters {
    background: white;
    padding: 15px;
    border-radius: 10px;
    margin-bottom: 20px;
    display: flex;
    gap: 15px;
    align-items: center;
    flex-wrap: wrap;
  }
  .filters select, .filters input {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 14px;
    min-width: 150px;
  }
  #search-input { flex: 1; max-width: 300px; }
  #reset-filters {
    padding: 8px 16px;
    background: #6c757d;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
  }
  .data-table th, .data-table td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  .data-table th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #555;
    position: sticky;
    top: 0;
  }
  .data-table tr:hover { background-color: #f8f9fa; }
`;
document.head.appendChild(style);

// 初始化应用
document.addEventListener("DOMContentLoaded", () => {
  window.dashboard = new RestaurantDashboard();
});
