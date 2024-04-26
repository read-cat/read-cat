const { version, commit } = require('./metadata.json');
const { devDependencies } = require('./package.json');
const builder = require('electron-builder');
const fs = require('fs');
const { join } = require('path');
const { Platform, Arch } = builder;

const electronVersion = /\d+\.\d+\.\d+/.exec(devDependencies.electron);

/**
* @type {import('electron-builder').Configuration}
* @see https://www.electron.build/configuration/configuration
*/
const config = {
  appId: 'io.github.read-cat',
  productName: 'ReadCat',
  asar: true,
  asarUnpack: [
    'node_modules'
  ],
  electronVersion: electronVersion && electronVersion[0] ? electronVersion[0] : '29.2.0',
  compression: 'maximum',
  directories: {
    'output': `build`
  },
  files: [
    'dist',
    'dist-electron',
    '!node_modules/**/*.map',
    '!node_modules/**/*.md',
    '!node_modules/**/*.ts',
    '!node_modules/**/*.scss',
    '!dist/icons/icon.icns',
  ],
  win: {
    icon: 'public/icons/icon.ico',
    artifactName: '${productName}-win32-${arch}' + `-${version}.${commit.slice(0, 8)}` + '.${ext}',
  },
  nsis: {
    installerIcon: 'public/icons/icon.ico',
    installerHeaderIcon: 'public/icons/icon.ico',
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false
  },
  mac: {
    icon: 'public/icons/icon.icns',
    artifactName: '${productName}-darwin-${arch}' + `-${version}.${commit.slice(0, 8)}` + '.${ext}',
    darkModeSupport: true
  },
  linux: {
    icon: 'public/icons',
    artifactName: '${productName}-linux-${arch}' + `-${version}.${commit.slice(0, 8)}` + '.${ext}',
  }
}


const promises = [];
let platforms = process.argv.slice(2);
(platforms.length <= 0) && (platforms.push('--win32=x64,ia32', '--darwin=x64,arm64', '--linux=x64,arm64'));
platforms.forEach(a => {
  let targets = void 0;
  const values = a.trim().split('=');
  const platform = values[0];
  const archs = values[1] === void 0 ? [] : values[1].split(',').map(a => {
    let arch;
    switch (a) {
      case 'ia32':
        arch = Arch.ia32;
        break;
      case 'x64':
        arch = Arch.x64;
        break;
      case 'arm64':
        arch = Arch.arm64;
        break;
      case 'armv7l':
        arch = Arch.armv7l;
        break;
      case 'universal':
      default:
        arch = Arch.universal;
        break;
    }
    return arch;
  });
  if (platform === '--win32') {
    (archs.length <= 0) && (archs.push(Arch.x64, Arch.ia32));
    targets = Platform.WINDOWS.createTarget([
      'nsis',
      'tar.gz'
    ], ...archs);
  } else if (platform === '--darwin') {
    (archs.length <= 0) && (archs.push(Arch.x64, Arch.arm64));
    targets = Platform.MAC.createTarget([
      'dmg',
      'tar.gz'
    ], ...archs);
  } else if (platform === '--linux') {
    (archs.length <= 0) && (archs.push(Arch.x64, Arch.arm64));
    targets = Platform.LINUX.createTarget([
      'AppImage',
      'tar.gz',
      'deb'
    ], ...archs);
  }
  targets && promises.push(builder.build({
    targets,
    config
  }));
});

const exts = [
  '.exe',
  '.tar.gz',
  '.dmg',
  '.appimage',
  '.deb',
];
const pass = (filename) => {
  if (typeof filename !== 'string') {
    return false;
  }
  for (const e of exts) {
    if (filename.toLowerCase().endsWith(e.toLowerCase())) {
      return true;
    }
  }
  return false;
}

Promise.allSettled(promises).then(res => {
  for (const item of res) {
    if (item.status === 'fulfilled') {
      console.log(item.value);
    } else {
      console.error('build error', item.reason);
    }
  }
  const buildDir = join(__dirname, 'build');
  const releaseDir = join(__dirname, 'release');
  fs.mkdirSync(releaseDir, {
    recursive: true
  });
  fs.existsSync(buildDir) && fs.readdirSync(buildDir, { encoding: 'utf-8' }).forEach(file => {
    console.log(buildDir, file);
    if (pass(file)) {
      console.log('file:', join(buildDir, file), join(releaseDir, file));
      fs.renameSync(join(buildDir, file), join(releaseDir, file));
    }
  });
}).catch(e => {
  console.error(e);
});
