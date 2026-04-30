"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  PawPrint,
  Ruler,
  Sparkles,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import {
  formatConfidenceLabel,
  recommendSizeFromMeasurements,
} from "@/lib/storefront/sizing";
import type { PetMeasurements } from "@/lib/types/domain";

type MeasurementKey = keyof PetMeasurements;

type MeasurementApiResponse = {
  measurement:
    | (PetMeasurements & {
        id?: string | null;
        createdAt?: string | null;
        created_at?: string | null;
      })
    | null;
  error?: string;
};

async function readMeasurementApiResponse(
  response: Response,
): Promise<MeasurementApiResponse | null> {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  try {
    return (await response.json()) as MeasurementApiResponse;
  } catch {
    return null;
  }
}

type IntroStepValue = {
  petName: string;
  breed: string;
  species: string;
};

type StepDefinition = {
  key: MeasurementKey;
  title: string;
  subtitle: string;
  instructions: string[];
  imageUrl: string;
  imageAlt: string;
  min: number;
  max: number;
  helper: string;
};

const STEP_DEFINITIONS: StepDefinition[] = [
  {
    key: "neckCm",
    title: "Neck circumference",
    subtitle: "Measure where the collar normally rests.",
    instructions: [
      "Keep your pet standing naturally and calm.",
      "Wrap the tape around the neck where a collar would sit.",
      "Leave a finger of comfort, then read the number in cm.",
    ],
    imageUrl: "https://placehold.co/960x540/png?text=Neck+measurement",
    imageAlt: "Illustration showing how to measure the neck circumference",
    min: 10,
    max: 80,
    helper:
      "A collar-line measurement keeps the neckline comfortable without rubbing.",
  },
  {
    key: "chestCm",
    title: "Chest circumference",
    subtitle: "Measure the widest point behind the front legs.",
    instructions: [
      "Place the tape around the broadest part of the rib cage.",
      "Keep the tape level and snug, but not tight.",
      "Read the measurement after a relaxed exhale.",
    ],
    imageUrl: "https://placehold.co/960x540/png?text=Chest+measurement",
    imageAlt: "Illustration showing how to measure the chest circumference",
    min: 20,
    max: 140,
    helper: "Chest size drives garment fit more than any other measurement.",
  },
  {
    key: "backLengthCm",
    title: "Back length",
    subtitle: "Measure from shoulder blades to the base of the tail.",
    instructions: [
      "Start at the top of the shoulders, not the neck line.",
      "Follow a straight line along the spine to the tail base.",
      "Do not curve around the tail or hips.",
    ],
    imageUrl: "https://placehold.co/960x540/png?text=Back+length",
    imageAlt: "Illustration showing how to measure the back length",
    min: 15,
    max: 140,
    helper:
      "Back length helps the recovery suit stop at the right point on the body.",
  },
  {
    key: "legGirthCm",
    title: "Front leg girth",
    subtitle: "Measure the upper front leg where the sleeve lands.",
    instructions: [
      "Measure around the upper front leg near the sleeve opening.",
      "Leave room for movement without slipping.",
      "Check both front legs if they differ noticeably.",
    ],
    imageUrl: "https://placehold.co/960x540/png?text=Leg+girth",
    imageAlt: "Illustration showing how to measure the upper front leg girth",
    min: 8,
    max: 80,
    helper: "This confirms the sleeve area can move freely during recovery.",
  },
];

const INTRO_FIELDS: Array<keyof IntroStepValue> = [
  "petName",
  "species",
  "breed",
];
const SPECIES_OPTIONS = ["Dog", "Cat", "Rabbit", "Other"];

const BREED_LIBRARY = [
  {
    species: "dog",
    matches: ["labrador", "golden retriever", "golden", "german shepherd"],
    size: "L",
    note: "Broader chests usually start at L for a secure fit.",
  },
  {
    species: "dog",
    matches: ["chihuahua", "toy poodle", "yorkie", "pomeranian", "maltese"],
    size: "XS",
    note: "Small breeds usually start at XS unless the chest is unusually broad.",
  },
  {
    species: "dog",
    matches: ["beagle", "cocker spaniel", "shih tzu", "cavalier"],
    size: "S",
    note: "These breeds commonly sit between XS and S depending on chest depth.",
  },
  {
    species: "dog",
    matches: ["french bulldog", "pug", "bulldog"],
    size: "M",
    note: "Compact breeds often need a wider chest cut even when they are short.",
  },
  {
    species: "dog",
    matches: ["dachshund"],
    size: "S",
    note: "Long backs often need a custom back length check even if the chest is small.",
  },
  {
    species: "cat",
    matches: [
      "domestic shorthair",
      "domestic longhair",
      "maine coon",
      "ragdoll",
    ],
    size: "XS",
    note: "Most cats begin at XS, with larger breeds stepping up to S or CUSTOM.",
  },
] as const;

