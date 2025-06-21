import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

/**
 * 관리자 재검증 API
 * 태그 기반 재검증을 처리
 */
export async function POST(request: NextRequest) {
  try {
    const { tag } = await request.json();

    if (!tag) {
      return NextResponse.json(
        { error: "태그가 필요합니다." },
        { status: 400 }
      );
    }

    // 특정 태그로 태그된 캐시 재검증
    revalidateTag(tag);

    return NextResponse.json({
      message: `태그 "${tag}"에 대한 재검증이 완료되었습니다.`,
      revalidatedTag: tag,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("재검증 오류:", error);
    return NextResponse.json(
      { error: "재검증 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
