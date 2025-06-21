#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// Core 패키지 정리
const coreDir = path.join(rootDir, 'packages', 'core');
const corePackages = fs.readdirSync(coreDir)
  .filter(file => file.startsWith('next-unified-query-core-') && file.endsWith('.tgz'));

// React 패키지 정리
const reactDir = path.join(rootDir, 'packages', 'react');
const reactPackages = fs.readdirSync(reactDir)
  .filter(file => file.startsWith('next-unified-query-') && file.endsWith('.tgz'));

let deletedCount = 0;

// Core 패키지들 삭제
corePackages.forEach(file => {
  try {
    fs.unlinkSync(path.join(coreDir, file));
    console.log(`🗑️  삭제됨: packages/core/${file}`);
    deletedCount++;
  } catch (error) {
    console.error(`❌ 삭제 실패: packages/core/${file}`, error.message);
  }
});

// React 패키지들 삭제
reactPackages.forEach(file => {
  try {
    fs.unlinkSync(path.join(reactDir, file));
    console.log(`🗑️  삭제됨: packages/react/${file}`);
    deletedCount++;
  } catch (error) {
    console.error(`❌ 삭제 실패: packages/react/${file}`, error.message);
  }
});

if (deletedCount === 0) {
  console.log('📭 삭제할 패키지 파일이 없습니다.');
} else {
  console.log(`✅ 총 ${deletedCount}개의 패키지 파일이 정리되었습니다.`);
}