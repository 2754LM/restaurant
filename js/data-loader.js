// 简化的数据加载器 - 使用Base64编码
class DataLoader {
  constructor() {
    this.allData = null;
    this.currentPage = 1;
    this.pageSize = 50;
    this.isLoading = false;
  }

  // 获取Base64编码的数据
  static getEncryptedData() {
    // 原始CSV数据（包含特殊符号评分）
    const csvData = `order_id,date,time,item_name,item_type,transaction_amount,order_type,customer_id,taste_rating,delivery_speed_rating,environment_rating,service_rating
1,03-13-2022,21:04,干煸豆角,主食,35.0,外卖,CUST_19833,⭐⭐⭐⭐⭐,⭐⭐⭐⭐⭐,,
2,02/20/2023,16:40,鱼香肉丝,主食,38.0,外卖,CUST_13042,⭐⭐⭐⭐⭐,⭐⭐⭐⭐⭐,,
3,05/18/2021,09:56,鱼头豆腐汤,汤类,26.0,堂食,CUST_08341,⭐⭐⭐⭐⭐,,⭐⭐⭐⭐⭐,⭐⭐⭐⭐⭐
4,08/25/2023,19:36,饺子,小吃,12.0,外卖,CUST_19236,⭐⭐⭐⭐⭐,⭐⭐⭐,,
5,09/24/2023,23:47,饺子,小吃,12.0,堂食,CUST_04798,⭐⭐⭐⭐⭐,,⭐⭐⭐⭐,⭐⭐⭐⭐⭐
6,10/15/2023,12:30,宫保鸡丁,主食,42.0,外卖,CUST_15678,⭐⭐⭐⭐,⭐⭐⭐⭐,,
7,11/20/2023,18:15,麻婆豆腐,主食,28.0,堂食,CUST_09345,⭐⭐⭐⭐⭐,,⭐⭐⭐⭐⭐,⭐⭐⭐⭐
8,12/05/2023,20:45,酸辣汤,汤类,18.0,外卖,CUST_16789,⭐⭐⭐⭐,⭐⭐⭐,,
9,01/10/2024,14:20,回锅肉,主食,45.0,外卖,CUST_23456,⭐⭐⭐⭐⭐,⭐⭐⭐⭐,,
10,02/15/2024,19:30,水煮鱼,主食,58.0,堂食,CUST_34567,⭐⭐⭐⭐,,⭐⭐⭐⭐⭐,⭐⭐⭐⭐⭐`;

    // 使用Base64编码
    return btoa(unescape(encodeURIComponent(csvData)));
  }

  // 解码数据
  static decodeData() {
    try {
      const encryptedData = this.getEncryptedData();
      // Base64解码
      const decodedData = decodeURIComponent(escape(atob(encryptedData)));

      // 解析CSV
      const lines = decodedData.split("\n");
      const headers = lines[0].split(",");

      const orders = lines
        .slice(1)
        .map((line) => {
          if (!line.trim()) return null;

          const values = line.split(",");
          const order = {};

          headers.forEach((header, index) => {
            let value = values[index] ? values[index].trim() : "";

            // 处理数值类型
            if (["transaction_amount"].includes(header)) {
              value = value ? parseFloat(value) : null;
            } else if (header === "order_id") {
              value = parseInt(value);
            }
            // 评分字段保持字符串形式（包含特殊符号）
            order[header] = value;
          });

          return order;
        })
        .filter((order) => order !== null);

      return orders;
    } catch (error) {
      console.error("数据解码失败:", error);
      return [];
    }
  }

