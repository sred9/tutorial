"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutPropertiesLoose"));

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _safeSharp = _interopRequireDefault(require("./safe-sharp"));

var _gatsbyCoreUtils = require("gatsby-core-utils");

var _common = require("./common");

_safeSharp.default.simd(true); // Handle Sharp's concurrency based on the Gatsby CPU count
// See: http://sharp.pixelplumbing.com/en/stable/api-utility/#concurrency
// See: https://www.gatsbyjs.org/docs/multi-core-builds/


_safeSharp.default.concurrency((0, _gatsbyCoreUtils.cpuCoreCount)());

function generateIcon(icon, srcIcon) {
  var imgPath, size, density;
  return _regenerator.default.async(function generateIcon$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          imgPath = _path.default.join("public", icon.src); // console.log(`generating icon: `, icon.src)
          // if (fs.existsSync(imgPath)) {
          //   console.log(`icon already Exists, not regenerating`)
          //   return true
          // }

          size = parseInt(icon.sizes.substring(0, icon.sizes.lastIndexOf("x"))); // For vector graphics, instruct sharp to use a pixel density
          // suitable for the resolution we're rasterizing to.
          // For pixel graphics sources this has no effect.
          // Sharp accept density from 1 to 2400

          density = Math.min(2400, Math.max(1, size));
          return _context.abrupt("return", (0, _safeSharp.default)(srcIcon, {
            density: density
          }).resize({
            width: size,
            height: size,
            fit: "contain",
            background: {
              r: 255,
              g: 255,
              b: 255,
              alpha: 0
            }
          }).toFile(imgPath));

        case 4:
        case "end":
          return _context.stop();
      }
    }
  });
}

function checkCache(cache, icon, srcIcon, srcIconDigest, callback) {
  var cacheKey, created;
  return _regenerator.default.async(function checkCache$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          cacheKey = (0, _gatsbyCoreUtils.createContentDigest)("" + icon.src + srcIcon + srcIconDigest);
          created = cache.get(cacheKey, srcIcon);

          if (created) {
            _context2.next = 15;
            break;
          }

          cache.set(cacheKey, true);
          _context2.prev = 4;
          _context2.next = 7;
          return _regenerator.default.awrap(callback(icon, srcIcon));

        case 7:
          _context2.next = 13;
          break;

        case 9:
          _context2.prev = 9;
          _context2.t0 = _context2["catch"](4);
          cache.set(cacheKey, false);
          throw _context2.t0;

        case 13:
          _context2.next = 15;
          break;

        case 15:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[4, 9]]);
}

exports.onPostBootstrap = function _callee(_ref, _ref2) {
  var reporter, parentSpan, basePath, localize, manifest, activity, cache, locales;
  return _regenerator.default.async(function _callee$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          reporter = _ref.reporter, parentSpan = _ref.parentSpan, basePath = _ref.basePath;
          localize = _ref2.localize, manifest = (0, _objectWithoutPropertiesLoose2.default)(_ref2, ["localize"]);
          activity = reporter.activityTimer("Build manifest and related icons", {
            parentSpan: parentSpan
          });
          activity.start();
          cache = new Map();
          _context3.next = 7;
          return _regenerator.default.awrap(makeManifest({
            cache: cache,
            reporter: reporter,
            pluginOptions: manifest,
            basePath: basePath
          }));

        case 7:
          if (!Array.isArray(localize)) {
            _context3.next = 11;
            break;
          }

          locales = [].concat(localize);
          _context3.next = 11;
          return _regenerator.default.awrap(Promise.all(locales.map(function (locale) {
            var cacheModeOverride = {};
            /* localization requires unique filenames for output files if a different src Icon is defined.
               otherwise one language would override anothers icons in automatic mode.
            */

            if (locale.hasOwnProperty("icon") && !locale.hasOwnProperty("icons")) {
              // console.debug(`OVERRIDING CACHE BUSTING`, locale)
              cacheModeOverride = {
                cache_busting_mode: "name"
              };
            }

            return makeManifest({
              cache: cache,
              reporter: reporter,
              pluginOptions: (0, _extends2.default)({}, manifest, {}, locale, {}, cacheModeOverride),
              shouldLocalize: true,
              basePath: basePath
            });
          })));

        case 11:
          activity.end();

        case 12:
        case "end":
          return _context3.stop();
      }
    }
  });
};
/**
 * The complete Triforce, or one or more components of the Triforce.
 * @typedef {Object} makeManifestArgs
 * @property {Object} cache - from gatsby-node api
 * @property {Object} reporter - from gatsby-node api
 * @property {Object} pluginOptions - from gatsby-node api/gatsby config
 * @property {boolean?} shouldLocalize
 * @property {string?} basePath - string of base path frpvided by gatsby node
 */

/**
 * Build manifest
 * @param {makeManifestArgs}
 */


