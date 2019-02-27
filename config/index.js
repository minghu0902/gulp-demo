const path = require('path');

// 获取环境变量
const BUILD_ENV = process.env.BUILD_ENV || 'dev';
const NODE_ENV = process.env.NODE_ENV || 'development';


function resolveDev(dir) {
  return path.join(__dirname, '../src/', dir);
}

function resolveBuild(dir) {
  return path.join(__dirname, NODE_ENV === 'development' ? '../dev/' : '../dist/', dir);
}  

module.exports = {
  dev: {
    root: path.join(__dirname, '../src/'),
    html: resolveDev('/*.html'),
    css: resolveDev('css/*.{scss, css}'),
    image: resolveDev('images/**.**'),
    js: resolveDev('js/page/*.{js, ts}'),
    entry: resolveDev('js/page/'),
    common: resolveDev('js/common/'),
    static: resolveDev('static/**/*'),
    component: this.root,
    font: resolveDev('font/*'),
    env: resolveDev(`../config/env/env.${BUILD_ENV}.js`)
  },
  build: {
    root: path.join(__dirname, '../dist/'),
    html: resolveBuild('.'),
    css: resolveBuild('css/'),
    image: resolveBuild('images/'),
    js: resolveBuild('js/'),
    static: resolveBuild('static/'),
    font: resolveBuild('font/'),
    env: resolveBuild('js/env/')
  },
  zip: {
    name: 'ecp_web',
    path: resolveBuild('**/*'),
    dest: path.join(__dirname, '../zip/')
  },
  server: {
    baseDir: path.join(__dirname, '../dev/'),
    open: false,
    port: 9090,
    notify: false
  },
  alias: {
    
  }
}