  // 生成大数据集
  static generateLargeDataset(baseData, totalCount = 100000) {
    const dataset = [...baseData];
    const items = [
      "宫保鸡丁",
      "麻婆豆腐",
      "回锅肉",
      "水煮鱼",
      "糖醋里脊",
      "鱼香肉丝",
      "干煸豆角",
      "酸菜鱼",
      "红烧肉",
      "清炒时蔬",
    ];
    const types = ["主食", "小吃", "汤类"];
    const orderTypes = ["外卖", "堂食"];
    const ratings = ["", "⭐", "⭐⭐", "⭐⭐⭐", "⭐⭐⭐⭐", "⭐⭐⭐⭐⭐"];

    for (let i = dataset.length + 1; i <= totalCount; i++) {
      const randomItem = items[Math.floor(Math.random() * items.length)];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomOrderType =
        orderTypes[Math.floor(Math.random() * orderTypes.length)];
      const tasteRating = ratings[Math.floor(Math.random() * ratings.length)];
      const serviceRating = ratings[Math.floor(Math.random() * ratings.length)];

      dataset.push({
        order_id: i,
        date: this.randomDate(),
        time: this.randomTime(),
        item_name: randomItem,
        item_type: randomType,
        transaction_amount: Math.floor(Math.random() * 50) + 10,
        order_type: randomOrderType,
        customer_id: `CUST_${Math.floor(Math.random() * 50000)
          .toString()
          .padStart(5, "0")}`,
        taste_rating: tasteRating,
        delivery_speed_rating:
          randomOrderType === "外卖"
            ? ratings[Math.floor(Math.random() * ratings.length)]
            : "",
        environment_rating:
          randomOrderType === "堂食"
            ? ratings[Math.floor(Math.random() * ratings.length)]
            : "",
        service_rating: serviceRating,
      });
    }

    return dataset;
  }

  static randomDate() {
    const start = new Date(2020, 0, 1);
    const end = new Date();
    const date = new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime())
    );
    return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date
      .getDate()
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  }

  static randomTime() {
    const hours = Math.floor(Math.random() * 24)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor(Math.random() * 60)
      .toString()
      .padStart(2, "0");
    return `${hours}:${minutes}`;
  }

  // 初始化大数据
  async initializeLargeData() {
    if (this.allData) return this.allData;

    return new Promise((resolve) => {
      setTimeout(() => {
        const baseData = DataLoader.decodeData();
        this.allData = DataLoader.generateLargeDataset(baseData, 100000);
        console.log(`初始化完成，共 ${this.allData.length} 条数据`);
        resolve(this.allData);
      }, 1000);
    });
  }

  // 分页获取数据
  async getPageData(page = 1, pageSize = 50, filters = {}) {
    if (this.isLoading) return [];

    this.isLoading = true;

    return new Promise(async (resolve) => {
      setTimeout(async () => {
        if (!this.allData) {
          await this.initializeLargeData();
        }

        let filteredData = this.applyFilters(this.allData, filters);
        const totalCount = filteredData.length;
        const totalPages = Math.ceil(totalCount / pageSize);

        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageData = filteredData.slice(startIndex, endIndex);

        this.isLoading = false;

        resolve({
          data: pageData,
          pagination: {
            currentPage: page,
            pageSize: pageSize,
            totalCount: totalCount,
            totalPages: totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        });
      }, 200); // 减少延迟
    });
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
          order.item_name.toLowerCase().includes(searchLower) ||
          order.customer_id.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }

  // 获取所有数据（供爬虫使用）
  async getAllData() {
    if (!this.allData) {
      await this.initializeLargeData();
    }
    return this.allData;
  }

  // 获取统计数据
  async getStatistics(filters = {}) {
    if (!this.allData) {
      await this.initializeLargeData();
    }

    const filteredData = this.applyFilters(this.allData, filters);

    const totalOrders = filteredData.length;
    const totalRevenue = filteredData.reduce(
      (sum, order) => sum + order.transaction_amount,
      0
    );

    // 计算平均评分（将星号转换为数字）
    const allRatings = filteredData
      .flatMap((order) => [
        this.ratingToNumber(order.taste_rating),
        this.ratingToNumber(order.delivery_speed_rating),
        this.ratingToNumber(order.environment_rating),
        this.ratingToNumber(order.service_rating),
      ])
      .filter((rating) => rating !== null);

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

  // 将星号评分转换为数字
  ratingToNumber(rating) {
    if (!rating || rating === "") return null;
    return (rating.match(/⭐/g) || []).length;
  }
}

// 创建全局实例
window.dataLoader = new DataLoader();
