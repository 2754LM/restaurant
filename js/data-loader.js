// 大数据分页加载器
class DataLoader {
  constructor() {
    this.allData = null;
    this.currentPage = 1;
    this.pageSize = 50; // 每页50条
    this.isLoading = false;
  }

  // 模拟大数据集 - 实际中应该从服务器API获取
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
    ];
    const types = ["主食", "小吃", "汤类"];
    const orderTypes = ["外卖", "堂食"];

    for (let i = dataset.length + 1; i <= totalCount; i++) {
      const randomItem = items[Math.floor(Math.random() * items.length)];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomOrderType =
        orderTypes[Math.floor(Math.random() * orderTypes.length)];

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
        taste_rating: Math.floor(Math.random() * 5) + 1,
        delivery_speed_rating:
          randomOrderType === "外卖" ? Math.floor(Math.random() * 5) + 1 : null,
        environment_rating:
          randomOrderType === "堂食" ? Math.floor(Math.random() * 5) + 1 : null,
        service_rating: Math.floor(Math.random() * 5) + 1,
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

  // 获取加密的基础数据
  static getBaseEncryptedData() {
    const base64Data = `...`; // 之前的加密数据

    const cleanData = base64Data.replace(/\s+/g, "");
    return cleanData
      .split("")
      .map((char) => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) {
          return String.fromCharCode(((code - 65 + 13) % 26) + 65);
        } else if (code >= 97 && code <= 122) {
          return String.fromCharCode(((code - 97 + 13) % 26) + 97);
        } else if (code >= 48 && code <= 57) {
          return String.fromCharCode(((code - 48 + 5) % 10) + 48);
        }
        return char;
      })
      .join("");
  }

  static decodeBaseData() {
    try {
      const encryptedData = this.getBaseEncryptedData();
      const decodedData = atob(encryptedData);

      const lines = decodedData.split("\n");
      const headers = lines[0].split(",");

      const baseOrders = lines
        .slice(1)
        .map((line) => {
          if (!line.trim()) return null;

          const values = line.split(",");
          const order = {};

          headers.forEach((header, index) => {
            let value = values[index] ? values[index].trim() : "";

            if (
              [
                "transaction_amount",
                "taste_rating",
                "delivery_speed_rating",
                "environment_rating",
                "service_rating",
              ].includes(header)
            ) {
              value = value ? parseFloat(value) : null;
            } else if (header === "order_id") {
              value = parseInt(value);
            }
            order[header] = value;
          });

          return order;
        })
        .filter((order) => order !== null);

      return baseOrders;
    } catch (error) {
      console.error("数据解码失败:", error);
      return [];
    }
  }

  // 初始化大数据
  async initializeLargeData() {
    if (this.allData) return this.allData;

    return new Promise((resolve) => {
      setTimeout(() => {
        const baseData = DataLoader.decodeBaseData();
        this.allData = DataLoader.generateLargeDataset(baseData, 100000);
        console.log(`初始化完成，共 ${this.allData.length} 条数据`);
        resolve(this.allData);
      }, 1500);
    });
  }

  // 分页获取数据
  async getPageData(page = 1, pageSize = 50, filters = {}) {
    if (this.isLoading) return [];

    this.isLoading = true;

    return new Promise(async (resolve) => {
      // 模拟网络延迟
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
      }, Math.random() * 500 + 200); // 200-700ms延迟
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

  // 获取统计数据（不加载全部数据）
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

    const allRatings = filteredData
      .flatMap((order) => [
        order.taste_rating,
        order.delivery_speed_rating,
        order.environment_rating,
        order.service_rating,
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

    // 热门菜品（抽样计算）
    const sampleSize = Math.min(filteredData.length, 10000);
    const sampleData = filteredData.slice(0, sampleSize);
    const popularItems = this.calculatePopularItems(sampleData);

    return {
      totalOrders,
      totalRevenue,
      avgRating,
      deliveryRatio,
      popularItems,
    };
  }

  calculatePopularItems(data, limit = 5) {
    const itemCounts = {};
    data.forEach((order) => {
      itemCounts[order.item_name] = (itemCounts[order.item_name] || 0) + 1;
    });

    return Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([item, count]) => ({ item, count }));
  }
}

// 创建全局实例
window.dataLoader = new DataLoader();
