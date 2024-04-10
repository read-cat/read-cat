const { execSync } = require('child_process');
const fs = require('fs');
function format(date, format) {
  const o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'H+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
    'q+': Math.floor((date.getMonth() + 3) / 3),
    'S': date.getMilliseconds()
  }

  const match = /(y+)/.exec(format);
  if (match) {
    format = format.replace(match[1], (date.getFullYear() + "").substring(4 - match[1].length));
  }

  for (const key in o) {
    const match = new RegExp(`(${key})`).exec(format);
    if (match) {
      format = format.replace(match[1], (match[1].length == 1) ? (o[key]) : (("00" + o[key]).substring(`${o[key]}`.length)));
    }
  }
  return format;
}
const getBranch = (branch) => {
  switch (branch) {
    case 'dev':
      return 'dev';
    case 'main':
      return 'release';
    default:
      return branch;
  }
}
const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
const commit = execSync('git log -1 --pretty=format:%H', { encoding: 'utf-8' }).trim();
const date = format(new Date(), 'yyMMddHH');

const pkg = require('./package.json');
const b = getBranch(branch);
let versionCode = Number(`${pkg.versionCode}.${date}`);
if (b === 'dev') {
  versionCode = Number(`0.${date}`);
} else if (b === 'release') {
  versionCode = Number(`${pkg.versionCode}.${date}`);
}
const version = `${pkg.version}-${b}`;
const out = {
  version,
  versionCode,
  branch,
  date,
  commit
}

fs.writeFileSync('metadata.json', JSON.stringify(out), { encoding: 'utf-8' });