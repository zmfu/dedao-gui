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

  const navs = [{
    "name": "全部分类",
    "value": "X9vmWzAl54WYrJ78ayq1VjKbDeZRxzpvnpXEBOlvko9L026gdm3AnGNMDkG1x8JR"
  }];

  for (let n = 0; n < navs.length; n++) {
    console.log(`current progress：nav(${navs[n].name})`);
    let iterator = 0;
    let hasMore = 1;
    while (hasMore === 1) {
      if (iterator > 10) {
        hasMore = 0;
        continue;
      }
      console.log(`current progress：iterator(${iterator})`);
      const ebookListRes = await getBookList(pageSize, iterator, navs[n]);
      const currentList = ebookListRes.c?.product_list || [];
      if (currentList.length === 0) {
        console.error("size error")
        hasMore = 0;
        continue;
      }
      for (let i = 0; i < currentList.length; i++) {
        const book = currentList[i];
        const bookInfo = await checkDownloaded(book.id_out);
        if (!bookInfo) {
          const bookDetailRes = await axios(`${baseUrl}pc/ebook2/v1/pc/detail?id=${book.id_out}`, {
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
          const bookDetail = bookDetailRes.data.c
          let category = bookDetail.classify_name
          if (!category || category === '') {
            category = '未分类'
          }
          console.log(`book name: ${bookDetail.operating_title}, category: ${category}`)
          await db.run(
            `INSERT INTO download_his (book_id, author, title, introduction, category, is_vip_book, icon_url, dd_id, uploaded) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [bookDetail.enid, bookDetail.book_author, bookDetail.operating_title, bookDetail.book_intro, category, bookDetail.is_vip_book, bookDetail.cover, bookDetail.id, null]
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

  async function getCartList(ps, cp, nav) {
    const ebookListRes = await axios(`${baseUrl}api/hades/v2/product/list`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        "xi-csrf-token": result.csrfToken,
        'Cookie': `${result.cookies}`,
        "User-Agent": userAgent,
        "sec-ch-ua": secChUa,
        "sec-ch-ua-mobile": "?0"
      },
      data: { "category": "ebook", "display_group": true, "filter": "all", "filter_complete": 0, "group_id": 0, "order": "study", "page": Number(cp), "page_size": Number(ps), "sort_type": "desc" }
    })
    return ebookListRes.data;
  }
})();