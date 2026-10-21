import React, { useState, useEffect } from 'react';
import { Image, ImageProps, StyleProp, ImageStyle, View, StyleSheet } from 'react-native';

const LUXURY_FALLBACKS: Record<string, string> = {
  japan: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
  kyoto: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
  tokyo: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
  fuji: 'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=1200&q=80',
  maldives: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80',
  male: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=80',
  switzerland: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
  interlaken: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
  alps: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=80',
  'sri lanka': 'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1200&q=80',
  sigiriya: 'https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1200&q=80',
  bali: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
  ubud: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
  thailand: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=1200&q=80',
  phuket: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
};

const resolveFallback = (keywords?: string, fallbackUri?: string): string => {
  if (fallbackUri && fallbackUri.trim().length > 0) return fallbackUri;
  if (keywords) {
    const lower = keywords.toLowerCase();
    for (const [key, url] of Object.entries(LUXURY_FALLBACKS)) {
      if (lower.includes(key)) return url;
    }
  }
  return LUXURY_FALLBACKS.default;
};

interface SafeImageProps extends Omit<ImageProps, 'source'> {
  uri: string | null | undefined;
  fallbackUri?: string;
  keywords?: string;
  style?: StyleProp<ImageStyle>;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  uri,
  fallbackUri,
  keywords,
  style,
  ...props
}) => {
  const [currentUri, setCurrentUri] = useState<string>(() => {
    return uri && uri.trim().length > 0 ? uri : resolveFallback(keywords, fallbackUri);
  });
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    if (uri && uri.trim().length > 0) {
      setCurrentUri(uri);
      setHasFailed(false);
    } else {
      setCurrentUri(resolveFallback(keywords, fallbackUri));
    }
  }, [uri, keywords, fallbackUri]);

  const handleError = () => {
    if (!hasFailed) {
      setHasFailed(true);
      const fallback = resolveFallback(keywords, fallbackUri);
      setCurrentUri(fallback);
    }
  };

  return (
    <View style={[styles.container, style as any]}>
      <Image
        {...props}
        source={{ uri: currentUri }}
        style={[StyleSheet.absoluteFill, style]}
        onError={handleError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a101d',
    overflow: 'hidden',
  },
});
