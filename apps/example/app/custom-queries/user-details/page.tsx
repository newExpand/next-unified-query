"use client";

import { useQuery } from "../../lib/query-client";

interface CombinedUserData {
  user: {
    id: number;
    name: string;
    departmentId: number;
  };
  department: {
    id: number;
    name: string;
    location: string;
    manager: string;
  };
  stats: {
    projectCount: number;
    taskCount: number;
    completedTasks: number;
    efficiency: number;
  };
  combinedInfo: string;
}

export default function UserDetailsPage() {
  const { data, error, isLoading } = useQuery<CombinedUserData, any>({
    cacheKey: ["user-details", 1],
    queryFn: async (params, fetcher) => {
      // 여러 API 호출을 조합하는 복잡한 queryFn
      try {
        console.log("Fetcher:", fetcher); // 디버깅용

        // fetcher가 undefined인 경우 fetch 직접 사용
        const fetchData = async (url: string) => {
          if (fetcher && fetcher.get) {
            const response = await fetcher.get(url);
            return response.data;
          } else {
            // fallback: fetch 직접 사용
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
          }
        };

        // 1. 사용자 기본 정보 조회 (절대 URL 사용)
        const userData = await fetchData("http://localhost:3001/api/users/1");

        // 2. 부서 정보 조회 (절대 URL 사용)
        const departmentData = await fetchData(
          `http://localhost:3001/api/departments/${userData.departmentId || 1}`
        );

        // 3. 사용자 통계 조회 (절대 URL 사용)
        const statsData = await fetchData(
          "http://localhost:3001/api/users/1/stats"
        );

        // 4. 데이터 조합
        const combinedData: CombinedUserData = {
          user: {
            id: userData.id,
            name: userData.name,
            departmentId: userData.departmentId || 1,
          },
          department: {
            id: departmentData.id,
            name: departmentData.name,
            location: departmentData.location,
            manager: departmentData.manager,
          },
          stats: {
            projectCount: statsData.projectCount,
            taskCount: statsData.taskCount,
            completedTasks: statsData.completedTasks,
            efficiency: statsData.efficiency,
          },
          combinedInfo: `${userData.name}님은 ${departmentData.name} 부서에서 ${statsData.projectCount}개의 프로젝트를 진행 중입니다.`,
        };

        return combinedData;
      } catch (error) {
        console.error("Error combining user data:", error);
        throw error;
      }
    },
  });

  if (isLoading) {
    return <div>사용자 상세 정보를 조합하는 중...</div>;
  }

  if (error) {
    return (
      <div>
        <h1>오류 발생</h1>
        <p>사용자 정보를 불러오는 중 오류가 발생했습니다:</p>
        <pre>{error.message}</pre>
      </div>
    );
  }

  return (
    <div>
      <h1>사용자 상세 정보</h1>
      <div style={{ display: "grid", gap: "20px", maxWidth: "800px" }}>
        <div
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
          <h2>기본 정보</h2>
          <p>
            <strong>이름:</strong> {data?.user.name}
          </p>
          <p>
            <strong>ID:</strong> {data?.user.id}
          </p>
        </div>

        <div
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
          <h2>부서 정보</h2>
          <p>
            <strong>부서명:</strong> {data?.department.name}
          </p>
          <p>
            <strong>위치:</strong> {data?.department.location}
          </p>
          <p>
            <strong>매니저:</strong> {data?.department.manager}
          </p>
        </div>

        <div
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
          <h2>업무 통계</h2>
          <p>
            <strong>프로젝트 수:</strong> {data?.stats.projectCount}
          </p>
          <p>
            <strong>작업 수:</strong> {data?.stats.taskCount}
          </p>
          <p>
            <strong>완료된 작업:</strong> {data?.stats.completedTasks}
          </p>
          <p>
            <strong>효율성:</strong> {data?.stats.efficiency}%
          </p>
        </div>

        <div
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            borderRadius: "8px",
            backgroundColor: "#f0f8ff",
          }}
        >
          <h2>종합 정보</h2>
          <p>{data?.combinedInfo}</p>
        </div>
      </div>
    </div>
  );
}
