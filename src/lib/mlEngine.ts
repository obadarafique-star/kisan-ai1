import { FarmRecord, FARM_DATASET } from "../data/farmDataset";

export interface MLModel {
  weights: number[];
  numFeatures: number;
  featureNames: string[];
  xMin: number[];
  xMax: number[];
  yMin: number;
  yMax: number;
  r2Score: number;
  rmse: number;
}

export interface TrainingHistory {
  epoch: number;
  loss: number;
}

export interface TrainingResult {
  yieldModel: MLModel;
  waterModel: MLModel;
  historyYield: TrainingHistory[];
  historyWater: TrainingHistory[];
}

// Global lists of categoricals for consistent one-hot mapping
export const CROPS = ["Cotton", "Carrot", "Sugarcane", "Tomato", "Soybean", "Rice", "Maize", "Wheat", "Barley", "Potato"];
export const IRRIGATION_TYPES = ["Sprinkler", "Manual", "Flood", "Rain-fed", "Drip"];
export const SOIL_TYPES = ["Loamy", "Peaty", "Silty", "Clay", "Sandy"];
export const SEASONS = ["Kharif", "Zaid", "Rabi"];

/**
 * Encodes a single farm record into a numeric feature vector.
 * The output vector includes:
 * [Bias(1), Area, Fertilizer, Pesticide, ...CropsOneHot, ...IrrigationOneHot, ...SoilOneHot, ...SeasonsOneHot]
 */
export function recordToFeatureVector(
  record: Omit<FarmRecord, "farmId" | "yield" | "waterUsage">
): number[] {
  const vector: number[] = [1.0]; // Bias term at index 0

  // Continuous numerical attributes
  vector.push(record.farmArea);
  vector.push(record.fertilizerUsed);
  vector.push(record.pesticideUsed);

  // One-hot encode Crop Type
  CROPS.forEach((crop) => {
    vector.push(record.cropType.toLowerCase() === crop.toLowerCase() ? 1.0 : 0.0);
  });

  // One-hot encode Irrigation Type
  IRRIGATION_TYPES.forEach((irr) => {
    vector.push(record.irrigationType.toLowerCase() === irr.toLowerCase() ? 1.0 : 0.0);
  });

  // One-hot encode Soil Type
  SOIL_TYPES.forEach((soil) => {
    vector.push(record.soilType.toLowerCase() === soil.toLowerCase() ? 1.0 : 0.0);
  });

  // One-hot encode Season
  SEASONS.forEach((season) => {
    vector.push(record.season.toLowerCase() === season.toLowerCase() ? 1.0 : 0.0);
  });

  return vector;
}

/**
 * Returns names of each column in the feature vector for feature importance visualization
 */
export function getFeatureNames(): string[] {
  return [
    "Bias",
    "Farm Area (acres)",
    "Fertilizer Used (tons)",
    "Pesticide Used (kg)",
    ...CROPS.map((c) => `Crop: ${c}`),
    ...IRRIGATION_TYPES.map((i) => `Irrigation: ${i}`),
    ...SOIL_TYPES.map((s) => `Soil: ${s}`),
    ...SEASONS.map((se) => `Season: ${se}`),
  ];
}

/**
 * Trains Multivariate Linear Regression models using Stochastic Gradient Descent.
 */
