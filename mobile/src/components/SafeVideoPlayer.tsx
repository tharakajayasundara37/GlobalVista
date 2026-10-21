import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

interface SafeVideoPlayerProps {
  sourceUrl: string;
  posterUrl: string;
  isMuted?: boolean;
  style?: StyleProp<ViewStyle>;
  nativeControls?: boolean;
  autoPlay?: boolean;
}

export const SafeVideoPlayer: React.FC<SafeVideoPlayerProps> = ({
  sourceUrl,
  posterUrl,
  isMuted = true,
  style,
  nativeControls = false,
  autoPlay = true,
}) => {
  const [hasError, setHasError] = useState(false);

  const player = useVideoPlayer(sourceUrl, (p) => {
    p.loop = true;
    p.muted = isMuted;
    if (autoPlay) {
      p.play();
    }
  });

  // Handle sourceUrl changes (e.g. switching between destination scenes)
  useEffect(() => {
    if (player && sourceUrl) {
      try {
        setHasError(false);
        if (typeof (player as any).replaceAsync === 'function') {
          (player as any).replaceAsync(sourceUrl).catch((err: any) => {
            console.warn('Async video source replace error:', err);
          });
        } else {
          player.replace(sourceUrl);
        }
        player.muted = isMuted;
        if (autoPlay) {
          player.play();
        }
      } catch (err) {
        console.warn('Failed to switch video source:', err);
        setHasError(true);
      }
    }
  }, [sourceUrl, player, isMuted, autoPlay]);

  // Handle mute changes
  useEffect(() => {
    if (player) {
      player.muted = isMuted;
    }
  }, [isMuted, player]);

  // If video encounters an error or is unsupported, render high-definition poster image
  if (hasError || !sourceUrl) {
    return (
      <Image
        source={{ uri: posterUrl }}
        style={[styles.full, style as StyleProp<ImageStyle>]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Background Poster while video loads */}
      <Image
        source={{ uri: posterUrl }}
        style={[StyleSheet.absoluteFill, styles.full]}
        resizeMode="cover"
      />
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        nativeControls={nativeControls}
        contentFit="cover"
        allowsPictureInPicture={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#070b14',
  },
  full: {
    width: '100%',
    height: '100%',
  },
});
