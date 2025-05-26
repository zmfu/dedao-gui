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

  } catch (error) {
    console.error(error);
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  let caegoryId = null;
  if (process.argv.length > 2) {
    caegoryId = process.argv[2];
  }

  // let querySql = "";
  // if (caegoryId) {
  //   querySql = `FROM download_his where category = '${caegoryId}' and (is_vip_book is null or is_vip_book = 1) and (uploaded = 0 or uploaded is null)`;
  // } else {
  //   querySql = `FROM download_his where (is_vip_book is null or is_vip_book = 1) and (uploaded = 0 or uploaded is null)`;
  // }
  // const totalRes = await db.get(`SELECT count(*) as total ${querySql}`);
  const totalRes = await db.get(`SELECT count(*) as total FROM download_his`);
  total = totalRes.total;
  const steps = Math.ceil(total / pageSize) - 1;
  for (let i = 0; i <= steps; i++) {
    console.time(`current progress：page(${i})`);
    // const currentList = await db.all(`SELECT * ${querySql} limit ${pageSize} offset ${i * pageSize}`);
    const currentList = await db.all(`SELECT * FROM download_his limit ${pageSize} offset ${i * pageSize}`);
    // for (let j = 0; j < currentList.length; j++) {
    //   const book = currentList[j];
    //   try {
    //     console.log(`current progress：page(${i}), chunk${k}, book#${j + 1}`);
    //     onDownload = true;
    //     let outputFileName = await downloadEbook(book);
    //     if (outputFileName) {
    //       await db.run(
    //         `update download_his set book_title = ?, uploaded = ? where book_id = ?`,
    //         [outputFileName, 0, book.book_id]
    //       );
    //     }
    //   } catch (error) {
    //     console.error(book.id_out, error.code, error.message);
    //   }
    // }
    const chunks = chunkArray(currentList, 20);
    let onDownload = false;
    for (let k = 0; k < chunks.length; k++) {
      const chunk = chunks[k];
      const promises = chunk.map(async (book, j) => {
        try {
          // console.log(`current progress：page(${i}), chunk${k}, book#${j + 1}`);

          const bookDetailRes = await axios(`${baseUrl}pc/ebook2/v1/pc/detail?id=${book.book_id}`, {
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
          let category = bookDetailRes.data.c.classify_name
          if (!category || category === '') {
            category = '未分类'
          }
          await db.run(
            `update download_his set dd_id = ?, category = ?, is_vip_book = ?, icon_url = ? where book_id = ?`,
            [bookDetailRes.data.c.id, category, bookDetailRes.data.c.is_vip_book, bookDetailRes.data.c.cover, book.book_id]
          );
          // if (bookDetailRes.data.c.is_vip_book != 1) {
          //   console.log(`skip vip book: ${bookDetailRes.data.c.operating_title}`)
          // } else {
            // onDownload = true;
            // let outputFileName = await downloadEbook(book, category);
            // if (outputFileName) {
            //   await db.run(
            //     `update download_his set book_title = ?, uploaded = ? where book_id = ?`,
            //     [outputFileName, 0, book.book_id]
            //   );
            // }
          // }
        } catch (error) {
          console.error(book.id_out, error.code, error.message);
        }
      });

      await Promise.all(promises);
    }
    if (onDownload) {
      await delay(30000);
    }
    console.timeEnd(`current progress：page(${i})`);
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

  async function getEbookPages(chapterId, count, index, offset, readToken, csrfToken, cookies, title) {
    try {
      let svgContents = []
      const ebookPages = await axios('https://www.dedao.cn/ebk_web_go/v2/get_pages', {
        method: 'POST',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          "xi-csrf-token": csrfToken,
          'Cookie': cookies,
          "User-Agent": userAgent,
          "Sec-Ch-Ua": secChUa,
          "Sec-Ch-Ua-Mobile": "?0",
          "Xi-Dt": "web"
        },
        data: {
          "chapter_id": chapterId,
          "config": {
            "density": 1,
            "direction": 1,
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
            "platform": 0,
            "width": 60000
          },
          "count": count,
          "index": index,
          "offset": offset,
          "orientation": 0,
          "token": readToken
        }
      })

      if (ebookPages.data.h.e) {
        return svgContents;
      }

      // console.log(chapterId, ebookPages.data)

      for (let i = 0; i < ebookPages.data.c.pages.length; i++) {
        const svContent = decryptAes(ebookPages.data.c.pages[i].svg)
        svgContents.push(svContent);
      }
      if (ebookPages.data.c.is_end) {
        return svgContents;
      } else {
        const newIndex = count;
        const newCount = count + 20;
        const nextSvgContents = await getEbookPages(chapterId, newCount, newIndex, offset, readToken, csrfToken, cookies, title)
        svgContents = svgContents.concat(nextSvgContents)
        return svgContents;
      }
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        console.log('令牌已过期，请重新登录');
      } else {
        console.error(title, chapterId, error.code, error.message)
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

  async function downloadEbook(book) {
    const enid = book.book_id;
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

    const bookId = book.book_id;
    const author = book.author;
    const title = book.title;
    const category = book.category;
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
          result.cookies,
          book.title
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
    reTitle = reTitle.replace(/\r/g, '_');

    console.log(`🔀 generate PDF: [${category}]${outputFileName}`)
    let outputDir = `D:/电子书/EBook/${category}`;
    // let outputDir = `${__dirname}/output/${category}`;
    let outputSource = `${__dirname}/source/${category}`;
    // console.time(`PDF created in ${outputFileName}`)
    try {
      saveSource(enid, outputSource, reTitle, svgContents, toc, category);
      // Svg2Html(outputHtml, reTitle, svgContents, toc);
      Svg2Pdf(outputDir, reTitle, title, svgContents, toc, enid, true);
      return outputFileName;
    } catch (error) {
      console.log(error);
      return null;
    }
    // return outputFileName;
  }
})();