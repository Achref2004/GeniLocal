import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import type { AvatarConfig } from '../../utils/avatarConfig';

interface AvatarCanvasProps {
  config: AvatarConfig;
  mouthState?: 'closed' | 'small' | 'open' | 'wide';
  blinkState?: boolean;
  size?: number;
  className?: string;
}

export default function AvatarCanvas({
  config,
  mouthState = 'closed',
  blinkState = false,
  size = 200,
  className = '',
}: AvatarCanvasProps) {
  const renderedSvgString = useMemo(() => {
    if (!config) return null;

    const dynamicOptions: Record<string, unknown> = {
      seed: 'core',
      backgroundColor: ['transparent'],
      radius: 50,
      size: size,
      top: [config.top],
      accessories: config.accessories !== 'none' ? [config.accessories] : [],
      hairColor: [config.hairColor],
      facialHair: config.facialHair !== 'none' ? [config.facialHair] : [],
      clothing: [config.clothing],
      clothesColor: [config.clothesColor],
      eyes: [config.eyes],
      eyebrows: [config.eyebrows],
      mouth: [config.mouth],
      skinColor: [config.skinColor],
    };

    // Lip-Sync dynamic mapping
    if (mouthState !== 'closed') {
      if (mouthState === 'wide') dynamicOptions.mouth = ['screamOpen'];
      else if (mouthState === 'open') dynamicOptions.mouth = ['grimace'];
      else if (mouthState === 'small') dynamicOptions.mouth = ['smile'];
    }

    // Eye closing logic
    if (blinkState) dynamicOptions.eyes = ['closed'];

    try {
      const avatar = createAvatar(avataaars, dynamicOptions as Parameters<typeof createAvatar>[1]);
      return avatar.toString();
    } catch (e) {
      console.error('DiceBear Error:', e);
      return '';
    }
  }, [config, mouthState, blinkState, size]);

  if (!renderedSvgString)
    return <div className={`bg-gray-800 rounded-full animate-pulse ${className}`} style={{ width: size, height: size }} />;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
      dangerouslySetInnerHTML={{ __html: renderedSvgString }}
    />
  );
}
