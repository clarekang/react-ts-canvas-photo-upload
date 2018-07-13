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

export interface PhotoInfo {
  info?: {
    top: number;
    left: number;
    bottom: number;
    right: number;
    width: number;
    height: number;
  };
  message: string;
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
