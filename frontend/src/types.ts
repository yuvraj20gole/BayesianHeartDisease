export type SchemaResponse = {
  target: string;
  variables: Record<string, string[]>;
};

export type PredictResponse = {
  heart_disease: Record<string, number>;
  probability_positive: number;
};
