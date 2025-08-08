import React, {useEffect, useState} from 'react';
import {AbsoluteFill} from 'remotion';
import Lottie from 'lottie-react';
import {VideoData} from '../VideoComposition';
import lottieData from '../teste.json';

interface LottieAnimationProps {
  lottieFile: string;
  customData: VideoData;
}

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  lottieFile,
  customData
}) => {
  const [animationData, setAnimationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔄 LottieAnimation: useEffect triggered');
    console.log('📁 Lottie file:', lottieFile);
    console.log('🎨 Custom data:', customData);
    
    try {
      console.log('📊 Dados originais do Lottie carregados');
      console.log('📋 Estrutura do arquivo:', Object.keys(lottieData));
      console.log('📋 Número de camadas:', lottieData.layers?.length || 0);
      console.log('🎬 Dimensões:', lottieData.w, 'x', lottieData.h);
      console.log('⏱️ Duração original:', lottieData.op, 'frames a', lottieData.fr, 'fps');
      console.log('⏱️ Duração em segundos:', lottieData.op / lottieData.fr, 'segundos');
      
      // Verifica se o arquivo tem a estrutura esperada
      if (!lottieData.layers || !Array.isArray(lottieData.layers)) {
        throw new Error('Arquivo Lottie inválido: propriedade "layers" não encontrada ou não é um array');
      }
      
      // Aplica as modificações dinâmicas
      const modifiedData = applyCustomData(lottieData, customData);
      console.log('✅ Dados modificados criados');
      console.log('📋 Número de camadas após modificação:', modifiedData.layers?.length || 0);
      
      setAnimationData(modifiedData);
    } catch (error) {
      console.error('❌ Erro ao carregar animação Lottie:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  }, [lottieFile, customData]);

  // Função para aplicar dados customizados ao Lottie
  const applyCustomData = (lottieData: any, customData: VideoData) => {
    console.log('🔧 Iniciando applyCustomData...');
    console.log('🎨 Custom data recebido:', customData);
    
    // Verifica se lottieData tem a estrutura correta
    if (!lottieData || !lottieData.layers || !Array.isArray(lottieData.layers)) {
      console.error('❌ Estrutura Lottie inválida:', lottieData);
      throw new Error('Estrutura Lottie inválida: layers não encontrado ou não é um array');
    }
    
    const modifiedData = JSON.parse(JSON.stringify(lottieData)); // Deep clone
    
    // Debug: Verificar se temos dados para modificar
    if (!customData || Object.keys(customData).length === 0) {
      console.log('⚠️ Nenhum dado customizado fornecido');
      return modifiedData;
    }
    
    console.log('📊 Camadas originais:', modifiedData.layers.length);
    
    // Modifica cores nas camadas existentes
    modifiedData.layers.forEach((layer: any, layerIndex: number) => {
      console.log(`🔍 Processando camada ${layerIndex}: ${layer.nm}`);
      
      if (layer.shapes && Array.isArray(layer.shapes)) {
        layer.shapes.forEach((shapeGroup: any) => {
          if (shapeGroup.it && Array.isArray(shapeGroup.it)) {
            shapeGroup.it.forEach((item: any) => {
              // Modifica fills (preenchimentos)
              if (item.ty === 'fl' && customData.cor_primaria) {
                console.log('🎨 Modificando cor de preenchimento para:', customData.cor_primaria);
                item.c = {
                  a: 0,
                  k: hexToRgbArray(customData.cor_primaria),
                  ix: 4
                };
              }
              
              // Modifica strokes (contornos)
              if (item.ty === 'st' && customData.cor_secundaria) {
                console.log('🎨 Modificando cor de contorno para:', customData.cor_secundaria);
                item.c = {
                  a: 0,
                  k: hexToRgbArray(customData.cor_secundaria),
                  ix: 3
                };
              }
              
              // Modifica gradientes de fundo
              if (item.ty === 'gf' && customData.cor_fundo) {
                console.log('🎨 Modificando gradiente de fundo para:', customData.cor_fundo);
                const rgb = hexToRgb(customData.cor_fundo);
                if (rgb) {
                  // Cria um gradiente com a cor base e uma variação mais clara
                  const r = rgb.r / 255;
                  const g = rgb.g / 255;
                  const b = rgb.b / 255;
                  
                  // Cor mais clara para o gradiente
                  const rLight = Math.min(1, r + 0.3);
                  const gLight = Math.min(1, g + 0.3);
                  const bLight = Math.min(1, b + 0.3);
                  
                  item.g = {
                    p: 2, // 2 cores no gradiente
                    k: {
                      a: 0,
                      k: [
                        0,      // Posição da Cor 1 (Início)
                        r,      // R da cor base
                        g,      // G da cor base
                        b,      // B da cor base
                        1,      // Posição da Cor 2 (Fim)
                        rLight, // R da cor mais clara
                        gLight, // G da cor mais clara
                        bLight  // B da cor mais clara
                      ],
                      ix: 9
                    }
                  };
                  console.log('✅ Gradiente modificado com cores:', [r, g, b], 'para', [rLight, gLight, bLight]);
                }
              }
            });
          }
        });
      }
    });

    console.log('✅ Modificações aplicadas com sucesso');
    return modifiedData;
  };

  // Função auxiliar para converter hex para RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // Função auxiliar para converter hex para array RGB
  const hexToRgbArray = (hex: string) => {
    const rgb = hexToRgb(hex);
    const result = rgb ? [rgb.r / 255, rgb.g / 255, rgb.b / 255, 1] : [1, 1, 1, 1];
    console.log(`🎨 Convertendo ${hex} para RGB:`, result);
    return result;
  };

  // Renderiza um fallback visual para debug
  if (error) {
    console.log('❌ Renderizando erro:', error);
    return (
      <AbsoluteFill style={{
        backgroundColor: '#FF0000',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        fontSize: '48px',
        textAlign: 'center'
      }}>
        <div>
          <h1>ERRO NO LOTTIE</h1>
          <p>{error}</p>
          <p>Dados recebidos: {JSON.stringify(customData)}</p>
          <p>Arquivo: {lottieFile}</p>
        </div>
      </AbsoluteFill>
    );
  }

  if (!animationData) {
    console.log('⏳ Renderizando tela de carregamento...');
    return (
      <AbsoluteFill style={{
        backgroundColor: '#0000FF',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        fontSize: '48px',
        textAlign: 'center'
      }}>
        <div>
          <h1>CARREGANDO...</h1>
          <p>Dados recebidos: {JSON.stringify(customData)}</p>
          <p>Arquivo: {lottieFile}</p>
        </div>
      </AbsoluteFill>
    );
  }

  console.log('🎬 Renderizando Lottie com dados modificados');
  return (
    <AbsoluteFill>
      <Lottie
        animationData={animationData}
        loop={true} // Permite loop para durar 6 segundos
        autoplay={true}
        style={{
          width: '100%',
          height: '100%'
        }}
        rendererSettings={{
          preserveAspectRatio: 'xMidYMid slice',
          progressiveLoad: false, // Carrega tudo de uma vez para melhor performance
          hideOnTransparent: true
        }}
      />
    </AbsoluteFill>
  );
}; 