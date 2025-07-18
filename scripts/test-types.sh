#!/bin/bash

# 타입 안전성 검증 스크립트
# 타입 테스트 파일들이 올바르게 컴파일되는지 확인합니다.

echo "🔍 타입 안전성 검증 시작..."

# Core 패키지 타입 테스트
echo "📦 Core 패키지 타입 검증 중..."
cd packages/core/test
npx tsc --project tsconfig.json --noEmit
CORE_RESULT=$?

if [ $CORE_RESULT -eq 0 ]; then
    echo "✅ Core 패키지 타입 검증 성공"
else
    echo "❌ Core 패키지 타입 검증 실패"
    exit 1
fi

cd ../../..

# React 패키지 타입 테스트
echo "📦 React 패키지 타입 검증 중..."
cd packages/react/test
npx tsc --project tsconfig.json --noEmit
REACT_RESULT=$?

if [ $REACT_RESULT -eq 0 ]; then
    echo "✅ React 패키지 타입 검증 성공"
else
    echo "❌ React 패키지 타입 검증 실패"
    exit 1
fi

echo "🎉 모든 타입 검증이 성공적으로 완료되었습니다!"