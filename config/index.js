const path = require('path');

function resolveDev(dir) {
  return path.join(__dirname, '../src/', dir);
}

function resolveBuild(dir) {
  return path.join(__dirname, '../dist/', dir);
}

module.exports = {
  dev: {
    html: resolveDev('/*.html'),
    css: resolveDev('css/*.{scss, css}'),
    image: resolveDev('images/**.**'),
    js: resolveDev('js/page/*.{js, ts}'),
    entry: resolveDev('js/page/'),
    static: resolveDev('../static/**/*'),
    component: resolveDev('components/'),
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
    name: 'ecp_web.zip',
    path: resolveBuild('**/*'),
    dest: path.join(__dirname, '../zip/')
  },
  server: {
    baseDir: path.join(__dirname, '../dist/'),
    open: false,
    port: 9090,
    notify: false
  }
}