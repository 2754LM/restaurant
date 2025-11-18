class RestaurantDashboard {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 50;
    this.filters = {};
    this.isLoading = false;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadInitialData();
  }

  async loadInitialData() {
    // 先加载统计数据
    await this.updateStats();

    // 加载第一页数据
    await this.loadPageData(1);

    // 异步加载图表数据
    setTimeout(() => this.renderCharts(), 1000);
  }

  async loadPageData(page = 1) {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showTableLoading(true);

    try {
      const result = await window.dataLoader.getPageData(
        page,
        this.pageSize,
        this.filters
      );

      this.currentPage = page;
      this.renderTable(result.data);
      this.updatePagination(result.pagination);
      this.updateStats(); // 更新统计信息
    } catch (error) {
      console.error("加载数据失败:", error);
      this.showMessage("数据加载失败", "error");
    } finally {
      this.isLoading = false;
      this.showTableLoading(false);
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
                <td class="rating">${this.formatRating(order.taste_rating)}</td>
                <td class="rating">${this.formatRating(
                  order.delivery_speed_rating
                )}</td>
                <td class="rating">${this.formatRating(
                  order.environment_rating
                )}</td>
                <td class="rating">${this.formatRating(
                  order.service_rating
                )}</td>
            </tr>
        `
      )
      .join("");
  }

  formatRating(rating) {
    if (rating === null || rating === undefined) return "-";
    return "⭐".repeat(rating);
  }

  updatePagination(pagination) {
    const pageInfo = document.getElementById("page-info");
    const prevBtn = document.getElementById("prev-page");
    const nextBtn = document.getElementById("next-page");
    const recordCount = document.getElementById("record-count");

    recordCount.textContent = pagination.totalCount.toLocaleString();
    pageInfo.textContent = `第 ${pagination.currentPage} 页，共 ${pagination.totalPages} 页`;

    prevBtn.disabled = !pagination.hasPrev;
    nextBtn.disabled = !pagination.hasNext;
  }

  showTableLoading(show) {
    const tbody = document.getElementById("orders-tbody");
    if (show) {
      tbody.innerHTML =
        '<tr><td colspan="12" class="loading">加载中...</td></tr>';
    }
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

    // 重新渲染图表
    setTimeout(() => this.renderCharts(), 500);
  }

  async resetFilters() {
    document.getElementById("order-type-filter").value = "";
    document.getElementById("item-type-filter").value = "";
    document.getElementById("search-input").value = "";

    await this.applyFilters();
  }

  setupEventListeners() {
    // 筛选器事件
    document
      .getElementById("order-type-filter")
      .addEventListener("change", () => {
        this.debounce(() => this.applyFilters(), 300);
      });

    document
      .getElementById("item-type-filter")
      .addEventListener("change", () => {
        this.debounce(() => this.applyFilters(), 300);
      });

    document.getElementById("search-input").addEventListener("input", () => {
      this.debounce(() => this.applyFilters(), 500);
    });

    document.getElementById("reset-filters").addEventListener("click", () => {
      this.resetFilters();
    });

    // 分页事件
    document.getElementById("prev-page").addEventListener("click", () => {
      if (this.currentPage > 1) {
        this.loadPageData(this.currentPage - 1);
      }
    });

    document.getElementById("next-page").addEventListener("click", () => {
      this.loadPageData(this.currentPage + 1);
    });

    // 刷新和导出
    document.getElementById("refresh-btn").addEventListener("click", () => {
      this.refreshData();
    });

    document.getElementById("export-btn").addEventListener("click", () => {
      this.exportCurrentPage();
    });

    // 无限滚动
    window.addEventListener("scroll", () => {
      this.handleInfiniteScroll();
    });
  }

  // 无限滚动加载
  handleInfiniteScroll() {
    if (this.isLoading) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // 距离底部100px时加载下一页
    if (scrollTop + windowHeight >= documentHeight - 30) {
      this.loadNextPage();
    }
  }

  async loadNextPage() {
    const result = await window.dataLoader.getPageData(
      this.currentPage + 1,
      this.pageSize,
      this.filters
    );
    if (result.data.length > 0) {
      this.currentPage++;
      this.appendToTable(result.data);
      this.updatePagination(result.pagination);
    }
  }

  appendToTable(data) {
    const tbody = document.getElementById("orders-tbody");
    const newRows = data
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
                <td class="rating">${this.formatRating(order.taste_rating)}</td>
                <td class="rating">${this.formatRating(
                  order.delivery_speed_rating
                )}</td>
                <td class="rating">${this.formatRating(
                  order.environment_rating
                )}</td>
                <td class="rating">${this.formatRating(
                  order.service_rating
                )}</td>
            </tr>
        `
      )
      .join("");

    tbody.innerHTML += newRows;
  }

  debounce(func, wait) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(func, wait);
  }

  async refreshData() {
    // 重新初始化数据
    window.dataLoader.allData = null;
    await this.loadInitialData();
    this.showMessage("数据刷新成功", "success");
  }

  exportCurrentPage() {
    // 导出当前页数据
    window.dataLoader
      .getPageData(this.currentPage, this.pageSize, this.filters)
      .then((result) => {
        const csvContent = this.convertToCSV(result.data);
        this.downloadCSV(csvContent, `餐厅数据_第${this.currentPage}页.csv`);
      });
  }

  convertToCSV(data) {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((order) =>
        headers
          .map((header) => {
            const value = order[header];
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(",")
      ),
    ];

    return csvRows.join("\n");
  }

  downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  async renderCharts() {
    try {
      // 获取抽样数据进行图表展示
      const sampleData = await this.getChartSampleData();
      this.renderSalesChart(sampleData);
      this.renderRatingChart(sampleData);
    } catch (error) {
      console.error("渲染图表失败:", error);
    }
  }

  async getChartSampleData() {
    // 获取前1000条数据用于图表展示（避免性能问题）
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

    // 销毁旧图表
    if (this.salesChart) {
      this.salesChart.destroy();
    }

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
          legend: {
            position: "bottom",
          },
          title: {
            display: true,
            text: "各类型菜品销售额分布",
          },
        },
      },
    });
  }

  renderRatingChart(data) {
    const ctx = document.getElementById("ratingChart").getContext("2d");

    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    data.forEach((order) => {
      const ratings = [
        order.taste_rating,
        order.delivery_speed_rating,
        order.environment_rating,
        order.service_rating,
      ];
      ratings.forEach((rating) => {
        if (rating !== null) {
          ratingCounts[rating]++;
        }
      });
    });

    // 销毁旧图表
    if (this.ratingChart) {
      this.ratingChart.destroy();
    }

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
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "评分数量",
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: "客户评分分布",
          },
        },
      },
    });
  }

  showMessage(message, type) {
    // 移除现有消息
    const existingMessage = document.querySelector(".message");
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageDiv = document.createElement("div");
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

    if (type === "success") {
      messageDiv.style.backgroundColor = "#28a745";
    } else {
      messageDiv.style.backgroundColor = "#dc3545";
    }

    document.body.appendChild(messageDiv);

    // 3秒后自动消失
    setTimeout(() => {
      messageDiv.style.animation = "slideOut 0.3s ease";
      setTimeout(() => messageDiv.remove(), 300);
    }, 3000);
  }
}

