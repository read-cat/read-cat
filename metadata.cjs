const { execSync } = require('child_process');
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

module.exports = (tag) => {
  if (!tag) {
    throw new Error('tag not found');
  }
  const pkg = require('./package.json');
  const branch = getBranch(pkg.branch);
  const isDev = branch === 'dev';

  let versionCode, date;
  if (tag === 'test') {
    date = format(new Date, 'yyMMdd');
    const vs = pkg.version.split('.');
    versionCode = `${vs[0]}.${vs[1]}${vs[1]}${date}`;
    tag = `v${pkg.version}-dev.${date}`;
  } else if (isDev) {
    const reg = /v(\d+)\.(\d+)\.(\d+)\-dev\.(\d+)/.exec(tag);
    console.log('tag parse:', reg);
    if (!reg) throw new Error('tag parse error');
    tag = reg[0];
    const v = `${reg[1]}.${reg[2]}${reg[3]}${reg[4]}`;
    console.log(v);
    versionCode = Number(v);
    date = reg[4];
  } else {
    const reg = /v(\d+)\.(\d+)\.(\d+)/.exec(tag);
    console.log('tag parse:', reg);
    if (!reg) throw new Error('tag parse error');
    tag = reg[0];
    const v = `${reg[1]}.${reg[2]}${reg[3]}`;
    console.log(v);
    versionCode = Number(v);
    date = format(new Date, 'yyMMdd');
  }
  if (isNaN(versionCode)) {
    throw new Error('versionCode is NaN');
  }
  const commit = execSync('git log -1 --pretty=format:%H', { encoding: 'utf-8' }).trim();
  console.log('branch:', branch, '\ncommit:', commit);

  const version = `${pkg.version}${isDev ? '-' + branch : ''}`;

  return {
    tag,
    version,
    versionCode,
    branch,
    date,
    commit
  }
}