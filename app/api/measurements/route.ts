import { NextRequest, NextResponse } from "next/server";
import { measurementPayloadSchema } from "@/lib/api/validation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Helper to map a DB row to the API response shape
function toMeasurementResponse(data: {
  id: string;
  pet_name: string;
  breed?: string | null;
  neck: number;
  chest: number;
  back_length: number;
  leg_girth: number;
  created_at: string;
  [key: string]: unknown;
}) {
  return {
    id: data.id,
    petName: data.pet_name,
    breed: data.breed ?? "",
    neckCm: data.neck,
    chestCm: data.chest,
    backLengthCm: data.back_length,
    legGirthCm: data.leg_girth,
    createdAt: data.created_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ measurement: null }, { status: 401 });
    }

    // If an ?id= query param is provided, fetch that specific measurement
    const editId = request.nextUrl.searchParams.get("id");

    if (editId) {
      const { data, error } = await supabase
        .from("measurements")
        .select("*")
        .eq("id", editId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (!data) {
        return NextResponse.json({ measurement: null }, { status: 404 });
      }

      return NextResponse.json({ measurement: toMeasurementResponse(data) });
    }

    // Default: fetch the most recent measurement
    const { data, error } = await supabase
      .from("measurements")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ measurement: null }, { status: 200 });
    }

    return NextResponse.json({ measurement: toMeasurementResponse(data) });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load measurements.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to save measurements." },
        { status: 401 },
      );
    }

    const payload = measurementPayloadSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!payload.success) {
      return NextResponse.json(
        {
          error: "Invalid measurement payload.",
          issues: payload.error.flatten(),
        },
        { status: 400 },
      );
    }

    // Ensure user profile exists
    const { data: profile, error: profileFetchError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (profileFetchError && profileFetchError.code !== "PGRST116") {
      return NextResponse.json(
        { error: profileFetchError.message },
        { status: 400 },
      );
    }

    if (!profile) {
      const { error: profileCreateError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || user.email || "",
          role: "customer",
        });

      if (profileCreateError) {
        return NextResponse.json(
          {
            error: `Failed to create user profile: ${profileCreateError.message}`,
          },
          { status: 500 },
        );
      }
    }

    // Insert new measurement row (supports multiple pets per user)
    const { data, error } = await supabase
      .from("measurements")
      .insert({
        user_id: user.id,
        pet_name: payload.data.petName,
        neck: payload.data.neckCm,
        chest: payload.data.chestCm,
        back_length: payload.data.backLengthCm,
        leg_girth: payload.data.legGirthCm,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Measurement record was not returned." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { measurement: toMeasurementResponse(data) },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save measurements.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to update measurements." },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => null);
    const measurementId = body?.id;

    if (!measurementId || typeof measurementId !== "string") {
      return NextResponse.json(
        { error: "Measurement id is required." },
        { status: 400 },
      );
    }

    const payload = measurementPayloadSchema.safeParse(body);
    if (!payload.success) {
      return NextResponse.json(
        {
          error: "Invalid measurement payload.",
          issues: payload.error.flatten(),
        },
        { status: 400 },
      );
    }

    // Only update if the measurement belongs to the current user
    const { data, error } = await supabase
      .from("measurements")
      .update({
        pet_name: payload.data.petName,
        neck: payload.data.neckCm,
        chest: payload.data.chestCm,
        back_length: payload.data.backLengthCm,
        leg_girth: payload.data.legGirthCm,
      })
      .eq("id", measurementId)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Measurement not found or not owned by you." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { measurement: toMeasurementResponse(data) },
      { status: 200 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update measurements.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}