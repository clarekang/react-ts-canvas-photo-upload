interface PhotoRequestImage {
  content: string;
}

interface PhotoRequestFeature {
  type: string;
}

interface PhotoRequest {
  features?: PhotoRequestFeature[];
  image?: PhotoRequestImage;
}

export interface PhotoRequests {
  requests: PhotoRequest[];
}

export interface Vertice {
  x: number;
  y: number;
}

interface Poly {
  vertices: Vertice[];
}

export interface PhotoResult {
  info?: PhotoInfo;
  message: string;
}

export interface PhotoInfo {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Position extends Vertice {
  z: number;
}

interface Landmark {
  type: string;
  position: Position;
}

interface PhotoResponseFaceAnnotation {
  angerLikelihood: string;
  blurredLikelihood: string;
  boundingPoly: Poly;
  detectionConfidence: number;
  fdBoundingPoly: Poly;
  headwearLikelihood: string;
  joyLikelihood: string;
  landmarkingConfidence: number;
  landmarks: Landmark[];
  panAngle: number;
  rollAngle: number;
  sorrowLikelihood: string;
  surpriseLikelihood: string;
  tiltAngle: number;
  underExposedLikelihood: string;
}

interface PhotoResponse {
  faceAnnotations: PhotoResponseFaceAnnotation[];
}

export interface PhotoResponses {
  responses: PhotoResponse[];
}
