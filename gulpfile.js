const fs = require('fs');
const path = require('path');
const gulp = require('gulp');
const browserify = require("browserify");
const tsify = require("tsify");
const babelify = require("babelify");
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const merge = require('merge-stream');
const del = require('del');
const chalk = require('chalk');
const sourcemaps = require('gulp-sourcemaps');
const gutil = require('gulp-util');
const uglify = require('gulp-uglify');
const gulpif = require('gulp-if');
const rev = require('gulp-rev'); // 为静态文件生成hash值 && 生成源文件和添加hash后文件的映射 rev.manifest.json
const revCollector = require('gulp-rev-collector'); // 根据rev生成的manifest.json文件中的映射, 去替换文件名称, 也可以替换路径
const sass = require('gulp-sass');
const sassImport = require('gulp-sass-import');
const cleanCSS = require('gulp-clean-css');
const postcss = require('gulp-postcss');
const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const fileinclude = require('gulp-file-include');
const zip = require('gulp-zip');
const rename = require('gulp-rename');
const plugins = require('gulp-load-plugins')();
const vinylPaths = require('vinyl-paths');

sass.compiler = require('node-sass');

// 打包配置
const config = require('./config');
const devConfig = config.dev;
const buildConfig = config.build;
const serverConfig = config.server;
const alias = config.alias;

// server
const browserSync = require('browser-sync').create()
const reload = browserSync.reload

// 判断环境变量
const NODE_ENV = process.env.NODE_ENV || 'development';
const condition = NODE_ENV === 'production';

// 获取打包环境
const BUILD_ENV = process.env.BUILD_ENV || 'dev';

// 获取目录下的文件
function getFiles(dir) {
  return fs.readdirSync(dir).filter(function (file) {
    return fs.statSync(path.join(dir, file)).isFile();
  });
}

// 获取页面入口文件
const entrys = getFiles(devConfig.entry);

