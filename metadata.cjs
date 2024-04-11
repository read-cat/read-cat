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

module.exports = () => {
  const pkg = require('./package.json');
  const { branch } = pkg;
  const commit = execSync('git log -1 --pretty=format:%H', { encoding: 'utf-8' }).trim();
  console.log('metadata');
  console.log('branch:', branch, 'commit:', commit);
  const date = format(new Date(), 'yyMMdd');
  const versionCode = Number(`${pkg.version.charAt(0)}.${`0${pkg.versionCode}`.slice(-2)}${date}`);

  const b = getBranch(branch);
  return {
    tag: `v${versionCode}${b === 'release' ? '' : '-' + b}`,
    version: `${pkg.version}${b === 'release' ? '' : '-' + b}`,
    versionCode,
    branch,
    date,
    commit
  }
}