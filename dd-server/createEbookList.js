const axios = require('axios');
const sqlite3 = require('sqlite3');
const path = require('path');
const { open } = require('sqlite');
const { createDecipheriv } = require('node:crypto');
const { Buffer } = require('node:buffer');
const { Svg2Pdf } = require('./services/svg2pdf');
const { saveSource } = require('./services/saveSource');

let dbFilePath = path.join(__dirname, './ddinfo.db');
const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const secChUa = "'Google Chrome';v='135', 'Not-A.Brand';v='8', 'Chromium';v='135'";
process.stdout.setEncoding('utf8');

(async () => {
  const CipherKey = "3e4r06tjkpjcevlbslr3d96gdb5ahbmo"
  const AesIv = "6fd89a1b3a7f48fb"
  let result = null;
  let configInfo = null;
  const baseUrl = "https://www.dedao.cn/";

  async function connectDb() {
    try {
      return await open({
        filename: dbFilePath,
        driver: sqlite3.Database
      });
    } catch (error) {
      console.error('无法连接到数据库:', error);
      return null;
    }
  }

  const pageSize = 100;
  const currentPage = 0;
  const sortStrategy = "NEW"; // HOT, NEW
  const labelId = "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR";
  const navigationId = "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR";
  let total = 0;
  let db = await connectDb();
  try {
    if (!db) {
      console.log('无法连接到数据库');
      return;
    }

    result = await db.get(`SELECT * FROM login_info`);
    if (!result || !result.csrfToken) {
      console.log('未登录，请先登录');
      return;
    }

    configInfo = await db.get(`SELECT * FROM output_config`);
  } catch (error) {
    console.error(error);
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const navs = [
    {
      "name": "小说",
      "value": "ojMGzeDmENKGVY6qWM9xR0AD3dy48zQe00p2bagZOrvLlojXnm7ek51BJ64nkVBL",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "悬疑推理",
          "value": "dajqNV8bKrZMqG8l0mBEN6aok9g7Vw8qoJpzOy35XeWv1nAJxRj2D4dLY7RBgE0l"
        },
        {
          "name": "科幻",
          "value": "JVmd7ENd8VkK9q47eg6yM52nRGABlPbrdzPYmO31jNabZDLXrE0JzoxvWMxzjZ1L"
        },
        {
          "name": "世界名著",
          "value": "78W2k53rVGE3Az5JXRKNg0yvZnMDOPzlYyp81LqW6d9Bl2m7kxaejYb4odqO4Ejg"
        },
        {
          "name": "中国名著",
          "value": "W25MJyb4A32EvOeJdrYMb0jz9o7GNPExXxQR5ZgX1DL8lq6xnKWaVBmkyVrEG6Yl"
        },
        {
          "name": "军事战争",
          "value": "X5j6m723vNJLRaW7lq120Gdk5o9nZPMnyJwgYEKmBAD8eVMjy6r4OXzxbZMYzkE1"
        },
        {
          "name": "武侠",
          "value": "9JYX4ajLrYe9xqlvBA8jm5yO16Vz4QNGvDPgbd2XZaNKR3WnE07JMkDGoWz2vrKD"
        },
        {
          "name": "影视",
          "value": "41qMkRzRl6JroAWby258BMe74jOnVwlyKMpYqGxKazL0g9D3NdmvZkEX10Ny5BXJ"
        },
        {
          "name": "魔幻玄幻",
          "value": "XlMz39On6Bra7byEl80DLdm4zo1AVp6ANVwWZO2XegvK3kRGNqj9xM5YJYd2eJr4"
        },
        {
          "name": "职场",
          "value": "XM5znRl8EvXy3JzY5o7mnqbkWRj4DQk8bvP1dAVNOraeM2Bl69LK0gxZGB4y3gj0"
        },
        {
          "name": "历史",
          "value": "xlovK1bLAZxVRdEr46lK7GYJDjagqPxBOzpm8vb3yB92zO51kMX0eNoWnBrgjY97"
        },
        {
          "name": "社会",
          "value": "WXZmORLB8y6rvYLAjdkRnG9z7ZbmDQY9mlQOgqXMo1exW2J43Kl5Na0VEde3rb9a"
        },
        {
          "name": "爱情婚恋",
          "value": "lKVA68nNWjlrgnGRKax0B2O5Db8J3PnGKNwd6kqV1XymoA7zZ49LevYMEZ5JL9kj"
        },
        {
          "name": "近现代",
          "value": "9vmWzAl54WYrJ78ayq1VjKbDeZRxzpv6OXpXEBOlvko9L026gdm3AnGNMDkG1x8J"
        },
        {
          "name": "当代",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p1rdeQje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        },
        {
          "name": "中短篇作品",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pRjL7prVNbxD6B0M9konAXqYLyg576ONm5K"
        },
        {
          "name": "长篇作品",
          "value": "YX2AkgVnaYGA08yjmlL2gBqx1Oo6Rwr7NNpVdKeDN3J4bkEZv5rM9z7WXyZ0vOdL"
        },
        {
          "name": "外国",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLogWwA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        }
      ]
    },
    {
      "name": "心理学",
      "value": "Da1LVnd9dA74k9nB2G6YZrL8eqENW5Q47bpyaDO0RxV3lzK1vJjmboMXgregjymY",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "心理学通俗读物",
          "value": "lKVA68nNWjlrgnGRKax0B2O5Db8J3PnMDgQd6kqV1XymoA7zZ49LevYMEZ5JL9kj"
        },
        {
          "name": "心理学与生活",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqMgbQGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        },
        {
          "name": "心理学理论",
          "value": "K86kabNoONLMJbDGVZvW0EzqBmrdYQ0LzdQ71y2geK9k43xRXA8j65lanO2eDv53"
        },
        {
          "name": "弗洛伊德",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pR6J7prVNbxD6B0M9konAXqYLyg576ONm5K"
        },
        {
          "name": "阿尔弗莱德·阿德勒",
          "value": "XlMz39On6Bra7byEl80DLdm4zo1AVp65b6wWZO2XegvK3kRGNqj9xM5YJYd2eJr4"
        },
        {
          "name": "儿童心理",
          "value": "Oe5lr9vlX9g2ae840VLG7o5ZDnBEMP9gmdpKyYkqxNrzWOmd3b1JjRA6v4g830By"
        },
        {
          "name": "消费心理",
          "value": "K86kabNoONLMJbDGVZvW0EzqBmrdYQ0MVdP71y2geK9k43xRXA8j65lanO2eDv53"
        },
        {
          "name": "亲密关系",
          "value": "dajqNV8bKrZMqG8l0mBEN6aok9g7Vw89EApzOy35XeWv1nAJxRj2D4dLY7RBgE0l"
        },
        {
          "name": "焦虑",
          "value": "jMGzeDmENKGVY6qWM9xR0AD3dy48zQenoWP2bagZOrvLlojXnm7ek51BJ64nkVBL"
        },
        {
          "name": "学习与记忆",
          "value": "0V7k1e220gRNB3DGL8rjkYMedEV7bp759YPaKzmlXO416vA9yn5WJqZxoyJDZA3o"
        },
        {
          "name": "思维方式",
          "value": "OGlLn3j657Mqz2vZ8AJ3VdB9NkWnaw5qmjwElGbO4KLgjro1mXRDeYy0xogKe7JD"
        },
        {
          "name": "自我认知",
          "value": "K86kabNoONLMJbDGVZvW0EzqBmrdYQ0ERLP71y2geK9k43xRXA8j65lanO2eDv53"
        },
        {
          "name": "情绪管理",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLKeDwA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        },
        {
          "name": "人际交往",
          "value": "jMGzeDmENKGVY6qWM9xR0AD3dy48zQe7JWw2bagZOrvLlojXnm7ek51BJ64nkVBL"
        },
        {
          "name": "荣格",
          "value": "mga0zrA2zyY6a179NgLJD3lkEd84WPVzmGP5eMnrGZxomBvRj0XVbOqAK6neZvY9"
        },
        {
          "name": "心理学学派及分支",
          "value": "ldBNYWEA5mlBNjJGY0Rqzex2vWg97pm2KEQ1yrZaXdo8DKLEbn6M4kVO3jLX3zAv"
        },
        {
          "name": "教育心理学",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p1aK2pje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        },
        {
          "name": "精神分析学派",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pRzAEprVNbxD6B0M9konAXqYLyg576ONm5K"
        },
        {
          "name": "社会心理学",
          "value": "Oe5lr9vlX9g2ae840VLG7o5ZDnBEMP9zqdwKyYkqxNrzWOmd3b1JjRA6v4g830By"
        },
        {
          "name": "积极心理学",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4MvvPyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "犯罪心理学",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqM7ZQGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        }
      ]
    },
    {
      "name": "历史",
      "value": "GKveNq0b0BdzylrD5j21qLJVXMReZnwA5Gw3EOm86GaWx7KgYA4b9okNvdoax4RB",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "历史通俗读物",
          "value": "k2YLJnemjblqYg7AM3Vo86EyRd4W9PW2B3QDvOZkaGeL0zn1X52NKJBrx87lMXGd"
        },
        {
          "name": "历史学术著作",
          "value": "78W2k53rVGE3Az5JXRKNg0yvZnMDOPznjYP81LqW6d9Bl2m7kxaejYb4odqO4Ejg"
        },
        {
          "name": "历史自传他传",
          "value": "xlovK1bLAZxVRdEr46lK7GYJDjagqPxzjvpm8vb3yB92zO51kMX0eNoWnBrgjY97"
        },
        {
          "name": "世界史",
          "value": "jMGzeDmENKGVY6qWM9xR0AD3dy48zQeek7Q2bagZOrvLlojXnm7ek51BJ64nkVBL"
        },
        {
          "name": "中国史",
          "value": "BVeYxJznG01zjBXDxarZd4mNJL73gwgNkWP8KqRvk2MWAOY9oEy6Vb5elljAERmN"
        },
        {
          "name": "思想史",
          "value": "W25MJyb4A32EvOeJdrYMb0jz9o7GNPErKxwR5ZgX1DL8lq6xnKWaVBmkyVrEG6Yl"
        },
        {
          "name": "政治史",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4MAKPyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "经济史",
          "value": "Oe5lr9vlX9g2ae840VLG7o5ZDnBEMP97A4pKyYkqxNrzWOmd3b1JjRA6v4g830By"
        },
        {
          "name": "战争史",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pR6BAprVNbxD6B0M9konAXqYLyg576ONm5K"
        },
        {
          "name": "商业史",
          "value": "X5j6m723vNJLRaW7lq120Gdk5o9nZPMKdnpgYEKmBAD8eVMjy6r4OXzxbZMYzkE1"
        },
        {
          "name": "科技史",
          "value": "dajqNV8bKrZMqG8l0mBEN6aok9g7Vw85kypzOy35XeWv1nAJxRj2D4dLY7RBgE0l"
        },
        {
          "name": "哲学史",
          "value": "ldBNYWEA5mlBNjJGY0Rqzex2vWg97pmzeMQ1yrZaXdo8DKLEbn6M4kVO3jLX3zAv"
        },
        {
          "name": "毛泽东",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLqjvQA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        },
        {
          "name": "拿破仑",
          "value": "OGlLn3j657Mqz2vZ8AJ3VdB9NkWnaw5jvEpElGbO4KLgjro1mXRDeYy0xogKe7JD"
        },
        {
          "name": "丘吉尔",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p18W7wje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        },
        {
          "name": "秦始皇",
          "value": "ldBNYWEA5mlBNjJGY0Rqzex2vWg97pmzaMQ1yrZaXdo8DKLEbn6M4kVO3jLX3zAv"
        },
        {
          "name": "曾国藩",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p1867wje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        },
        {
          "name": "蒋介石",
          "value": "mga0zrA2zyY6a179NgLJD3lkEd84WPVkK0w5eMnrGZxomBvRj0XVbOqAK6neZvY9"
        },
        {
          "name": "法国大革命",
          "value": "41qMkRzRl6JroAWby258BMe74jOnVwlzl5QYqGxKazL0g9D3NdmvZkEX10Ny5BXJ"
        },
        {
          "name": "第一次工业革命",
          "value": "jMGzeDmENKGVY6qWM9xR0AD3dy48zQe9lWQ2bagZOrvLlojXnm7ek51BJ64nkVBL"
        },
        {
          "name": "第二次工业革命",
          "value": "ldBNYWEA5mlBNjJGY0Rqzex2vWg97pm7lOP1yrZaXdo8DKLEbn6M4kVO3jLX3zAv"
        },
        {
          "name": "一战",
          "value": "bZyoDzAEkMKRVd3yD6nNxJLeOgr9oQOedDwYZ0Xm4Aql285Ba7jvGz1bWl0d6YnR"
        },
        {
          "name": "二战",
          "value": "ovAaOYqxZdaA2gR9B4NJLWkXYVmorpKOdLpn0jO6q3e81GbylMEK5Dzv7dW4BGE6"
        },
        {
          "name": "文艺复兴",
          "value": "mga0zrA2zyY6a179NgLJD3lkEd84WPV8dlp5eMnrGZxomBvRj0XVbOqAK6neZvY9"
        },
        {
          "name": "中美关系",
          "value": "JVmd7ENd8VkK9q47eg6yM52nRGABlPbxvkpYmO31jNabZDLXrE0JzoxvWMxzjZ1L"
        },
        {
          "name": "古典时代",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pRWbGQrVNbxD6B0M9konAXqYLyg576ONm5K"
        },
        {
          "name": "中世纪",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4jvOwyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "史前时期",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p1NWkQje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        },
        {
          "name": "夏商周",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pRWJWQrVNbxD6B0M9konAXqYLyg576ONm5K"
        },
        {
          "name": "战国秦汉",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4jlewyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "三国",
          "value": "yn2d86X5lJE2jO0gv6LVyN9B1xRZ8Q3jWypAXWdKanoreY4qkbMz3DG7m79jWxNM"
        },
        {
          "name": "魏晋",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqydZQGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        },
        {
          "name": "南北朝",
          "value": "BVeYxJznG01zjBXDxarZd4mNJL73gwgb32P8KqRvk2MWAOY9oEy6Vb5elljAERmN"
        },
        {
          "name": "隋代",
          "value": "zNWRM4Ll7Nr0VaAqyDYX5zjnZxG6KPXb8GpWBLkg8Rvm24d9ObE3oJeM1o6jqnvK"
        },
        {
          "name": "唐代",
          "value": "GK0DgyEd6lkWmjXOZM4E7vbrDx1BKPozY9QgL5RyeY93nNoqa0V8GzAJ28qrl16m"
        },
        {
          "name": "五代十国",
          "value": "BAjYy4g0BM8Zqgkj34NR5r1dVznlOQJdKOw92xGbXvAW6mJYDEeL7oaKy0W8OX5Z"
        },
        {
          "name": "宋代",
          "value": "0V7k1e220gRNB3DGL8rjkYMedEV7bp7ak3PaKzmlXO416vA9yn5WJqZxoyJDZA3o"
        },
        {
          "name": "元代",
          "value": "bZyoDzAEkMKRVd3yD6nNxJLeOgr9oQOWBMQYZ0Xm4Aql285Ba7jvGz1bWl0d6YnR"
        },
        {
          "name": "明代",
          "value": "XAl15znMexOnqb2XlYzokEyJ95gvApDekKQ83DNRZr6KVGLaW170dmjB4EOmBk6W"
        },
        {
          "name": "清代",
          "value": "XlMz39On6Bra7byEl80DLdm4zo1AVp65q6wWZO2XegvK3kRGNqj9xM5YJYd2eJr4"
        },
        {
          "name": "近代",
          "value": "BAjYy4g0BM8Zqgkj34NR5r1dVznlOQJxybw92xGbXvAW6mJYDEeL7oaKy0W8OX5Z"
        },
        {
          "name": "美国",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4mWbPyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "英国",
          "value": "yn2d86X5lJE2jO0gv6LVyN9B1xRZ8Q3j7RpAXWdKanoreY4qkbMz3DG7m79jWxNM"
        },
        {
          "name": "德国",
          "value": "Rnl4j9qXO4bAE8larL3DqoyBz5Wm0pa51ZpRn12ejvxK9GNYZM6JgVdk7kNKDGxe"
        },
        {
          "name": "日本",
          "value": "0V7k1e220gRNB3DGL8rjkYMedEV7bp7mxVPaKzmlXO416vA9yn5WJqZxoyJDZA3o"
        },
        {
          "name": "法国",
          "value": "mga0zrA2zyY6a179NgLJD3lkEd84WPV83Lp5eMnrGZxomBvRj0XVbOqAK6neZvY9"
        },
        {
          "name": "印度",
          "value": "K86kabNoONLMJbDGVZvW0EzqBmrdYQ0O6kp71y2geK9k43xRXA8j65lanO2eDv53"
        },
        {
          "name": "中东",
          "value": "KveNq0b0BdzylrD5j21qLJVXMReZnwA2bBp3EOm86GaWx7KgYA4b9okNvdoax4RB"
        },
        {
          "name": "俄罗斯",
          "value": "arxJjZvJvglXA63Bq5y2NRrbZdMOxPB2bDPLVkK4z8aWjG9ome0Y17EnDoGy5NDl"
        },
        {
          "name": "葡萄牙",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pRW8EQrVNbxD6B0M9konAXqYLyg576ONm5K"
        },
        {
          "name": "西班牙",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4j5owyaDO0RxV3lzK1vJjmboMXgregjymY"
        }
      ]
    },
    {
      "name": "人工智能",
      "value": "V5x4ydKZzoyMlbme6n0kBjqxrdXL9VQq2GPGOW4YJ87D3v1RZE5gNaAK22lAezN6"
    },
    {
      "name": "互联网",
      "value": "vGMV25XqgJ34YMo0L5laWVX2vx7RdkPyy2PmnEq1ZBy6KNbGjeDzOA9r8ydWjD9Y",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "运营",
          "value": "XM5znRl8EvXy3JzY5o7mnqbkWRj4DQkk1oQ1dAVNOraeM2Bl69LK0gxZGB4y3gj0"
        },
        {
          "name": "数据分析",
          "value": "JVmd7ENd8VkK9q47eg6yM52nRGABlPbxjLpYmO31jNabZDLXrE0JzoxvWMxzjZ1L"
        },
        {
          "name": "设计师",
          "value": "DV4A8d9KVNA1mGBl865q2LodxzODWw2j0JwEnYMe4J3y9bav7kgRrjX0ZbvlyYZk"
        },
        {
          "name": "产品设计",
          "value": "GMV25XqgJ34YMo0L5laWVX2vx7RdkPyMgxPmnEq1ZBy6KNbGjeDzOA9r8ydWjD9Y"
        },
        {
          "name": "营销",
          "value": "A8XdO46oA1E4kLX6gvl3MyJxzD7dWPGZynQemYR8B52Kbqj0GnrV9ZaNOVDJBZ5a"
        },
        {
          "name": "互联网思维",
          "value": "XlMz39On6Bra7byEl80DLdm4zo1AVp653WwWZO2XegvK3kRGNqj9xM5YJYd2eJr4"
        },
        {
          "name": "互联网前沿视野",
          "value": "N7r0xXAOk346rqanZE8Y7xGR2oVbWQZvZyQv5KyeB1lDN90JmzXLMjdgA8baRK53"
        },
        {
          "name": "中国互联网公司",
          "value": "0V7k1e220gRNB3DGL8rjkYMedEV7bp7axzPaKzmlXO416vA9yn5WJqZxoyJDZA3o"
        },
        {
          "name": "外国互联网公司",
          "value": "XAl15znMexOnqb2XlYzokEyJ95gvApDeOGQ83DNRZr6KVGLaW170dmjB4EOmBk6W"
        },
        {
          "name": "用户需求",
          "value": "lKVA68nNWjlrgnGRKax0B2O5Db8J3PnzZNPd6kqV1XymoA7zZ49LevYMEZ5JL9kj"
        },
        {
          "name": "用户体验",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLKnvwA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        },
        {
          "name": "商业模式",
          "value": "YX2AkgVnaYGA08yjmlL2gBqx1Oo6Rwr5AxPVdKeDN3J4bkEZv5rM9z7WXyZ0vOdL"
        },
        {
          "name": "用户行为",
          "value": "XM5znRl8EvXy3JzY5o7mnqbkWRj4DQkgXvQ1dAVNOraeM2Bl69LK0gxZGB4y3gj0"
        },
        {
          "name": "自媒体新媒体",
          "value": "YX2AkgVnaYGA08yjmlL2gBqx1Oo6Rwr0oNQVdKeDN3J4bkEZv5rM9z7WXyZ0vOdL"
        },
        {
          "name": "产品经理",
          "value": "bZyoDzAEkMKRVd3yD6nNxJLeOgr9oQOW1DQYZ0Xm4Aql285Ba7jvGz1bWl0d6YnR"
        },
        {
          "name": "新零售",
          "value": "K86kabNoONLMJbDGVZvW0EzqBmrdYQ0O48p71y2geK9k43xRXA8j65lanO2eDv53"
        },
        {
          "name": "互联网金融",
          "value": "dajqNV8bKrZMqG8l0mBEN6aok9g7Vw8jKJQzOy35XeWv1nAJxRj2D4dLY7RBgE0l"
        },
        {
          "name": "互联网+",
          "value": "jMGzeDmENKGVY6qWM9xR0AD3dy48zQe72Ww2bagZOrvLlojXnm7ek51BJ64nkVBL"
        }
      ]
    },
    {
      "name": "商业",
      "value": "mldBNYWEA5mlBNjJGY0Rqzex2vWg97pm1mp1yrZaXdo8DKLEbn6M4kVO3jLX3zAv",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "商业通俗读物",
          "value": "lKVA68nNWjlrgnGRKax0B2O5Db8J3PnMRaQd6kqV1XymoA7zZ49LevYMEZ5JL9kj"
        },
        {
          "name": "商业传记",
          "value": "0V7k1e220gRNB3DGL8rjkYMedEV7bp7m8lPaKzmlXO416vA9yn5WJqZxoyJDZA3o"
        },
        {
          "name": "商业理论",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p19VVpje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        },
        {
          "name": "商业案例与实务",
          "value": "41qMkRzRl6JroAWby258BMe74jOnVwlMLLpYqGxKazL0g9D3NdmvZkEX10Ny5BXJ"
        },
        {
          "name": "视野洞察",
          "value": "9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvz7VpXEBOlvko9L026gdm3AnGNMDkG1x8J"
        },
        {
          "name": "经营战略",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqNVlPGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        },
        {
          "name": "领导力",
          "value": "yn2d86X5lJE2jO0gv6LVyN9B1xRZ8Q3EZRwAXWdKanoreY4qkbMz3DG7m79jWxNM"
        },
        {
          "name": "团队管理",
          "value": "0DYv3aWon714NWZYkOJa8vRbmVy5ePdbZNp9rx3LzBK6MjX0lG2gqdAEDJ91mBjb"
        },
        {
          "name": "项目管理",
          "value": "gMjleDOrG8vZAkRX5yNnDzY1g69Wjwjo9xp0bJMEx7LmeO2qdBoVl4aK3RJAEoGZ"
        },
        {
          "name": "商业模式",
          "value": "GMV25XqgJ34YMo0L5laWVX2vx7RdkPyz3mwmnEq1ZBy6KNbGjeDzOA9r8ydWjD9Y"
        },
        {
          "name": "新零售",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4maVPyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "市场调研",
          "value": "k2YLJnemjblqYg7AM3Vo86EyRd4W9PWxExwDvOZkaGeL0zn1X52NKJBrx87lMXGd"
        },
        {
          "name": "企业竞争力",
          "value": "78W2k53rVGE3Az5JXRKNg0yvZnMDOPzB5vP81LqW6d9Bl2m7kxaejYb4odqO4Ejg"
        },
        {
          "name": "投融资",
          "value": "bZyoDzAEkMKRVd3yD6nNxJLeOgr9oQOW2bQYZ0Xm4Aql285Ba7jvGz1bWl0d6YnR"
        },
        {
          "name": "创业",
          "value": "KveNq0b0BdzylrD5j21qLJVXMReZnwAMOkw3EOm86GaWx7KgYA4b9okNvdoax4RB"
        },
        {
          "name": "企业创新",
          "value": "JVmd7ENd8VkK9q47eg6yM52nRGABlPbEJoQYmO31jNabZDLXrE0JzoxvWMxzjZ1L"
        },
        {
          "name": "中国企业及企业家",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pR6gKprVNbxD6B0M9konAXqYLyg576ONm5K"
        },
        {
          "name": "外国企业及企业家",
          "value": "GK0DgyEd6lkWmjXOZM4E7vbrDx1BKPoMmMpgL5RyeY93nNoqa0V8GzAJ28qrl16m"
        }
      ]
    },
    {
      "name": "期刊杂志",
      "value": "V5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqZLPGOW4YJ87D3v1RZE5gNaAK22lAezN6",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "《凤凰周刊》",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p1rb7Qje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        },
        {
          "name": "《文化纵横》",
          "value": "YX2AkgVnaYGA08yjmlL2gBqx1Oo6Rwr7LLpVdKeDN3J4bkEZv5rM9z7WXyZ0vOdL"
        },
        {
          "name": "《看世界》",
          "value": "lKVA68nNWjlrgnGRKax0B2O5Db8J3PnGBLwd6kqV1XymoA7zZ49LevYMEZ5JL9kj"
        },
        {
          "name": "《看天下》",
          "value": "9vmWzAl54WYrJ78ayq1VjKbDeZRxzpv6eKpXEBOlvko9L026gdm3AnGNMDkG1x8J"
        },
        {
          "name": "《中国国家天文》",
          "value": "W25MJyb4A32EvOeJdrYMb0jz9o7GNPExKOQR5ZgX1DL8lq6xnKWaVBmkyVrEG6Yl"
        },
        {
          "name": "《十月》",
          "value": "jMGzeDmENKGVY6qWM9xR0AD3dy48zQee5JQ2bagZOrvLlojXnm7ek51BJ64nkVBL"
        },
        {
          "name": "《中国科学院院刊》",
          "value": "ovAaOYqxZdaA2gR9B4NJLWkXYVmorpKoJapn0jO6q3e81GbylMEK5Dzv7dW4BGE6"
        },
        {
          "name": "《南风窗》",
          "value": "k2YLJnemjblqYg7AM3Vo86EyRd4W9PWlrXwDvOZkaGeL0zn1X52NKJBrx87lMXGd"
        },
        {
          "name": "《第一财经》",
          "value": "lKVA68nNWjlrgnGRKax0B2O5Db8J3PnG1vwd6kqV1XymoA7zZ49LevYMEZ5JL9kj"
        },
        {
          "name": "《财经》",
          "value": "9vmWzAl54WYrJ78ayq1VjKbDeZRxzpv6RJpXEBOlvko9L026gdm3AnGNMDkG1x8J"
        },
        {
          "name": "《环球人物》",
          "value": "XlMz39On6Bra7byEl80DLdm4zo1AVp6Av7wWZO2XegvK3kRGNqj9xM5YJYd2eJr4"
        },
        {
          "name": "《哈佛商业评论》",
          "value": "xlovK1bLAZxVRdEr46lK7GYJDjagqPxBn7pm8vb3yB92zO51kMX0eNoWnBrgjY97"
        },
        {
          "name": "《新华月报》",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLoBDwA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        },
        {
          "name": "《证券市场周刊》",
          "value": "WXZmORLB8y6rvYLAjdkRnG9z7ZbmDQY9ZYQOgqXMo1exW2J43Kl5Na0VEde3rb9a"
        },
        {
          "name": "《证券市场红周刊》",
          "value": "WXZmORLB8y6rvYLAjdkRnG9z7ZbmDQY9RJQOgqXMo1exW2J43Kl5Na0VEde3rb9a"
        },
        {
          "name": "《体坛周报》",
          "value": "W25MJyb4A32EvOeJdrYMb0jz9o7GNPEx7yQR5ZgX1DL8lq6xnKWaVBmkyVrEG6Yl"
        },
        {
          "name": "《看电影》",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4edvPyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "《读书》",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLonMwA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        },
        {
          "name": "《当代》",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p1rRzQje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        },
        {
          "name": "《读者》",
          "value": "Oe5lr9vlX9g2ae840VLG7o5ZDnBEMP9arJPKyYkqxNrzWOmd3b1JjRA6v4g830By"
        },
        {
          "name": "《青年文摘》",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pRj12prVNbxD6B0M9konAXqYLyg576ONm5K"
        },
        {
          "name": "《小说月报》",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pRjX9prVNbxD6B0M9konAXqYLyg576ONm5K"
        },
        {
          "name": "《散文》",
          "value": "YX2AkgVnaYGA08yjmlL2gBqx1Oo6Rwr7ZopVdKeDN3J4bkEZv5rM9z7WXyZ0vOdL"
        },
        {
          "name": "《音乐爱好者》",
          "value": "ldBNYWEA5mlBNjJGY0Rqzex2vWg97pmgJZP1yrZaXdo8DKLEbn6M4kVO3jLX3zAv"
        },
        {
          "name": "《天文爱好者》",
          "value": "jMGzeDmENKGVY6qWM9xR0AD3dy48zQee2AQ2bagZOrvLlojXnm7ek51BJ64nkVBL"
        },
        {
          "name": "《轻兵器》",
          "value": "BAjYy4g0BM8Zqgkj34NR5r1dVznlOQJoWKP92xGbXvAW6mJYDEeL7oaKy0W8OX5Z"
        },
        {
          "name": "《父母必读》",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqV1EPGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        },
        {
          "name": "《商业评论》",
          "value": "KveNq0b0BdzylrD5j21qLJVXMReZnwAZ9kp3EOm86GaWx7KgYA4b9okNvdoax4RB"
        },
        {
          "name": "《中国企业家》",
          "value": "Oe5lr9vlX9g2ae840VLG7o5ZDnBEMP9a4GPKyYkqxNrzWOmd3b1JjRA6v4g830By"
        },
        {
          "name": "《商界》",
          "value": "zNWRM4Ll7Nr0VaAqyDYX5zjnZxG6KPXnM1pWBLkg8Rvm24d9ObE3oJeM1o6jqnvK"
        },
        {
          "name": "《雪球专刊》",
          "value": "BVeYxJznG01zjBXDxarZd4mNJL73gwgND5P8KqRvk2MWAOY9oEy6Vb5elljAERmN"
        },
        {
          "name": "《21世纪商业评论》",
          "value": "W25MJyb4A32EvOeJdrYMb0jz9o7GNPExj8QR5ZgX1DL8lq6xnKWaVBmkyVrEG6Yl"
        },
        {
          "name": "《21世纪经济报道》",
          "value": "zNWRM4Ll7Nr0VaAqyDYX5zjnZxG6KPXn1rpWBLkg8Rvm24d9ObE3oJeM1o6jqnvK"
        },
        {
          "name": "《北大金融评论》",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLoD4wA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        },
        {
          "name": "《中欧商业评论》",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p1rJ1Qje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        },
        {
          "name": "《青年文摘·彩版》",
          "value": "N7r0xXAOk346rqanZE8Y7xGR2oVbWQZNmjQv5KyeB1lDN90JmzXLMjdgA8baRK53"
        },
        {
          "name": "《十月·长篇小说》",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4eLKPyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "《当代·长篇小说》",
          "value": "Rnl4j9qXO4bAE8larL3DqoyBz5Wm0paLqxwRn12ejvxK9GNYZM6JgVdk7kNKDGxe"
        },
        {
          "name": "《读者·校园版》",
          "value": "XAl15znMexOnqb2XlYzokEyJ95gvApDxoLp83DNRZr6KVGLaW170dmjB4EOmBk6W"
        },
        {
          "name": "《散文·海外版》",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pRjdAprVNbxD6B0M9konAXqYLyg576ONm5K"
        },
        {
          "name": "《小说月报·原创版》",
          "value": "YX2AkgVnaYGA08yjmlL2gBqx1Oo6Rwr7v8pVdKeDN3J4bkEZv5rM9z7WXyZ0vOdL"
        },
        {
          "name": "《销售与市场》",
          "value": "bZyoDzAEkMKRVd3yD6nNxJLeOgr9oQOoEOQYZ0Xm4Aql285Ba7jvGz1bWl0d6YnR"
        },
        {
          "name": "《百科知识》",
          "value": "yn2d86X5lJE2jO0gv6LVyN9B1xRZ8Q3ZdBpAXWdKanoreY4qkbMz3DG7m79jWxNM"
        },
        {
          "name": "《新程序员》",
          "value": "OGlLn3j657Mqz2vZ8AJ3VdB9NkWnaw5AbjwElGbO4KLgjro1mXRDeYy0xogKe7JD"
        },
        {
          "name": "《电脑报》",
          "value": "0V7k1e220gRNB3DGL8rjkYMedEV7bp76vYwaKzmlXO416vA9yn5WJqZxoyJDZA3o"
        }
      ]
    },
    {
      "name": "管理学",
      "value": "Wk2YLJnemjblqYg7AM3Vo86EyRd4W9PWmjpDvOZkaGeL0zn1X52NKJBrx87lMXGd",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "企业经营与管理",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4MbePyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "管理通俗读物",
          "value": "ldBNYWEA5mlBNjJGY0Rqzex2vWg97pmMzEp1yrZaXdo8DKLEbn6M4kVO3jLX3zAv"
        },
        {
          "name": "组织结构",
          "value": "41qMkRzRl6JroAWby258BMe74jOnVwlMM9pYqGxKazL0g9D3NdmvZkEX10Ny5BXJ"
        },
        {
          "name": "团队管理",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pRxLWPrVNbxD6B0M9konAXqYLyg576ONm5K"
        },
        {
          "name": "品牌管理",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqX6ZpGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        },
        {
          "name": "创业",
          "value": "YX2AkgVnaYGA08yjmlL2gBqx1Oo6Rwr5kyPVdKeDN3J4bkEZv5rM9z7WXyZ0vOdL"
        },
        {
          "name": "企业竞争力",
          "value": "A8XdO46oA1E4kLX6gvl3MyJxzD7dWPGnn6QemYR8B52Kbqj0GnrV9ZaNOVDJBZ5a"
        },
        {
          "name": "企业创新",
          "value": "XM5znRl8EvXy3JzY5o7mnqbkWRj4DQkkygQ1dAVNOraeM2Bl69LK0gxZGB4y3gj0"
        },
        {
          "name": "物流与供应链",
          "value": "K86kabNoONLMJbDGVZvW0EzqBmrdYQ0MMkP71y2geK9k43xRXA8j65lanO2eDv53"
        },
        {
          "name": "战略管理",
          "value": "9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvz0npXEBOlvko9L026gdm3AnGNMDkG1x8J"
        },
        {
          "name": "组织行为",
          "value": "YX2AkgVnaYGA08yjmlL2gBqx1Oo6Rwra5yPVdKeDN3J4bkEZv5rM9z7WXyZ0vOdL"
        },
        {
          "name": "企业文化",
          "value": "GK0DgyEd6lkWmjXOZM4E7vbrDx1BKPoaN9pgL5RyeY93nNoqa0V8GzAJ28qrl16m"
        },
        {
          "name": "明茨伯格",
          "value": "jMGzeDmENKGVY6qWM9xR0AD3dy48zQenAWP2bagZOrvLlojXnm7ek51BJ64nkVBL"
        },
        {
          "name": "德鲁克",
          "value": "N7r0xXAOk346rqanZE8Y7xGR2oVbWQZv17Qv5KyeB1lDN90JmzXLMjdgA8baRK53"
        },
        {
          "name": "稻盛和夫",
          "value": "78W2k53rVGE3Az5JXRKNg0yvZnMDOPz3zOw81LqW6d9Bl2m7kxaejYb4odqO4Ejg"
        },
        {
          "name": "管理学大师",
          "value": "78W2k53rVGE3Az5JXRKNg0yvZnMDOPzBDYP81LqW6d9Bl2m7kxaejYb4odqO4Ejg"
        }
      ]
    },
    {
      "name": "自我提升",
      "value": "YOe5lr9vlX9g2ae840VLG7o5ZDnBEMP9WvpKyYkqxNrzWOmd3b1JjRA6v4g830By",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "思维方式",
          "value": "KveNq0b0BdzylrD5j21qLJVXMReZnwArgvp3EOm86GaWx7KgYA4b9okNvdoax4RB"
        },
        {
          "name": "说话沟通",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p19Kzpje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        },
        {
          "name": "学习方法",
          "value": "dajqNV8bKrZMqG8l0mBEN6aok9g7Vw89GMpzOy35XeWv1nAJxRj2D4dLY7RBgE0l"
        },
        {
          "name": "精力管理",
          "value": "A8XdO46oA1E4kLX6gvl3MyJxzD7dWPGZ1AQemYR8B52Kbqj0GnrV9ZaNOVDJBZ5a"
        },
        {
          "name": "个人成长",
          "value": "GK0DgyEd6lkWmjXOZM4E7vbrDx1BKPoyLZpgL5RyeY93nNoqa0V8GzAJ28qrl16m"
        },
        {
          "name": "情绪管理",
          "value": "BVeYxJznG01zjBXDxarZd4mNJL73gwgYk5Q8KqRvk2MWAOY9oEy6Vb5elljAERmN"
        },
        {
          "name": "亲密关系",
          "value": "zNWRM4Ll7Nr0VaAqyDYX5zjnZxG6KPXDM2PWBLkg8Rvm24d9ObE3oJeM1o6jqnvK"
        },
        {
          "name": "时间管理",
          "value": "A8XdO46oA1E4kLX6gvl3MyJxzD7dWPGnEAQemYR8B52Kbqj0GnrV9ZaNOVDJBZ5a"
        },
        {
          "name": "职业技能",
          "value": "XlMz39On6Bra7byEl80DLdm4zo1AVp6m66wWZO2XegvK3kRGNqj9xM5YJYd2eJr4"
        },
        {
          "name": "团队协作",
          "value": "GMV25XqgJ34YMo0L5laWVX2vx7RdkPyzbvwmnEq1ZBy6KNbGjeDzOA9r8ydWjD9Y"
        },
        {
          "name": "情商培养",
          "value": "9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvzrKpXEBOlvko9L026gdm3AnGNMDkG1x8J"
        },
        {
          "name": "职场写作",
          "value": "dajqNV8bKrZMqG8l0mBEN6aok9g7Vw85DEpzOy35XeWv1nAJxRj2D4dLY7RBgE0l"
        },
        {
          "name": "职场新人",
          "value": "JVmd7ENd8VkK9q47eg6yM52nRGABlPb2ddPYmO31jNabZDLXrE0JzoxvWMxzjZ1L"
        },
        {
          "name": "中层领导",
          "value": "9JYX4ajLrYe9xqlvBA8jm5yO16Vz4QNxv5wgbd2XZaNKR3WnE07JMkDGoWz2vrKD"
        },
        {
          "name": "大学生",
          "value": "GMV25XqgJ34YMo0L5laWVX2vx7RdkPyzyewmnEq1ZBy6KNbGjeDzOA9r8ydWjD9Y"
        },
        {
          "name": "领导者",
          "value": "XlMz39On6Bra7byEl80DLdm4zo1AVp6m3lwWZO2XegvK3kRGNqj9xM5YJYd2eJr4"
        }
      ]
    },
    {
      "name": "影视原著",
      "value": "V5x4ydKZzoyMlbme6n0kBjqxrdXL9VQq6LPGOW4YJ87D3v1RZE5gNaAK22lAezN6",
      "sub_options": []
    },
    {
      "name": "科技",
      "value": "9bZyoDzAEkMKRVd3yD6nNxJLeOgr9oQO1MwYZ0Xm4Aql285Ba7jvGz1bWl0d6YnR",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "科技公司",
          "value": "A8XdO46oA1E4kLX6gvl3MyJxzD7dWPGmoYpemYR8B52Kbqj0GnrV9ZaNOVDJBZ5a"
        },
        {
          "name": "科技前沿视野",
          "value": "N7r0xXAOk346rqanZE8Y7xGR2oVbWQZ7rEPv5KyeB1lDN90JmzXLMjdgA8baRK53"
        },
        {
          "name": "科技与生活",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLK8MwA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        },
        {
          "name": "科技关键词",
          "value": "arxJjZvJvglXA63Bq5y2NRrbZdMOxPB2rXPLVkK4z8aWjG9ome0Y17EnDoGy5NDl"
        },
        {
          "name": "科学家",
          "value": "zNWRM4Ll7Nr0VaAqyDYX5zjnZxG6KPX2R1pWBLkg8Rvm24d9ObE3oJeM1o6jqnvK"
        },
        {
          "name": "埃隆·马斯克",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLKrMwA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        },
        {
          "name": "苹果",
          "value": "78W2k53rVGE3Az5JXRKNg0yvZnMDOPz36Ww81LqW6d9Bl2m7kxaejYb4odqO4Ejg"
        },
        {
          "name": "亚马逊",
          "value": "Oe5lr9vlX9g2ae840VLG7o5ZDnBEMP9MNGPKyYkqxNrzWOmd3b1JjRA6v4g830By"
        },
        {
          "name": "人工智能",
          "value": "BVeYxJznG01zjBXDxarZd4mNJL73gwgY34Q8KqRvk2MWAOY9oEy6Vb5elljAERmN"
        },
        {
          "name": "无人驾驶",
          "value": "DV4A8d9KVNA1mGBl865q2LodxzODWw2jgowEnYMe4J3y9bav7kgRrjX0ZbvlyYZk"
        },
        {
          "name": "大数据",
          "value": "JVmd7ENd8VkK9q47eg6yM52nRGABlPbxXzpYmO31jNabZDLXrE0JzoxvWMxzjZ1L"
        },
        {
          "name": "区块链",
          "value": "9JYX4ajLrYe9xqlvBA8jm5yO16Vz4QNK2DPgbd2XZaNKR3WnE07JMkDGoWz2vrKD"
        },
        {
          "name": "比特币",
          "value": "XlMz39On6Bra7byEl80DLdm4zo1AVp6mVVwWZO2XegvK3kRGNqj9xM5YJYd2eJr4"
        },
        {
          "name": "物联网",
          "value": "GMV25XqgJ34YMo0L5laWVX2vx7RdkPyza0wmnEq1ZBy6KNbGjeDzOA9r8ydWjD9Y"
        },
        {
          "name": "互联网",
          "value": "WXZmORLB8y6rvYLAjdkRnG9z7ZbmDQYzjlPOgqXMo1exW2J43Kl5Na0VEde3rb9a"
        },
        {
          "name": "基因编辑",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pR697prVNbxD6B0M9konAXqYLyg576ONm5K"
        },
        {
          "name": "5G",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p19xvpje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        },
        {
          "name": "芯片",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pR69JprVNbxD6B0M9konAXqYLyg576ONm5K"
        },
        {
          "name": "脑机接口",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4mN5PyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "新能源",
          "value": "K86kabNoONLMJbDGVZvW0EzqBmrdYQ0MJ9P71y2geK9k43xRXA8j65lanO2eDv53"
        },
        {
          "name": "微软",
          "value": "W25MJyb4A32EvOeJdrYMb0jz9o7GNPEraywR5ZgX1DL8lq6xnKWaVBmkyVrEG6Yl"
        },
        {
          "name": "Facebook",
          "value": "yn2d86X5lJE2jO0gv6LVyN9B1xRZ8Q3bKBpAXWdKanoreY4qkbMz3DG7m79jWxNM"
        },
        {
          "name": "谷歌",
          "value": "Oe5lr9vlX9g2ae840VLG7o5ZDnBEMP9M9aPKyYkqxNrzWOmd3b1JjRA6v4g830By"
        },
        {
          "name": "腾讯",
          "value": "KveNq0b0BdzylrD5j21qLJVXMReZnwAMLvw3EOm86GaWx7KgYA4b9okNvdoax4RB"
        }
      ]
    },
    {
      "name": "经济",
      "value": "WGK0DgyEd6lkWmjXOZM4E7vbrDx1BKPorOQgL5RyeY93nNoqa0V8GzAJ28qrl16m",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "中国经济",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLKGvwA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        },
        {
          "name": "经济学家",
          "value": "dajqNV8bKrZMqG8l0mBEN6aok9g7Vw8jJyQzOy35XeWv1nAJxRj2D4dLY7RBgE0l"
        },
        {
          "name": "经济史",
          "value": "k2YLJnemjblqYg7AM3Vo86EyRd4W9PW20BQDvOZkaGeL0zn1X52NKJBrx87lMXGd"
        },
        {
          "name": "经济学通俗读物",
          "value": "X5j6m723vNJLRaW7lq120Gdk5o9nZPMKe2pgYEKmBAD8eVMjy6r4OXzxbZMYzkE1"
        },
        {
          "name": "诺贝尔奖",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLqODQA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        },
        {
          "name": "财政",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pRjEGprVNbxD6B0M9konAXqYLyg576ONm5K"
        },
        {
          "name": "货币",
          "value": "N7r0xXAOk346rqanZE8Y7xGR2oVbWQZN8DQv5KyeB1lDN90JmzXLMjdgA8baRK53"
        },
        {
          "name": "金融、银行",
          "value": "jMGzeDmENKGVY6qWM9xR0AD3dy48zQeeMWQ2bagZOrvLlojXnm7ek51BJ64nkVBL"
        },
        {
          "name": "保险",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4eyOPyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "经济学经典著作",
          "value": "xlovK1bLAZxVRdEr46lK7GYJDjagqPxzVNpm8vb3yB92zO51kMX0eNoWnBrgjY97"
        },
        {
          "name": "经济学应用",
          "value": "W25MJyb4A32EvOeJdrYMb0jz9o7GNPEeZyPR5ZgX1DL8lq6xnKWaVBmkyVrEG6Yl"
        },
        {
          "name": "经济危机",
          "value": "KveNq0b0BdzylrD5j21qLJVXMReZnwA2Evp3EOm86GaWx7KgYA4b9okNvdoax4RB"
        },
        {
          "name": "贸易战",
          "value": "N7r0xXAOk346rqanZE8Y7xGR2oVbWQZbBjQv5KyeB1lDN90JmzXLMjdgA8baRK53"
        },
        {
          "name": "行为经济学",
          "value": "DV4A8d9KVNA1mGBl865q2LodxzODWw2jagwEnYMe4J3y9bav7kgRrjX0ZbvlyYZk"
        },
        {
          "name": "政治经济学",
          "value": "mga0zrA2zyY6a179NgLJD3lkEd84WPVlzYp5eMnrGZxomBvRj0XVbOqAK6neZvY9"
        },
        {
          "name": "制度经济学",
          "value": "9vmWzAl54WYrJ78ayq1VjKbDeZRxzpv0Y9PXEBOlvko9L026gdm3AnGNMDkG1x8J"
        },
        {
          "name": "宏观经济学",
          "value": "YX2AkgVnaYGA08yjmlL2gBqx1Oo6Rwr5XoPVdKeDN3J4bkEZv5rM9z7WXyZ0vOdL"
        },
        {
          "name": "微观经济学",
          "value": "JVmd7ENd8VkK9q47eg6yM52nRGABlPbEALQYmO31jNabZDLXrE0JzoxvWMxzjZ1L"
        },
        {
          "name": "芝加哥经济学派",
          "value": "ovAaOYqxZdaA2gR9B4NJLWkXYVmorpKKLgpn0jO6q3e81GbylMEK5Dzv7dW4BGE6"
        },
        {
          "name": "奥地利经济学派",
          "value": "9JYX4ajLrYe9xqlvBA8jm5yO16Vz4QNYzNpgbd2XZaNKR3WnE07JMkDGoWz2vrKD"
        },
        {
          "name": "凯恩斯学派",
          "value": "ovAaOYqxZdaA2gR9B4NJLWkXYVmorpKOqJpn0jO6q3e81GbylMEK5Dzv7dW4BGE6"
        },
        {
          "name": "罗纳德·科斯",
          "value": "9JYX4ajLrYe9xqlvBA8jm5yO16Vz4QNKqxPgbd2XZaNKR3WnE07JMkDGoWz2vrKD"
        },
        {
          "name": "亚当·斯密",
          "value": "WXZmORLB8y6rvYLAjdkRnG9z7ZbmDQY2aYPOgqXMo1exW2J43Kl5Na0VEde3rb9a"
        },
        {
          "name": "大卫·李嘉图",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pRWgAQrVNbxD6B0M9konAXqYLyg576ONm5K"
        },
        {
          "name": "哈耶克",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4javwyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "米尔顿·弗里德曼",
          "value": "yn2d86X5lJE2jO0gv6LVyN9B1xRZ8Q3jJBpAXWdKanoreY4qkbMz3DG7m79jWxNM"
        },
        {
          "name": "美国经济",
          "value": "Oe5lr9vlX9g2ae840VLG7o5ZDnBEMP9Mn4PKyYkqxNrzWOmd3b1JjRA6v4g830By"
        },
        {
          "name": "欧洲经济",
          "value": "XM5znRl8EvXy3JzY5o7mnqbkWRj4DQk8GeP1dAVNOraeM2Bl69LK0gxZGB4y3gj0"
        },
        {
          "name": "世界各国经济概况",
          "value": "BAjYy4g0BM8Zqgkj34NR5r1dVznlOQJdR0w92xGbXvAW6mJYDEeL7oaKy0W8OX5Z"
        }
      ]
    },
    {
      "name": "哲学与宗教",
      "value": "2BVeYxJznG01zjBXDxarZd4mNJL73gwg0kp8KqRvk2MWAOY9oEy6Vb5elljAERmN",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "思想经典",
          "value": "yn2d86X5lJE2jO0gv6LVyN9B1xRZ8Q3jYBpAXWdKanoreY4qkbMz3DG7m79jWxNM"
        },
        {
          "name": "哲学理论",
          "value": "Rnl4j9qXO4bAE8larL3DqoyBz5Wm0paLGvwRn12ejvxK9GNYZM6JgVdk7kNKDGxe"
        },
        {
          "name": "哲学名家",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4jYKwyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "美学",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4eYOPyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "中国哲学",
          "value": "0DYv3aWon714NWZYkOJa8vRbmVy5ePdZDqp9rx3LzBK6MjX0lG2gqdAEDJ91mBjb"
        },
        {
          "name": "宗教",
          "value": "KveNq0b0BdzylrD5j21qLJVXMReZnwAZYnp3EOm86GaWx7KgYA4b9okNvdoax4RB"
        },
        {
          "name": "逻辑学",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqVL8PGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        },
        {
          "name": "伦理学",
          "value": "Oe5lr9vlX9g2ae840VLG7o5ZDnBEMP9aX4PKyYkqxNrzWOmd3b1JjRA6v4g830By"
        },
        {
          "name": "诸子百家",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqy2EQGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        },
        {
          "name": "儒家思想",
          "value": "ldBNYWEA5mlBNjJGY0Rqzex2vWg97pm76RP1yrZaXdo8DKLEbn6M4kVO3jLX3zAv"
        },
        {
          "name": "禅宗",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4jGKwyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "道家思想",
          "value": "Rnl4j9qXO4bAE8larL3DqoyBz5Wm0pa5GxpRn12ejvxK9GNYZM6JgVdk7kNKDGxe"
        },
        {
          "name": "基督教",
          "value": "ldBNYWEA5mlBNjJGY0Rqzex2vWg97pmz9ZQ1yrZaXdo8DKLEbn6M4kVO3jLX3zAv"
        },
        {
          "name": "佛教",
          "value": "Oe5lr9vlX9g2ae840VLG7o5ZDnBEMP9aXdPKyYkqxNrzWOmd3b1JjRA6v4g830By"
        },
        {
          "name": "伊斯兰教",
          "value": "GK0DgyEd6lkWmjXOZM4E7vbrDx1BKPoynVpgL5RyeY93nNoqa0V8GzAJ28qrl16m"
        },
        {
          "name": "犹太教",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqXKGpGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        },
        {
          "name": "存在主义",
          "value": "DV4A8d9KVNA1mGBl865q2LodxzODWw2jkdwEnYMe4J3y9bav7kgRrjX0ZbvlyYZk"
        },
        {
          "name": "现代哲学",
          "value": "arxJjZvJvglXA63Bq5y2NRrbZdMOxPBez5QLVkK4z8aWjG9ome0Y17EnDoGy5NDl"
        },
        {
          "name": "人生哲学",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p1rYnQje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        }
      ]
    },
    {
      "name": "法律",
      "value": "MovAaOYqxZdaA2gR9B4NJLWkXYVmorpKWGpn0jO6q3e81GbylMEK5Dzv7dW4BGE6",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "法律通俗读物",
          "value": "Oe5lr9vlX9g2ae840VLG7o5ZDnBEMP9775pKyYkqxNrzWOmd3b1JjRA6v4g830By"
        },
        {
          "name": "法律专著",
          "value": "Oe5lr9vlX9g2ae840VLG7o5ZDnBEMP9MrVPKyYkqxNrzWOmd3b1JjRA6v4g830By"
        },
        {
          "name": "司法解释",
          "value": "A8XdO46oA1E4kLX6gvl3MyJxzD7dWPGmmKpemYR8B52Kbqj0GnrV9ZaNOVDJBZ5a"
        },
        {
          "name": "经典案例",
          "value": "BVeYxJznG01zjBXDxarZd4mNJL73gwgqq1Q8KqRvk2MWAOY9oEy6Vb5elljAERmN"
        },
        {
          "name": "法条解读",
          "value": "X5j6m723vNJLRaW7lq120Gdk5o9nZPMnxnwgYEKmBAD8eVMjy6r4OXzxbZMYzkE1"
        },
        {
          "name": "行政法",
          "value": "0DYv3aWon714NWZYkOJa8vRbmVy5ePdqq4w9rx3LzBK6MjX0lG2gqdAEDJ91mBjb"
        },
        {
          "name": "民法",
          "value": "gMjleDOrG8vZAkRX5yNnDzY1g69WjwjNNaw0bJMEx7LmeO2qdBoVl4aK3RJAEoGZ"
        },
        {
          "name": "刑法",
          "value": "78W2k53rVGE3Az5JXRKNg0yvZnMDOPznn9P81LqW6d9Bl2m7kxaejYb4odqO4Ejg"
        },
        {
          "name": "商法",
          "value": "k2YLJnemjblqYg7AM3Vo86EyRd4W9PW22ZQDvOZkaGeL0zn1X52NKJBrx87lMXGd"
        },
        {
          "name": "经济法",
          "value": "xlovK1bLAZxVRdEr46lK7GYJDjagqPxzzbpm8vb3yB92zO51kMX0eNoWnBrgjY97"
        },
        {
          "name": "诉讼法",
          "value": "W25MJyb4A32EvOeJdrYMb0jz9o7GNPEeeGPR5ZgX1DL8lq6xnKWaVBmkyVrEG6Yl"
        },
        {
          "name": "司法制度",
          "value": "N7r0xXAOk346rqanZE8Y7xGR2oVbWQZbbLQv5KyeB1lDN90JmzXLMjdgA8baRK53"
        },
        {
          "name": "婚姻法",
          "value": "KveNq0b0BdzylrD5j21qLJVXMReZnwA22qp3EOm86GaWx7KgYA4b9okNvdoax4RB"
        },
        {
          "name": "刑事诉讼法",
          "value": "GMV25XqgJ34YMo0L5laWVX2vx7RdkPyB62wmnEq1ZBy6KNbGjeDzOA9r8ydWjD9Y"
        },
        {
          "name": "民事诉讼法",
          "value": "xlovK1bLAZxVRdEr46lK7GYJDjagqPxB9gpm8vb3yB92zO51kMX0eNoWnBrgjY97"
        },
        {
          "name": "社会保障法",
          "value": "OGlLn3j657Mqz2vZ8AJ3VdB9NkWnaw5AKXwElGbO4KLgjro1mXRDeYy0xogKe7JD"
        },
        {
          "name": "行政诉讼法",
          "value": "XlMz39On6Bra7byEl80DLdm4zo1AVp6AB7wWZO2XegvK3kRGNqj9xM5YJYd2eJr4"
        },
        {
          "name": "犯罪学",
          "value": "9vmWzAl54WYrJ78ayq1VjKbDeZRxzpv61JpXEBOlvko9L026gdm3AnGNMDkG1x8J"
        },
        {
          "name": "法律思想",
          "value": "arxJjZvJvglXA63Bq5y2NRrbZdMOxPB2RvPLVkK4z8aWjG9ome0Y17EnDoGy5NDl"
        },
        {
          "name": "合同法",
          "value": "lKVA68nNWjlrgnGRKax0B2O5Db8J3PnzMWPd6kqV1XymoA7zZ49LevYMEZ5JL9kj"
        },
        {
          "name": "知识产权",
          "value": "41qMkRzRl6JroAWby258BMe74jOnVwlzMGQYqGxKazL0g9D3NdmvZkEX10Ny5BXJ"
        },
        {
          "name": "物权法",
          "value": "GMV25XqgJ34YMo0L5laWVX2vx7RdkPylm0QmnEq1ZBy6KNbGjeDzOA9r8ydWjD9Y"
        },
        {
          "name": "侵权责任",
          "value": "xlovK1bLAZxVRdEr46lK7GYJDjagqPxEAzwm8vb3yB92zO51kMX0eNoWnBrgjY97"
        },
        {
          "name": "债法",
          "value": "41qMkRzRl6JroAWby258BMe74jOnVwl02MwYqGxKazL0g9D3NdmvZkEX10Ny5BXJ"
        },
        {
          "name": "英美法系",
          "value": "ovAaOYqxZdaA2gR9B4NJLWkXYVmorpKOKopn0jO6q3e81GbylMEK5Dzv7dW4BGE6"
        },
        {
          "name": "大陆法系",
          "value": "mga0zrA2zyY6a179NgLJD3lkEd84WPV8lAp5eMnrGZxomBvRj0XVbOqAK6neZvY9"
        }
      ]
    },
    {
      "name": "传记",
      "value": "lyn2d86X5lJE2jO0gv6LVyN9B1xRZ8Q3oGQAXWdKanoreY4qkbMz3DG7m79jWxNM",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "历代帝王",
          "value": "XAl15znMexOnqb2XlYzokEyJ95gvApDxM2p83DNRZr6KVGLaW170dmjB4EOmBk6W"
        },
        {
          "name": "军事人物",
          "value": "zNWRM4Ll7Nr0VaAqyDYX5zjnZxG6KPXnKGpWBLkg8Rvm24d9ObE3oJeM1o6jqnvK"
        },
        {
          "name": "政治人物",
          "value": "BAjYy4g0BM8Zqgkj34NR5r1dVznlOQJoJOP92xGbXvAW6mJYDEeL7oaKy0W8OX5Z"
        },
        {
          "name": "财经人物",
          "value": "Rnl4j9qXO4bAE8larL3DqoyBz5Wm0paLAvwRn12ejvxK9GNYZM6JgVdk7kNKDGxe"
        },
        {
          "name": "科学家",
          "value": "JVmd7ENd8VkK9q47eg6yM52nRGABlPbrYEPYmO31jNabZDLXrE0JzoxvWMxzjZ1L"
        },
        {
          "name": "宗教人物",
          "value": "arxJjZvJvglXA63Bq5y2NRrbZdMOxPBeZ5QLVkK4z8aWjG9ome0Y17EnDoGy5NDl"
        },
        {
          "name": "女性人物",
          "value": "DV4A8d9KVNA1mGBl865q2LodxzODWw2RkxwEnYMe4J3y9bav7kgRrjX0ZbvlyYZk"
        },
        {
          "name": "艺术家",
          "value": "gMjleDOrG8vZAkRX5yNnDzY1g69Wjwj9e9P0bJMEx7LmeO2qdBoVl4aK3RJAEoGZ"
        },
        {
          "name": "文学家",
          "value": "XM5znRl8EvXy3JzY5o7mnqbkWRj4DQk84OP1dAVNOraeM2Bl69LK0gxZGB4y3gj0"
        },
        {
          "name": "学者",
          "value": "9JYX4ajLrYe9xqlvBA8jm5yO16Vz4QNG5aPgbd2XZaNKR3WnE07JMkDGoWz2vrKD"
        }
      ]
    },
    {
      "name": "政治学",
      "value": "B78W2k53rVGE3Az5JXRKNg0yvZnMDOPz23P81LqW6d9Bl2m7kxaejYb4odqO4Ejg",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "政治人物",
          "value": "OGlLn3j657Mqz2vZ8AJ3VdB9NkWnaw5KmJQElGbO4KLgjro1mXRDeYy0xogKe7JD"
        },
        {
          "name": "政治理论",
          "value": "gMjleDOrG8vZAkRX5yNnDzY1g69Wjwj9nBP0bJMEx7LmeO2qdBoVl4aK3RJAEoGZ"
        },
        {
          "name": "国际关系",
          "value": "W25MJyb4A32EvOeJdrYMb0jz9o7GNPExO7QR5ZgX1DL8lq6xnKWaVBmkyVrEG6Yl"
        },
        {
          "name": "时局议题",
          "value": "KveNq0b0BdzylrD5j21qLJVXMReZnwAxajP3EOm86GaWx7KgYA4b9okNvdoax4RB"
        }
      ]
    },
    {
      "name": "豆瓣高分",
      "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpv2KpXEBOlvko9L026gdm3AnGNMDkG1x8J",
      "sub_options": []
    },
    {
      "name": "AI 导读",
      "value": "3yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p127Qje3n8Ro1Db05kA7qdMV4xgroWEMNL",
      "sub_options": []
    },
    {
      "name": "社会学",
      "value": "rA8XdO46oA1E4kLX6gvl3MyJxzD7dWPGWBPemYR8B52Kbqj0GnrV9ZaNOVDJBZ5a",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "社会学理论著作",
          "value": "78W2k53rVGE3Az5JXRKNg0yvZnMDOPznqvP81LqW6d9Bl2m7kxaejYb4odqO4Ejg"
        },
        {
          "name": "社会热点问题",
          "value": "ldBNYWEA5mlBNjJGY0Rqzex2vWg97pm7d3P1yrZaXdo8DKLEbn6M4kVO3jLX3zAv"
        },
        {
          "name": "社会观察",
          "value": "xlovK1bLAZxVRdEr46lK7GYJDjagqPxzA1pm8vb3yB92zO51kMX0eNoWnBrgjY97"
        },
        {
          "name": "社会调查",
          "value": "k2YLJnemjblqYg7AM3Vo86EyRd4W9PW2eNQDvOZkaGeL0zn1X52NKJBrx87lMXGd"
        },
        {
          "name": "中国",
          "value": "BVeYxJznG01zjBXDxarZd4mNJL73gwgbKlP8KqRvk2MWAOY9oEy6Vb5elljAERmN"
        },
        {
          "name": "社会变迁",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4jdLwyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "社会生活与社会问题",
          "value": "lKVA68nNWjlrgnGRKax0B2O5Db8J3PnMmWQd6kqV1XymoA7zZ49LevYMEZ5JL9kj"
        },
        {
          "name": "社会心理与社会行为",
          "value": "BVeYxJznG01zjBXDxarZd4mNJL73gwgYj1Q8KqRvk2MWAOY9oEy6Vb5elljAERmN"
        },
        {
          "name": "前沿视野",
          "value": "W25MJyb4A32EvOeJdrYMb0jz9o7GNPEe7kPR5ZgX1DL8lq6xnKWaVBmkyVrEG6Yl"
        },
        {
          "name": "城市化",
          "value": "XM5znRl8EvXy3JzY5o7mnqbkWRj4DQkMe6w1dAVNOraeM2Bl69LK0gxZGB4y3gj0"
        },
        {
          "name": "个人和社会",
          "value": "YX2AkgVnaYGA08yjmlL2gBqx1Oo6RwraEMPVdKeDN3J4bkEZv5rM9z7WXyZ0vOdL"
        }
      ]
    },
    {
      "name": "文学",
      "value": "Dmga0zrA2zyY6a179NgLJD3lkEd84WPVA0Q5eMnrGZxomBvRj0XVbOqAK6neZvY9",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "世界名著",
          "value": "WXZmORLB8y6rvYLAjdkRnG9z7ZbmDQYz5oPOgqXMo1exW2J43Kl5Na0VEde3rb9a"
        },
        {
          "name": "中国古代文学名家及作品",
          "value": "78W2k53rVGE3Az5JXRKNg0yvZnMDOPzBz9P81LqW6d9Bl2m7kxaejYb4odqO4Ejg"
        },
        {
          "name": "诺贝尔文学奖",
          "value": "bZyoDzAEkMKRVd3yD6nNxJLeOgr9oQOA2ewYZ0Xm4Aql285Ba7jvGz1bWl0d6YnR"
        },
        {
          "name": "中国现当代文学名家及作品",
          "value": "k2YLJnemjblqYg7AM3Vo86EyRd4W9PWx4ZwDvOZkaGeL0zn1X52NKJBrx87lMXGd"
        },
        {
          "name": "国学经典",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqN1ZPGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        },
        {
          "name": "文学名家及作品",
          "value": "WXZmORLB8y6rvYLAjdkRnG9z7ZbmDQYzm0POgqXMo1exW2J43Kl5Na0VEde3rb9a"
        },
        {
          "name": "文学评论及鉴赏",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqNdWPGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        },
        {
          "name": "文学理论",
          "value": "0DYv3aWon714NWZYkOJa8vRbmVy5ePdZzMp9rx3LzBK6MjX0lG2gqdAEDJ91mBjb"
        },
        {
          "name": "文学史",
          "value": "JVmd7ENd8VkK9q47eg6yM52nRGABlPbrazPYmO31jNabZDLXrE0JzoxvWMxzjZ1L"
        },
        {
          "name": "小说",
          "value": "WXZmORLB8y6rvYLAjdkRnG9z7ZbmDQYzZEPOgqXMo1exW2J43Kl5Na0VEde3rb9a"
        },
        {
          "name": "诗歌词曲",
          "value": "X5j6m723vNJLRaW7lq120Gdk5o9nZPMngJwgYEKmBAD8eVMjy6r4OXzxbZMYzkE1"
        },
        {
          "name": "散文随笔杂文",
          "value": "9JYX4ajLrYe9xqlvBA8jm5yO16Vz4QNGyDPgbd2XZaNKR3WnE07JMkDGoWz2vrKD"
        },
        {
          "name": "传记",
          "value": "GK0DgyEd6lkWmjXOZM4E7vbrDx1BKPoMb9pgL5RyeY93nNoqa0V8GzAJ28qrl16m"
        },
        {
          "name": "回忆录",
          "value": "GMV25XqgJ34YMo0L5laWVX2vx7RdkPylvOQmnEq1ZBy6KNbGjeDzOA9r8ydWjD9Y"
        },
        {
          "name": "纪实文学",
          "value": "XlMz39On6Bra7byEl80DLdm4zo1AVp6AxVwWZO2XegvK3kRGNqj9xM5YJYd2eJr4"
        },
        {
          "name": "戏剧曲艺",
          "value": "k2YLJnemjblqYg7AM3Vo86EyRd4W9PWlWzwDvOZkaGeL0zn1X52NKJBrx87lMXGd"
        },
        {
          "name": "茅盾文学奖",
          "value": "JVmd7ENd8VkK9q47eg6yM52nRGABlPb2YlPYmO31jNabZDLXrE0JzoxvWMxzjZ1L"
        }
      ]
    },
    {
      "name": "计算机",
      "value": "r0V7k1e220gRNB3DGL8rjkYMedEV7bp77rpaKzmlXO416vA9yn5WJqZxoyJDZA3o",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "编程开发",
          "value": "YX2AkgVnaYGA08yjmlL2gBqx1Oo6Rwr76NpVdKeDN3J4bkEZv5rM9z7WXyZ0vOdL"
        },
        {
          "name": "计算机理论",
          "value": "41qMkRzRl6JroAWby258BMe74jOnVwly6MpYqGxKazL0g9D3NdmvZkEX10Ny5BXJ"
        },
        {
          "name": "数据库",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pRj77prVNbxD6B0M9konAXqYLyg576ONm5K"
        },
        {
          "name": "软件工程",
          "value": "N7r0xXAOk346rqanZE8Y7xGR2oVbWQZN1WQv5KyeB1lDN90JmzXLMjdgA8baRK53"
        },
        {
          "name": "信息系统",
          "value": "Oe5lr9vlX9g2ae840VLG7o5ZDnBEMP9aDVPKyYkqxNrzWOmd3b1JjRA6v4g830By"
        },
        {
          "name": "人工智能",
          "value": "9vmWzAl54WYrJ78ayq1VjKbDeZRxzpv6VbpXEBOlvko9L026gdm3AnGNMDkG1x8J"
        },
        {
          "name": "多媒体",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p1rgeQje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        },
        {
          "name": "网络通讯",
          "value": "jMGzeDmENKGVY6qWM9xR0AD3dy48zQee6XQ2bagZOrvLlojXnm7ek51BJ64nkVBL"
        },
        {
          "name": "操作系统",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLo2WwA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        },
        {
          "name": "硬件开发",
          "value": "KveNq0b0BdzylrD5j21qLJVXMReZnwAZGlp3EOm86GaWx7KgYA4b9okNvdoax4RB"
        },
        {
          "name": "电子商务",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p1rgvQje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        },
        {
          "name": "IT产业",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLo2EwA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        },
        {
          "name": "安全加密",
          "value": "ldBNYWEA5mlBNjJGY0Rqzex2vWg97pmg6qP1yrZaXdo8DKLEbn6M4kVO3jLX3zAv"
        },
        {
          "name": "行业软件",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqVoWPGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        }
      ]
    },
    {
      "name": "自然科学总论",
      "value": "zOGlLn3j657Mqz2vZ8AJ3VdB9NkWnaw5MWwElGbO4KLgjro1mXRDeYy0xogKe7JD",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "诺贝尔奖",
          "value": "Rnl4j9qXO4bAE8larL3DqoyBz5Wm0panAmQRn12ejvxK9GNYZM6JgVdk7kNKDGxe"
        },
        {
          "name": "自然科学理论著作",
          "value": "XlMz39On6Bra7byEl80DLdm4zo1AVp6aMVwWZO2XegvK3kRGNqj9xM5YJYd2eJr4"
        },
        {
          "name": "科学史",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqN3GPGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        },
        {
          "name": "科普",
          "value": "GMV25XqgJ34YMo0L5laWVX2vx7RdkPylavQmnEq1ZBy6KNbGjeDzOA9r8ydWjD9Y"
        },
        {
          "name": "科学哲学",
          "value": "78W2k53rVGE3Az5JXRKNg0yvZnMDOPz3vWw81LqW6d9Bl2m7kxaejYb4odqO4Ejg"
        },
        {
          "name": "科学思维",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pRx49PrVNbxD6B0M9konAXqYLyg576ONm5K"
        }
      ]
    },
    {
      "name": "数理科学与化学",
      "value": "0Rnl4j9qXO4bAE8larL3DqoyBz5Wm0pajyQRn12ejvxK9GNYZM6JgVdk7kNKDGxe",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "数学",
          "value": "gMjleDOrG8vZAkRX5yNnDzY1g69Wjwj9WJP0bJMEx7LmeO2qdBoVl4aK3RJAEoGZ"
        },
        {
          "name": "物理学",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pRjZWprVNbxD6B0M9konAXqYLyg576ONm5K"
        }
      ]
    },
    {
      "name": "生物科学",
      "value": "rXAl15znMexOnqb2XlYzokEyJ95gvApDWXw83DNRZr6KVGLaW170dmjB4EOmBk6W",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "细胞生物学",
          "value": "XAl15znMexOnqb2XlYzokEyJ95gvApDxK0p83DNRZr6KVGLaW170dmjB4EOmBk6W"
        },
        {
          "name": "遗传学",
          "value": "K86kabNoONLMJbDGVZvW0EzqBmrdYQ0LbBQ71y2geK9k43xRXA8j65lanO2eDv53"
        },
        {
          "name": "生理学",
          "value": "XM5znRl8EvXy3JzY5o7mnqbkWRj4DQk8l6P1dAVNOraeM2Bl69LK0gxZGB4y3gj0"
        },
        {
          "name": "生物化学",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLoEewA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        },
        {
          "name": "分子生物学",
          "value": "DV4A8d9KVNA1mGBl865q2LodxzODWw2RJRwEnYMe4J3y9bav7kgRrjX0ZbvlyYZk"
        },
        {
          "name": "古生物学",
          "value": "GMV25XqgJ34YMo0L5laWVX2vx7RdkPyBvewmnEq1ZBy6KNbGjeDzOA9r8ydWjD9Y"
        },
        {
          "name": "微生物学",
          "value": "YX2AkgVnaYGA08yjmlL2gBqx1Oo6Rwr731pVdKeDN3J4bkEZv5rM9z7WXyZ0vOdL"
        },
        {
          "name": "植物学",
          "value": "YX2AkgVnaYGA08yjmlL2gBqx1Oo6Rwr73MpVdKeDN3J4bkEZv5rM9z7WXyZ0vOdL"
        },
        {
          "name": "动物学",
          "value": "yn2d86X5lJE2jO0gv6LVyN9B1xRZ8Q3ZWepAXWdKanoreY4qkbMz3DG7m79jWxNM"
        },
        {
          "name": "昆虫学",
          "value": "0DYv3aWon714NWZYkOJa8vRbmVy5ePdZnep9rx3LzBK6MjX0lG2gqdAEDJ91mBjb"
        },
        {
          "name": "人类学",
          "value": "41qMkRzRl6JroAWby258BMe74jOnVwlyd3pYqGxKazL0g9D3NdmvZkEX10Ny5BXJ"
        },
        {
          "name": "生态学",
          "value": "yn2d86X5lJE2jO0gv6LVyN9B1xRZ8Q3ZLXpAXWdKanoreY4qkbMz3DG7m79jWxNM"
        }
      ]
    },
    {
      "name": "医药与卫生",
      "value": "JK86kabNoONLMJbDGVZvW0EzqBmrdYQ0o3p71y2geK9k43xRXA8j65lanO2eDv53",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "一般理论",
          "value": "ldBNYWEA5mlBNjJGY0Rqzex2vWg97pmgZ3P1yrZaXdo8DKLEbn6M4kVO3jLX3zAv"
        },
        {
          "name": "研究方法",
          "value": "ovAaOYqxZdaA2gR9B4NJLWkXYVmorpKobopn0jO6q3e81GbylMEK5Dzv7dW4BGE6"
        },
        {
          "name": "预防医学与卫生学",
          "value": "yn2d86X5lJE2jO0gv6LVyN9B1xRZ8Q3ZlepAXWdKanoreY4qkbMz3DG7m79jWxNM"
        },
        {
          "name": "基础医学",
          "value": "78W2k53rVGE3Az5JXRKNg0yvZnMDOPzlVvp81LqW6d9Bl2m7kxaejYb4odqO4Ejg"
        },
        {
          "name": "临床医学",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLobOwA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        },
        {
          "name": "内科学",
          "value": "KveNq0b0BdzylrD5j21qLJVXMReZnwAZajp3EOm86GaWx7KgYA4b9okNvdoax4RB"
        },
        {
          "name": "外科学",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4eAbPyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "妇产科学",
          "value": "ovAaOYqxZdaA2gR9B4NJLWkXYVmorpKoZGpn0jO6q3e81GbylMEK5Dzv7dW4BGE6"
        },
        {
          "name": "儿科学",
          "value": "XAl15znMexOnqb2XlYzokEyJ95gvApDxXXp83DNRZr6KVGLaW170dmjB4EOmBk6W"
        },
        {
          "name": "肿瘤学",
          "value": "0DYv3aWon714NWZYkOJa8vRbmVy5ePdZRop9rx3LzBK6MjX0lG2gqdAEDJ91mBjb"
        },
        {
          "name": "神经病学与精神病学",
          "value": "W25MJyb4A32EvOeJdrYMb0jz9o7GNPExynQR5ZgX1DL8lq6xnKWaVBmkyVrEG6Yl"
        },
        {
          "name": "皮肤病学与性病学",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLo8KwA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        },
        {
          "name": "耳鼻咽喉科学",
          "value": "N7r0xXAOk346rqanZE8Y7xGR2oVbWQZNRXQv5KyeB1lDN90JmzXLMjdgA8baRK53"
        },
        {
          "name": "眼科学",
          "value": "Oe5lr9vlX9g2ae840VLG7o5ZDnBEMP9aJvPKyYkqxNrzWOmd3b1JjRA6v4g830By"
        },
        {
          "name": "口腔科学",
          "value": "mga0zrA2zyY6a179NgLJD3lkEd84WPVkE0w5eMnrGZxomBvRj0XVbOqAK6neZvY9"
        },
        {
          "name": "特种医学",
          "value": "arxJjZvJvglXA63Bq5y2NRrbZdMOxPBeWOQLVkK4z8aWjG9ome0Y17EnDoGy5NDl"
        },
        {
          "name": "药学",
          "value": "78W2k53rVGE3Az5JXRKNg0yvZnMDOPzlm5p81LqW6d9Bl2m7kxaejYb4odqO4Ejg"
        }
      ]
    },
    {
      "name": "天文与地球科学",
      "value": "azNWRM4Ll7Nr0VaAqyDYX5zjnZxG6KPXMowWBLkg8Rvm24d9ObE3oJeM1o6jqnvK",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "天文学科普",
          "value": "k2YLJnemjblqYg7AM3Vo86EyRd4W9PWloxwDvOZkaGeL0zn1X52NKJBrx87lMXGd"
        },
        {
          "name": "天文观测",
          "value": "lKVA68nNWjlrgnGRKax0B2O5Db8J3PnG3awd6kqV1XymoA7zZ49LevYMEZ5JL9kj"
        },
        {
          "name": "宇宙学",
          "value": "9vmWzAl54WYrJ78ayq1VjKbDeZRxzpv6bVpXEBOlvko9L026gdm3AnGNMDkG1x8J"
        },
        {
          "name": "太阳系",
          "value": "YX2AkgVnaYGA08yjmlL2gBqx1Oo6Rwr7bnpVdKeDN3J4bkEZv5rM9z7WXyZ0vOdL"
        },
        {
          "name": "天文学",
          "value": "78W2k53rVGE3Az5JXRKNg0yvZnMDOPzlNDp81LqW6d9Bl2m7kxaejYb4odqO4Ejg"
        },
        {
          "name": "地球物理学",
          "value": "BVeYxJznG01zjBXDxarZd4mNJL73gwgNm4P8KqRvk2MWAOY9oEy6Vb5elljAERmN"
        },
        {
          "name": "大气科学",
          "value": "mga0zrA2zyY6a179NgLJD3lkEd84WPVkOLw5eMnrGZxomBvRj0XVbOqAK6neZvY9"
        },
        {
          "name": "海洋学",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p1rv2Qje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        }
      ]
    },
    {
      "name": "艺术",
      "value": "aBAjYy4g0BM8Zqgkj34NR5r1dVznlOQJWYP92xGbXvAW6mJYDEeL7oaKy0W8OX5Z",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "艺术理论",
          "value": "YX2AkgVnaYGA08yjmlL2gBqx1Oo6Rwr763pVdKeDN3J4bkEZv5rM9z7WXyZ0vOdL"
        },
        {
          "name": "艺术史",
          "value": "oEJz13njdG7eW2E1RKOZ3azl8mvJ4pRj7JprVNbxD6B0M9konAXqYLyg576ONm5K"
        },
        {
          "name": "世界艺术",
          "value": "N7r0xXAOk346rqanZE8Y7xGR2oVbWQZN1yQv5KyeB1lDN90JmzXLMjdgA8baRK53"
        },
        {
          "name": "绘画",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4eg5PyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "音乐",
          "value": "A8XdO46oA1E4kLX6gvl3MyJxzD7dWPGx5rwemYR8B52Kbqj0GnrV9ZaNOVDJBZ5a"
        },
        {
          "name": "设计",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqVo8PGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        },
        {
          "name": "影视",
          "value": "Oe5lr9vlX9g2ae840VLG7o5ZDnBEMP9aD4PKyYkqxNrzWOmd3b1JjRA6v4g830By"
        },
        {
          "name": "动画",
          "value": "bZyoDzAEkMKRVd3yD6nNxJLeOgr9oQOo7XQYZ0Xm4Aql285Ba7jvGz1bWl0d6YnR"
        },
        {
          "name": "戏剧",
          "value": "GK0DgyEd6lkWmjXOZM4E7vbrDx1BKPoy67pgL5RyeY93nNoqa0V8GzAJ28qrl16m"
        },
        {
          "name": "摄影",
          "value": "BVeYxJznG01zjBXDxarZd4mNJL73gwgNx2P8KqRvk2MWAOY9oEy6Vb5elljAERmN"
        },
        {
          "name": "雕塑",
          "value": "ovAaOYqxZdaA2gR9B4NJLWkXYVmorpKolrpn0jO6q3e81GbylMEK5Dzv7dW4BGE6"
        },
        {
          "name": "建筑",
          "value": "yn2d86X5lJE2jO0gv6LVyN9B1xRZ8Q3ZMDpAXWdKanoreY4qkbMz3DG7m79jWxNM"
        },
        {
          "name": "舞蹈",
          "value": "mga0zrA2zyY6a179NgLJD3lkEd84WPVkxDw5eMnrGZxomBvRj0XVbOqAK6neZvY9"
        },
        {
          "name": "工艺美术",
          "value": "0V7k1e220gRNB3DGL8rjkYMedEV7bp76DKwaKzmlXO416vA9yn5WJqZxoyJDZA3o"
        }
      ]
    },
    {
      "name": "人类学",
      "value": "5DV4A8d9KVNA1mGBl865q2LodxzODWw2lvQEnYMe4J3y9bav7kgRrjX0ZbvlyYZk",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "人类学经典著作及理论",
          "value": "JVmd7ENd8VkK9q47eg6yM52nRGABlPbxgdpYmO31jNabZDLXrE0JzoxvWMxzjZ1L"
        },
        {
          "name": "人类学通俗读物",
          "value": "9JYX4ajLrYe9xqlvBA8jm5yO16Vz4QNKX5Pgbd2XZaNKR3WnE07JMkDGoWz2vrKD"
        },
        {
          "name": "文化史",
          "value": "XlMz39On6Bra7byEl80DLdm4zo1AVp6BvlpWZO2XegvK3kRGNqj9xM5YJYd2eJr4"
        },
        {
          "name": "语言学",
          "value": "WXZmORLB8y6rvYLAjdkRnG9z7ZbmDQYzNWPOgqXMo1exW2J43Kl5Na0VEde3rb9a"
        },
        {
          "name": "符号学",
          "value": "XM5znRl8EvXy3JzY5o7mnqbkWRj4DQkg76Q1dAVNOraeM2Bl69LK0gxZGB4y3gj0"
        },
        {
          "name": "婚姻",
          "value": "bZyoDzAEkMKRVd3yD6nNxJLeOgr9oQOeNgwYZ0Xm4Aql285Ba7jvGz1bWl0d6YnR"
        },
        {
          "name": "性别",
          "value": "ovAaOYqxZdaA2gR9B4NJLWkXYVmorpKOYMpn0jO6q3e81GbylMEK5Dzv7dW4BGE6"
        },
        {
          "name": "宗教",
          "value": "DV4A8d9KVNA1mGBl865q2LodxzODWw2jBRwEnYMe4J3y9bav7kgRrjX0ZbvlyYZk"
        },
        {
          "name": "民俗学",
          "value": "X5j6m723vNJLRaW7lq120Gdk5o9nZPMxN3QgYEKmBAD8eVMjy6r4OXzxbZMYzkE1"
        },
        {
          "name": "文化",
          "value": "41qMkRzRl6JroAWby258BMe74jOnVwlz5GQYqGxKazL0g9D3NdmvZkEX10Ny5BXJ"
        },
        {
          "name": "考古学",
          "value": "dajqNV8bKrZMqG8l0mBEN6aok9g7Vw8jE0QzOy35XeWv1nAJxRj2D4dLY7RBgE0l"
        }
      ]
    },
    {
      "name": "教育",
      "value": "EarxJjZvJvglXA63Bq5y2NRrbZdMOxPB0OpLVkK4z8aWjG9ome0Y17EnDoGy5NDl",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "教育心理",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqNZrPGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        },
        {
          "name": "学习方法与自学",
          "value": "GK0DgyEd6lkWmjXOZM4E7vbrDx1BKPoMrepgL5RyeY93nNoqa0V8GzAJ28qrl16m"
        },
        {
          "name": "世界各国教育事业",
          "value": "N7r0xXAOk346rqanZE8Y7xGR2oVbWQZv7WQv5KyeB1lDN90JmzXLMjdgA8baRK53"
        },
        {
          "name": "幼儿教育",
          "value": "XAl15znMexOnqb2XlYzokEyJ95gvApDAy0Q83DNRZr6KVGLaW170dmjB4EOmBk6W"
        },
        {
          "name": "初等教育",
          "value": "BAjYy4g0BM8Zqgkj34NR5r1dVznlOQJngnQ92xGbXvAW6mJYDEeL7oaKy0W8OX5Z"
        },
        {
          "name": "成人教育",
          "value": "78W2k53rVGE3Az5JXRKNg0yvZnMDOPz3nyw81LqW6d9Bl2m7kxaejYb4odqO4Ejg"
        },
        {
          "name": "高等教育",
          "value": "k2YLJnemjblqYg7AM3Vo86EyRd4W9PWbxzQDvOZkaGeL0zn1X52NKJBrx87lMXGd"
        },
        {
          "name": "青少年",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqXmEpGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        },
        {
          "name": "家庭教育",
          "value": "ldBNYWEA5mlBNjJGY0Rqzex2vWg97pmzZRQ1yrZaXdo8DKLEbn6M4kVO3jLX3zAv"
        },
        {
          "name": "亲子关系",
          "value": "Oe5lr9vlX9g2ae840VLG7o5ZDnBEMP9MxGPKyYkqxNrzWOmd3b1JjRA6v4g830By"
        },
        {
          "name": "教师与学生",
          "value": "bZyoDzAEkMKRVd3yD6nNxJLeOgr9oQOWyOQYZ0Xm4Aql285Ba7jvGz1bWl0d6YnR"
        }
      ]
    },
    {
      "name": "军事",
      "value": "5dajqNV8bKrZMqG8l0mBEN6aok9g7Vw8onPzOy35XeWv1nAJxRj2D4dLY7RBgE0l",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "一战",
          "value": "yn2d86X5lJE2jO0gv6LVyN9B1xRZ8Q3jZepAXWdKanoreY4qkbMz3DG7m79jWxNM"
        },
        {
          "name": "二战",
          "value": "0V7k1e220gRNB3DGL8rjkYMedEV7bp7a6lPaKzmlXO416vA9yn5WJqZxoyJDZA3o"
        },
        {
          "name": "抗日战争",
          "value": "BAjYy4g0BM8Zqgkj34NR5r1dVznlOQJxo6w92xGbXvAW6mJYDEeL7oaKy0W8OX5Z"
        },
        {
          "name": "冷战",
          "value": "0DYv3aWon714NWZYkOJa8vRbmVy5ePdqZew9rx3LzBK6MjX0lG2gqdAEDJ91mBjb"
        },
        {
          "name": "美国内战",
          "value": "W25MJyb4A32EvOeJdrYMb0jz9o7GNPEexkPR5ZgX1DL8lq6xnKWaVBmkyVrEG6Yl"
        },
        {
          "name": "国共内战",
          "value": "gMjleDOrG8vZAkRX5yNnDzY1g69WjwjGD2p0bJMEx7LmeO2qdBoVl4aK3RJAEoGZ"
        },
        {
          "name": "军事理论",
          "value": "9vmWzAl54WYrJ78ayq1VjKbDeZRxzpv68jpXEBOlvko9L026gdm3AnGNMDkG1x8J"
        },
        {
          "name": "军事史",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p1rlnQje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        },
        {
          "name": "世界军事",
          "value": "W25MJyb4A32EvOeJdrYMb0jz9o7GNPEeYnPR5ZgX1DL8lq6xnKWaVBmkyVrEG6Yl"
        },
        {
          "name": "中国军事",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLo3vwA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        },
        {
          "name": "战略战役战术",
          "value": "YX2AkgVnaYGA08yjmlL2gBqx1Oo6Rwr7nxpVdKeDN3J4bkEZv5rM9z7WXyZ0vOdL"
        },
        {
          "name": "军事技术",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqVnbPGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        }
      ]
    },
    {
      "name": "传播学",
      "value": "K0DYv3aWon714NWZYkOJa8vRbmVy5ePd0oP9rx3LzBK6MjX0lG2gqdAEDJ91mBjb",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "新媒体自媒体",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p19Gnpje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        },
        {
          "name": "信息与传播理论",
          "value": "KveNq0b0BdzylrD5j21qLJVXMReZnwAZlnp3EOm86GaWx7KgYA4b9okNvdoax4RB"
        },
        {
          "name": "新闻学",
          "value": "ldBNYWEA5mlBNjJGY0Rqzex2vWg97pmgyOP1yrZaXdo8DKLEbn6M4kVO3jLX3zAv"
        },
        {
          "name": "广播电视事业",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqVYbPGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        },
        {
          "name": "出版事业",
          "value": "Oe5lr9vlX9g2ae840VLG7o5ZDnBEMP9aldPKyYkqxNrzWOmd3b1JjRA6v4g830By"
        },
        {
          "name": "图书馆学",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p1r1kQje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        },
        {
          "name": "博物馆学",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLoyJwA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        },
        {
          "name": "档案学",
          "value": "YX2AkgVnaYGA08yjmlL2gBqx1Oo6Rwr7KypVdKeDN3J4bkEZv5rM9z7WXyZ0vOdL"
        }
      ]
    },
    {
      "name": "语言与文字",
      "value": "lJVmd7ENd8VkK9q47eg6yM52nRGABlPbdDpYmO31jNabZDLXrE0JzoxvWMxzjZ1L",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "语言学",
          "value": "ovAaOYqxZdaA2gR9B4NJLWkXYVmorpKo62pn0jO6q3e81GbylMEK5Dzv7dW4BGE6"
        },
        {
          "name": "汉语",
          "value": "arxJjZvJvglXA63Bq5y2NRrbZdMOxPBe6DQLVkK4z8aWjG9ome0Y17EnDoGy5NDl"
        }
      ]
    },
    {
      "name": "地理",
      "value": "KXM5znRl8EvXy3JzY5o7mnqbkWRj4DQkbep1dAVNOraeM2Bl69LK0gxZGB4y3gj0",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "历史地理学",
          "value": "arxJjZvJvglXA63Bq5y2NRrbZdMOxPBvWoPLVkK4z8aWjG9ome0Y17EnDoGy5NDl"
        },
        {
          "name": "亚洲",
          "value": "9vmWzAl54WYrJ78ayq1VjKbDeZRxzpv0aGPXEBOlvko9L026gdm3AnGNMDkG1x8J"
        },
        {
          "name": "非洲",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p18OVwje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        },
        {
          "name": "南美洲",
          "value": "YX2AkgVnaYGA08yjmlL2gBqx1Oo6Rwr5oMPVdKeDN3J4bkEZv5rM9z7WXyZ0vOdL"
        },
        {
          "name": "大洋洲",
          "value": "N7r0xXAOk346rqanZE8Y7xGR2oVbWQZvAzQv5KyeB1lDN90JmzXLMjdgA8baRK53"
        },
        {
          "name": "欧洲",
          "value": "jMGzeDmENKGVY6qWM9xR0AD3dy48zQe7bVw2bagZOrvLlojXnm7ek51BJ64nkVBL"
        },
        {
          "name": "各国地理",
          "value": "yn2d86X5lJE2jO0gv6LVyN9B1xRZ8Q3ZvypAXWdKanoreY4qkbMz3DG7m79jWxNM"
        }
      ]
    },
    {
      "name": "体育与运动",
      "value": "VgMjleDOrG8vZAkRX5yNnDzY1g69WjwjYzP0bJMEx7LmeO2qdBoVl4aK3RJAEoGZ",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "体育理论",
          "value": "N7r0xXAOk346rqanZE8Y7xGR2oVbWQZNE7Qv5KyeB1lDN90JmzXLMjdgA8baRK53"
        },
        {
          "name": "世界各国体育",
          "value": "jMGzeDmENKGVY6qWM9xR0AD3dy48zQeeL7Q2bagZOrvLlojXnm7ek51BJ64nkVBL"
        },
        {
          "name": "田径运动",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4eRePyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "体操运动",
          "value": "KveNq0b0BdzylrD5j21qLJVXMReZnwAZ6Bp3EOm86GaWx7KgYA4b9okNvdoax4RB"
        },
        {
          "name": "球类运动",
          "value": "ldBNYWEA5mlBNjJGY0Rqzex2vWg97pmgqEP1yrZaXdo8DKLEbn6M4kVO3jLX3zAv"
        },
        {
          "name": "武术及民族形式体育",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqVgZPGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        },
        {
          "name": "水上、冰雪运动",
          "value": "Oe5lr9vlX9g2ae840VLG7o5ZDnBEMP9am6PKyYkqxNrzWOmd3b1JjRA6v4g830By"
        },
        {
          "name": "其他体育运动",
          "value": "bZyoDzAEkMKRVd3yD6nNxJLeOgr9oQOo67QYZ0Xm4Aql285Ba7jvGz1bWl0d6YnR"
        },
        {
          "name": "文体运动",
          "value": "GK0DgyEd6lkWmjXOZM4E7vbrDx1BKPoyO9pgL5RyeY93nNoqa0V8GzAJ28qrl16m"
        }
      ]
    },
    {
      "name": "英文电子书",
      "value": "NXlMz39On6Bra7byEl80DLdm4zo1AVp632QWZO2XegvK3kRGNqj9xM5YJYd2eJr4"
    },
    {
      "name": "经典套系",
      "value": "vlKVA68nNWjlrgnGRKax0B2O5Db8J3PnL2pd6kqV1XymoA7zZ49LevYMEZ5JL9kj",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "经典套系",
          "value": "9vmWzAl54WYrJ78ayq1VjKbDeZRxzpv6NJpXEBOlvko9L026gdm3AnGNMDkG1x8J"
        },
        {
          "name": "中华经典藏书",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p1ra1Qje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        },
        {
          "name": "汉译名著",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLoz4wA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        },
        {
          "name": "全本全注全译丛书",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4e3vPyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "皮书",
          "value": "a1LVnd9dA74k9nB2G6YZrL8eqENW5Q4emvPyaDO0RxV3lzK1vJjmboMXgregjymY"
        },
        {
          "name": "大辞海",
          "value": "9vmWzAl54WYrJ78ayq1VjKbDeZRxzpv669pXEBOlvko9L026gdm3AnGNMDkG1x8J"
        }
      ]
    },
    {
      "name": "少儿",
      "value": "B78W2k53rVGE3Az5JXRKNg0yvZnMDOPzY5Q81LqW6d9Bl2m7kxaejYb4odqO4Ejg",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "儿童文学",
          "value": "9vmWzAl54WYrJ78ayq1VjKbDeZRxzpv62bpXEBOlvko9L026gdm3AnGNMDkG1x8J"
        },
        {
          "name": "儿童健康",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqVMGPGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        },
        {
          "name": "漫画绘本",
          "value": "yJdeKqvNJKmXr9WZyGB2aEOLlvYz6p1r2vQje3n8Ro1Db05kA7qdMV4xgroWEMNL"
        },
        {
          "name": "科普百科",
          "value": "W6obgA3DGqz14MWYyXl5ar29KxebnpLolEwA3EB8LOR6ZgmNk0voJj7dVJa9mXlq"
        }
      ]
    },
    {
      "name": "旅游",
      "value": "0X5j6m723vNJLRaW7lq120Gdk5o9nZPMyWPgYEKmBAD8eVMjy6r4OXzxbZMYzkE1",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "旅游随笔",
          "value": "5x4ydKZzoyMlbme6n0kBjqxrdXL9VQqV28PGOW4YJ87D3v1RZE5gNaAK22lAezN6"
        },
        {
          "name": "国内游",
          "value": "Oe5lr9vlX9g2ae840VLG7o5ZDnBEMP9ay4PKyYkqxNrzWOmd3b1JjRA6v4g830By"
        },
        {
          "name": "国外游",
          "value": "bZyoDzAEkMKRVd3yD6nNxJLeOgr9oQOo2XQYZ0Xm4Aql285Ba7jvGz1bWl0d6YnR"
        },
        {
          "name": "户外探险",
          "value": "BVeYxJznG01zjBXDxarZd4mNJL73gwgNr2P8KqRvk2MWAOY9oEy6Vb5elljAERmN"
        },
        {
          "name": "旅游摄影",
          "value": "ovAaOYqxZdaA2gR9B4NJLWkXYVmorpKoXrpn0jO6q3e81GbylMEK5Dzv7dW4BGE6"
        }
      ]
    },
    {
      "name": "动漫绘本",
      "value": "89JYX4ajLrYe9xqlvBA8jm5yO16Vz4QNvqQgbd2XZaNKR3WnE07JMkDGoWz2vrKD",
      "sub_options": [
        {
          "name": "全部",
          "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
        },
        {
          "name": "绘本",
          "value": "XlMz39On6Bra7byEl80DLdm4zo1AVp6AMxwWZO2XegvK3kRGNqj9xM5YJYd2eJr4"
        },
        {
          "name": "大陆漫画",
          "value": "k2YLJnemjblqYg7AM3Vo86EyRd4W9PWl33wDvOZkaGeL0zn1X52NKJBrx87lMXGd"
        },
        {
          "name": "港台漫画",
          "value": "lKVA68nNWjlrgnGRKax0B2O5Db8J3PnGqywd6kqV1XymoA7zZ49LevYMEZ5JL9kj"
        },
        {
          "name": "日韩漫画",
          "value": "GMV25XqgJ34YMo0L5laWVX2vx7RdkPyBENwmnEq1ZBy6KNbGjeDzOA9r8ydWjD9Y"
        },
        {
          "name": "欧美漫画",
          "value": "xlovK1bLAZxVRdEr46lK7GYJDjagqPxB2vpm8vb3yB92zO51kMX0eNoWnBrgjY97"
        }
      ]
    }
  ];

  for (let n = 0; n < navs.length; n++) {
    console.log(`current progress：nav(${navs[n].name})`);
    let iterator = 0;
    let hasMore = 1;
    while (hasMore === 1) {
      const ebookListRes = await getBookList(pageSize, iterator, navs[n]);
      const currentList = ebookListRes.c?.product_list || [];
      if (currentList.length === 0) {
        console.error("size error")
      }
      for (let i = 0; i < currentList.length; i++) {
        const book = currentList[i];
        const bookInfo = await checkDownloaded(book.id_out);
        if (!bookInfo) {
          await db.run(
            `INSERT INTO download_his (book_id, author, title, introduction, category, uploaded) VALUES (?, ?, ?, ?, ?, ?)`,
            [book.id_out, book.lecturer_name, book.name, book.introduction, navs[n].name, null]
          );
        }
      }
      hasMore = ebookListRes.c.is_more;
      iterator++;
    }
    console.log(iterator)
  }

  async function checkDownloaded(bookId) {
    const db = await connectDb();
    const bookInfo = await db.get(
      `select * from download_his where book_id = '${bookId}'`
    );
    await db.close();
    if (bookInfo) {
      return bookInfo;
    } else {
      return false;
    }
  }

  async function getBookList(ps, cp, nav) {
    const ebookListRes = await axios(`${baseUrl}pc/label/v2/algo/pc/product/list`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        "xi-csrf-token": result.csrfToken,
        'Cookie': `${result.cookies};token=${result.csrfToken}`,
        "User-Agent": userAgent,
        "sec-ch-ua": secChUa,
        "sec-ch-ua-mobile": "?0"
      },
      data: {
        "classfc_name": nav.name,
        "label_id": labelId,
        "nav_type": 0,
        "navigation_id": nav.value,
        "page": Number(cp),
        "page_size": Number(ps),
        "product_types": "2",
        "request_id": "",
        "sort_strategy": sortStrategy || "HOT", // HOT, NEW
        "tags_ids": []
      }
    })
    return ebookListRes.data;
  }

  function decryptAes(contents) {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(CipherKey);
    const iv = Buffer.from(AesIv);
    const decipher = createDecipheriv(algorithm, key, iv);
    const ciphertext = Buffer.from(contents, 'base64');

    let decrypted = decipher.update(ciphertext, 'binary', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted
  }

  async function getEbookPages(chapterId, count, index, offset, readToken, csrfToken, cookies) {
    try {
      let svgContents = []
      const ebookPages = await axios('https://www.dedao.cn/ebk_web_go/v2/get_pages', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          "xi-csrf-token": csrfToken,
          'Cookie': cookies,
          "User-Agent": userAgent,
          "sec-ch-ua": secChUa,
          "sec-ch-ua-mobile": "?0"
        },
        data: {
          "chapter_id": chapterId,
          "config": {
            "density": 1,
            "direction": 0,
            "font_name": "yahei",
            "font_scale": 1,
            "font_size": 16,
            "height": 10000,
            "line_height": "2em",
            "margin_bottom": 60,
            "margin_left": 30,
            "margin_right": 30,
            "margin_top": 60,
            "paragraph_space": "1em",
            "platform": 1,
            "width": 60000
          },
          "count": count,
          "index": index,
          "offset": offset,
          "orientation": 0,
          "token": readToken
        }
      })

      for (let i = 0; i < ebookPages.data.c.pages.length; i++) {
        const svContent = decryptAes(ebookPages.data.c.pages[i].svg)
        svgContents.push(svContent);
      }
      if (ebookPages.data.c.is_end) {
        return svgContents;
      } else {
        const newIndex = count;
        const newCount = count + 20;
        const nextSvgContents = await getEbookPages(chapterId, newCount, newIndex, offset, readToken, csrfToken, cookies)
        svgContents = svgContents.concat(nextSvgContents)
        return svgContents;
      }
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        console.log('令牌已过期，请重新登录');
      } else {
        console.error(error.code, error.message)
      }
      throw error;
    }
  }

  function chunkArray(arr, chunkSize) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      chunks.push(arr.slice(i, i + chunkSize));
    }
    return chunks;
  }

  async function downloadEbook(enid) {
    const readTokenRes = await axios(`${baseUrl}api/pc/ebook2/v1/pc/read/token?id=${enid}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        "xi-csrf-token": result.csrfToken,
        'Cookie': result.cookies,
        "User-Agent": userAgent,
        "sec-ch-ua": secChUa,
        "sec-ch-ua-mobile": "?0"
      }
    })
    const readToken = readTokenRes.data.c.token;

    const bookDetailRes = await axios(`${baseUrl}pc/ebook2/v1/pc/detail?id=${enid}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        "xi-csrf-token": result.csrfToken,
        'Cookie': result.cookies,
        "User-Agent": userAgent,
        "sec-ch-ua": secChUa,
        "sec-ch-ua-mobile": "?0"
      }
    })
    const bookId = bookDetailRes.data.c.id;
    const author = bookDetailRes.data.c.book_author;
    const title = bookDetailRes.data.c.operating_title
    let category = bookDetailRes.data.c.classify_name;
    if (!category || category === '') {
      category = '未分类'
    }

    const bookDetailInfoRes = await axios(`${baseUrl}ebk_web/v1/get_book_info?token=${readToken}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        "xi-csrf-token": result.csrfToken,
        'Cookie': result.cookies,
        "User-Agent": userAgent,
        "sec-ch-ua": secChUa,
        "sec-ch-ua-mobile": "?0"
      }
    })
    const orders = bookDetailInfoRes.data.c.bookInfo.orders;
    const toc = bookDetailInfoRes.data.c.bookInfo.toc;

    const index = 0;
    const count = 6;
    const offset = 0;
    let svgContents = [];
    console.log(`▶️ start download: [${category}]${title}_${author}`)
    // console.time(`download: ${title} - ${author}`)
    const chunks = chunkArray(orders, 5);
    for (const chunk of chunks) {
      const promises = chunk.map(async (order, i) => {
        const orderIndex = orders.indexOf(order);
        const pageSvgContents = await getEbookPages(
          order.chapterId,
          count,
          index,
          offset,
          readToken,
          result.csrfToken,
          result.cookies
        );

        svgContents.push({
          Contents: pageSvgContents,
          ChapterID: order.chapterId,
          PathInEpub: order.PathInEpub,
          OrderIndex: orderIndex,
        });
      });

      await Promise.all(promises);
    }
    // console.timeEnd(`download: ${title} - ${author}`)
    svgContents = svgContents.sort((a, b) => {
      return a.OrderIndex - b.OrderIndex;
    })

    const outputFileName = `${bookId}_${title}_${author}`;
    let reTitle = outputFileName.replace(/\//g, '_');
    reTitle = reTitle.replace(/\\/g, '_');
    reTitle = reTitle.replace(/\:/g, '_');
    reTitle = reTitle.replace(/\*/g, '_');
    reTitle = reTitle.replace(/\?/g, '_');
    reTitle = reTitle.replace(/\"/g, '_');
    reTitle = reTitle.replace(/\n/g, '');

    console.log(`🔀 generate PDF: [${category}]${outputFileName}`)
    let outputDir = `D:/电子书/EBook/${category}`;
    // let outputDir = `${__dirname}/output/${category}`;
    let outputSource = `${__dirname}/source/${category}`;
    // console.time(`PDF created in ${outputFileName}`)
    saveSource(enid, outputSource, reTitle, svgContents, toc, category);
    // Svg2Html(outputHtml, reTitle, svgContents, toc);
    Svg2Pdf(outputDir, reTitle, title, svgContents, toc, enid, true);
    return { category, outputFileName };
  }
})();