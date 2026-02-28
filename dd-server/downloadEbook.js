const { spawn } = require('child_process');
const sqlite3 = require('sqlite3');
const path = require('path');
const { open } = require('sqlite');
let dbFilePath = path.join(__dirname, './ddinfo.db');
process.stdout.setEncoding('utf8');

(async () => {
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

  let category = null;
  if (process.argv.length > 2) {
    category = process.argv[2];
  }

  const db = await connectDb();
  let queues = null;
  if (category) {
    queues = await db.all(`SELECT book_id, 0 as on_loading FROM download_his where (uploaded = 0 or uploaded is null) and is_vip_book = 1 and category = '${category}'`);
  } else {
    queues = await db.all(`SELECT book_id, 0 as on_loading FROM download_his where (uploaded = 0 or uploaded is null) and is_vip_book = 1`);
  }
  await db.close();

  const initPoolSize = 2;
  let poolSize = 0;
  const maxPoolSize = 4;
  console.time("download 100 spend: ")
  let counter = 0;
  for (let i = 0; i < initPoolSize; i++) {
    const enid = await getNext();
    if (enid) {
      runDownload(enid);
    }
  }

  async function getNext() {
    for (let i = 0; i < queues.length; i++) {
      if (queues[i].on_loading === 0) {
        queues[i].on_loading = 1;
        return queues[i].book_id;
      }
    }
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function runDownload(enid) {
    const child = spawn('node', ['downloadOne.js', enid], {
      stdio: ['inherit', 'inherit', 'inherit', 'ipc']
    });
    poolSize++;

    child.on('message', async (msg) => {
      queues = queues.filter(item => item.book_id !== msg);
      while (poolSize > maxPoolSize) {
        await delay(5000);
      }
      const nextId = await getNext();
      if (nextId) {
        runDownload(nextId);
      }
    });

    child.on('exit', (code) => {
      poolSize--;
      counter++;
      if (counter == 100) {
        console.timeEnd("download 100 spend: ")
        counter = 0;
        console.time("download 100 spend: ")
      }
      if (code !== 0) {
        console.error(`子进程异常退出，代码: ${code}`);
      }
    });
  }
})();