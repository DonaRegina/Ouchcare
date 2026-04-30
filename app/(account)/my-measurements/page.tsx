import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = {
  title: "My Measurements",
  description: "View and manage your saved pet measurements",
};

export default async function MyMeasurementsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: measurements, error } = await supabase
    .from("measurements")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching measurements:", error);
  }

  const measurementList = measurements ?? [];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          My Measurements
        </h1>
        <p className="text-muted-foreground">
          View and use your saved pet measurements to customize your Recovery
          Vest.
        </p>
      </div>

      {measurementList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                No measurements saved yet.
              </p>
              <Link href="/measurement-wizard">
                <Button>Create Your First Measurement</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {measurementList.map((measurement) => {
            const date = new Date(measurement.created_at).toLocaleDateString(
              "en-US",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
              },
            );

            return (
              <Card key={measurement.created_at} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {measurement.pet_name} — {date}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Neck</p>
                      <p className="font-semibold">{measurement.neck} cm</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Chest</p>
                      <p className="font-semibold">{measurement.chest} cm</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Back Length</p>
                      <p className="font-semibold">
                        {measurement.back_length} cm
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Leg Girth</p>
                      <p className="font-semibold">
                        {measurement.leg_girth} cm
                      </p>
                    </div>
                  </div>
                </CardContent>
                <div className="px-6 pb-6 pt-4 border-t">
                  <Link
                    href={{
                      pathname: "/customizer",
                      query: { measurement_id: measurement.id },
                    }}
                  >
                    <Button className="w-full" variant="default">
                      Customize Vest
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
