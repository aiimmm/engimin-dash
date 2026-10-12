import { authorizationHeaders, upstreamApi } from "@/lib/api/upstream";
import { getSession } from "@/lib/auth/session";
import { safeError } from "@/lib/security";
import { tomorrow } from "@/modules/shared/work-orders/lib";
import { NextResponse } from "next/server";

export async function GET(request) {
  const session = await getSession();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ message: "Session expired." }, { status: 401 });
  }

  const query = request.nextUrl.searchParams;
  const tomorrowDate = tomorrow();
  const fromDate = query.get("dateFrom") || query.get("from_action_date") || tomorrowDate;
  const toDate = query.get("dateTo") || query.get("to_action_date") || tomorrowDate;
  const clusterParam = query.get("cluster");
  const type = query.get("type") || "allocation";

  let clusterValue = undefined;
  if (clusterParam !== null && clusterParam !== undefined && clusterParam !== "") {
    clusterValue = isNaN(Number(clusterParam)) ? clusterParam : Number(clusterParam);
  }

  const payload = {
    from_action_date: fromDate,
    to_action_date: toDate,
    ...(clusterValue !== undefined ? { cluster: clusterValue } : {}),
    type,
  };

  try {
    const response = await upstreamApi.post(
      `/allocationWorkOrder?id=${encodeURIComponent(session.user.id)}`,
      payload,
      { headers: authorizationHeaders(session), timeout: 30000 },
    );

    const data = response.data?.data || [];
    const count = response.data?.count ?? data.length;

    return NextResponse.json({
      success: true,
      data,
      count,
    });
  } catch (error) {
    const safe = safeError(error);
    return NextResponse.json({ message: safe.message }, { status: safe.status });
  }
}
