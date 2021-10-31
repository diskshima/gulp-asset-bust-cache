# gulp-bust-cache

gulp plugin for busting the cache.

## Usage

1. Add to your development dependency.
    ```bash
    npm install --save-dev gulp-cache-bust
    ```
1. To use it, add it to your pipeline.
    - Example:
    ```javascript
    const bustCache = require('gulp-bust-cache');

    gulp.src('./dist/*/*.html')
        .pipe(bustCache())
        .pipe(gulp.dest('./dist'));
    ```

## Options

### options.showLog

- Type: `Boolean`
- Default: `false`

Show detailed logs.

#### options.basePath

- Type: `String`
- Default: ``

Specify the path to the directory where your assets reside. By default, the plugin will search the target assets files relative to your target HTML file.
