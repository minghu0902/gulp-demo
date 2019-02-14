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
const chalk = require('chalk')
const sourcemaps = require('gulp-sourcemaps');
const gutil = require('gulp-util');
const uglify = require('gulp-uglify');
const gulpif = require('gulp-if');
const rev = require('gulp-rev'); // 为静态文件生成hash值 && 生成源文件和添加hash后文件的映射 rev.manifest.json
const revCollector = require('gulp-rev-collector'); // 根据rev生成的manifest.json文件中的映射, 去替换文件名称, 也可以替换路径
const sass = require('gulp-sass');
const cleanCSS = require('gulp-clean-css');
const postcss = require('gulp-postcss');
const htmlmin = require('gulp-htmlmin')
const imagemin = require('gulp-imagemin');
const fileinclude = require('gulp-file-include')
const zip = require('gulp-zip')

// 打包配置
const config = require('./config');
const devConfig = config.dev;
const buildConfig = config.build;
const serverConfig = config.server;

// server
const browserSync = require('browser-sync').create()
const reload = browserSync.reload

// 判断环境变量
const env = process.env.NODE_ENV || 'development';
const condition = env === 'production';

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

// 打包 js
gulp.task('js', function () {
  const tasks = entrys.map(file => {
    return browserify({
      basedir: '.',
      debug: true,
      entries: [devConfig.entry + file],
      cache: {},
      packageCache: {}
    })
      .plugin(tsify)
      .transform(babelify, {
        extensions: ['.ts']
      })
      .bundle()
      .pipe(source(file.split('.')[0] + '.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(uglify())
      .pipe(sourcemaps.write('./sourcemap/'))
      .pipe(gulpif(condition, rev())) // 添加hash后缀
      .pipe(gulp.dest("dist/js"))
      .pipe(gulpif(condition, rev.manifest())) // 生成映射文件
      .pipe(gulpif(condition, gulp.dest('rev/js'))) // 输出映射文件
  });
  return merge(tasks);
})

// 打包 css
gulp.task('css', function () {
  return gulp.src(devConfig.css)
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
gulp.task('font', () => {
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
  return del(['./dist', './rev']);
})

// 替换html文件中的路径
gulp.task('rev:html', function () {
  return gulp.src(['rev/**/*.json', path.join(buildConfig.html, '/*.html')])
    .pipe(revCollector())
    .pipe(gulp.dest(buildConfig.html));
});

// 替换打包后css文件中的路径
gulp.task('rev:css', function () {
  return gulp.src(['rev/**/*.json', path.join(buildConfig.css, '/*.css')])
    .pipe(revCollector())
    .pipe(gulp.dest(buildConfig.css));
})

// 打包 dist 下的文件
gulp.task('zip', function () {
  return gulp.src(config.zip.path)
    .pipe(zip(config.zip.name))
    .pipe(gulp.dest(config.zip.dest))
})

// 监听文件变化
gulp.task('watch', function () {
  gulp.watch('./src/**/*.html', gulp.parallel('html')).on('change', reload)
  gulp.watch('./src/css/*.scss', gulp.parallel('css')).on('change', reload)
  gulp.watch('./src/js/**/*', gulp.parallel('js')).on('change', reload)
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

gulp.task('rev', gulp.parallel("rev:html", "rev:css"));
gulp.task('build', gulp.series('clean', gulp.parallel('html', 'css', 'js', 'image', 'font', 'static'), 'rev', 'build:chalk'));
gulp.task('dev', gulp.series('build', gulp.parallel('server', 'watch')));
