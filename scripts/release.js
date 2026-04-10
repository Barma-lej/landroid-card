#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';

const isBeta = process.argv.includes('--beta');

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const currentVersion = pkg.version;

const today = new Date();
const calver = `${today.getFullYear()}.${today.getMonth() + 1}`;
const defaultVersion = `${calver}.0${isBeta ? '-beta.1' : ''}`;

const rl = createInterface({ input: process.stdin, output: process.stdout });

rl.question(
  `Текущая версия: ${currentVersion}\nНовая версия (Enter = ${defaultVersion}): `,
  (input) => {
    rl.close();

    const newVersion = input.trim() || defaultVersion;

    // 1. Обновляем package.json только если версия изменилась
    if (newVersion === currentVersion) {
      console.log(
        `⚠️  Версия не изменилась (${currentVersion}), пропускаем коммит`,
      );
    } else {
      pkg.version = newVersion;
      writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
      console.log(`✅ package.json → ${newVersion}`);
    }

    // 2. Lint + build (один раз, с --no-verify чтобы не гонять husky повторно)
    console.log('🔨 Запуск lint + build...');
    execSync('npm run test', { stdio: 'inherit' });

    // 3. Коммит только если есть что коммитить (проверяем staged)
    execSync('git add package.json dist/');
    const staged = execSync('git diff --cached --name-only').toString().trim();

    if (staged) {
      execSync(`git commit --no-verify -m "chore(release): ${newVersion}"`, {
        stdio: 'inherit',
      });
      console.log(`✅ Коммит создан`);
    } else {
      console.log(`ℹ️  Staged изменений нет, пропускаем коммит`);
    }

    // 4. Тег — удаляем старый если существует
    const tag = `v${newVersion}`;
    try {
      execSync(`git tag -d ${tag}`, { stdio: 'pipe' });
      execSync(`git push origin :refs/tags/${tag}`, { stdio: 'pipe' });
      console.log(`🗑️  Старый тег ${tag} удалён`);
    } catch {
      // тега не было — всё нормально
    }

    execSync(`git tag ${tag}`);
    console.log(`✅ Тег: ${tag}`);

    // 5. Push
    execSync(`git push && git push origin ${tag}`, { stdio: 'inherit' });
    console.log(`✅ Push выполнен`);

    // 6. GitHub Release (черновик)
    const title = `v${newVersion}${isBeta ? ' (beta)' : ''}`;
    const prerelease = isBeta ? '--prerelease' : '';

    execSync(
      `gh release create ${tag} dist/landroid-card.js --title "${title}" --generate-notes --draft ${prerelease}`,
      { stdio: 'inherit' },
    );

    console.log(`\n🚀 Черновик релиза ${tag} создан!`);
    console.log(`   https://github.com/Barma-lej/landroid-card/releases`);
  },
);
