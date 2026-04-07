// Borrowed from:
// https://github.com/custom-cards/boilerplate-card/blob/master/src/localize/localize.ts

// Sorted alphabetically
import * as cs from './translations/cs.json';
import * as da from './translations/da.json';
import * as de from './translations/de.json';
import * as en from './translations/en.json';
import * as et from './translations/et.json';
import * as es from './translations/es.json';
import * as fr from './translations/fr.json';
import * as hu from './translations/hu.json';
import * as it from './translations/it.json';
import * as nl from './translations/nl.json';
import * as pl from './translations/pl.json';
import * as ru from './translations/ru.json';
import * as sl from './translations/sl.json';
import * as sv from './translations/sv.json';

import { DEFAULT_LANG } from './defaults';

var languages = { cs, da, de, en, et, es, fr, hu, it, nl, pl, ru, sl, sv };

export default function localize(string, search, replace) {
  const [section, key] = string.toLowerCase().split('.');
  const langStored = localStorage.getItem('selectedLanguage');

  const lang = (langStored || navigator.language.split('-')[0] || DEFAULT_LANG)
    .replace(/['"]+/g, '')
    .replace('-', '_');

  let translated;

  try {
    translated = languages[lang][section][key];
  } catch (e) {
    console.warn(e);
    translated = languages[DEFAULT_LANG][section][key];
  }

  if (translated === undefined) {
    translated = languages[DEFAULT_LANG][section][key];
  }

  if (translated === undefined) {
    return key;
  }

  if (search !== undefined && replace !== undefined) {
    translated = translated.replace(search, replace);
  }

  return translated;
}
