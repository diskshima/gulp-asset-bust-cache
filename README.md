# gulp-asset-bust-cache

gulp plugin for busting the cache.

The plugin will add a query parameter `v` with the MD5 hash of the file.

## Example:

Before:

```html
<img src="assets/image.webp" alt="image" />
<picture>
  <source srcset="assets/image.png" />
  <img src="assets/image.jpg" alt="image" />
</picture>
```

After:

```html
<img src="assets/image.webp?v=da9b38175660ed2ba5855531f00e8953" alt="image">
<picture>
  <source srcset="assets/image.png?v=be89d427129ab1dc5f599b84d7e4ad38">
  <img src="assets/image.jpg?v=4190c40ef91f9e0248f1adba3df38b1e" alt="image">
</picture>
```

## Usage

1. Add to your development dependency.
    ```sh
    npm install --save-dev gulp-asset-bust-cache
    ```
1. To use it, add it to your pipeline.
    - Example:
    ```javascript
    const bustCache = require('gulp-asset-bust-cache');

    gulp.src('./dist/*/*.html')
        .pipe(bustCache())
        .pipe(gulp.dest('./dist'));
    ```

## Options

### options.basePath

- Type: `String`
- Default: `''` (empty string)

Specify the path to the directory where your assets reside. By default, the plugin will search the target assets files relative to your target HTML file.

### options.paramName

- Type: `String`
- Default: `v`

The query parameter name used for the hash.

### options.selectorMap

- Type: `Object`
- Default: Please see `DEFAULT_SELECTOR_MAP` in [index.js](./index.js).

This should be the selector to attribute name mapping. The key (selector) will be used to query for node and the value (attribute name) will be used as the attribute to add hashes.

### options.showLog

- Type: `Boolean`
- Default: `false`

Show detailed logs.

## Development

1. Use `nodenv` (or anything that respects `.node-version`) to install Node.
    ```sh
    nodenv install
    ```
1. Install `yarn`.
    - No `yarn install` required as this project uses [Zero-Installs](https://yarnpkg.com/features/zero-installs).
    ```sh
    npm install -g yarn
    ```
