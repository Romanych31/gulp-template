let projectFolder = require("path").basename(__dirname); //переменная пути к папке с результатом работы галп
let sourceFolder = "#src"; // переменная с именем папки исходника

let fs = require("fs"); // file system

//создаем обьект который будет содержать различные пути к папкам и файлам проекта
let path = {
   //пути куда будут выгружатся результирующие файлы 
   build: {
      html: projectFolder + "/",
      css: projectFolder + "/css/",
      js: projectFolder + "/js/",
      img: projectFolder + "/img/",
      fonts: projectFolder + "/fonts/",
   },
   // пути к исходникам
   src: {
      html: sourceFolder + "/*.html",
      css: sourceFolder + "/scss/style.scss",
      js: sourceFolder + "/js/script.js",
      img: sourceFolder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
      fonts: sourceFolder + "/fonts/*.ttf",
   },
   //пути ко всем исходным файлам которые нужно слушать
   watch: {
      html: sourceFolder + "/**/*.html",
      css: sourceFolder + "/scss/**/*.scss",
      js: sourceFolder + "/js/**/*.js",
      img: sourceFolder + "/img/**/*.{jpg,png,svg,gif,ico,webp}",
   },
   //путь для очистки папки с результатами при запуске ГАЛПа
   clean: "./" + projectFolder + "/",
}

//дополнительные переменные
let { src, dest, watch, parallel, series } = require("gulp"),
   browsersync = require("browser-sync").create(),        //переменная плагина browser-sync для обновления браузера
   fileInclude = require("gulp-file-include"),            //переменная плагина file-include для сборки файлов в один
   del = require("del"),                                  //переменная плагина del для удаления папки
   scss = require("gulp-sass"),                           //переменная плагина sass
   autoprefixer = require("gulp-autoprefixer"),           //плагин автоматической установки префиксов scss
   groupMedia = require("gulp-group-css-media-queries"), // группировка медиа-запросов в конце файла
   cleanCss = require("gulp-clean-css"),                 // плагин для читки и сжатия файла на выходе
   rename = require("gulp-rename"),                       //переименовывает файл .css в .min.css, .js в .min.js
   uglify = require("gulp-uglify-es").default,            //сжатие и минификация js-файлов
   imageMin = require("gulp-imagemin"),                   //сжатие и оптимизация картинок
   webp = require("gulp-webp"),                           //конвертация в webp
   webpHtml = require("gulp-webp-html"),                  //подключение webp в html
   webpCss = require("gulp-webpcss"),                     //плагин для подключения картинок .webp в стилях css
   svgSprite = require("gulp-svg-sprite"),                //создание svg-спрайтов
   ttf2woff = require("gulp-ttf2woff"),                   //шрифты конвертация ttf в woff
   ttf2woff2 = require("gulp-ttf2woff2"),                 //шрифты конвертация ttf в woff2
   fonter = require("gulp-fonter");                       //шрифты конвертация otf в ttf

function browserSync() {
   browsersync.init({
      //настройки плагина
      server: {
         baseDir: "./" + projectFolder + "/"
      },
      port: 3000,
      notify: false, // отключаем всплытие информационного окна что страничка обновилась
      browser: ["chrome"/*, "firefox", "opera", "msedge"*/],
   });
}

//работа с html 
function html() {
   return src(path.src.html)       // метод получения исходных файлов по заданному пути
      .pipe(fileInclude())         // собирает файлы html в один
      .pipe(webpHtml())            // заменяет в html тег img на picture и подключает формат webp
      .pipe(dest(path.build.html)) // запись полученых файлов в указанном каталоге, pipe - формирует цепочку потока данных (трубопровод)
      .pipe(browsersync.stream())
}

//работа scss
function css() {
   return src(path.src.css)                               // метод получения исходных файлов по заданному пути
      .pipe(
         scss({                                           // обработка scss в соответствии с настройками
            outputStyle: "expanded",                      //расширенный файл css (не сжатый)
         })
      )
      .pipe(groupMedia())                                // группировка медиа запросов
      .pipe(
         autoprefixer({                                   //настройка плагина автопрефиксов
            overrideBrowserslist: ["last 5 versions"],
            cascade: true,
         })
      )
      .pipe(webpCss())
      .pipe(dest(path.build.css))                        // выгружает обычный файл css
      .pipe(cleanCss())                                 // сжимает и чистит файл css
      .pipe(
         rename({
            extname: ".min.css"                          // меняем расширение перед повторной выгрузкой
         })
      )
      .pipe(dest(path.build.css))                        // запись полученых файлов в указанном каталоге, pipe - формирует цепочку потока данных (трубопровод)
      .pipe(browsersync.stream())
}

