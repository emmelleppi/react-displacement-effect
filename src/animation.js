import React, { useMemo, useRef, useEffect, useState } from "react";
import * as THREE from "three";
import TweenMax from "gsap/TweenMax";
import { Canvas, useThree } from "react-three-fiber";

const vertex = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const fragment = `
  varying vec2 vUv;
  uniform float dispFactor;
  uniform sampler2D disp;
  uniform sampler2D texture1;
  uniform sampler2D texture2;
  uniform float angle1;
  uniform float angle2;
  uniform float intensity1;
  uniform float intensity2;
  mat2 getRotM(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat2(c, -s, s, c);
  }
  void main() {
    vec4 disp = texture2D(disp, vUv);
    vec2 dispVec = vec2(disp.r, disp.g);
    vec2 distortedPosition1 = vUv + getRotM(angle1) * dispVec * intensity1 * dispFactor;
    vec2 distortedPosition2 = vUv + getRotM(angle2) * dispVec * intensity2 * (1.0 - dispFactor);
    vec4 _texture1 = texture2D(texture1, distortedPosition1);
    vec4 _texture2 = texture2D(texture2, distortedPosition2);
    gl_FragColor = mix(_texture1, _texture2, dispFactor);
  }
`;

const getMaterialParams = props => {
  const {
    intensity1,
    intensity2,
    angle1,
    angle2,
    texture1,
    texture2,
    disp
  } = props;
  return {
    uniforms: {
      intensity1: {
        type: "f",
        value: intensity1
      },
      intensity2: {
        type: "f",
        value: intensity2
      },
      dispFactor: {
        type: "f",
        value: 0.0
      },
      angle1: {
        type: "f",
        value: angle1
      },
      angle2: {
        type: "f",
        value: angle2
      },
      texture1: {
        type: "t",
        value: texture1
      },
      texture2: {
        type: "t",
        value: texture2
      },
      disp: {
        type: "t",
        value: disp
      }
    },
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    opacity: 1.0
  };
};

const generalTransition = ({ obj, speed, value, ease, onComplete }) => {
  TweenMax.to(obj, speed, {
    value,
    ease,
    onComplete
  });
};

const transitionIn = ({ dispFactor, speedIn, easing, onComplete }) => {
  generalTransition({
    obj: dispFactor,
    speed: speedIn,
    value: 1,
    ease: easing,
    onComplete
  });
};

const textureAsUniform = ({ texture1, texture2, meshRef }) => {
  meshRef.current.material.uniforms.texture1.value = texture1;
  meshRef.current.material.uniforms.texture2.value = texture2;
  meshRef.current.material.uniforms.dispFactor.value = 0.0;
};

const loadTexture = ({ imageUrl, loader }) => {
  return new Promise(resolve => {
    loader.load(imageUrl, resolve);
  });
};

const loadTextures = ({ initImage, endImage, loader }) => {
  const promises = [
    loadTexture({ imageUrl: initImage, loader }),
    loadTexture({ imageUrl: endImage, loader })
  ];
  return Promise.all(promises).then(result => {
    const texture1 = result[0];
    const texture2 = result[1];
    texture1.magFilter = texture2.magFilter = THREE.LinearFilter;
    texture1.minFilter = texture2.minFilter = THREE.LinearFilter;
    return { texture1, texture2 };
  });
};

const loadImages = ({ initImage, endImage }) => {
  const loader = new THREE.TextureLoader();
  return loadTextures({ initImage, endImage, loader });
};

const resizeMesh = ({ image, canvas }) => {
  const canvasAspect = canvas.clientWidth / canvas.clientHeight;
  const imageAspect = image.width / image.height;
  const horizontalDrawAspect = imageAspect / canvasAspect;
  const verticalDrawAspect = 1;
  if (horizontalDrawAspect < 1) {
    return { width: 1, height: verticalDrawAspect / horizontalDrawAspect };
  }
  return { width: horizontalDrawAspect, height: verticalDrawAspect };
};

const useDisplacementAnimation = props => {
  const {
    dispImg,
    image1,
    intensity1,
    intensity2,
    commonAngle,
    speedIn,
    easing,
    onComplete
  } = props;
  const meshRef = useRef();
  const [initImage, setInitImage] = useState(image1);
  const [endImage, setEndImage] = useState(image1);
  const [dispImage, setDispImage] = useState(dispImg);
  const [shaderProps, setShaderProps] = useState();
  const disp = useMemo(
    () => {
      const loader = new THREE.TextureLoader();
      const dispTexture = loader.load(dispImage);
      dispTexture.wrapS = dispTexture.wrapT = THREE.RepeatWrapping;
      return dispTexture;
    },
    [dispImage]
  );

  useEffect(() => {
    const angle1 = commonAngle;
    const angle2 = -commonAngle * 3;
    loadImages({ initImage, endImage }).then(result => {
      const { texture1, texture2 } = result;
      const shader = getMaterialParams({
        intensity1,
        intensity2,
        angle1,
        angle2,
        texture1,
        texture2,
        disp
      });
      setShaderProps(shader);
    });
  }, []);

  useEffect(
    () => {
      if (meshRef.current) {
        loadImages({
          initImage,
          endImage
        }).then(result => {
          const { texture1, texture2 } = result;
          textureAsUniform({ texture1, texture2, meshRef });
          transitionIn({
            dispFactor: meshRef.current.material.uniforms.dispFactor,
            speedIn,
            easing,
            onComplete: () => {
              setInitImage(endImage);
              if (onComplete) {
                onComplete();
              }
            }
          });
        });
      }
    },
    [endImage]
  );

  return [
    <Canvas>
      <Content meshRef={meshRef} shaderProps={shaderProps} />
    </Canvas>,
    img => setEndImage(img)
  ];
};

const Content = ({ meshRef, shaderProps }) => {
  const { gl, canvas, viewport } = useThree();
  const { width: widthVp, height: heightVp } = viewport();
  const [dimensions, setDimensions] = useState(viewport());
  const { width, height } = dimensions;

  useEffect(() => {
    gl.setPixelRatio(window.devicePixelRatio);
    gl.setClearColor(0xffffff, 0.0);
    gl.alpha = 0;
    gl.antialias = false;
  }, []);
  useEffect(
    () => {
      if (meshRef.current) {
        setDimensions(
          resizeMesh({
            image: meshRef.current.material.uniforms.texture1.value.image,
            canvas
          })
        );
      }
    },
    [widthVp, heightVp]
  );
  return (
    <>
      <orthographicCamera args={[-1, 1, 1, -1, -1, 1]} />
      <mesh ref={meshRef} scale={[width, height, 1]}>
        <planeBufferGeometry name="geometry" args={[widthVp, heightVp, 1, 1]} />
        <shaderMaterial name="material" {...shaderProps} />
      </mesh>
    </>
  );
};

export default useDisplacementAnimation;
