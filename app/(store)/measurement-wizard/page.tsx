import { MeasurementWizard } from "@/components/store/measurement-wizard";

export default function MeasurementWizardPage() {
  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Measurement Wizard</h1>
        <p className="max-w-3xl text-base leading-7 text-muted-foreground">
          Capture pet details, walk through each measurement with visual guidance, and save the fit profile to your OUCHCare account.
        </p>
      </div>
      <MeasurementWizard />
    </section>
  );
}