const initialIntro: IntroStepValue = {
  petName: "",
  breed: "",
  species: "Dog",
};

const initialMeasurementInputs: Record<MeasurementKey, string> = {
  neckCm: "",
  chestCm: "",
  backLengthCm: "",
  legGirthCm: "",
};

function toOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function formatMeasurement(value: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "--";
  }

  return `${toOneDecimal(parsed).toFixed(1)} cm`;
}

function normalizeSpecies(value: string) {
  return value.trim().toLowerCase();
}

function validateIntroField(key: keyof IntroStepValue, value: string) {
  if (key === "species") {
    return value.trim().length > 0
      ? null
      : "Choose a species to personalize the fit guidance.";
  }

  if (value.trim().length > 0) {
    return null;
  }

  return key === "petName"
    ? "Enter a pet name to continue."
    : "Enter a breed to continue.";
}

function validateMeasurementValue(key: MeasurementKey, value: string) {
  const config = STEP_DEFINITIONS.find((step) => step.key === key);

  if (!config) {
    return null;
  }

  if (!value.trim()) {
    return `Enter the ${config.title.toLowerCase()} in cm.`;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "Please use a valid numeric value in cm.";
  }

  if (parsed < config.min || parsed > config.max) {
    return `Please enter a value between ${config.min} and ${config.max} cm.`;
  }

  return null;
}

function getBreedSuggestion(species: string, breed: string) {
  const normalizedSpecies = normalizeSpecies(species);
  const normalizedBreed = breed.trim().toLowerCase();

  for (const suggestion of BREED_LIBRARY) {
    if (suggestion.species !== normalizedSpecies) {
      continue;
    }

    if (suggestion.matches.some((match) => normalizedBreed.includes(match))) {
      return suggestion;
    }
  }

  if (normalizedSpecies === "cat") {
    return {
      size: "XS",
      note: "Most cats start at XS; use the measurements to confirm the exact cut.",
    };
  }

  return {
    size: "CUSTOM",
    note: "No direct breed match yet. We will rely on the measurements for a custom fit.",
  };
}

