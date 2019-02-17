const path = require('path');

function resolveDev(dir) {
  return path.join(__dirname, '../src/', dir);
}

function resolveBuild(dir) {
  return path.join(__dirname, '../dist/', dir);
}  

// 获取打包环境
const BUILD_ENV = process.env.BUILD_ENV || 'dev';

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
    font: resolveDev('font/*') 
  },
  build: {
    html: resolveBuild('.'),
    css: resolveBuild('css/'),
    image: resolveBuild('images/'),
    js: resolveBuild('js/'),
    static: resolveBuild('static/'),
    font: resolveBuild('font/')
  },
  zip: {
    name: 'ecp_web',
    path: resolveBuild('**/*'),
    dest: path.join(__dirname, '../zip/')
  },
  server: {
    baseDir: path.join(__dirname, '../dist/'),
    open: false,
    port: 9090,
    notify: false
  },
  alias: {
    // 使用环境配置文件时，import envConfig from 'envConfig'
    envConfig: path.join(__dirname, `./env/env.${BUILD_ENV}.js`)
  }
}