export function trainModels(
  dataset: FarmRecord[] = FARM_DATASET,
  epochs: number = 600,
  learningRate: number = 0.03
): TrainingResult {
  const n = dataset.length;
  if (n === 0) {
    throw new Error("Dataset is empty; cannot train model.");
  }

  const featureNames = getFeatureNames();
  const numFeatures = featureNames.length;

  // 1. Construct raw feature vectors and targets
  const rawX: number[][] = dataset.map((rec) => recordToFeatureVector(rec));
  const rawY_yield: number[] = dataset.map((rec) => rec.yield);
  const rawY_water: number[] = dataset.map((rec) => rec.waterUsage);

  // 2. Perform Min-Max scaling of continuous features (indexes 1, 2, 3) and Targets to stabilize Gradient Descent
  const xMin = Array(numFeatures).fill(0);
  const xMax = Array(numFeatures).fill(1);

  // Bias is constant 1.0, so keep min=0, max=1
  for (let col = 1; col < numFeatures; col++) {
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (let row = 0; row < n; row++) {
      const val = rawX[row][col];
      if (val < minVal) minVal = val;
      if (val > maxVal) maxVal = val;
    }
    // Avoid division by zero for binary one-hot attributes
    if (maxVal === minVal) {
      xMin[col] = minVal - 0.5;
      xMax[col] = maxVal + 0.5;
    } else {
      xMin[col] = minVal;
      xMax[col] = maxVal;
    }
  }

  // Scale feature vectors
  const scaledX: number[][] = rawX.map((vec) => {
    return vec.map((val, idx) => {
      if (idx === 0) return 1.0; // Bias column
      return (val - xMin[idx]) / (xMax[idx] - xMin[idx]);
    });
  });

  // Scale target Ys
  const yMin_yield = Math.min(...rawY_yield);
  const yMax_yield = Math.max(...rawY_yield);
  const scaledY_yield = rawY_yield.map((y) => (y - yMin_yield) / (yMax_yield - yMin_yield));

  const yMin_water = Math.min(...rawY_water);
  const yMax_water = Math.max(...rawY_water);
  const scaledY_water = rawY_water.map((y) => (y - yMin_water) / (yMax_water - yMin_water));

  // 3. Train Yield Model with Stochastic Gradient Descent
  const wYield = Array(numFeatures).fill(0.0);
  const historyYield: TrainingHistory[] = [];

  for (let epoch = 1; epoch <= epochs; epoch++) {
    let epochLoss = 0.0;
    // Shuffle rows for stochastic GD
    const indices = Array.from({ length: n }, (_, i) => i);
    indices.sort(() => Math.random() - 0.5);

    for (const idx of indices) {
      const x = scaledX[idx];
      const y = scaledY_yield[idx];

      // Predict
      let pred = 0.0;
      for (let j = 0; j < numFeatures; j++) {
        pred += wYield[j] * x[j];
      }

      const error = pred - y;
      epochLoss += error * error;

      // Update weights
      for (let j = 0; j < numFeatures; j++) {
        wYield[j] -= learningRate * error * x[j];
      }
    }
    
    // Log history for charts (decimate to keep UI fast)
    if (epoch % 10 === 0 || epoch === 1) {
      historyYield.push({ epoch, loss: epochLoss / n });
    }
  }

  // 4. Train Water Model with SGD
  const wWater = Array(numFeatures).fill(0.0);
  const historyWater: TrainingHistory[] = [];

  for (let epoch = 1; epoch <= epochs; epoch++) {
    let epochLoss = 0.0;
    const indices = Array.from({ length: n }, (_, i) => i);
    indices.sort(() => Math.random() - 0.5);

    for (const idx of indices) {
      const x = scaledX[idx];
      const y = scaledY_water[idx];

      let pred = 0.0;
      for (let j = 0; j < numFeatures; j++) {
        pred += wWater[j] * x[j];
      }

      const error = pred - y;
      epochLoss += error * error;

      for (let j = 0; j < numFeatures; j++) {
        wWater[j] -= learningRate * error * x[j];
      }
    }

    if (epoch % 10 === 0 || epoch === 1) {
      historyWater.push({ epoch, loss: epochLoss / n });
    }
  }

  // 5. Evaluate models (RMSE & R2 Score)
  const evalModel = (weights: number[], scaledTargetY: number[], minTarget: number, maxTarget: number) => {
    let sumSqError = 0;
    let sumSqTotal = 0;
    
    // Target mean
    const sum = scaledTargetY.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    for (let i = 0; i < n; i++) {
      const x = scaledX[i];
      const yScaled = scaledTargetY[i];

      let predScaled = 0;
      for (let j = 0; j < numFeatures; j++) {
        predScaled += weights[j] * x[j];
      }

      // Convert back to original scale
      const yActual = yScaled * (maxTarget - minTarget) + minTarget;
      const yPred = predScaled * (maxTarget - minTarget) + minTarget;

      const err = yPred - yActual;
      sumSqError += err * err;

      const targetMeanScaledBack = mean * (maxTarget - minTarget) + minTarget;
      const diffMean = yActual - targetMeanScaledBack;
      sumSqTotal += diffMean * diffMean;
    }

    const rmse = Math.sqrt(sumSqError / n);
    const r2Score = 1 - (sumSqError / (sumSqTotal || 1));

    return { rmse, r2Score };
  };

  const evalYield = evalModel(wYield, scaledY_yield, yMin_yield, yMax_yield);
  const evalWater = evalModel(wWater, scaledY_water, yMin_water, yMax_water);

  return {
    yieldModel: {
      weights: wYield,
      numFeatures,
      featureNames,
      xMin,
      xMax,
      yMin: yMin_yield,
      yMax: yMax_yield,
      r2Score: Math.max(0, evalYield.r2Score),
      rmse: evalYield.rmse,
    },
    waterModel: {
      weights: wWater,
      numFeatures,
      featureNames,
      xMin,
      xMax,
      yMin: yMin_water,
      yMax: yMax_water,
      r2Score: Math.max(0, evalWater.r2Score),
      rmse: evalWater.rmse,
    },
    historyYield,
    historyWater,
  };
}

/**
 * Predicts yield and water usage for a new user input using trained models
 */
export function predict(
  input: Omit<FarmRecord, "farmId" | "yield" | "waterUsage">,
  yieldModel: MLModel,
  waterModel: MLModel
): { predictedYield: number; predictedWater: number } {
  // Convert inputs to raw feature vector
  const rawVec = recordToFeatureVector(input);

  const scaleAndPredict = (model: MLModel) => {
    // Scale features using trained mins and maxes
    const scaledVec = rawVec.map((val, idx) => {
      if (idx === 0) return 1.0; // Bias is unscaled
      const min = model.xMin[idx];
      const max = model.xMax[idx];
      return (val - min) / (max - min);
    });

    // Multiply weights
    let predScaled = 0.0;
    for (let j = 0; j < model.numFeatures; j++) {
      predScaled += model.weights[j] * scaledVec[j];
    }

    // Clip to valid [0, 1] range to avoid runaway predictions on out-of-bounds inputs
    predScaled = Math.max(0, Math.min(1.2, predScaled));

    // Scale back to targets
    const predActual = predScaled * (model.yMax - model.yMin) + model.yMin;
    return Math.max(0, predActual);
  };

  return {
    predictedYield: scaleAndPredict(yieldModel),
    predictedWater: scaleAndPredict(waterModel),
  };
}

/**
 * Extracts and sorts feature importance weights for a trained model
 */
export function getFeatureImportances(model: MLModel): { name: string; weight: number; direction: "positive" | "negative" }[] {
  const list: { name: string; weight: number; direction: "positive" | "negative" }[] = [];
  
  // Skip bias at index 0
  for (let i = 1; i < model.numFeatures; i++) {
    const w = model.weights[i];
    if (Math.abs(w) > 0.0001) {
      list.push({
        name: model.featureNames[i],
        weight: Math.abs(w),
        direction: w >= 0 ? "positive" : "negative",
      });
    }
  }

  // Sort descending by importance
  return list.sort((a, b) => b.weight - a.weight);
}
