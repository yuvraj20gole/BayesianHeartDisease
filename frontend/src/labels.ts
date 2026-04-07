export const DISPLAY_NAMES: Record<string, string> = {
  Age: "Age group",
  Sex: "Sex",
  ChestPainType: "Chest pain type",
  RestingBP: "Resting blood pressure",
  Cholesterol: "Cholesterol",
  FastingBS: "Fasting blood sugar",
  RestingECG: "Resting ECG",
  MaxHR: "Max heart rate",
  ExerciseAngina: "Exercise angina",
  Oldpeak: "ST depression (Oldpeak)",
  ST_Slope: "ST slope",
};

export const FIELD_HINTS: Record<string, string> = {
  Age: "Age band used when the data were discretized for the network.",
  Sex: "Recorded sex category in the training data.",
  ChestPainType: "Chest pain pattern (e.g. typical vs atypical angina).",
  RestingBP: "Resting systolic blood pressure (binned).",
  Cholesterol: "Total cholesterol (mg/dL), binned into three levels.",
  FastingBS: "Whether fasting blood sugar is elevated in the dataset encoding.",
  RestingECG: "Resting ECG category (normal vs ST changes vs LVH).",
  MaxHR: "Maximum heart rate achieved, binned into bands.",
  ExerciseAngina: "Exercise-induced angina (Y/N).",
  Oldpeak: "ST depression (Oldpeak), binned in mm.",
  ST_Slope: "Slope of the ST segment on ECG.",
};
