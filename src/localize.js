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

  // Извлекаем чистый код языка, удаляя кавычки перед split('-') 
  // Это важно для Vivaldi, где localStorage может вернуть '"en-US"'
  const rawLang = (langStored || navigator.language || DEFAULT_LANG)
    .replace(/['"]+/g, '')
    .split('-')[0]
    .replace('_', '-');

  // Проверяем, поддерживается ли язык. Если нет — откатываемся на дефолтный
  const lang = (rawLang in languages) ? rawLang : DEFAULT_LANG;

  let translated;

  // Безопасное обращение к объектам без try-catch
  if (languages[lang] && languages[lang][section] && languages[lang][section][key]) {
    translated = languages[lang][section][key];
  } else if (languages[DEFAULT_LANG] && languages[DEFAULT_LANG][section] && languages[DEFAULT_LANG][section][key]) {
    // Fallback на английский, если ключа нет в текущем языке
    translated = languages[DEFAULT_LANG][section][key];
  } else {
    // Если ключа нет даже в дефолтном языке, возвращаем сам ключ
    translated = key;
  }

  // Обработка параметров search/replace
  if (translated !== key && search !== undefined && replace !== undefined) {
    translated = translated.replace(search, replace);
  }

  return translated;
}
