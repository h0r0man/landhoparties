var gulp         = require('gulp'),
    plumber      = require('gulp-plumber'),
    path         = require('path'),
    del          = require('del');

var jade         = require('gulp-jade');

var imageResize  = require('gulp-image-resize')
    parallel     = require('concurrent-transform'),
    os           = require("os"),
    rename       = require("gulp-rename"),
    imagemin     = require('gulp-imagemin');

var webpack      = require('webpack-stream');

var sass         = require('gulp-sass'),
    combineMq    = require('gulp-combine-mq'),
    autoprefixer = require('gulp-autoprefixer'),
    cssnano      = require('gulp-cssnano'),
    shorthand    = require('gulp-shorthand');

var cheerio      = require('gulp-cheerio'),
    svgstore     = require('gulp-svgstore'),
    svgmin       = require('gulp-svgmin');

var favicons     = require('gulp-favicons');

var browserSync  = require('browser-sync'),
    reload       = browserSync.reload;

// CLEAN -----------------------------------------------------------------------

gulp.task('clean', function () {
  return del.sync([
    './dist/**/*'
  ]);
});

// JADE ------------------------------------------------------------------------

gulp.task('jade', function() {

  var YOUR_LOCALS = {};

  return gulp.src(['./src/**/*.jade', '!./src/**/_*.jade'])
    .pipe(plumber())
    .pipe(jade({
      locals: YOUR_LOCALS
    }))
    .pipe(gulp.dest('./dist/'))
});

gulp.task('jade-watch', ['jade'], reload);

// STYLESHEETS -----------------------------------------------------------------

var AUTOPREFIXER_BROWSERS = {
  browsers: [
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
  ]
};

gulp.task('stylesheets', function () {
  return gulp.src('./src/stylesheets/**/*.{scss,sass}')
    .pipe(plumber())
    .pipe(sass({
      precision: 6
    }).on('error', sass.logError))
    .pipe(combineMq())
    .pipe(shorthand())
    .pipe(autoprefixer(AUTOPREFIXER_BROWSERS))
    .pipe(cssnano())
    .pipe(gulp.dest('./dist/css/'))
    .pipe(reload({stream: true}));
});

// SCRIPTS ---------------------------------------------------------------------

gulp.task('scripts', function () {
  return gulp.src(['./src/js/all.js'])
    .pipe(webpack(
      require('./webpack.config.js')
    ))
    .pipe(gulp.dest('./dist/js/'));
});

gulp.task('scripts-watch', ['scripts'], reload);

// RESIZE ----------------------------------------------------------------------

gulp.task('resize-1x', function () {
  return gulp.src('./src/img/*{jpg,jpeg}')
    .pipe(plumber())
    .pipe(parallel(
      imageResize({ width : 960 }),
      os.cpus().length
    ))
    .pipe(rename(function (path) { path.basename += "-960"; }))
    .pipe(gulp.dest('./dist/img'));
});

gulp.task('resize-1.5x', function () {
  return gulp.src('./src/img/*{jpg,jpeg}')
    .pipe(plumber())
    .pipe(parallel(
      imageResize({ width : 1440 }),
      os.cpus().length
    ))
    .pipe(rename(function (path) { path.basename += "-1440"; }))
    .pipe(gulp.dest('./dist/img'));
});

gulp.task('resize-2x', function () {
  return gulp.src('./src/img/*{jpg,jpeg}')
    .pipe(plumber())
    .pipe(parallel(
      imageResize({ width : 1920 }),
      os.cpus().length
    ))
    .pipe(rename(function (path) { path.basename += "-1920"; }))
    .pipe(gulp.dest('./dist/img'));
});

gulp.task('images-resize', ['resize-1x', 'resize-1.5x', 'resize-2x']);

// IMAGES ----------------------------------------------------------------------

gulp.task('images-compress', function () {
  return gulp.src(['./src/img/**/*{gif,jpg,jpeg,png}'])
    .pipe(plumber())
    .pipe(imagemin({
      optimizationLevel: 5,
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest('./dist/img/'));
});

gulp.task('images', ['images-resize', 'images-compress']);

// ICONS -----------------------------------------------------------------------

gulp.task('icons', function () {
  return gulp.src(['./src/img/icons/**/*.svg'])
    .pipe(plumber())
    .pipe(svgmin(function (file) {
      var prefix = path.basename(file.relative, path.extname(file.relative));
      return {
        plugins: [{
          cleanupIDs: {
            prefix: prefix + '-',
            minify: true
          }
        }]
      }
    }))
    .pipe(gulp.dest('./dist/img'));
});

// COPY ------------------------------------------------------------------------

var FILES_TO_COPY = [
    './src/*.txt',
    './favicon.ico'
];

gulp.task('copy', function () {
  return gulp.src(FILES_TO_COPY)
    .pipe(gulp.dest('./dist'));
});

// BUILD -----------------------------------------------------------------------

gulp.task('build', ['jade', 'icons', 'scripts', 'images', 'stylesheets', 'copy'], function () {
  browserSync({
    server: './dist',
    port: 9999
  });
});

// WATCH -----------------------------------------------------------------------

gulp.task('watch', function () {
  gulp.watch('./src/**/*.jade',                    ['jade-watch']);
  gulp.watch('./src/js/**/*.js',                   ['scripts-watch']);
  gulp.watch('./src/stylesheets/**/*.{scss,sass}', ['stylesheets']);
});

// DEFAULT/WATCH ---------------------------------------------------------------

gulp.task('default', function () {
  gulp.start('clean', 'build', 'watch');
});

// FAVICONS --------------------------------------------------------------------

gulp.task('favicons', function () {
  return gulp.src('./src/img/logo.png')
    .pipe(favicons({
      appName: "gulp-horoman",
      appDescription: "A workflow environment using Gulp.js",
      developerName: "Roman Horokhovatskyy",
      developerURL: "http://horoman.com/",
      background: "#FFF",
      path: "/",
      url: "http://domain.ltd/",
      display: "standalone",
      orientation: "portrait",
      version: 0.2,
      logging: false,
      online: false,
      html: "index.html",
      pipeHTML: true,
      replace: true
    }))
    .pipe(gulp.dest('./dist/'))
});
