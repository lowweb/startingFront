
'use strict'
import gulp from 'gulp';
import babel from 'gulp-babel';
import sync from 'browser-sync';
import yargs from 'yargs';
import gulpif from "gulp-if";
import sourcemaps from "gulp-sourcemaps";
import rename from "gulp-rename";
import del from  "del";
import debug from "gulp-debug";
//html
import include from "gulp-file-include";
import replace from 'gulp-replace';
import htmlmin from 'gulp-htmlmin';
//styles
import postcss from 'gulp-postcss';
import sass from 'gulp-sass';
import sassGlob from 'gulp-sass-glob';
import plumber from 'gulp-plumber';
import mediaminmax from 'postcss-media-minmax';
import autoprefixer from 'autoprefixer';
import mincsso from 'postcss-csso';
//js
import webpack from 'webpack';
import webpackStream from 'webpack-stream';
import terser from 'gulp-terser';
//images
import imagemin from "gulp-imagemin";
import imageminPngquant from "imagemin-pngquant";
import imageminZopfli from "imagemin-zopfli";
import imageminMozjpeg from "imagemin-mozjpeg";
import imageminGiflossy from "imagemin-giflossy";
import flatten from "gulp-flatten" //remove path
//favicons
import gfavicons from "gulp-favicons";
//Webp
import imageminWebp from "imagemin-webp";
import gwebp from "gulp-webp";
//sprites
import svg from "gulp-svg-sprite";
// postcss-assets
// postcss-svg
// postcss-nano
// postscc-fontface
// postcss-use

//Detect prod flag
const production = !!yargs.argv.production;

//webpack config for js bandle
import webpackConfig from "./webpack.config.js";
webpackConfig.mode = production ? "production" : "development";
webpackConfig.devtool = production ? false : "source-map";

//Declare task PATH
const path = {
    html: {
        src: ['./src/html/*.html', './src/html/pages/*.html',],
        dist: './dist',
        watch: ['./src/blocks/**/*.html','./src/html/**/*.html'],
    },
    styles: {
        src: "./src/styles/main.{scss,sass}",
        dist: "./dist/styles/",
        watch: [
            "./src/blocks/**/*.{scss,sass}",
            "./src/styles/**/*.{scss,sass}"
        ]
    },

    clean: {
        dist: "./dist/*" 
    },
    scripts: {
        src: "./src/scripts/**/*.js",
        dist: "./dist/scripts/",
        watch: [
            "./src/blocks/**/*.js",
            "./src/scripts/**/*.js"
        ]
    },
    favicons: {
        src: "./src/images/favicon/*.{jpg,jpeg,png,gif}",
        dist: "./dist/images/favicons/",
    },
    images: {
        src: [
            "./src/images/**/*.{jpg,jpeg,png,gif,tiff,svg}",
            "./src/blocks/**/*.{jpg,jpeg,png,gif,tiff,svg}",
            "!./src/images/favicon/*.{jpg,jpeg,png,gif,tiff}"
        ],
        dist: "./dist/images/",
        watch: ["./src/images/**/*.{jpg,jpeg,png,gif,svg,tiff}",
                "./src/blocks/**/*.{jpg,jpeg,png,gif,tiff,svg}",
        ]
    },
    webp: {
        src: [
            "./src/images/**/*.{jpg,jpeg,png,tiff}",
            "./src/blocks/**/*.{jpg,jpeg,png,tiff}",
            "!./src/images/favicon/*.{jpg,jpeg,png,gif,tiff}"
        ],
        dist: "./dist/images/",
        watch: [
            "./src/images/**/*.{jpg,jpeg,png,tiff}",
            "./src/blocks/**/*.{jpg,jpeg,png,tiff}",
            "!./src/images/favicon/*.{jpg,jpeg,png,gif,tiff}"
        ]
    },
    sprites: {
        src: ["./src/images/svg/*.svg",
              "./src/blocks/**/*.svg"
            ],
        dist: "./dist/images/sprites/",
        watch: ["./src/images/svg/*.svg",
                "./src/blocks/**/*.svg"
                ]
    },
    fonts: {
        src: "./src/fonts/**/*.{woff,woff2}",
        dist: "./dist/fonts/",
        watch: "./src/fonts/**/*.{woff,woff2}"
    }
}

// HTML
export const html = () => {
    return gulp.src(path.html.src)
        .pipe(include({
            prefix: "@@",
            basepath: "@file"
        }))
        .pipe(gulpif(production,htmlmin({
            removeComments: true,
            collapseWhitespace: true
        })))
        .pipe(gulpif(production, replace(".css", ".min.css")))
        .pipe(gulpif(production, replace(".js", ".min.js")))
        .pipe(gulp.dest(path.html.dist))
        .pipe(sync.stream());
};


