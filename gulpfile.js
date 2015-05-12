/**
 * This is the gulp file for the "jet-google-maps" project
 * Author:Nisheed Jagadish
 * email:nisheedj@thoughtworks.com
 */

//Wire up all the plugins need to run gulp tasks
var gulp = require('gulp'),
  //Path Util
  path = require('path'),
  //Console colors
  colors = require('colors/safe'),
  //Test for errors in JS files
  jshint = require('gulp-jshint'),
  //compress the JS files
  uglify = require('gulp-uglify'),
  //Compile less files to css
  less = require('gulp-less'),
  //Minify CSS
  minify = require('gulp-minify-css'),
  //Keep gulp running even on errors
  plumber = require('gulp-plumber'),
  //Clean the folders before build
  clean = require('gulp-clean'),
  //Concatinate files
  concat = require('gulp-concat'),
  //Rename files or folder structures
  rename = require('gulp-rename');

// Folder paths
var paths = {
  css: {
    dest: ['app/css'],
    watch: ['app/less/**/*.less','app/less/**.less'],
    clean: ['app/css/**', 'app/less/bootstrap']
  },
  js: {
    src: ['app/js/*.js'],
    dest: 'app/js/build',
    watch: ['app/js/**/*.js'],
    clean: ['app/js/vendor']
  },
  fonts: {
    clean: ['app/fonts/bootstrap']
  }
};


//Clean CSS task
gulp.task('clean-css-first', function() {
  return gulp.src(paths.css.clean, {
      read: false
    })
    .pipe(plumber())
    .pipe(clean());
});

//Clean CSS task
gulp.task('clean-css', function() {
  return gulp.src(paths.css.dest, {
      read: false
    })
    .pipe(plumber())
    .pipe(clean());
});

//Clean CSS task
gulp.task('clean-fonts', function() {
  return gulp.src(paths.fonts.clean, {
      read: false
    })
    .pipe(plumber())
    .pipe(clean());
});

//Clean JS task
gulp.task('clean-js', function() {
  return gulp.src(paths.js.clean, {
      read: false
    })
    .pipe(plumber())
    .pipe(clean());
});

//Copy JS assets
gulp.task('copyJsAssets', ['clean-js'], function() {
  return gulp.src([
      'bower_components/jquery/dist/*.*',
      'bower_components/bootstrap/dist/js/*.js'
    ])
    .pipe(plumber())
    .pipe(rename({
      dirname: ''
    }))
    .pipe(gulp.dest('app/js/vendor'));
});

//Copy Bootstrap CSS assets
gulp.task('copyCssAssets', ['clean-css-first'], function() {
  return gulp.src([
      'bower_components/bootstrap/less/**/*.less',
    ], {
      base: path.join(__dirname, 'bower_components', 'bootstrap', 'less')
    })
    .pipe(plumber())
    .pipe(gulp.dest('app/less/bootstrap'));
});

//Copy Bootstrap Font assets
gulp.task('copyFontAssets', ['clean-fonts'], function() {
  return gulp.src([
      'bower_components/bootstrap/fonts/*.*',
    ], {
      base: path.join(__dirname, 'bower_components', 'bootstrap', 'fonts')
    })
    .pipe(plumber())
    .pipe(gulp.dest('app/fonts/bootstrap'));
});



//The default gulp task
gulp.task('default', function() {
  //Hello message
  console.log(colors.green.bold('seed gulp tasks!'));
  console.log(colors.cyan('Please use one of the following tasks:'));
  //Tasks go here
  console.log(colors.yellow('`gulp firstrun` to copy the assets for the first time.'));
  console.log(colors.yellow('`gulp less` for copiling less to css.'));
  console.log(colors.yellow('`gulp watch` to continuously check for changes.'));
  //System beep
  console.log("\007");
});

// First run task
gulp.task('firstrun', ['copyCssAssets', 'copyFontAssets', 'copyJsAssets']);


// Rerun the task when a file changes
gulp.task('watch', function() {
  gulp.watch(paths.css.watch, ['less']);
});

// Compile less to css build
gulp.task('lessBuild', function() {
  return gulp.src('app/less/styles.less')
    .pipe(plumber())
    .pipe(less())
    .pipe(minify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(paths.css.dest[0]));
});

// Compile less bootstrap
gulp.task('lessBootstrap', function() {
  return gulp.src('app/less/bootstrap/bootstrap.less')
    .pipe(plumber())
    .pipe(less())
    .pipe(minify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(paths.css.dest[0]));
});

//Compile less to css
gulp.task('less', ['clean-css', 'lessBootstrap', 'lessBuild']);