var makeManifest = function makeManifest(_ref3) {
  var cache, reporter, pluginOptions, _ref3$shouldLocalize, shouldLocalize, _ref3$basePath, basePath, icon, manifest, suffix, paths, sharpIcon, metadata, cacheMode, iconDigest;

  return _regenerator.default.async(function makeManifest$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          cache = _ref3.cache, reporter = _ref3.reporter, pluginOptions = _ref3.pluginOptions, _ref3$shouldLocalize = _ref3.shouldLocalize, shouldLocalize = _ref3$shouldLocalize === void 0 ? false : _ref3$shouldLocalize, _ref3$basePath = _ref3.basePath, basePath = _ref3$basePath === void 0 ? "" : _ref3$basePath;
          icon = pluginOptions.icon, manifest = (0, _objectWithoutPropertiesLoose2.default)(pluginOptions, ["icon"]);
          suffix = shouldLocalize && pluginOptions.lang ? "_" + pluginOptions.lang : ""; // Delete options we won't pass to the manifest.webmanifest.

          delete manifest.plugins;
          delete manifest.legacy;
          delete manifest.theme_color_in_head;
          delete manifest.cache_busting_mode;
          delete manifest.crossOrigin;
          delete manifest.icon_options;
          delete manifest.include_favicon; // If icons are not manually defined, use the default icon set.

          if (!manifest.icons) {
            manifest.icons = [].concat(_common.defaultIcons);
          } // Specify extra options for each icon (if requested).


          if (pluginOptions.icon_options) {
            manifest.icons = manifest.icons.map(function (icon) {
              return (0, _extends2.default)({}, pluginOptions.icon_options, {}, icon);
            });
          } // Determine destination path for icons.


          paths = {};
          manifest.icons.forEach(function (icon) {
            var iconPath = _path.default.join("public", _path.default.dirname(icon.src));

            if (!paths[iconPath]) {
              var exists = _fs.default.existsSync(iconPath); //create destination directory if it doesn't exist


              if (!exists) {
                _fs.default.mkdirSync(iconPath);
              }

              paths[iconPath] = true;
            }
          }); // Only auto-generate icons if a src icon is defined.

          if (!(icon !== undefined)) {
            _context4.next = 31;
            break;
          }

          if ((0, _common.doesIconExist)(icon)) {
            _context4.next = 17;
            break;
          }

          throw new Error("icon (" + icon + ") does not exist as defined in gatsby-config.js. Make sure the file exists relative to the root of the site.");

        case 17:
          sharpIcon = (0, _safeSharp.default)(icon);
          _context4.next = 20;
          return _regenerator.default.awrap(sharpIcon.metadata());

        case 20:
          metadata = _context4.sent;

          if (metadata.width !== metadata.height) {
            reporter.warn("The icon(" + icon + ") you provided to 'gatsby-plugin-manifest' is not square.\n" + "The icons we generate will be square and for the best results we recommend you provide a square icon.\n");
          } //add cache busting


          cacheMode = typeof pluginOptions.cache_busting_mode !== "undefined" ? pluginOptions.cache_busting_mode : "query";
          iconDigest = (0, _gatsbyCoreUtils.createContentDigest)(_fs.default.readFileSync(icon)); //if cacheBusting is being done via url query icons must be generated before cache busting runs

          if (!(cacheMode === "query")) {
            _context4.next = 27;
            break;
          }

          _context4.next = 27;
          return _regenerator.default.awrap(Promise.all(manifest.icons.map(function (dstIcon) {
            return checkCache(cache, dstIcon, icon, iconDigest, generateIcon);
          })));

        case 27:
          if (cacheMode !== "none") {
            manifest.icons = manifest.icons.map(function (icon) {
              var newIcon = (0, _extends2.default)({}, icon);
              newIcon.src = (0, _common.addDigestToPath)(icon.src, iconDigest, cacheMode);
              return newIcon;
            });
          } //if file names are being modified by cacheBusting icons must be generated after cache busting runs


          if (!(cacheMode !== "query")) {
            _context4.next = 31;
            break;
          }

          _context4.next = 31;
          return _regenerator.default.awrap(Promise.all(manifest.icons.map(function (dstIcon) {
            return checkCache(cache, dstIcon, icon, iconDigest, generateIcon);
          })));

        case 31:
          //Fix #18497 by prefixing paths
          manifest.icons = manifest.icons.map(function (icon) {
            return (0, _extends2.default)({}, icon, {
              src: (0, _gatsbyCoreUtils.slash)(_path.default.join(basePath, icon.src))
            });
          });

          if (manifest.start_url) {
            manifest.start_url = _path.default.posix.join(basePath, manifest.start_url);
          } //Write manifest


          _fs.default.writeFileSync(_path.default.join("public", "manifest" + suffix + ".webmanifest"), JSON.stringify(manifest));

        case 34:
        case "end":
          return _context4.stop();
      }
    }
  });
};

exports.onCreateWebpackConfig = function (_ref4, pluginOptions) {
  var actions = _ref4.actions,
      plugins = _ref4.plugins;
  actions.setWebpackConfig({
    plugins: [plugins.define({
      __MANIFEST_PLUGIN_HAS_LOCALISATION__: pluginOptions.localize && pluginOptions.localize.length
    })]
  });
};