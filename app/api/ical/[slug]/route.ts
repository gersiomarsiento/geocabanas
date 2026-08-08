import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import ical, { ICalCalendarMethod } from "ical-generator";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const { data: property, error } = await supabaseAdmin
    .from("properties")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (error || !property) {
    return new NextResponse("Property not found", {
      status: 404,
    });
  }

  const calendar = ical({
    name: property.name,
    method: ICalCalendarMethod.PUBLISH,
  });

  return new NextResponse(calendar.toString(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
    },
  });
}
