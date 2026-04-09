#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';

const isBeta = process.argv.includes('--beta');

// Читаем текущую версию
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const currentVersion = pkg.version;

// Определяем новую версию
const today = new Date();
const calver = `${today.getFullYear()}.${today.getMonth() + 1}`;

const rl = createInterface({ input: process.stdin, output: process.stdout });

rl.question(
  `Текущая версия: ${currentVersion}\nНовая версия (Enter = ${calver}.0${isBeta ? '-beta.1' : ''}): `,
  (input) => {
    rl.close();

    const newVersion = input.trim() || `${calver}.0${isBeta ? '-beta.1' : ''}`;

    // 1. Обновляем package.json
    pkg.version = newVersion;
    writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
    console.log(`✅ package.json → ${newVersion}`);

    // 2. Сборка и проверка
    console.log('🔨 Запуск npm run test...');
    execSync('npm run test', { stdio: 'inherit' });

    // 3. Коммит
    execSync(`git add package.json`);
    execSync(`git commit -m "chore(release): ${newVersion}"`);
    console.log(`✅ Коммит создан`);

    // 4. Тег
    const tag = `v${newVersion}`;
    execSync(`git tag ${tag}`);
    console.log(`✅ Тег: ${tag}`);

    // 5. Push
    execSync(`git push && git push origin ${tag}`);
    console.log(`✅ Push выполнен`);

    // 6. Создаём черновик GitHub Release через gh CLI
    const title = isBeta ? `v${newVersion} (beta)` : `v${newVersion}`;

    const prerelease = isBeta ? '--prerelease' : '';
    const draft = '--draft';

    execSync(
      `gh release create ${tag} dist/landroid-card.js \
        --title "${title}" \
        --generate-notes \
        ${prerelease} \
        ${draft}`,
      { stdio: 'inherit' },
    );

    console.log(`\n🚀 Черновик релиза ${tag} создан на GitHub!`);
    console.log(
      `   Открой: https://github.com/Barma-lej/landroid-card/releases`,
    );
  },
);
