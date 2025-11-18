// 简单的数据混淆（不是真正的加密，但可以防止简单的爬取）
class DataProtector {
  static encodeData(data) {
    // 简单的字符偏移混淆
    return data
      .split("")
      .map((char) => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) {
          // A-Z
          return String.fromCharCode(((code - 65 + 13) % 26) + 65);
        } else if (code >= 97 && code <= 122) {
          // a-z
          return String.fromCharCode(((code - 97 + 13) % 26) + 97);
        } else if (code >= 48 && code <= 57) {
          // 0-9
          return String.fromCharCode(((code - 48 + 5) % 10) + 48);
        }
        return char;
      })
      .join("");
  }

  static decodeData(encodedData) {
    // 反向解码
    return encodedData
      .split("")
      .map((char) => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) {
          // A-Z
          return String.fromCharCode(((code - 65 + 13) % 26) + 65);
        } else if (code >= 97 && code <= 122) {
          // a-z
          return String.fromCharCode(((code - 97 + 13) % 26) + 97);
        } else if (code >= 48 && code <= 57) {
          // 0-9
          return String.fromCharCode(((code - 48 + 5) % 10) + 48);
        }
        return char;
      })
      .join("");
  }
}
