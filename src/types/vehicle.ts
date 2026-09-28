export interface BoundingBox {
  ymin: number; // 0 to 100 percentage
  xmin: number; // 0 to 100 percentage
  ymax: number; // 0 to 100 percentage
  xmax: number; // 0 to 100 percentage
}

export interface DetectedCarItem {
  id?: string;
  make: string;
  model: string;
  colour: string; // e.g. "White", "Obsidian Black", "Guards Red"
  colour_hex?: string; // hex code for visual badge
  make_confidence: number; // 0.0 to 1.0 (e.g. 0.94)
  model_confidence: number; // 0.0 to 1.0 (e.g. 0.87)
  colour_confidence: number; // 0.0 to 1.0 (e.g. 0.98)
  bounding_box?: BoundingBox;
  year_estimate?: string;
  body_type?: string;
  notes?: string;
}

export type DetectedCar = DetectedCarItem;

export interface CarAnalysisResponse {
  car_detected: boolean;
  message?: string;
  cars: DetectedCarItem[];
  // Fallback for single car backward compatibility
  primary_car?: DetectedCarItem;
}

export interface ScanRecord {
  id: string;
  timestamp: number;
  imageUrl: string;
  analysis: CarAnalysisResponse;
  selectedCarIndex: number;
  notes?: string;
}

export interface SampleCar {
  id: string;
  title: string;
  make: string;
  model: string;
  colour: string;
  colorHex: string;
  tag: string;
  imageUrl: string;
  description: string;
  isMultiCar?: boolean;
}
