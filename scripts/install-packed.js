#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const exampleDir = path.join(rootDir, 'apps', 'example');
const examplePackageJsonPath = path.join(exampleDir, 'package.json');

// 패키지된 파일들 찾기
const corePackages = fs.readdirSync(path.join(rootDir, 'packages', 'core'))
  .filter(file => file.startsWith('next-unified-query-core-') && file.endsWith('.tgz'))
  .sort((a, b) => fs.statSync(path.join(rootDir, 'packages', 'core', b)).mtime - fs.statSync(path.join(rootDir, 'packages', 'core', a)).mtime);

const reactPackages = fs.readdirSync(path.join(rootDir, 'packages', 'react'))
  .filter(file => file.startsWith('next-unified-query-') && file.endsWith('.tgz'))
  .sort((a, b) => fs.statSync(path.join(rootDir, 'packages', 'react', b)).mtime - fs.statSync(path.join(rootDir, 'packages', 'react', a)).mtime);

if (corePackages.length === 0 || reactPackages.length === 0) {
  console.error('❌ 패키지된 파일을 찾을 수 없습니다. pnpm pack:all을 먼저 실행하세요.');
  process.exit(1);
}

const latestCore = corePackages[0];
const latestReact = reactPackages[0];

console.log(`📦 최신 패키지 파일들:`);
console.log(`   Core: ${latestCore}`);
console.log(`   React: ${latestReact}`);

// example/package.json 읽기
let examplePackageJson;
try {
  examplePackageJson = JSON.parse(fs.readFileSync(examplePackageJsonPath, 'utf8'));
} catch (error) {
  console.error('❌ example/package.json을 읽을 수 없습니다:', error.message);
  process.exit(1);
}

// dependencies 업데이트 - React 패키지만 설치 (Core는 React 패키지의 dependency로 포함됨)
examplePackageJson.dependencies = examplePackageJson.dependencies || {};

// 기존 패키지들 제거 (캐싱 이슈 방지)
delete examplePackageJson.dependencies['next-type-fetch'];
delete examplePackageJson.dependencies['next-unified-query-core'];
delete examplePackageJson.dependencies['next-unified-query'];

// 새 패키지 추가
examplePackageJson.dependencies['next-unified-query'] = `file:../../packages/react/${latestReact}`;

// package.json 저장
try {
  fs.writeFileSync(examplePackageJsonPath, JSON.stringify(examplePackageJson, null, 2) + '\n');
  console.log('✅ example/package.json이 업데이트되었습니다.');
  
  console.log('\n📋 업데이트된 dependencies:');
  console.log(`   next-unified-query: file:../../packages/react/${latestReact}`);
} catch (error) {
  console.error('❌ example/package.json 저장 실패:', error.message);
  process.exit(1);
}