export function MeasurementWizard() {
  const router = useRouter();
  const [intro, setIntro] = useState<IntroStepValue>(initialIntro);
  const [measurementInputs, setMeasurementInputs] = useState<
    Record<MeasurementKey, string>
  >(initialMeasurementInputs);
  const [touched, setTouched] = useState<
    Record<"petName" | "breed" | "species" | MeasurementKey, boolean>
  >({
    petName: false,
    breed: false,
    species: false,
    neckCm: false,
    chestCm: false,
    backLengthCm: false,
    legGirthCm: false,
  });
  const [activeStep, setActiveStep] = useState(0);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [savedMeasurementId, setSavedMeasurementId] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [firstProductId, setFirstProductId] = useState<string | null>(null);

  const measurements = useMemo(() => {
    return {
      neckCm: Number(measurementInputs.neckCm) || 0,
      chestCm: Number(measurementInputs.chestCm) || 0,
      backLengthCm: Number(measurementInputs.backLengthCm) || 0,
      legGirthCm: Number(measurementInputs.legGirthCm) || 0,
    } satisfies PetMeasurements;
  }, [measurementInputs]);

  const completedMeasurements = useMemo(() => {
    return STEP_DEFINITIONS.map((step) => ({
      ...step,
      value: measurementInputs[step.key],
      error: touched[step.key]
        ? validateMeasurementValue(step.key, measurementInputs[step.key])
        : null,
    }));
  }, [measurementInputs, touched]);

  const hasCompleteMeasurements = completedMeasurements.every(
    (step) => Boolean(step.value) && !step.error,
  );
  const sizingRecommendation = useMemo(
    () =>
      recommendSizeFromMeasurements(
        hasCompleteMeasurements ? measurements : null,
      ),
    [hasCompleteMeasurements, measurements],
  );

  const currentStepDefinition =
    activeStep > 0 ? STEP_DEFINITIONS[activeStep - 1] : null;
  const currentProgress = ((activeStep + 1) / 5) * 100;
  const breedSuggestion = getBreedSuggestion(intro.species, intro.breed);

  const introErrors = useMemo(() => {
    return {
      petName: touched.petName
        ? validateIntroField("petName", intro.petName)
        : null,
      species: touched.species
        ? validateIntroField("species", intro.species)
        : null,
      breed: touched.breed ? validateIntroField("breed", intro.breed) : null,
    };
  }, [intro, touched]);

  const currentMeasurementError = currentStepDefinition
    ? touched[currentStepDefinition.key]
      ? validateMeasurementValue(
          currentStepDefinition.key,
          measurementInputs[currentStepDefinition.key],
        )
      : null
    : null;

  useEffect(() => {
    let isMounted = true;

    async function loadMeasurements() {
      try {
        const response = await fetch("/api/measurements", {
          cache: "no-store",
        });

        if (response.status === 401) {
          return;
        }

        const data = await readMeasurementApiResponse(response);

        if (!response.ok) {
          throw new Error(
            data?.error ??
              `Failed to load saved measurements (HTTP ${response.status}).`,
          );
        }

        if (!isMounted || !data || !data.measurement) {
          return;
        }

        const loaded = data.measurement;
        setMeasurementInputs({
          neckCm: toOneDecimal(loaded.neckCm).toFixed(1),
          chestCm: toOneDecimal(loaded.chestCm).toFixed(1),
          backLengthCm: toOneDecimal(loaded.backLengthCm).toFixed(1),
          legGirthCm: toOneDecimal(loaded.legGirthCm).toFixed(1),
        });
        setSavedMeasurementId(loaded.id ?? null);
        setSavedAt(loaded.createdAt ?? null);
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Failed to load saved measurements.";
        toast.error(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadMeasurements();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile]);

  useEffect(() => {
    let isMounted = true;

    async function loadFirstProduct() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("products")
          .select("id")
          .eq("is_active", true)
          .order("name", { ascending: true })
          .limit(1)
          .maybeSingle();

        console.log("Product fetch result:", data, error);

        if (error) {
          throw new Error(error.message);
        }

        if (isMounted) {
          setFirstProductId(data?.id ?? null);
        }
      } catch (error) {
        // Silently fail - the buttons will still work, just without the product ID
        console.error("Failed to load first product:", error);
      }
    }

    void loadFirstProduct();

    return () => {
      isMounted = false;
    };
  }, []);

  const introStepValidation = () => {
    const errors = INTRO_FIELDS.map((key) =>
      validateIntroField(key, intro[key]),
    );
    return errors.find(Boolean) ?? null;
  };

  const firstInvalidMeasurementStep = () => {
    return STEP_DEFINITIONS.findIndex((step) =>
      Boolean(validateMeasurementValue(step.key, measurementInputs[step.key])),
    );
  };

  function updateTouched(key: keyof typeof touched) {
    setTouched((current) => ({ ...current, [key]: true }));
  }

  function updateIntroField(key: keyof IntroStepValue, value: string) {
    setIntro((current) => ({ ...current, [key]: value }));
    updateTouched(key);
  }

  function updateMeasurementField(key: MeasurementKey, value: string) {
    setMeasurementInputs((current) => ({ ...current, [key]: value }));
    updateTouched(key);
  }

  function goBack() {
    setActiveStep((current) => Math.max(current - 1, 0));
  }

  async function saveMeasurements() {
    const introError = introStepValidation();

    if (introError) {
      setTouched((current) => ({
        ...current,
        petName: true,
        species: true,
        breed: true,
      }));
      setActiveStep(0);
      toast.error(introError);
      return;
    }

    const invalidMeasurementStep = firstInvalidMeasurementStep();

    if (invalidMeasurementStep !== -1) {
      const invalidKey = STEP_DEFINITIONS[invalidMeasurementStep].key;
      updateTouched(invalidKey);
      setActiveStep(invalidMeasurementStep + 1);
      toast.error(
        validateMeasurementValue(invalidKey, measurementInputs[invalidKey]) ??
          "Please complete the measurement step.",
      );
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/measurements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          petName: intro.petName,
          breed: intro.breed,
          neckCm: toOneDecimal(Number(measurements.neckCm)),
          chestCm: toOneDecimal(Number(measurements.chestCm)),
          backLengthCm: toOneDecimal(Number(measurements.backLengthCm)),
          legGirthCm: toOneDecimal(Number(measurements.legGirthCm)),
        }),
      });

      const data = await readMeasurementApiResponse(response);

      if (!response.ok) {
        throw new Error(
          data?.error ??
            `Unable to save measurements (HTTP ${response.status}).`,
        );
      }

      const savedMeasurementIdFromInsert = data?.measurement?.id ?? null;

      if (!savedMeasurementIdFromInsert) {
        throw new Error(
          "Measurement saved, but id was not returned from Supabase.",
        );
      }

      setSavedMeasurementId(savedMeasurementIdFromInsert);
      setSavedAt(data?.measurement?.createdAt ?? null);
      toast.success(
        `${intro.petName || "Your pet"}'s measurements were saved.`,
      );
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to save measurements.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  function goForward() {
    if (activeStep === 0) {
      const error = introStepValidation();

      if (error) {
        setTouched((current) => ({
          ...current,
          petName: true,
          species: true,
          breed: true,
        }));
        toast.error(error);
        return;
      }

      setActiveStep(1);
      return;
    }

    if (currentStepDefinition) {
      const error = validateMeasurementValue(
        currentStepDefinition.key,
        measurementInputs[currentStepDefinition.key],
      );

      if (error) {
        updateTouched(currentStepDefinition.key);
        toast.error(error);
        return;
      }
    }

    if (activeStep === 4) {
      void saveMeasurements();
      return;
    }

    setActiveStep((current) => current + 1);
  }

  const saveDisabled =
    isSaving ||
    Boolean(introStepValidation()) ||
    STEP_DEFINITIONS.some((step) =>
      Boolean(validateMeasurementValue(step.key, measurementInputs[step.key])),
    );

  if (isLoading) {
    return (
      <Card className="mx-auto w-full max-w-6xl border-black/5 bg-white/95 shadow-[0_20px_70px_rgba(15,23,42,0.12)]">
        <CardContent className="flex items-center justify-center gap-3 py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading saved measurements...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-6xl overflow-hidden border-black/5 bg-white/95 shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
      <CardHeader className="border-b bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.18),_transparent_32%),linear-gradient(135deg,_#0f172a_0%,_#111827_56%,_#1f2937_100%)] text-white">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Badge className="w-fit border-white/15 bg-white/10 px-3 py-1 text-white hover:bg-white/15">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Vega style measurement flow
            </Badge>
            <div className="space-y-3">
              <CardTitle className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
                Measure your pet with confidence, one guided step at a time.
              </CardTitle>
              <CardDescription className="max-w-2xl text-base leading-7 text-slate-200">
                Start with pet details, follow the illustrated measurement
                cards, and save the finished fit profile directly to your
                account.
              </CardDescription>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/10 p-4 text-sm backdrop-blur">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-300">
                Suggested starting size
              </p>
              <p className="mt-1 text-3xl font-semibold text-white">
                {breedSuggestion.size}
              </p>
            </div>
            <p className="max-w-sm text-slate-200">{breedSuggestion.note}</p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <Progress
            value={currentProgress}
            className="bg-white/10"
            aria-label="Measurement wizard progress"
          />
          <nav
            aria-label="Measurement wizard steps"
            className="flex gap-2 overflow-x-auto pb-1"
          >
            {[
              { title: "Pet info", icon: PawPrint },
              ...STEP_DEFINITIONS.map((step) => ({
                title: step.title,
                icon: Ruler,
              })),
            ].map((step, stepIndex) => {
              const active = stepIndex === activeStep;
              const complete = stepIndex < activeStep;

              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => {
                    if (stepIndex <= activeStep) {
                      setActiveStep(stepIndex);
                    }
                  }}
                  aria-current={active ? "step" : undefined}
                  className={`inline-flex min-w-[8.5rem] items-center gap-2 rounded-full border px-3 py-2 text-left text-sm transition ${
                    active
                      ? "border-white/30 bg-white text-slate-950 shadow-sm"
                      : complete
                        ? "border-white/20 bg-white/10 text-white hover:bg-white/15"
                        : "border-white/10 bg-white/5 text-slate-300"
                  }`}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${active ? "bg-slate-950 text-white" : "bg-white/15 text-white"}`}
                  >
                    <step.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="leading-tight">{step.title}</span>
                </button>
              );
            })}
          </nav>
          <p className="text-sm text-slate-200">Step {activeStep + 1} of 5</p>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
        {savedAt ? (
          <section className="col-span-full flex flex-col items-center justify-center gap-8 py-16">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="rounded-full bg-emerald-50 p-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold text-slate-950">
                  Measurements saved successfully!
                </h2>
                <p className="max-w-md text-lg text-slate-600">
                  {intro.petName || "Your pet"}'s fit profile is now saved to
                  your account and ready for use.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => {
                  console.log("firstProductId at click time:", firstProductId);
                  router.push("/shop");
                }}
                variant="outline"
                className="px-6 py-3 text-base"
              >
                Browse Products
              </Button>

              <Button
                variant="ghost"
                className="px-6 py-3 text-base"
                onClick={() => {
                  // Reset wizard state back to initial values and return to step 0.
                  setIntro(initialIntro);
                  setMeasurementInputs(initialMeasurementInputs);
                  setTouched({
                    petName: false,
                    breed: false,
                    species: false,
                    neckCm: false,
                    chestCm: false,
                    backLengthCm: false,
                    legGirthCm: false,
                  });
                  setActiveStep(0);
                  setPhotoFile(null);
                  setPhotoPreviewUrl(null);
                  // Clear any saved flags so the success screen hides and wizard returns to first step UI
                  setSavedAt(null);
                  setSavedMeasurementId(null);
                }}
              >
                Add Another Measurement
              </Button>

              <Button asChild className="px-6 py-3 text-base">
                <Link
                  href={
                    firstProductId && savedMeasurementId
                      ? `/products/${firstProductId}?measurement_id=${savedMeasurementId}`
                      : "/shop"
                  }
                >
                  Use for Recovery Vest
                </Link>
              </Button>
            </div>
          </section>
        ) : (
          <>
            <section className="space-y-6">
              {activeStep === 0 ? (
                <Card className="border-black/5 bg-slate-50/90 shadow-none">
                  <CardHeader className="space-y-2">
                    <Badge variant="secondary" className="w-fit">
                      Step 1
                    </Badge>
                    <CardTitle>Welcome and pet details</CardTitle>
                    <CardDescription>
                      Tell us who we are fitting. The breed suggestion updates
                      as you type.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="petName">Pet name</Label>
                      <Input
                        id="petName"
                        value={intro.petName}
                        onChange={(event) =>
                          updateIntroField("petName", event.target.value)
                        }
                        onBlur={() => updateTouched("petName")}
                        placeholder="E.g. Luna"
                        aria-invalid={Boolean(introErrors.petName)}
                        aria-describedby="petName-help"
                      />
                      <p
                        id="petName-help"
                        className="text-sm text-muted-foreground"
                      >
                        A name helps you keep multiple pets organized.
                      </p>
                      {introErrors.petName ? (
                        <p className="text-sm text-destructive">
                          {introErrors.petName}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="species">Species</Label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {SPECIES_OPTIONS.map((option) => (
                          <Button
                            key={option}
                            type="button"
                            variant={
                              intro.species === option ? "default" : "outline"
                            }
                            className="justify-center"
                            onClick={() => updateIntroField("species", option)}
                            onBlur={() => updateTouched("species")}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                      {introErrors.species ? (
                        <p className="text-sm text-destructive">
                          {introErrors.species}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="breed">Breed</Label>
                      <Input
                        id="breed"
                        value={intro.breed}
                        onChange={(event) =>
                          updateIntroField("breed", event.target.value)
                        }
                        onBlur={() => updateTouched("breed")}
                        placeholder="Labrador Retriever"
                        aria-invalid={Boolean(introErrors.breed)}
                        aria-describedby="breed-help"
                      />
                      <p
                        id="breed-help"
                        className="text-sm text-muted-foreground"
                      >
                        Enter the most specific breed you know. We use this for
                        a rough starting size.
                      </p>
                      {introErrors.breed ? (
                        <p className="text-sm text-destructive">
                          {introErrors.breed}
                        </p>
                      ) : null}
                    </div>

                    <div className="sm:col-span-2 grid gap-4 rounded-3xl border border-black/5 bg-white p-4 shadow-xs md:grid-cols-[1fr_0.85fr]">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          Breed-based suggestion
                        </p>
                        <p className="text-lg font-semibold">
                          Starting size: {breedSuggestion.size}
                        </p>
                        <p className="text-sm leading-6 text-muted-foreground">
                          {breedSuggestion.note}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          The final fit still depends on the four measurements
                          you enter next.
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-950 p-4 text-white">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
                          Quick reminder
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-200">
                          Keep the tape level, do not compress the fur, and
                          measure in centimeters for the most reliable result.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="overflow-hidden border-black/5 bg-slate-50/90 shadow-none">
                  <CardHeader className="space-y-2 border-b bg-white/80">
                    <Badge variant="secondary" className="w-fit">
                      Step {activeStep + 1}
                    </Badge>
                    <CardTitle>{currentStepDefinition?.title}</CardTitle>
                    <CardDescription>
                      {currentStepDefinition?.subtitle}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 p-6 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="space-y-5">
                      <div className="space-y-3 rounded-3xl border border-black/5 bg-white p-5 shadow-xs">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                          How to measure
                        </p>
                        <ol className="space-y-3 text-sm leading-6 text-slate-700">
                          {currentStepDefinition?.instructions.map(
                            (instruction, instructionIndex) => (
                              <li key={instruction} className="flex gap-3">
                                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-900">
                                  {instructionIndex + 1}
                                </span>
                                <span>{instruction}</span>
                              </li>
                            ),
                          )}
                        </ol>
                      </div>

                      <figure className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-xs">
                        <Image
                          src={
                            currentStepDefinition?.imageUrl ??
                            "https://placehold.co/960x540/png?text=Measurement"
                          }
                          alt={
                            currentStepDefinition?.imageAlt ??
                            "Measurement reference image"
                          }
                          width={960}
                          height={540}
                          className="aspect-video w-full object-cover"
                        />
                        <figcaption className="space-y-1 p-4 text-sm text-slate-600">
                          <p className="font-medium text-slate-900">
                            Illustrated reference
                          </p>
                          <p>
                            Use this guide to place the tape exactly where the
                            garment needs support.
                          </p>
                        </figcaption>
                      </figure>
                    </div>

                    <div className="space-y-5">
                      <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-xs">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                              Live input
                            </p>
                            <p className="mt-1 text-lg font-semibold">
                              Enter the value in centimeters
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {currentStepDefinition?.min} -{" "}
                            {currentStepDefinition?.max} cm
                          </Badge>
                        </div>

                        <div className="mt-5 space-y-3">
                          <Label htmlFor={currentStepDefinition?.key}>
                            {currentStepDefinition?.title}
                          </Label>
                          <Input
                            id={currentStepDefinition?.key}
                            type="number"
                            min={currentStepDefinition?.min}
                            max={currentStepDefinition?.max}
                            step="0.1"
                            inputMode="decimal"
                            value={
                              currentStepDefinition
                                ? measurementInputs[currentStepDefinition.key]
                                : ""
                            }
                            onChange={(event) => {
                              if (!currentStepDefinition) {
                                return;
                              }

                              updateMeasurementField(
                                currentStepDefinition.key,
                                event.target.value,
                              );
                            }}
                            onBlur={() => {
                              if (!currentStepDefinition) {
                                return;
                              }

                              updateTouched(currentStepDefinition.key);
                            }}
                            placeholder="0.0"
                            aria-invalid={Boolean(currentMeasurementError)}
                            aria-describedby={`${currentStepDefinition?.key}-help`}
                          />
                          <p
                            id={`${currentStepDefinition?.key}-help`}
                            className="text-sm text-muted-foreground"
                          >
                            {currentStepDefinition?.helper}
                          </p>
                          {currentMeasurementError ? (
                            <p
                              className="text-sm text-destructive"
                              aria-live="polite"
                            >
                              {currentMeasurementError}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      {activeStep === 4 ? (
                        <Card className="border-black/5 bg-white shadow-xs">
                          <CardHeader className="space-y-2 border-b">
                            <Badge variant="secondary" className="w-fit">
                              Review and save
                            </Badge>
                            <CardTitle>Optional photo upload</CardTitle>
                            <CardDescription>
                              This is only a placeholder for later photo
                              analysis. The file stays local in this prototype.
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4 p-5">
                            <label className="grid cursor-pointer gap-3 rounded-2xl border border-dashed border-black/10 bg-slate-50 p-4 transition hover:border-black/20 hover:bg-slate-100/70">
                              <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                                <Upload className="h-4 w-4" />
                                Upload a reference photo
                              </span>
                              <span className="text-sm leading-6 text-slate-600">
                                Add a front or side photo for later
                                photo-analysis features. This is optional.
                              </span>
                              <Input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(event) => {
                                  const file = event.target.files?.[0] ?? null;
                                  setPhotoFile(file);

                                  if (file) {
                                    toast.success(
                                      `Selected ${file.name} for future photo analysis.`,
                                    );
                                  }
                                }}
                              />
                            </label>

                            {photoPreviewUrl ? (
                              <div className="overflow-hidden rounded-2xl border border-black/5">
                                <Image
                                  src={photoPreviewUrl}
                                  alt="Uploaded preview"
                                  width={960}
                                  height={420}
                                  unoptimized
                                  className="h-52 w-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="rounded-2xl border border-black/5 bg-slate-50 p-4 text-sm text-slate-600">
                                No photo selected yet.
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              )}
            </section>

            <aside className="space-y-6">
              <Card className="border-black/5 bg-slate-50/90 shadow-none">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-xl">Review summary</CardTitle>
                  <CardDescription>
                    Keep an eye on the live summary while you move through the
                    flow.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-black/5 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Pet details
                    </p>
                    <div className="mt-3 grid gap-2 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Name</span>
                        <span className="font-medium text-slate-950">
                          {intro.petName || "Not set"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Species</span>
                        <span className="font-medium text-slate-950">
                          {intro.species || "Not set"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Breed</span>
                        <span className="font-medium text-slate-950">
                          {intro.breed || "Not set"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-black/5 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Measurement snapshot
                    </p>
                    <div className="mt-3 grid gap-2 text-sm">
                      {completedMeasurements.map((step) => (
                        <div
                          key={step.key}
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="text-muted-foreground">
                            {step.title}
                          </span>
                          <span className="font-medium text-slate-950">
                            {formatMeasurement(step.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-black/5 bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Size guidance
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      <Badge className="bg-slate-950 px-3 py-1 text-white hover:bg-slate-900">
                        {breedSuggestion.size}
                      </Badge>
                      <p className="text-sm text-slate-600">
                        {breedSuggestion.note}
                      </p>
                    </div>
                    {hasCompleteMeasurements ? (
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
                        <p className="font-medium">
                          Measurement-based estimate:{" "}
                          {sizingRecommendation.recommendedSize}
                        </p>
                        <p className="mt-1 text-emerald-900/80">
                          {sizingRecommendation.explanation} Confidence:{" "}
                          {formatConfidenceLabel(
                            sizingRecommendation.confidence,
                          )}
                          .
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {savedAt ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                      <p className="font-medium">Saved to your account</p>
                      <p className="mt-1 text-emerald-900/80">
                        Last synced {new Date(savedAt).toLocaleString()}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="border-black/5 bg-white shadow-none">
                <CardHeader className="space-y-2">
                  <CardTitle className="text-xl">Fit notes</CardTitle>
                  <CardDescription>
                    These reminders help keep the fit comfortable and practical.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
                  <p>
                    Measure while your pet is relaxed and standing straight on a
                    flat surface.
                  </p>
                  <p>
                    Keep the tape snug but never tight enough to compress fur or
                    skin.
                  </p>
                  <p>
                    Use the same unit across every field so the saved profile
                    stays consistent.
                  </p>
                </CardContent>
              </Card>
            </aside>
          </>
        )}
      </CardContent>

      {!savedAt && (
        <CardFooter className="flex flex-col items-start gap-4 border-t bg-slate-50/80 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={goBack}
              disabled={activeStep === 0 || isSaving}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={goForward}
              disabled={saveDisabled && activeStep === 4}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : activeStep === 4 ? (
                "Save measurements"
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            {activeStep === 4
              ? "Review the full fit profile, then save it to your account."
              : "Move through the flow at your own pace. Previous steps stay editable."}
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
