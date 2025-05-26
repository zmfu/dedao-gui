const path = require('path');
const fs = require('fs-extra');
const archiver = require('archiver');

(async () => {
  async function saveSource(enid, outputDir, reTitle, svgContents, toc, category) {
    const saveData = {
      enid,
      outputDir,
      reTitle,
      svgContents,
      toc
    }
    const zipDir = `D:/电子书/Source/${category}`;

    try {
      fs.ensureDirSync(outputDir);
      const filePath = `${outputDir}/${reTitle}.json`;
      await fs.writeFile(filePath, JSON.stringify(saveData), 'utf8')

      // 创建输出流
      fs.ensureDirSync(zipDir);
      const archive = archiver('zip', {
        zlib: { level: 5 } // 最高压缩级别
      });
      
      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') console.warn('文件不存在警告:', err);
        else throw err;
      });
      
      archive.on('error', (err) => {
        throw err;
      });
      
      const output = fs.createWriteStream(`${zipDir}/${reTitle}.zip`);
      
      // 监听事件
      output.on('close', () => {
        console.log(`📄 压缩源数据完成: ${zipDir}/${reTitle}.zip `);
        fs.unlinkSync(filePath);
      });
      // 管道连接
      archive.pipe(output);

      archive.file(filePath, { name: path.basename(filePath) });

      // 完成压缩
      archive.finalize().then(() => {
      });

    } catch (error) {
      console.error('保存源数据失败:', error);
    }
  }

  module.exports = {
    saveSource
  };
})();