const { src, dest, watch, series, parallel } = require("gulp");
const fileInclude = require("gulp-file-include");
const prettyHtml = require("gulp-pretty-html");
const sass = require("gulp-sass")(require("sass"));
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const purgecss = require("gulp-purgecss");
const cssnano = require("cssnano");
const uglify = require("gulp-uglify");
const imagemin = require("gulp-imagemin");
const concat = require("gulp-concat");
const del = require("del");
const browsersync = require("browser-sync").create();

const srcPathName = "src";
const buildPathName = "build";
const distPathName = "dist";

const paths = {
	html: {
		src: `./${srcPathName}/html/*.html`,
		watch_src: `./${srcPathName}/html/**/*.html`,
		dest: `./${buildPathName}`,
		destProd: `./${distPathName}`,
	},
	css: {
		src: `./${srcPathName}/css/**/*.css`,
		dest: `./${buildPathName}/assets/css`,
		destProd: `./${distPathName}/assets/css`,
	},
	scss: {
		src: `./${srcPathName}/scss/**/*.scss`,
		exclude_src: `!./${srcPathName}/scss/plugins/**/*.scss`,
		dest: `./${buildPathName}/assets/css`,
		destProd: `./${distPathName}/assets/css`,
	},
	js: {
		root_src: `./${srcPathName}/js/*.js`,
		bootstrap_src: `./${srcPathName}/js/plugins/bootstrap.bundle.min.js`,
		plugins_src: `./${srcPathName}/js/plugins/**/*.js`,
		watch_src: `./${srcPathName}/js/**/*.js`,
		dest: `./${buildPathName}/assets/js`,
		destProd: `./${distPathName}/assets/js`,
	},
	jsPlugins: [
		`./${srcPathName}/js/plugins/bootstrap.bundle.min.js`,
		`./${srcPathName}/js/plugins/swiper-bundle.min.js`,
		`./${srcPathName}/js/plugins/aos.min.js`,
		`./${srcPathName}/js/plugins/venobox.min.js`,
		`./${srcPathName}/js/plugins/typed.umd.js`,
		`./${srcPathName}/js/plugins/headroom.min.js`,
	],
	img: {
		src: `./${srcPathName}/images/**/*.{jpg,jpeg,png,svg}`,
		dest: `./${buildPathName}/assets/images`,
		destProd: `./${distPathName}/assets/images`,
	},
	php: {
		src: `./${srcPathName}/php/**/*.php`,
		dest: `./${buildPathName}/assets/php`,
		destProd: `./${distPathName}/assets/php`,
	},
	clean: {
		dist: `./${distPathName}/*`,
		all: `./${buildPathName}/*`,
		html: `./${buildPathName}/*.html`,
		css: `./${buildPathName}/assets/css/*`,
		js: `./${buildPathName}/assets/js/*`,
		img: `./${buildPathName}/assets/images/*`,
		php: `./${buildPathName}/assets/php/*`,
	},
};

// Browsersync Tasks
function browsersyncServe(done) {
	browsersync.init({
		server: {
			baseDir: `./${buildPathName}`,
		},
		notify: false,
	});
	done();
}

function browsersyncReload(done) {
	browsersync.reload();
	done();
}

// HTML Task
function htmlTask() {
	return src(paths.html.src)
		.pipe(fileInclude({ prefix: "@@", basepath: "@file" }))
		.pipe(prettyHtml())
		.pipe(dest(paths.html.dest));
}
function htmlTaskProd() {
	return src(paths.html.src)
		.pipe(fileInclude({ prefix: "@@", basepath: "@file" }))
		.pipe(prettyHtml())
		.pipe(dest(paths.html.destProd));
}

// CSS Task
function cssTask() {
	return src(paths.css.src).pipe(concat("plugins.css")).pipe(dest(paths.css.dest));
}

function cssTaskProd() {
	return src(paths.css.src).pipe(concat("plugins.css")).pipe(dest(paths.css.destProd));
}

function cssPurgeTask() {
	return src(`${paths.css.dest}/**/*.css`)
		.pipe(
			purgecss({
				content: [`${buildPathName}/**/*.{html,js}`],
				safelist: [/^veno/, /^swiper-pagination/],
			})
		)
		.pipe(postcss([autoprefixer(), cssnano()]))
		.pipe(dest(paths.css.destProd));
}

// // Sass Task
function scssTask() {
	return src([paths.scss.src, paths.scss.exclude_src], { sourcemaps: true })
		.pipe(sass())
		.on("error", sass.logError)
		.pipe(postcss([autoprefixer()]))
		.pipe(dest(paths.css.dest, { sourcemaps: "." }));
}

function scssTaskProd() {
	return src([paths.scss.src, paths.scss.exclude_src], { sourcemaps: false })
		.pipe(sass({ outputStyle: "compressed" }))
		.on("error", sass.logError)
		.pipe(postcss([autoprefixer(), cssnano()]))
		.pipe(dest(paths.css.destProd));
}

// JavaScript Task
function jsTask() {
	return src(paths.js.root_src).pipe(dest(paths.js.dest));
}
function jsTaskProd() {
	return src(paths.js.root_src).pipe(uglify()).pipe(dest(paths.js.destProd));
}

// JavaScript Plugins Task
function jsPluginsTask() {
	return src(paths.jsPlugins).pipe(concat("plugins.js")).pipe(dest(paths.js.dest));
}
function jsPluginsTaskProd() {
	return src(paths.jsPlugins).pipe(concat("plugins.js")).pipe(dest(paths.js.destProd));
}

// Image Task
function imgTask() {
	return src(paths.img.src).pipe(imagemin()).pipe(dest(paths.img.dest));
}
function imgTaskProd() {
	return src(paths.img.src).pipe(imagemin()).pipe(dest(paths.img.destProd));
}

// PHP Task
function phpTask() {
	return src(paths.php.src).pipe(dest(paths.php.dest));
}
function phpTaskProd() {
	return src(paths.php.src).pipe(dest(paths.php.destProd));
}

// Clean directory
function cleanDist() {
	return del(paths.clean.dist);
}
function cleanAll() {
	return del(paths.clean.all);
}
function cleanHtml() {
	return del(paths.clean.html);
}
function cleanCss() {
	return del(paths.clean.css);
}
function cleanJs() {
	return del(paths.clean.js);
}
function cleanImg() {
	return del(paths.clean.img);
}
function cleanPhp() {
	return del(paths.clean.php);
}

// Watch Task
function watchTask() {
	watch(paths.html.watch_src, series(cleanHtml, htmlTask, browsersyncReload));
	watch([paths.css.src, paths.scss.src], series(cleanCss, parallel(cssTask, scssTask), browsersyncReload));
	watch(
		[paths.js.root_src, paths.js.plugins_src],
		series(cleanJs, parallel(jsTask, jsPluginsTask), browsersyncReload)
	);
	watch(paths.img.src, series(cleanImg, imgTask, browsersyncReload));
	watch(paths.php.src, series(cleanPhp, phpTask, browsersyncReload));
}

// Default Gulp task
exports.default = series(
	cleanAll,
	parallel(htmlTask, cssTask, scssTask, jsTask, jsPluginsTask, imgTask, phpTask),
	browsersyncServe,
	watchTask
);
exports.prod = series(
	cleanDist,
	htmlTaskProd,
	cssTaskProd,
	jsTaskProd,
	jsPluginsTaskProd,
	phpTaskProd,
	imgTaskProd,
	scssTaskProd,
	cssPurgeTask
);
