import got from 'got';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import rimraf from 'rimraf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pathDir = path.join(__dirname, './json');

function sleep(m = 3000) {
  return new Promise(resolve => {
    setTimeout(resolve, m);
  });
}

async function init() {
  await createDirNotExt();
  await spider();
}

async function createDirNotExt(dir = pathDir) {
  try {
    await fs.access(dir);
    rimraf.sync(dir);
    await fs.mkdir(dir);
  } catch (error) {
    console.log(error);
    await fs.mkdir(dir);
  }
}

async function spider(code = '100000_full') {
  const url = `https://geo.datav.aliyun.com/areas/bound/${code}.json`;
  try {
    await sleep(3000);
    const r = await got.get(url);
    if (r.statusCode === 200) {
      const respJson = JSON.parse(r.body);
      const text = JSON.stringify(respJson, null, '\t');
      const features = respJson['features'] || [];
      const dir = path.join(pathDir, `${code}.json`);
      await fs.writeFile(dir, text, 'utf-8');
      for (let i = 0; i < features.length; i++) {
        const item = features[i];
        if ('childrenNum' in item['properties']) {
          if (item['properties']['name']) {
            console.log(item['properties']['name'] + '抓取ing');
          }
          if (item['properties']['childrenNum'] > 0) {
            const _code = `${item['properties']['adcode']}_full`;
            await spider(_code);
          } else {
            const _code = `${item['properties']['adcode']}`;
            await spider(_code);
          }
        }
      }
    }
  } catch (error) {
    if (error.code && error.code === 403) await spider(code);
  }
}

init();
