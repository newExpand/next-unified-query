import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const sensitiveData = {
    secretData: "Top Secret Information",
    confidentialReports: [
      {
        id: 1,
        title: "Financial Report Q4 2023",
        content: "Confidential revenue data...",
        classification: "TOP_SECRET",
      },
      {
        id: 2,
        title: "User Analytics Dashboard",
        content: "Private user behavior data...",
        classification: "CONFIDENTIAL",
      },
    ],
    adminSettings: {
      maintenanceMode: false,
      debugLevel: "production",
      featureFlags: {
        newDashboard: true,
        betaFeatures: false,
      },
    },
    lastAccessed: new Date().toISOString(),
  };

  return NextResponse.json(sensitiveData);
}
