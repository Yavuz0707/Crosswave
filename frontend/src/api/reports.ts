import { api } from "./client";

/**
 * Generate a PDF report for an account/period and trigger a browser download.
 * The backend streams `application/pdf`, so the response is read as a blob.
 */
export async function generateReport(
  accountId: string,
  periodStart: string, // "YYYY-MM-DD"
  periodEnd: string,
): Promise<void> {
  const response = await api.post(
    "/reports/generate",
    { account_id: accountId, period_start: periodStart, period_end: periodEnd },
    { responseType: "blob" },
  );

  const url = window.URL.createObjectURL(
    new Blob([response.data], { type: "application/pdf" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `crosswave-report-${periodStart}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
