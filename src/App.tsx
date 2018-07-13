import * as React from "react";
import styled from "styled-components";
import "./App.css";

import logo from "./logo.svg";

import { PhotoInfo, PhotoRequests, PhotoResponses, Vertice } from "./Photo";

const googleKey = "asdf";

const FACE_WIDTH = 35;
const FACE_POSITION_TOP = 0.35;
const MIN_IMAGE_WIDTH_IN_PX = 540;
const ASPECT_RATIO = 75;
const canvasWidth = 300;
const canvasHeight = 400;

const sample = require("./assets/photo-ex.png");
const background = require("./assets/unregistered-image.png");
const errorBg = require("./assets/photo-viewer.png");
const Img = styled.img`
  width: ${canvasWidth}px;
  height: ${canvasHeight}px;
`;

const ImageBackground = styled.div`
  width: ${canvasWidth}px;
  height: ${canvasHeight}px;
  background: url(${background}) no-repeat center center;
`;

const GuideText = styled.ul`
  display: block;
  font-size: 0.9em;
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
`;

const ModalColumn = styled.div`
  width: 300px;
  padding: 10px;
`;

interface AppProps {
  onSubmit?: (photo: any) => void;
  onClose?: () => void;
}

interface AppState {
  imageData: string;
  canvas: HTMLElement | null;
  img: HTMLImageElement;
  message: string;
}

class App extends React.Component<AppProps, AppState> {
  public state = {
    imageData: "",
    canvas: null,
    img: new Image(),
    message: "",
  };

  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <div>
          <ModalContent>
            <ModalColumn>
              <h4>사진 가이드</h4>
              <Img src={sample} />
              <GuideText>
                <li>얼굴이 잘 보이는 단독 사진을 업로드해주세요.</li>
                <li>미소 짓고 있는 사진을 등록해주세요.</li>
              </GuideText>
            </ModalColumn>
            <ModalColumn>
              <h4>사진 등록</h4>
              <ImageBackground>
                <canvas
                  ref={this.refCanvas}
                  width={canvasWidth}
                  height={canvasHeight}
                />
                {this.state.message && <p>{this.state.message}</p>}
              </ImageBackground>
              <input
                type="file"
                name="photo"
                onChange={this.handleOnFileUpload}
                value={this.state.img.name}
                accept=".jpg,.png,.bmp,.jpeg"
              />
            </ModalColumn>
          </ModalContent>
        </div>
      </div>
    );
  }

  private refCanvas = (element: HTMLCanvasElement) => {
    this.setState({
      canvas: element,
    });
  };

  private handleOnFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        const imageData = reader.result.split(",")[1];
        const img = new Image();
        img.src = reader.result;
        img.onload = () => {
          this.setState({
            imageData: reader.result,
            img,
            message: "",
          });
          this.fileUpload(imageData).then((photoInfo: PhotoInfo) => {
            if (!photoInfo.info && !!photoInfo.message) {
              this.setState({
                message: photoInfo.message,
              });
            }
            this.drawInCanvas(photoInfo);
          });
        };
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  private fileUpload = (content: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      const body: PhotoRequests = {
        requests: [
          {
            image: {
              content,
            },
            features: [
              {
                type: "FACE_DETECTION",
              },
            ],
          },
        ],
      };
      this.uploadPhoto(body)
        .then((res: PhotoResponses) => resolve(this.getPhotoInfo(res)))
        .catch(() => reject(false));
    });
  };

  private getPhotoInfo(data: PhotoResponses) {
    if (data.responses.length === 0) {
      return { message: "얼굴이 인식되지 않습니다." };
    }
    if (data.responses.length > 1) {
      return { message: "얼굴이 하나인 사진만 승인됩니다." };
    }

    const faceDetection = data.responses[0].faceAnnotations[0];
    let topBound: number = 0;
    let bottomBound: number = 0;
    let leftBound: number = 0;
    let rightBound: number = 0;
    faceDetection.fdBoundingPoly.vertices.forEach((vertice: Vertice) => {
      if (!topBound || vertice.y < topBound) {
        topBound = vertice.y;
      }
      if (!bottomBound || vertice.y > bottomBound) {
        bottomBound = vertice.y;
      }
      if (!leftBound || vertice.x < leftBound) {
        leftBound = vertice.x;
      }
      if (!rightBound || vertice.x > rightBound) {
        rightBound = vertice.x;
      }
    });

    const faceWidth = rightBound - leftBound;
    const cropWidth = Math.round((faceWidth / FACE_WIDTH) * 100);
    const cropHeight = Math.round((cropWidth / ASPECT_RATIO) * 100);

    if (cropWidth < MIN_IMAGE_WIDTH_IN_PX) {
      return { message: "지금보다 얼굴이 크게 보여야합니다." };
    }

    const top = Math.round(topBound - cropHeight * FACE_POSITION_TOP);
    const bottom = top + cropHeight;
    const horizontalCenter = leftBound + Math.round(faceWidth / 2);
    const left = horizontalCenter - cropWidth / 2;
    const right = left + cropWidth;

    return {
      info: {
        top,
        bottom,
        left,
        right,
        width: cropWidth,
        height: cropHeight,
      },
      message: "사진이 등록되었습니다.",
    };
  }

  private uploadPhoto(body: any): Promise<PhotoResponses> {
    return fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${googleKey}`,
      {
        method: "POST",
        headers: new Headers({
          Accept: "application/json",
        }),
        body: JSON.stringify(body),
      },
    )
      .then(res => res.json())
      .catch(() => false);
  }

  private drawInCanvas = (photoInfo: PhotoInfo) => {
    const { canvas, img } = this.state;
    const { top, left, right, bottom, width, height } = photoInfo.info;
    const ctx = canvas.getContext("2d");

    if (left < 0 || top < 0 || right > img.width || bottom > img.height) {
      this.setState({
        message: "얼굴이 화면 정중앙에 놓여야 합니다.",
      });
    }

    const x = left;
    const y = top;
    const ratio = canvasWidth / width;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 캔버스 빨간 영역 출력
    // ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
    // ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    const redBackground = new Image();
    redBackground.src = errorBg;
    redBackground.onload = () => {
      ctx.drawImage(redBackground, 0, 0, canvasWidth, canvasHeight);

      // 캔버스 흰 영역 출력
      ctx.fillStyle = "#fff";
      ctx.fillRect(
        x * -1 * ratio,
        y * -1 * ratio,
        img.width * ratio,
        img.height * ratio,
      );

      // 캔버스 사진 출력
      ctx.drawImage(
        img,
        x,
        y,
        width,
        height,
        0,
        0,
        Math.round(width * ratio),
        Math.round(height * ratio),
      );
    };
  };
}

export default App;
