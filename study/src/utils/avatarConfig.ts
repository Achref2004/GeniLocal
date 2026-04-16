const AVATAR_KEY = 'study_dicebear_config_detailed';

export const AVATAR_OPTIONS = {
  top: ['shortFlat', 'hat', 'hijab', 'turban', 'winterHat1', 'winterHat02', 'winterHat03', 'winterHat04', 'bob', 'bun', 'curly', 'curvy', 'dreads', 'frida', 'fro', 'froBand', 'longButNotTooLong', 'miaWallace', 'shavedSides', 'straight02', 'straight01', 'straightAndStrand', 'dreads01', 'dreads02', 'frizzle', 'shaggy', 'shaggyMullet', 'shortCurly', 'shortRound', 'shortWaved', 'sides', 'theCaesar', 'theCaesarAndSidePart', 'bigHair'],
  eyes: ['default', 'closed', 'cry', 'eyeRoll', 'happy', 'hearts', 'side', 'squint', 'surprised', 'winkWacky', 'wink', 'xDizzy'],
  eyebrows: ['defaultNatural', 'angryNatural', 'flatNatural', 'frownNatural', 'raisedExcitedNatural', 'sadConcernedNatural', 'unibrowNatural', 'upDownNatural', 'angry', 'default', 'raisedExcited', 'sadConcerned', 'upDown'],
  mouth: ['default', 'concerned', 'disbelief', 'eating', 'grimace', 'sad', 'screamOpen', 'serious', 'smile', 'tongue', 'twinkle', 'vomit'],
  facialHair: ['none', 'beardLight', 'beardMajestic', 'beardMedium', 'moustacheFancy', 'moustacheMagnum'],
  clothing: ['shirtCrewNeck', 'blazerAndShirt', 'blazerAndSweater', 'collarAndSweater', 'graphicShirt', 'hoodie', 'overall', 'shirtScoopNeck', 'shirtVNeck'],
  accessories: ['none', 'kurt', 'prescription01', 'prescription02', 'round', 'sunglasses', 'wayfarers', 'eyepatch'],
  skinColor: ['edb98a', 'ffdbb4', 'fd9841', 'f8d25c', 'd08b5b', 'ae5d29', '614335'],
  hairColor: ['2c1b18', '4a312c', '724133', 'a55728', 'b58143', 'c93305', 'd6b370', 'e8e1e1', 'ecdcbf', 'f59797'],
  clothesColor: ['262e33', '3c4f5c', '25557c', '5199e4', '65c9ff', 'b1e2ff', 'a7ffc4', 'ffffb1', 'ffafb9', 'ff5c5c', 'ff488e', '929598', 'e6e6e6', 'ffffff'],
};

export interface AvatarConfig {
  top: string;
  hairColor: string;
  eyes: string;
  eyebrows: string;
  mouth: string;
  facialHair: string;
  clothing: string;
  clothesColor: string;
  accessories: string;
  skinColor: string;
}

export const getDefaultConfig = (): AvatarConfig => ({
  top: 'shortFlat',
  hairColor: '2c1b18',
  eyes: 'default',
  eyebrows: 'defaultNatural',
  mouth: 'default',
  facialHair: 'none',
  clothing: 'shirtCrewNeck',
  clothesColor: '262e33',
  accessories: 'none',
  skinColor: 'ffdbb4',
});

export const getRandomConfig = (): AvatarConfig => {
  const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
  return {
    top: pick(AVATAR_OPTIONS.top),
    hairColor: pick(AVATAR_OPTIONS.hairColor),
    eyes: pick(AVATAR_OPTIONS.eyes),
    eyebrows: pick(AVATAR_OPTIONS.eyebrows),
    mouth: pick(AVATAR_OPTIONS.mouth),
    facialHair: pick(AVATAR_OPTIONS.facialHair),
    clothing: pick(AVATAR_OPTIONS.clothing),
    clothesColor: pick(AVATAR_OPTIONS.clothesColor),
    accessories: pick(AVATAR_OPTIONS.accessories),
    skinColor: pick(AVATAR_OPTIONS.skinColor),
  };
};

export async function saveAvatarConfig(config: AvatarConfig): Promise<void> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return;
    await fetch('http://localhost:8000/api/avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(config)
    });
  } catch (e) {
    console.warn("Failed to save avatar to db", e);
  }
}

export async function loadAvatarConfig(): Promise<AvatarConfig> {
  try {
    const token = localStorage.getItem('token');
    if (!token) return getDefaultConfig();
    const res = await fetch('http://localhost:8000/api/avatar', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      return { ...getDefaultConfig(), ...data };
    }
  } catch (e) {
    console.warn("Failed to load avatar from db, using default", e);
  }
  return getDefaultConfig();
}
