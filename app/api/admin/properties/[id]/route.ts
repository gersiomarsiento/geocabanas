import { NextResponse } from "next/server";
import { store } from "@/lib/admin/mock-admin-store";
import type { PropertySettingsUpdate } from "@/types/admin-availability";

// TODO: gate this route behind your admin auth/session check before ship.
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const property = store.properties.find((p) => p.id === params.id);
  if (!property) {
    return NextResponse.json(
      { error: "Propiedad no encontrada" },
      { status: 404 },
    );
  }

  const body = (await request.json()) as PropertySettingsUpdate;

  if (body.defaultPrice != null) property.defaultPrice = body.defaultPrice;
  if (body.defaultMinStay != null)
    property.defaultMinStay = body.defaultMinStay;
  if (body.minReservationFee != null)
    property.minReservationFee = body.minReservationFee;

  return NextResponse.json(property);
}