// 打包入口js
gulp.task('js:entry', function () {
  const tasks = entrys.map(file => {
    return browserify({
      basedir: '.',
      debug: true,
      cache: {},
      packageCache: {},
      entries: [devConfig.entry + file]
    })
      .plugin(tsify)
      .transform(babelify, {
        extensions: ['.ts'],
        plugins: [
          ['module-resolver', {
            'alias': alias
          }]
        ]
      })
      .bundle()
      .pipe(source(file.split('.')[0] + '.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(gulpif(condition, uglify()))
      .pipe(sourcemaps.write('./sourcemap/'))
      .pipe(gulp.dest(buildConfig.js))
  });
  return merge(tasks);
}) 

// 打包公共js
gulp.task('js:common', function() {
  return browserify({
    basedir: '.',
    debug: true,
    cache: {},
    packageCache: {},
    entries: [path.join(devConfig.common, '/index.ts')]
  })
    .plugin(tsify)
    .transform(babelify, {
      extensions: ['.ts'],
      plugins: [
        ['module-resolver', {
          'alias': alias
        }]
      ]
    })
    .bundle()
    .pipe(source('common.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(gulpif(condition, uglify()))
    .pipe(sourcemaps.write('./sourcemap/'))
    .pipe(gulp.dest(buildConfig.js))
})

// 给 dist 下的js添加hash
gulp.task('rev:js', function() {
  return gulp.src([`${buildConfig.js}/**/*.js`, `!${buildConfig.env}/*`])
    .pipe(vinylPaths(del))
    .pipe(gulpif(condition, rev())) // 添加hash后缀
    .pipe(gulp.dest(buildConfig.js))
    .pipe(gulpif(condition, rev.manifest({ merge: true }))) // 生成映射文件
    .pipe(gulpif(condition, gulp.dest('rev/js'))) // 输出映射文件
})

// 打包 js
gulp.task('js', gulp.parallel('js:entry', 'js:common'));

// 打包 css
gulp.task('css', function () {
  return gulp.src(devConfig.css)
    .pipe(sassImport())
    .pipe(sass().on('error', sass.logError))
    .pipe(gulpif(condition, cleanCSS()))
    .pipe(postcss('./.postcssrc.js'))
    .pipe(gulpif(condition, rev()))
    .pipe(gulp.dest(buildConfig.css))
    .pipe(gulpif(condition, rev.manifest()))
    .pipe(gulpif(condition, gulp.dest('rev/css')))
})

// 打包 html
gulp.task('html', function () {
  return gulp.src(devConfig.html)
    .pipe(fileinclude({
      prefix: '@@',
      basepath: devConfig.component
    }))
    .pipe(gulpif(condition, htmlmin({
      removeComments: true,
      collapseWhitespace: true,
      minifyJS: true,
      minifyCSS: true
    })))
    .pipe(gulp.dest(buildConfig.html))
})

// 打包图片
gulp.task('image', function () {
  return gulp.src(devConfig.image)
    .pipe(imagemin())
    .pipe(gulpif(condition, rev()))
    .pipe(gulp.dest(buildConfig.image))
    .pipe(gulpif(condition, rev.manifest()))
    .pipe(gulpif(condition, gulp.dest('rev/images')))
})

// 打包字体
gulp.task('font', function() {
  return gulp.src(devConfig.font)
    .pipe(gulpif(condition, rev()))
    .pipe(gulp.dest(buildConfig.font))
    .pipe(gulpif(condition, rev.manifest()))
    .pipe(gulpif(condition, gulp.dest('rev/fonts')))
})

// 打包静态文件
gulp.task('static', function () {
  return gulp.src(devConfig.static)
    .pipe(gulp.dest(buildConfig.static))
})

// 清除文件
gulp.task('clean', function () {
  return del([NODE_ENV === 'development' ? './dev/' : './dist/', './rev']);
})

// 替换html文件中的路径
gulp.task('revC:html', function () {
  return gulp.src(['rev/**/*.json', path.join(buildConfig.html, '/*.html')])
    .pipe(revCollector({replaceReved:true}))
    .pipe(gulp.dest(buildConfig.html));
});

// 替换打包后css文件中的路径
gulp.task('revC:css', function () {
  return gulp.src(['rev/**/*.json', path.join(buildConfig.css, '/*.css')])
    .pipe(revCollector({replaceReved:true}))
    .pipe(gulp.dest(buildConfig.css));
})

// 打包 dist 下的文件
gulp.task('zip', function () {
  const d = new Date();
  const zipName = [config.zip.name, String(d.getFullYear()) + (d.getMonth() + 1) + d.getDate()]
  return gulp.src(config.zip.path)
    .pipe(zip(zipName.join('_') + '.zip'))
    .pipe(gulp.dest(config.zip.dest))
})

// 打包环境配置文件
gulp.task('env', function () {
  return gulp.src(devConfig.env)
    .pipe(rename('env.js'))
    .pipe(gulp.dest(buildConfig.env))
})

// 监听文件变化
gulp.task('watch', function () {
  gulp.watch('./src/**/*.html', gulp.parallel('html')).on('change', reload)
  gulp.watch('./src/css/**/*.{scss, css}', gulp.parallel('css')).on('change', reload)
  gulp.watch(['./src/js/**/*', './src/api/*', './config/**/*'], gulp.parallel('js')).on('change', reload)
  gulp.watch('./src/images/**.**', gulp.parallel('image')).on('change', reload)
  gulp.watch('./static/**/*', gulp.parallel('static')).on('change', reload)
})

// 启动本地服务
gulp.task('server', function () {
  browserSync.init({
    server: {
      baseDir: serverConfig.baseDir
    },
    open: serverConfig.open,
    port: serverConfig.port,
    notify: serverConfig.notify
  });
})

// 构建任务完成后的提示
gulp.task('build:chalk', function(done) {
  done();
  console.log(chalk.green(`
    --------------------
      ${BUILD_ENV} 环境构建完成
    --------------------
  `));
})

// 默认任务
gulp.task('default', function(done) {
  done();
  console.log(chalk.green(`
    启动开发环境：    npm run dev
    启动uat环境：     npm run uat
    启动prod环境：    npm run prod
    构建开发环境：    npm run build:dev
    构建uat 环境：    npm run build:uat
    构建prod环境：    npm run build:prod
    运行dist下代码：  npm run build:server
    压缩dist下代码：  npm run zip
  `));
})

gulp.task('revC', gulp.parallel("revC:html", "revC:css"));
gulp.task('build', gulp.series('clean', gulp.parallel('env', 'html', 'css', 'js', 'image', 'font', 'static'), 'rev:js', 'revC', 'build:chalk'));
gulp.task('dev', gulp.series('build', gulp.parallel('server', 'watch')));
