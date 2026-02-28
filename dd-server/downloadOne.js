const axios = require('axios');
const sqlite3 = require('sqlite3');
const path = require('path');
const { open } = require('sqlite');
const { createDecipheriv } = require('node:crypto');
const { Buffer } = require('node:buffer');
const { Svg2Pdf, PartSvg2Pdf } = require('./services/svg2pdf_1');
const { mergePdfFiles } = require('./services/createOutline');
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
  } finally {
    await db.close();
  }

  let enid = null;
  if (process.argv.length > 2) {
    enid = process.argv[2];
  } else {
    return;
  }

  if (!enid) {
    return;
  }

  try {
    db = await connectDb();
    const book = await db.get(`select * from download_his where book_id = ?`, [enid]);
    await db.close();

    await downloadEbook(book);

    if (process.send) {
      process.send(enid);
    }
  } catch (error) {
    console.error(error);
    process.exit(-1);
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

      if (!ebookPages.data.c || !ebookPages.data.c.pages) {
        return [];
      }

      for (let i = 0; i < ebookPages.data.c.pages.length; i++) {
        const svContent = decryptAes(ebookPages.data.c.pages[i].svg)
        svgContents.push(svContent);
      }
      if (ebookPages.data.c.is_end) {
        return svgContents;
      } else {
        const newIndex = index + count;
        // const newCount = count + 2;
        const nextSvgContents = await getEbookPages(chapterId, count, newIndex, offset, readToken, csrfToken, cookies)
        svgContents = svgContents.concat(nextSvgContents)
        return svgContents;
      }
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        console.log('令牌已过期，请重新登录');
      }
      console.error(error)
      return []
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

    const bookId = book.dd_id;
    const { author, title, category } = book;

    if (!bookDetailInfoRes.data.c.bookInfo) {
      console.log(`❌️ get book info failed: ${title}`);
      return null;
    }
    const orders = bookDetailInfoRes.data.c.bookInfo.orders;
    const toc = bookDetailInfoRes.data.c.bookInfo.toc;

    const index = 0;
    const count = 2;
    const offset = 0;
    let svgContents = [];
    console.log(`⏳️ start download: [${category}]${title}_${author}`)

    let outputDir = `D:/电子书/EBook/${category}`;
    let outputSource = `${__dirname}/source/${category}`;
    const outputFileName = `${bookId}_${title}`;
    let reTitle = outputFileName.replace(/\//g, '_');
    reTitle = reTitle.replace(/\\/g, '_');
    reTitle = reTitle.replace(/\:/g, '_');
    reTitle = reTitle.replace(/\*/g, '_');
    reTitle = reTitle.replace(/\?/g, '_');
    reTitle = reTitle.replace(/\"/g, '_');
    reTitle = reTitle.replace(/\n/g, '');

    const chunks = chunkArray(orders, 5);
    let splited = false;
    let splitedIndex = 1;
    let splitedFiles = [];
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
      if (svgContents.length > 200) {
        svgContents = svgContents.sort((a, b) => {
          return a.OrderIndex - b.OrderIndex;
        })
        console.log(`⏳️ generate PDF part-${splitedIndex}: [${category}]${outputFileName}, contentSize: ${svgContents.length}`);
        splitedFiles.push(await PartSvg2Pdf(outputDir, reTitle, svgContents, splitedIndex, toc, enid, true));
        saveSource(enid, outputSource, `${reTitle}-${splitedIndex}`, svgContents, [], category);
        splited = true;
        splitedIndex++;
        svgContents = [];
      }
    }

    svgContents = svgContents.sort((a, b) => {
      return a.OrderIndex - b.OrderIndex;
    })

    if (splited) {
      if (svgContents.length > 0) {
        console.log(`⏳️ generate PDF part-${splitedIndex}: [${category}]${outputFileName}, contentSize: ${svgContents.length}`)
        splitedFiles.push(await PartSvg2Pdf(outputDir, reTitle, svgContents, splitedIndex, toc, enid, true));
      }
      saveSource(enid, outputSource, reTitle, svgContents, toc, category);
      const filePreName = path.join(outputDir, reTitle);
      const fileName = `${filePreName}.pdf`;
      await mergePdfFiles(splitedFiles, fileName, toc);
      const db = await connectDb();
      await db.run(
        `update download_his set book_title = '${outputFileName}', uploaded = 1 where book_id = '${enid}'`
      );
      await db.close();
      console.log('\x1b[32m%s\x1b[0m', `✅ merged PDF: ${fileName}`);
    } else {
      console.log(`⏳️ generate PDF: [${category}]${outputFileName}`)
      saveSource(enid, outputSource, reTitle, svgContents, toc, category);
      Svg2Pdf(outputDir, reTitle, svgContents, toc, enid, true);
    }
    return { category, outputFileName };
  }
})();