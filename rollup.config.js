/*  eslint-env node */
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import image from '@rollup/plugin-image';
import postcss from 'rollup-plugin-postcss';
import postcssPresetEnv from 'postcss-preset-env';
import postcssLit from 'rollup-plugin-postcss-lit';
import terser from '@rollup/plugin-terser';
import minifyLiterals from 'rollup-plugin-minify-html-literals';
import serve from 'rollup-plugin-serve';
import ignore from './rollup-plugins/ignore';

const IS_DEV = process.env.ROLLUP_WATCH;

const serverOptions = {
  contentBase: ['./dist'],
  host: 'localhost',
  port: 5000,
  allowCrossOrigin: true,
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
};

export default {
  input: 'src/landroid-card.js',
  output: {
    dir: 'dist',
    format: 'es',
    name: 'LandroidCard',
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    json(),
    babel({
      babelHelpers: 'runtime',
      exclude: 'node_modules/**',
    }),
    postcss({
      plugins: [
        postcssPresetEnv({
          stage: 1,
          features: {
            'nesting-rules': true,
          },
        }),
      ],
      extract: false,
    }),
    postcssLit(),
    image(),
    IS_DEV && serve(serverOptions),
    !IS_DEV && minifyLiterals(),
    !IS_DEV &&
      terser({
        output: {
          comments: false,
        },
      }),
    ignore({
      files: [
        '@material/mwc-menu/mwc-menu.js',
        '@material/mwc-menu/mwc-menu-surface.js',
        '@material/mwc-ripple/mwc-ripple.js',
        '@material/mwc-list/mwc-list.js',
        '@material/mwc-list/mwc-list-item.js',
        '@material/mwc-icon/mwc-icon.js',
        '@material/mwc-notched-outline/mwc-notched-outline.js',
      ].map((file) => require.resolve(file)),
    }),
  ],
};
