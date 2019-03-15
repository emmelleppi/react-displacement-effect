import React, { useState } from "react";
import ReactDOM from "react-dom";
import useDisplacementAnimation from "./animation";
import { Expo } from "gsap/TweenMax";
import "./styles.css";
import styled, { css } from "styled-components";

const App = props => {
  const [disabled, setDisabled] = useState(false);
  const [selected, setSelected] = useState(0);
  const animationProps = {
    dispImg: "https://picsum.photos/1440/1179?image=723",
    image1: "https://picsum.photos/1440/1179?image=498",
    intensity1: 1,
    intensity2: 1,
    commonAngle: Math.PI / 2,
    speedIn: 1,
    easing: Expo.easeOut,
    onComplete: () => setDisabled(false)
  };
  const [Animation, changeImage] = useDisplacementAnimation(animationProps);
  const text = "WOW IT'S A BEAUTIFUL DISPLACEMENT ANIMATION ";
  const repeatedText = new Array(1000).fill(1).map(() => text);
  console.log(repeatedText);
  return (
    <Background>
      <div
        style={{
          position: "absolute",
          zIndex: -1
        }}
      >
        {repeatedText}
      </div>
      <AppWrapper>{Animation}</AppWrapper>
      <ButtonWrapper>
        <Button
          onClick={() => {
            if (selected !== 1) {
              setDisabled(true);
              setSelected(1);
              changeImage("https://picsum.photos/1440/1179?image=384");
            }
          }}
          disabled={disabled}
          selected={selected === 1}
        >
          1
        </Button>
        <Button
          onClick={() => {
            if (selected !== 2) {
              setDisabled(true);
              setSelected(2);
              changeImage("https://picsum.photos/1440/1179?image=881");
            }
          }}
          disabled={disabled}
          selected={selected === 2}
        >
          2
        </Button>
        <Button
          onClick={() => {
            if (selected !== 3) {
              setDisabled(true);
              setSelected(3);
              changeImage("https://picsum.photos/1440/1179?image=824");
            }
          }}
          disabled={disabled}
          selected={selected === 3}
        >
          3
        </Button>
      </ButtonWrapper>
    </Background>
  );
};

const Background = styled.div`
  color: white;
  font-family: sans-serif;
  font-size: 25px;
  font-weight: 600;
  word-break: break-all;
  position: relative;
  background: deeppink;
  width: 100vw;
  height: 100vh;
  z-index: 0;
`;
const ButtonWrapper = styled.div`
  text-align: center;
  padding-top: 10%;
`;
const Button = styled.button`
  margin: 0 1rem;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  font-size: 30px;
  cursor: pointer;
  color: deeppink;
  background-color: white;
  border: 5px solid white;
  :hover {
    color: white;
    background-color: deeppink;
    border: 5px solid deeppink;
  }
  ${props =>
    props.selected &&
    css`
      color: white;
      background-color: deeppink;
      border: 5px solid deeppink;
    `}
  ${props =>
    (props.disabled || props.selected) &&
    css`
      opacity: 0.5;
    `}
`;
const AppWrapper = styled.div`
  position: absolute;
  width: 90%;
  height: 90%;
  left: 50%;
  top: 50%;
  transform: translateX(-50%) translateY(-50%);
  overflow: hidden;
  margin: auto;
  z-index: -1;
  border: 1rem solid white;
`;
const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
