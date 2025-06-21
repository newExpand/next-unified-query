"use client";

import Image from "next/image";
import { useQuery } from "../lib/query-client";
import { useState } from "react";

interface ImageData {
  id: string;
  url: string;
  title: string;
  description: string;
  width: number;
  height: number;
}

interface ImageMetadata {
  id: string;
  likes: number;
  views: number;
  tags: string[];
  uploadedBy: string;
  uploadDate: string;
  fileSize: string;
  dimensions: string;
}

/**
 * 갤러리 페이지
 * Next.js Image Optimization과 쿼리 연동 테스트
 */
export default function GalleryPage() {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  // 기본 이미지 데이터 (실제로는 API에서 가져올 수 있음)
  const imageData: ImageData[] = [
    {
      id: "1",
      url: "https://picsum.photos/400/300?random=1",
      title: "첫 번째 이미지",
      description: "아름다운 풍경",
      width: 400,
      height: 300,
    },
    {
      id: "2",
      url: "https://picsum.photos/400/300?random=2",
      title: "두 번째 이미지",
      description: "도시 풍경",
      width: 400,
      height: 300,
    },
    {
      id: "3",
      url: "https://picsum.photos/400/300?random=3",
      title: "세 번째 이미지",
      description: "자연 풍경",
      width: 400,
      height: 300,
    },
  ];

  // 선택된 이미지의 메타데이터를 실제 API에서 가져오는 쿼리
  const {
    data: metadata,
    isLoading: metadataLoading,
    error: metadataError,
  } = useQuery<ImageMetadata>({
    cacheKey: ["image-metadata", selectedImageId],
    url: `/api/image-metadata/${selectedImageId}`,
    enabled: !!selectedImageId,
    staleTime: 5 * 60 * 1000, // 5분
  });

  const handleImageClick = (imageId: string) => {
    setSelectedImageId(imageId);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">이미지 갤러리</h1>

      <div
        data-testid="image-gallery"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
      >
        {imageData.map((image) => (
          <div
            key={image.id}
            className="cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
            onClick={() => handleImageClick(image.id)}
          >
            <Image
              data-testid="gallery-image"
              src={image.url}
              alt={image.title}
              width={image.width}
              height={image.height}
              className="w-full h-48 object-cover"
              loading="lazy"
            />
            <div className="p-4">
              <h3 className="font-semibold text-lg">{image.title}</h3>
              <p className="text-gray-600 text-sm">{image.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 선택된 이미지의 메타데이터 표시 */}
      {selectedImageId && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">이미지 메타데이터</h2>
          {metadataLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>메타데이터 로딩 중...</span>
            </div>
          ) : metadataError ? (
            <div className="text-red-600">
              메타데이터를 불러오는데 실패했습니다.
            </div>
          ) : metadata ? (
            <div data-testid="image-metadata" className="space-y-2">
              <p>
                <strong>이미지 ID:</strong> {metadata.id}
              </p>
              <p>
                <strong>좋아요:</strong> {metadata.likes.toLocaleString()}
              </p>
              <p>
                <strong>조회수:</strong> {metadata.views.toLocaleString()}
              </p>
              <p>
                <strong>태그:</strong> {metadata.tags.join(", ")}
              </p>
              <p>
                <strong>업로드:</strong> {metadata.uploadedBy}
              </p>
              <p>
                <strong>업로드 날짜:</strong> {metadata.uploadDate}
              </p>
              <p>
                <strong>파일 크기:</strong> {metadata.fileSize}
              </p>
              <p>
                <strong>해상도:</strong> {metadata.dimensions}
              </p>
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p>
          이 페이지는 Next.js Image 컴포넌트의 lazy loading 기능을 사용합니다.
        </p>
        <p>
          이미지를 클릭하면 실제 API를 통해 해당 이미지의 메타데이터를
          가져옵니다.
        </p>
        <p>useQuery 훅이 자동으로 캐싱과 로딩 상태를 관리합니다.</p>
      </div>
    </div>
  );
}
