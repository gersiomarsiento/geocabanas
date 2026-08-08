import { getAvailabilityRange } from "@/lib/booking/availability";

export async function GET() {
  const propertyId = "2c616c18-4900-4682-9227-0f687989cc8f";

  const data = await getAvailabilityRange(
    propertyId,
    "2026-08-20",
    "2026-08-28",
  );

  return Response.json(data);
}