//работа с js
function js() {
   return src(path.src.js)       // метод получения исходных файлов по заданному пути
      .pipe(fileInclude())       // собирает файлы js в один
      .pipe(dest(path.build.js)) // выгружает обычный файл js
      .pipe(uglify())            //сжимаем js-файл
      .pipe(
         rename({
            extname: ".min.js"   // меняем расширение перед повторной выгрузкой
         })
      )
      .pipe(dest(path.build.js)) // запись полученых файлов в указанном каталоге, pipe - формирует цепочку потока данных (трубопровод)
      .pipe(browsersync.stream())
}

//работа с картинками
function images() {
   return src(path.src.img)       // метод получения исходных файлов по заданному пути
      .pipe(
         webp({
            quality: 70          // качество/сжатие
         })
      )
      .pipe(dest(path.build.img)) //выгрузка изображений webp
      .pipe(src(path.src.img))    // обращение к исходникам для последующей обработки изображений других форматов
      .pipe(
         imageMin({           // настройки оптимизации
            progressive: true,
            svgoPlugins: [{ removeViewBox: false }],
            interLased: true,
            optimizationLevel: 3 // от 0 до 7 уровень сжатия
         })
      )
      .pipe(dest(path.build.img)) // запись полученых файлов в указанном каталоге, pipe - формирует цепочку потока данных (трубопровод)
      .pipe(browsersync.stream())
}

//svg-спрайт"
function sprite() {
   return src([sourceFolder + "/img/**/*.svg"])
      .pipe(
         svgSprite({                            //настройки для создания спрайтов
            mode: {
               stack: {
                  sprite: "../icons/icons.svg", //имя файла спрайта
                  example: true                 //создает html-файл с примерами иконок
               }
            }
         })
      )
      .pipe(dest(path.build.img))
}

//обработка шрифтов
function fonts() {                               // преобразование ttf в woff and woff2
   // преобразование otf в ttf
   src([sourceFolder + "/fonts/*.otf"])
      .pipe(
         fonter({
            formats: ["ttf"]
         })
      )
      .pipe(dest(sourceFolder + "/fonts/"));
   src(path.src.fonts)
      .pipe(ttf2woff())
      .pipe(dest(path.build.fonts));
   return src(path.src.fonts)
      .pipe(ttf2woff2())
      .pipe(dest(path.build.fonts));
}

//функция для подключения шрифтов в файле стилей fonts.scss
function fontsStyle() {
   let fileContent = fs.readFileSync(sourceFolder + "/scss/fonts.scss");
   if (fileContent == '') {
      fs.writeFile(sourceFolder + "/scss/fonts.scss", '', cb);
      return fs.readdir(path.build.fonts, function (err, items) {
         if (items) {
            let cFontName;
            for (var i = 0; i < items.length; i++) {
               let fontName = items[i].split('.');
               fontName = fontName[0];
               if (cFontName != fontName) {
                  fs.appendFile(sourceFolder + "/scss/fonts.scss", "@include font('" + fontName + "', '" + fontName + "', '400', 'normal');\r\n", cb);
               }
               cFontName = fontName;
               console.log(cFontName);
            }
         }
      });
   }
}
function cb() { return } //callback function

// отслеживание изменения файлов
function watchFiles() {
   watch([path.watch.html], html);   // отслеживает изменения во всех файлах html
   watch([path.watch.css], css);     // отслеживает изменения во всех файлах scss
   watch([path.watch.js], js);       // отслеживает изменения во всех файлах js
   watch([path.watch.img], images);  // отслеживает изменения в файлах img
}

// удаление папки dist при перезаписи
function clean() {
   return del(path.clean);
}

let build = series(clean, parallel(js, css, html, images, fonts));
let start = parallel(series(build, parallel(fontsStyle, browserSync)), watchFiles);

//необходимо подружить ГАЛП с новыми переменными
exports.sprite = sprite;
exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.browserSync = browserSync;
exports.build = series(build, fontsStyle);       //команда gulp build выполнит функцию build
exports.start = start;
exports.default = start; //команда по умолчанию gulp выполнит заданную функцию
