import { safeError } from "@/lib/security";
import axios from "axios";
import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const url =
      "https://go-ops.travelio.com/liohd/cluster/get?key=b26f8ad9dc6df63b5bb2365f97f5d6f25009da144b45258ad9a11674a9e16aa7&status=1&keyword=";

    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        Accept: "application/json",
      },
    });

    const resData = response.data?.data;
    const outerData = Array.isArray(resData?.data)
      ? resData.data
      : Array.isArray(resData)
        ? resData
        : [];

    const clusters = [];
    const seenIds = new Set();

    outerData.forEach((group) => {
      const id = group?.id;
      const clusterName = group?.clusterName || group?.clusterCode || String(id || "");
      const clusterCode = group?.clusterCode || "";

      if (id !== undefined && id !== null && !seenIds.has(id)) {
        seenIds.add(id);
        clusters.push({
          id: Number(id) || id,
          clusterName: String(clusterName).trim(),
          clusterCode: String(clusterCode).trim(),
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: clusters,
    });
  } catch (error) {
    const safe = safeError(error, "Failed to fetch cluster list.");
    return NextResponse.json({ message: safe.message }, { status: safe.status || 500 });
  }
}
