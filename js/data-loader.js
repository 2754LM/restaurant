class DataLoader {
  constructor() {
    this.allData = null;
  }

  async loadData() {
    if (this.allData) return this.allData;

    try {
      const response = await fetch("data/obfuscated");
      const encodedData = await response.text();

      // 修复：使用正确的Base64解码
      const decodedData = CryptoJS.enc.Base64.parse(encodedData).toString(
        CryptoJS.enc.Utf8
      );
      this.allData = JSON.parse(decodedData);

      console.log("数据加载成功:", this.allData.length, "条记录");
      return this.allData;
    } catch (error) {
      console.error("加载数据失败:", error);
      return this.getDefaultData();
    }
  }

  async getPageData(page = 1, pageSize = 50, filters = {}) {
    const data = await this.loadData();
    let filteredData = this.applyFilters(data, filters);

    const totalCount = filteredData.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const pageData = filteredData.slice(startIndex, startIndex + pageSize);

    return {
      data: pageData,
      pagination: {
        currentPage: page,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  applyFilters(data, filters) {
    return data.filter(
      (order) =>
        (!filters.orderType || order.order_type === filters.orderType) &&
        (!filters.itemType || order.item_type === filters.itemType) &&
        (!filters.searchText ||
          order.item_name
            ?.toLowerCase()
            .includes(filters.searchText.toLowerCase()) ||
          order.customer_id
            ?.toLowerCase()
            .includes(filters.searchText.toLowerCase()))
    );
  }

  async getStatistics(filters = {}) {
    const data = await this.loadData();
    const filteredData = this.applyFilters(data, filters);

    const totalOrders = filteredData.length;
    const totalRevenue = filteredData.reduce(
      (sum, order) => sum + (order.transaction_amount || 0),
      0
    );

    const allRatings = filteredData
      .flatMap((order) => [
        order.taste_rating,
        order.delivery_speed_rating,
        order.environment_rating,
        order.service_rating,
      ])
      .filter((rating) => rating);

    return {
      totalOrders,
      totalRevenue,
      avgRating: allRatings.length
        ? (allRatings.reduce((a, b) => a + b) / allRatings.length).toFixed(1)
        : 0,
    };
  }

  getDefaultData() {
    return [
      {
        order_id: 1,
        date: "03-13-2022",
        time: "21:04",
        item_name: "干煸豆角",
        item_type: "主食",
        transaction_amount: 35.0,
        order_type: "外卖",
        customer_id: "CUST_19833",
        taste_rating: 5,
        delivery_speed_rating: 5,
      },
    ];
  }
}

window.dataLoader = new DataLoader();
