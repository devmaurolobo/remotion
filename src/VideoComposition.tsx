import React from 'react';
import {Composition, AbsoluteFill} from 'remotion';
import {LottieAnimation} from './components/LottieAnimation';

// Interface para os dados dinâmicos
export interface VideoData {
  texto_principal?: string;
  logo_empresa?: string;
  video_fundo?: string;
  cor_primaria?: string;
  cor_secundaria?: string;
  cor_fundo?: string; // Nova propriedade para cor de fundo
  duracao?: number;
}

// Componente principal que renderiza o Lottie
export const VideoComposition: React.FC<VideoData> = (props) => {
  console.log('🎬 VideoComposition renderizado com props:', props);
  
  return (
    <AbsoluteFill>
      <LottieAnimation 
        lottieFile="teste.json"
        customData={props}
      />
    </AbsoluteFill>
  );
};

// Configuração da composição
export const RemotionVideo: React.FC = () => {
  console.log('🎬 RemotionVideo renderizado');
  
  return (
    <>
      <Composition
        id="VideoComposition"
        component={VideoComposition}
        durationInFrames={144} // 6 segundos a 24fps (3 ciclos de 2 segundos)
        fps={24} // FPS original do Lottie para sincronização perfeita
        width={1080}
        height={1920}
        defaultProps={{
          texto_principal: "Texto Padrão",
          logo_empresa: "https://exemplo.com/logo.png",
          video_fundo: "https://exemplo.com/video.mp4",
          cor_primaria: "#FF0000",
          cor_secundaria: "#00FF00",
          cor_fundo: "#1E90FF", // Cor de fundo padrão (DodgerBlue)
          duracao: 6 // 6 segundos (3 ciclos da animação)
        }}
      />
    </>
  );
}; 