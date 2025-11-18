// data-loader.js - 修复版本
class DataLoader {
  constructor() {
    this.allData = null;
    this.pageSize = 50;
  }

  // Base64解码
  deobfuscateData(encodedData) {
    try {
      console.log("开始解码Base64数据...");
      // Base64解码
      const decodedData = atob(encodedData);
      console.log("Base64解码成功，数据长度:", decodedData.length);

      // 解析JSON
      const parsedData = JSON.parse(decodedData);
      console.log("JSON解析成功，记录数:", parsedData.length);

      return parsedData;
    } catch (error) {
      console.error("解码失败:", error);
      console.error("原始数据:", encodedData.substring(0, 200));
      return [];
    }
  }

  // 获取混淆数据并解码
  async loadObfuscatedData() {
    try {
      console.log("正在加载混淆数据...");
      const response = await fetch("data/obfuscated_data.txt");
      if (!response.ok) throw new Error("无法加载混淆数据文件");

      const encodedData = await response.text();
      console.log("获取到混淆数据，长度:", encodedData.length);

      // 解码数据
      this.allData = this.deobfuscateData(encodedData);
      console.log("混淆数据加载成功:", this.allData.length, "条记录");
      return this.allData;
    } catch (error) {
      console.error("加载混淆数据失败:", error);
      // 备用方案：使用原始CSV数据
      return await this.loadBackupData();
    }
  }

  // 备用数据加载
  async loadBackupData() {
    try {
      console.log("回退到CSV数据...");
      const response = await fetch("data/orders.csv");
      if (!response.ok) throw new Error("无法加载CSV文件");

      const csvData = await response.text();
      const data = this.parseCSVData(csvData);
      console.log("CSV备用数据加载成功:", data.length, "条记录");
      return data;
    } catch (error) {
      console.error("加载备用数据失败:", error);
      return this.getDefaultData();
    }
  }

  // 解析CSV数据
  parseCSVData(csvData) {
    const lines = csvData.split("\n");
    const headers = lines[0].split(",");

    return lines
      .slice(1)
      .map((line) => {
        if (!line.trim()) return null;
        const values = line.split(",");
        const order = {};

        headers.forEach((header, i) => {
          let value = values[i] ? values[i].trim() : "";
          if (header === "transaction_amount") {
            value = value ? parseFloat(value) : 0;
          } else if (header === "order_id") {
            value = parseInt(value);
          } else if (header.includes("rating")) {
            value = value === "" ? null : parseInt(value) || null;
          }
          order[header] = value;
        });
        return order;
      })
      .filter((order) => order !== null);
  }

  // 初始化数据
  async initializeData() {
    if (this.allData) {
      console.log("使用缓存数据");
      return this.allData;
    }
    console.log("初始化加载混淆数据...");
    this.allData = await this.loadObfuscatedData();
    return this.allData;
  }

  // 分页获取数据
  async getPageData(page = 1, pageSize = 50, filters = {}) {
    if (!this.allData) await this.initializeData();

    let filteredData = this.applyFilters(this.allData, filters);
    const totalCount = filteredData.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = filteredData.slice(startIndex, endIndex);

    return {
      data: pageData,
      pagination: {
        currentPage: page,
        pageSize: pageSize,
        totalCount: totalCount,
        totalPages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  applyFilters(data, filters) {
    let filtered = [...data];

    if (filters.orderType) {
      filtered = filtered.filter(
        (order) => order.order_type === filters.orderType
      );
    }

    if (filters.itemType) {
      filtered = filtered.filter(
        (order) => order.item_type === filters.itemType
      );
    }

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          (order.item_name &&
            order.item_name.toLowerCase().includes(searchLower)) ||
          (order.customer_id &&
            order.customer_id.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }

  // 获取统计数据
  async getStatistics(filters = {}) {
    if (!this.allData) {
      await this.initializeData();
    }

    const filteredData = this.applyFilters(this.allData, filters);

    const totalOrders = filteredData.length;
    const totalRevenue = filteredData.reduce(
      (sum, order) => sum + (order.transaction_amount || 0),
      0
    );

    // 计算平均评分
    const allRatings = filteredData
      .flatMap((order) => [
        order.taste_rating,
        order.delivery_speed_rating,
        order.environment_rating,
        order.service_rating,
      ])
      .filter(
        (rating) => rating !== null && rating !== undefined && rating !== ""
      );

    const avgRating = allRatings.length
      ? (allRatings.reduce((a, b) => a + b) / allRatings.length).toFixed(1)
      : 0;

    const deliveryOrders = filteredData.filter(
      (order) => order.order_type === "外卖"
    ).length;
    const deliveryRatio = totalOrders
      ? ((deliveryOrders / totalOrders) * 100).toFixed(1)
      : 0;

    return {
      totalOrders,
      totalRevenue,
      avgRating,
      deliveryRatio,
    };
  }

  getDefaultData() {
    // 默认数据
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
        environment_rating: null,
        service_rating: null,
      },
    ];
  }
}

// 创建全局实例
window.dataLoader = new DataLoader();