// Styles
export const styles = () => {
    return gulp.src(path.styles.src)
        .pipe(gulpif(!production, sourcemaps.init()))
        .pipe(plumber())
        .pipe(sassGlob())
        .pipe(sass())
        .pipe(gulpif(production,postcss([
            autoprefixer,
            mediaminmax,
            mincsso,
            // postcss-flexbug
            ])))
        .pipe(gulpif(production, rename({
            suffix: ".min"
        })))
        .pipe(plumber.stop()) 
        .pipe(gulpif(!production, sourcemaps.write()))   
        .pipe(replace(/\.\.\//g, ''))
        .pipe(gulp.dest(path.styles.dist))
        .pipe(sync.stream());
}

// Scripts
// export const scripts = () => {
//     return gulp.src(path.scripts.src)
//         .pipe(sourcemaps.init())
//         .pipe(babel({
//             presets: ['@babel/preset-env']
//         }))
//         .pipe(terser())
//         .pipe(concat('all.js'))
//         .pipe(sourcemaps.write('.'))
//         .pipe(gulp.dest(path.dist.js))
//         .pipe(sync.stream());
		
// }
export const scripts = () => {
    return gulp.src(path.scripts.src)
            .pipe(webpackStream(webpackConfig), webpack)
            .pipe(gulpif(production,terser()))
            .pipe(gulpif(production, rename({
                suffix: ".min"
            })))
            .pipe(gulp.dest(path.scripts.dist))
            // .pipe(debug({
            //     "title": "Scripts files"
            // }))
            // .on("end", sync.stream());
            
            .pipe(sync.stream());
}
//Images
export const images = () => {
    return gulp.src(path.images.src)
        .pipe(gulpif(production, imagemin([
            imageminGiflossy({
                optimizationLevel: 3,
                optimize: 3,
                lossy: 2
            }),
            imageminPngquant({
                speed: 5,
                quality: [0.6, 0.8]
            }),
            imageminZopfli({
                more: true
            }),
            imageminMozjpeg({
                progressive: true,
                quality: 90
            }),
            imagemin.svgo({
                plugins: [
                    { removeViewBox: false },
                    { removeUnusedNS: false },
                    { removeUselessStrokeAndFill: false },
                    { cleanupIDs: false },
                    { removeComments: true },
                    { removeEmptyAttrs: true },
                    { removeEmptyText: true },
                    { collapseGroups: true }
                ]
            })
        ])))
        .pipe(flatten())
        .pipe(gulp.dest(path.images.dist))
        .pipe(sync.stream());
        // .pipe(debug({
        //     "title": "Images"
        // }))
        // .on("end", sync.stream());
}

//Favicons
export const favicons = () => {
    return gulp.src(path.favicons.src)
        .pipe(gulpif(production,gfavicons({
            icons: {
                appleIcon: true,
                favicons: true,
                online: false,
                appleStartup: false,
                android: false,
                firefox: false,
                yandex: false,
                windows: false,
                coast: false
            }
        })))
        .pipe(gulp.dest(path.favicons.dist))
        .pipe(debug({
            "title": "Favicons"
        }));
}

//Webp 
export const webp = () => {
    return gulp.src(path.webp.src)
        .pipe(gwebp(gulpif(production, imageminWebp({
            lossless: true,
            quality: 100,
            alphaQuality: 100
        }))))
        .pipe(gulp.dest(path.webp.dist))
        .pipe(sync.stream());

}

//Sprites
export const sprites = () => {
    return gulp.src(path.sprites.src)
    .pipe(svg({
        // shape: {
        //     dest: "intermediate-svg"
        // },
        mode: {
            // css: { // Activate the «css» mode
            //     render: {
            //       css: true // Activate CSS output (with default options)
            //     }
            //   }
            stack: {
                sprite: "../sprite.svg"
            }
        }
    }))
    .pipe(gulp.dest(path.sprites.dist))
    .pipe(sync.stream());
}
//Fonts
export const fonts = () => {
    return gulp.src(path.fonts.src)
          .pipe(gulp.dest(path.fonts.dist))
          .pipe(sync.stream());
}


// Server
export const server = () => {
    sync.init({
        ui: false,
        notify: false,
        server: {
            baseDir: 'dist'
        }
    });
}

// Watch
export const watch = () => {
    gulp.watch(path.html.watch, gulp.series('html'));
    gulp.watch(path.styles.watch, gulp.series('styles'));
    gulp.watch(path.scripts.watch, gulp.series('scripts'));
    gulp.watch(path.images.watch, gulp.series('images'));
    gulp.watch(path.webp.watch, gulp.series('webp'));
    gulp.watch(path.sprites.watch, gulp.series('sprites'));
    gulp.watch(path.fonts.watch, gulp.series('fonts'));
}

//Clean
export const clean = () => {
    return del([path.clean.dist]);
}

// Default
export const dev = gulp.series(
    clean,
    gulp.parallel(
        html,
        styles,
        scripts,
        images,
        webp,
        sprites,
        fonts,
        favicons
    ),
    gulp.parallel(
        watch,
        server
    )
)

export const prod = gulp.series(
    clean,
    gulp.parallel(
        html,
        styles,
        scripts,
        images,
        webp,
        sprites,
        fonts,
        favicons
    )
)

export default dev;