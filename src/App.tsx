import * as React from "react";
import styled from "styled-components";
import "./App.css";

import logo from "./logo.svg";

import {
  PhotoInfo,
  PhotoRequests,
  PhotoResponses,
  Vertice,
  PhotoResult,
} from "./Photo";

const canvasWidth = 540;
const canvasHeight = 720;
const imageWidth = 225;
const imageHeight = 300;

const faceWidthPx = 45;
const facePositionTop = 0.25;
const minImageWidthPx = 420;
const aspectRatio = canvasWidth / canvasHeight;

const sample = require("./assets/photo-guide.png");
const background = require("./assets/unregistered-image.png");
const Img = styled.img`
  width: ${imageWidth}px;
  height: ${imageHeight}px;
`;

const Canvas = styled.canvas`
  width: ${imageWidth}px;
  height: ${imageHeight}px;
  background: url(${background}) no-repeat center center;
  background-size: ${imageWidth}px ${imageHeight}px;
`;

const GuideText = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  list-style-image: none;
  display: block;
  font-size: 0.9em;
  margin-top: 10px;
  text-align: left;
`;

const Content = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  padding: 20px;
`;

const Column = styled.div`
  width: 300px;
  padding: 10px;
  text-align: center;
`;

const Header = styled.h4`
  text-align: left;
  margin-top: 0;
  margin-bottom: 10px;
`;

const Message = styled.p`
  text-align: center;
  margin-top: 10px;
  margin-bottom: 10px;
`;

const ApiInput = styled.input`
  width: 400px;
  height: 20px;
  font-size: 1.2em;
`;

interface AppState {
  message: string;
  googleKey: string;
}

class App extends React.Component<{}, AppState> {
  public state = {
    message: "Upload your Photo",
    googleKey: "",
  };

  private canvas!: HTMLCanvasElement;
  private img!: HTMLImageElement;
  private errorBackground!: HTMLImageElement;

  public componentDidMount() {
    const errorBackground = new Image();
    errorBackground.src = require("./assets/photo-viewer.png");
    errorBackground.onload = () => {
      this.errorBackground = errorBackground;
    };
  }

  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">React TypeScript Canvas Photo Upload</h1>
          <small>React, TypeScript and Canvas Photo Upload with GCS</small>
        </header>
        <>
          <Content>
            <Column>
              <Header>Photo Guidance</Header>
              <Img src={sample} />
              <GuideText>
                <li>Please upload a stand-alone photo that looks good.</li>
                <li>Please upload a photo with smile.</li>
              </GuideText>
            </Column>
            <Column>
              <Header>Your Photo</Header>
              <Canvas
                innerRef={this.refCanvas}
                width={canvasWidth}
                height={canvasHeight}
              />
              <Message>{this.state.message}</Message>
              <input
                type="file"
                name="photo"
                onChange={this.handleOnFileUpload}
                value={this.img && this.img.name}
                accept=".jpg,.png,.bmp,.jpeg"
              />
            </Column>
          </Content>
          <Content>
            <ApiInput
              name="googleKey"
              onChange={this.handleOnKeyChange}
              value={this.state.googleKey}
              placeholder="YOUR-GOOGLE-API-KEY"
            />
          </Content>
        </>
      </div>
    );
  }

  private refCanvas = (canvas: HTMLCanvasElement) => {
    this.canvas = canvas;
  };

  private handleOnKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({
      googleKey: e.target.value,
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
          this.img = img;
          this.setState({
            message: "",
          });

          this.fileUpload(imageData)
            .then((result: PhotoResult) => {
              if (!result.info && !!result.message) {
                this.setState({
                  message: result.message,
                });
              }
              this.drawInCanvas(result.info!);
            })
            .catch(() => {
              alert("Not Valid Google API Key Or Data");
            });
        };
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  private fileUpload = (content: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!!this.state.googleKey) {
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
      } else {
        reject(false);
      }
    });
  };

  private getPhotoInfo(data: PhotoResponses) {
    if (data.responses.length === 0) {
      return { message: "The face is not recognized." };
    }
    if (data.responses.length > 1) {
      return { message: "Only photos with a single face will be accepted." };
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
    const cropWidth = Math.round((faceWidth / faceWidthPx) * 100);
    const cropHeight = Math.round(cropWidth / aspectRatio);

    if (cropWidth < minImageWidthPx) {
      return { message: "The face should look bigger than now." };
    }

    const top = Math.round(topBound - cropHeight * facePositionTop);
    const bottom = top + cropHeight;
    const horizontalCenter = leftBound + Math.round(faceWidth / 2);
    const left = horizontalCenter - cropWidth / 2;
    const right = left + cropWidth;

    if (left < 0 || top < 0 || right > imageWidth || bottom > imageHeight) {
      return {
        info: {
          x: left,
          y: top,
          width: cropWidth,
          height: cropHeight,
        },
        message: "The face must be in the middle of the screen.",
      };
    }

    return {
      info: {
        x: left,
        y: top,
        width: cropWidth,
        height: cropHeight,
      },
      message: "Photo Uploaded",
    };
  }

  private uploadPhoto(body: any): Promise<PhotoResponses> {
    return fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${
        this.state.googleKey
      }`,
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
    const ctx = this.canvas.getContext("2d") || null;
    if (!!ctx) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      if (!!photoInfo) {
        const { x, y, width, height } = photoInfo;
        const ratio = canvasWidth / width;
        ctx.drawImage(this.errorBackground, 0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = "#fff";
        ctx.fillRect(
          x * -1 * ratio,
          y * -1 * ratio,
          this.img.width * ratio,
          this.img.height * ratio,
        );
        ctx.drawImage(
          this.img,
          x,
          y,
          width,
          height,
          0,
          0,
          Math.round(width * ratio),
          Math.round(height * ratio),
        );
      } else {
        ctx.drawImage(this.img, 0, 0, this.img.width, this.img.height);
      }
    }
  };
}

export default App;
