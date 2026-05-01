import { MeasurementWizard } from "@/components/store/measurement-wizard";

type PageProps = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function MeasurementWizardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const editId = params.edit ?? null;

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {editId ? "Edit Measurement" : "Measurement Wizard"}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          {editId
            ? "Update the saved measurement profile with corrected values."
            : "Capture pet details, walk through each measurement with visual guidance, and save the fit profile to your OUCHCare account."}
        </p>
      </div>
      <MeasurementWizard editId={editId} />
    </section>
  );
}