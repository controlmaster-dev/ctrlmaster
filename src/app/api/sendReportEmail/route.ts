import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api/errorResponse";
import { validateApiAuth } from "@/lib/apiAuth";
import { connectMongo } from "@/lib/mongo";
import { ReportModel } from "@/models";
import { sendReportEmailFromForm } from "@/server/services/reportEmailService";
import { ValidationError } from "@/lib/errors";

export async function POST(req: NextRequest) {
  let reportId = "";

  try {
    const authResult = await validateApiAuth(req);
    if (authResult instanceof NextResponse) return authResult;

    const formData = await req.formData();
    reportId = (formData.get("reportId") as string) || "";

    const result = await sendReportEmailFromForm(formData);

    if (!result.success) {
      const status = result.statusCode ?? 500;
      if (reportId && status >= 500) {
        await connectMongo();
        await ReportModel.findByIdAndUpdate(reportId, { emailStatus: "failed" });
      }
      return NextResponse.json(
        { success: false, error: result.error ?? "Error al enviar correo" },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      provider: result.provider,
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (reportId) {
      await connectMongo();
      await ReportModel.findByIdAndUpdate(reportId, { emailStatus: "failed" });
    }

    return apiErrorResponse(error);
  }
}
