// 修改后的数据加载器 - 使用AES加密从CSV文件读取数据
class DataLoader {
  constructor() {
    this.allData = null;
    this.currentPage = 1;
    this.pageSize = 50;
    this.isLoading = false;
    this.encryptionKey = "restaurant_data_key_2024"; // 加密密钥
  }

  // 简单的AES加密函数
  static async encryptData(data, key) {
    try {
      // 使用CryptoJS进行AES加密
      if (typeof CryptoJS === "undefined") {
        console.warn("CryptoJS未加载，使用Base64编码替代");
        return btoa(unescape(encodeURIComponent(data)));
      }

      const encrypted = CryptoJS.AES.encrypt(data, key).toString();
      return encrypted;
    } catch (error) {
      console.warn("AES加密失败，使用Base64编码:", error);
      return btoa(unescape(encodeURIComponent(data)));
    }
  }

  // 解密函数
  static async decryptData(encryptedData, key) {
    try {
      if (typeof CryptoJS === "undefined") {
        console.warn("CryptoJS未加载，使用Base64解码");
        return decodeURIComponent(escape(atob(encryptedData)));
      }

      const decrypted = CryptoJS.AES.decrypt(encryptedData, key).toString(
        CryptoJS.enc.Utf8
      );
      return decrypted;
    } catch (error) {
      console.warn("AES解密失败，使用Base64解码:", error);
      return decodeURIComponent(escape(atob(encryptedData)));
    }
  }

  // 从CSV文件获取并加密数据
  static async getEncryptedDataFromCSV() {
    try {
      // 模拟从CSV文件读取数据
      const response = await fetch("data/orders.csv");
      if (!response.ok) {
        throw new Error("无法加载CSV文件");
      }

      const csvData = await response.text();

      // 使用AES加密数据
      const encryptedData = await this.encryptData(
        csvData,
        "restaurant_data_key_2024"
      );
      return encryptedData;
    } catch (error) {
      console.error("从CSV文件加载数据失败:", error);
      // 备用数据
      const backupData = `order_id,date,time,item_name,item_type,transaction_amount,order_type,customer_id,taste_rating,delivery_speed_rating,environment_rating,service_rating
1,03-13-2022,21:04,干煸豆角,主食,35.0,外卖,CUST_19833,5,5,,
2,02/20/2023,16:40,鱼香肉丝,主食,38.0,外卖,CUST_13042,5,5,,
3,05/18/2021,09:56,鱼头豆腐汤,汤类,26.0,堂食,CUST_08341,5,,5,5
4,08/25/2023,19:36,饺子,小吃,12.0,外卖,CUST_19236,5,3,,`;

      return await this.encryptData(backupData, "restaurant_data_key_2024");
    }
  }

  // 解码数据
  static async decodeData() {
    try {
      const encryptedData = await this.getEncryptedDataFromCSV();

      // 解密数据
      const decryptedData = await this.decryptData(
        encryptedData,
        "restaurant_data_key_2024"
      );

      // 解析CSV
      const lines = decryptedData.split("\n");
      const headers = lines[0].split(",");

      const orders = lines
        .slice(1)
        .map((line) => {
          if (!line.trim()) return null;

          const values = this.parseCSVLine(line);
          const order = {};

          headers.forEach((header, index) => {
            let value = values[index] ? values[index].trim() : "";

            // 处理数值类型
            if (["transaction_amount"].includes(header)) {
              value = value ? parseFloat(value) : null;
            } else if (header === "order_id") {
              value = parseInt(value);
            } else if (header.includes("rating")) {
              // 评分字段：空字符串保持为空，数字转换为数字
              value =
                value === "" ? null : isNaN(value) ? value : parseInt(value);
            }
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

  // 解析CSV行，处理逗号在引号内的情况
  static parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
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

    for (let i = dataset.length + 1; i <= totalCount; i++) {
      const randomItem = items[Math.floor(Math.random() * items.length)];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const randomOrderType =
        orderTypes[Math.floor(Math.random() * orderTypes.length)];

      // 根据订单类型设置评分
      const tasteRating = Math.floor(Math.random() * 5) + 1;
      let deliveryRating = null;
      let environmentRating = null;
      let serviceRating = Math.floor(Math.random() * 5) + 1;

      if (randomOrderType === "外卖") {
        deliveryRating = Math.floor(Math.random() * 5) + 1;
      } else {
        environmentRating = Math.floor(Math.random() * 5) + 1;
      }

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
        delivery_speed_rating: deliveryRating,
        environment_rating: environmentRating,
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
    const formats = ["MM-DD-YYYY", "MM/DD/YYYY"];
    const format = formats[Math.floor(Math.random() * formats.length)];

    if (format === "MM-DD-YYYY") {
      return `${(date.getMonth() + 1).toString().padStart(2, "0")}-${date
        .getDate()
        .toString()
        .padStart(2, "0")}-${date.getFullYear()}`;
    } else {
      return `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date
        .getDate()
        .toString()
        .padStart(2, "0")}/${date.getFullYear()}`;
    }
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

    return new Promise(async (resolve) => {
      setTimeout(async () => {
        const baseData = await DataLoader.decodeData();
        this.allData = DataLoader.generateLargeDataset(baseData, 100000);
        console.log(`初始化完成，共 ${this.allData.length} 条数据`);
        resolve(this.allData);
      }, 1000);
    });
  }

  // 分页获取数据
  async getPageData(page = 1, pageSize = 50, filters = {}) {
    if (this.isLoading) return { data: [], pagination: {} };

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
      }, 200);
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

    // 计算平均评分
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

    return {
      totalOrders,
      totalRevenue,
      avgRating,
      deliveryRatio,
    };
  }
}

// 创建全局实例
window.dataLoader = new DataLoader();