// 添加CSS动画和样式
const style = document.createElement("style");
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .order-type {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
    }
    
    .order-type.外卖 {
        background-color: #e3f2fd;
        color: #1976d2;
    }
    
    .order-type.堂食 {
        background-color: #e8f5e8;
        color: #2e7d32;
    }
    
    .table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        background-color: #f8f9fa;
        border-bottom: 1px solid #dee2e6;
    }
    
    .table-actions {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .table-actions button {
        padding: 6px 12px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .table-actions button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .loading, .no-data {
        text-align: center;
        padding: 40px;
        color: #666;
        font-style: italic;
    }
    
    .rating {
        font-weight: bold;
        color: #ffc107;
    }
    
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
    
    #search-input {
        flex: 1;
        max-width: 300px;
    }
    
    #reset-filters {
        padding: 8px 16px;
        background: #6c757d;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }
    
    #reset-filters:hover {
        background: #5a6268;
    }
    
    .data-table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .data-table th,
    .data-table td {
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
    
    .data-table tr:hover {
        background-color: #f8f9fa;
    }
    
    @media (max-width: 768px) {
        .filters {
            flex-direction: column;
            align-items: stretch;
        }
        
        .table-header {
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
        }
        
        .charts {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(style);

// 初始化应用
document.addEventListener("DOMContentLoaded", () => {
  window.dashboard = new RestaurantDashboard();
});
