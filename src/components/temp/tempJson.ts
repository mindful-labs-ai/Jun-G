export const tempScenes = [
  {
    id: 'scene-1',
    originalText: '네 마음이 곧 길이야. 남들이 몰라도, 너는 알고 있잖아.',
    englishPrompt:
      'A hopeful daylight scene showing this character standing at a crossroads, as this character looks contemplative.',
    sceneExplain:
      '자신의 마음을 믿고 나아가야 함을 담담하게 다짐하는 장면. 스스로의 신념을 확인하며 내면의 힘을 보여준다.',
    koreanSummary:
      '이 캐릭터가 교차로에 서서 눈을 감고 고요하게 생각에 잠긴 모습, 자연광 아래 따뜻한 분위기.',
    imagePrompt: {
      intent: '내면의 결심과 희망 전달, 침착하고 밝음',
      img_style: 'soft cinematic realism',
      camera: {
        shot_type: 'long',
        angle: 'eye-level',
        focal_length: '35mm',
      },
      subject: {
        pose: 'this character stands straight, facing ahead',
        expression: 'contemplative calm',
        gaze: 'off-screen right',
        hands: 'this character’s hands are relaxed at sides',
      },
      lighting: {
        key: 'soft front sunlight, medium intensity',
        mood: 'warm, natural',
      },
      background: {
        location: 'quiet open crossroads in small town',
        dof: 'deep',
        props: 'simple street signs, bare branches',
        time: 'morning',
      },
    },
    clipPrompt: {
      intent: '고요하지만 용기를 전하는 출발의 순간',
      img_message:
        'This character faces a quiet crossroads, filled with resolve.',
      background: {
        location: 'quiet open crossroads in small town',
        props: 'simple street signs, bare branches',
        time: 'morning',
      },
      camera_motion: {
        type: 'push-in',
        easing: 'ease-in',
      },
      subject_motion: [
        {
          time: '0.5s',
          action: 'this character gently closes eyes for a moment',
        },
        {
          time: '1.2s',
          action: 'this character exhales softly and lifts chin slightly',
        },
      ],
      environment_motion: [
        {
          type: 'lighting',
          action: 'morning sunlight grows subtly brighter',
        },
      ],
    },
    confirmed: false,
  },
  {
    id: 'scene-2',
    originalText: '작은 진심이 세상에 가장 큰 파동을 만든다.',
    englishPrompt:
      'A gentle moment as this character drops a pebble in a still pond, symbolizing small sincerity.',
    sceneExplain:
      '작은 마음도 큰 변화를 만든다는 진심의 힘을 상징적으로 표현한다.',
    koreanSummary:
      '이 캐릭터가 잔잔한 연못에 조심스럽게 돌을 던지는 장면, 미묘한 파동이 번진다.',
    imagePrompt: {
      intent: '진심의 울림과 소박한 희망 표현',
      img_style: 'delicate naturalism',
      camera: {
        shot_type: 'medium',
        angle: 'slightly high-angle',
        focal_length: '50mm',
      },
      subject: {
        pose: 'this character kneels at pond edge, leaning forward slightly',
        expression: 'gentle focus',
        gaze: 'down',
        hands: 'this character’s right hand releases a small pebble over water',
      },
      lighting: {
        key: 'soft diffused side-light',
        mood: 'cool, peaceful',
      },
      background: {
        location: 'serene pond in quiet park',
        dof: 'medium',
        props: 'few scattered leaves',
        time: 'morning',
      },
    },
    clipPrompt: {
      intent: '잔잔한 움직임에서 파급되는 진정성의 울림',
      img_message:
        'This character’s small gesture causes ripples on still water.',
      background: {
        location: 'serene pond in quiet park',
        props: 'few scattered leaves',
        time: 'morning',
      },
      camera_motion: {
        type: 'tilt',
        easing: 'ease-in-out',
      },
      subject_motion: [
        {
          time: '0.5s',
          action: 'this character gently drops the pebble into pond',
        },
        {
          time: '1.0s',
          action: 'this character’s fingers softly open then close again',
        },
      ],
      environment_motion: [
        {
          type: 'background',
          action: 'concentric ripples spread across pond surface',
        },
      ],
    },
    confirmed: false,
  },
  {
    id: 'scene-3',
    originalText: '누구보다 너 자신에게 솔직할 때, 가장 빛나.',
    englishPrompt:
      'A close-up of this character gazing into a mirror, honesty in the eyes of this character.',
    sceneExplain:
      '거울을 통해 솔직한 자신을 마주하며 내면에서 빛이 나는 순간을 담는다.',
    koreanSummary:
      '이 캐릭터가 거울 앞에서 진지하게 자신을 바라보며 내면의 빛을 표현한다.',
    imagePrompt: {
      intent: '자기 성찰과 내면의 진실 강조',
      img_style: 'subtle portrait realism',
      camera: {
        shot_type: 'close-up',
        angle: 'frontal eye-level',
        focal_length: '85mm',
      },
      subject: {
        pose: 'this character faces directly forward, head slightly tilted',
        expression: 'sincere vulnerability',
        gaze: 'toward camera',
        hands: 'this character’s hands touch mirror surface softly',
      },
      lighting: {
        key: 'soft frontal key, gentle fill from below',
        mood: 'neutral, intimate',
      },
      background: {
        location: 'minimal, unfurnished room with mirror',
        dof: 'shallow',
        props: 'simple clean mirror',
        time: 'evening',
      },
    },
    clipPrompt: {
      intent: '내면의 진실과 용기를 정면으로 마주함',
      img_message:
        'This character’s honest reflection meets their direct gaze.',
      background: {
        location: 'minimal, unfurnished room with mirror',
        props: 'simple clean mirror',
        time: 'evening',
      },
      camera_motion: {
        type: 'none',
        easing: 'linear',
      },
      subject_motion: [
        {
          time: '0.5s',
          action: 'this character blinks softly, breathes in deeply',
        },
        {
          time: '1.2s',
          action: 'this character’s lips tremble, then form a small smile',
        },
      ],
      environment_motion: [
        {
          type: 'lighting',
          action: 'frontal light warms subtly',
        },
      ],
    },
    confirmed: false,
  },
  {
    id: 'scene-4',
    originalText: '남들이 이해하지 못해도, 네 가치는 변하지 않아.',
    englishPrompt:
      'This character stands alone in a crowd, looking steady while others blur around this character.',
    sceneExplain:
      '주변에서 인정받지 못해도 흔들리지 않는 당당함과 자신의 가치를 표현한다.',
    koreanSummary:
      '이 캐릭터는 북적이는 군중 속에서 선명하게 드러나며, 흔들림 없이 서 있다.',
    imagePrompt: {
      intent: '주변과 대조되는 자기 확신, 고요한 자존감',
      img_style: 'urban contrast realism',
      camera: {
        shot_type: 'medium',
        angle: 'slight low-angle',
        focal_length: '35mm',
      },
      subject: {
        pose: 'this character stands upright, shoulders back among moving people',
        expression: 'steadfast composure',
        gaze: 'off-screen left',
        hands: 'this character’s arms are relaxed at sides',
      },
      lighting: {
        key: 'cool directional backlight, fills from left',
        mood: 'cool, contrasted',
      },
      background: {
        location: 'downtown crosswalk',
        dof: 'shallow',
        props: 'blurred passersby',
        time: 'noon',
      },
    },
    clipPrompt: {
      intent: '자신의 가치를 지키는 묵직한 존재감 표현',
      img_message: 'This character stands clear amid blurred crowd, unmoved.',
      background: {
        location: 'downtown crosswalk',
        props: 'blurred passersby',
        time: 'noon',
      },
      camera_motion: {
        type: 'none',
        easing: 'linear',
      },
      subject_motion: [
        {
          time: '0.5s',
          action: 'this character’s shoulders lift with a slow inhale',
        },
        {
          time: '1.2s',
          action: 'this character’s head turns very slightly left',
        },
      ],
      environment_motion: [
        {
          type: 'background',
          action: 'crowd blurs past with gentle streaks',
        },
      ],
    },
    confirmed: false,
  },
  {
    id: 'scene-5',
    originalText: '네가 지키는 그 따뜻함이 누군가의 희망이야.',
    englishPrompt:
      'Candlelit room scene where this character passes a small light to another’s hands.',
    sceneExplain:
      '작은 따뜻함이 타인에게 희망이 되는 감동적인 순간을 보여준다.',
    koreanSummary:
      '이 캐릭터가 촛불을 다른 사람에게 건네며 따뜻한 감정을 나눈다.',
    imagePrompt: {
      intent: '작은 온기가 희망이 되는 감동의 전달',
      img_style: 'soft glowing realism',
      camera: {
        shot_type: 'medium',
        angle: 'over-the-shoulder (other person foreground right)',
        focal_length: '50mm',
      },
      subject: {
        pose: 'this character extends hand, offering lit candle to another',
        expression: 'gentle warmth',
        gaze: 'toward other person’s hands',
        hands: 'this character’s palms cradle candle, touching other hands',
      },
      lighting: {
        key: 'warm low-intensity candlelight, soft fill from left',
        mood: 'warm, sentimental',
      },
      background: {
        location: 'simple dimly lit room',
        dof: 'medium',
        props: 'unadorned wooden table, small candle',
        time: 'evening',
      },
    },
    clipPrompt: {
      intent: '따뜻함이 전달되는 잔잔하고 감동적인 순간',
      img_message:
        'This character gently passes candlelight to another’s hands.',
      background: {
        location: 'simple dimly lit room',
        props: 'unadorned wooden table, small candle',
        time: 'evening',
      },
      camera_motion: {
        type: 'push-in',
        easing: 'ease-out',
      },
      subject_motion: [
        {
          time: '0.3s',
          action: 'this character’s fingers softly brush other person’s hand',
        },
        {
          time: '1.1s',
          action: 'this character gives a small nod and smiles faintly',
        },
      ],
      environment_motion: [
        {
          type: 'lighting',
          action: 'candle flame flickers tenderly',
        },
      ],
    },
    confirmed: false,
  },
  {
    id: 'scene-6',
    originalText: '흔들리지 않는 건 완벽함이 아니라, 진심이야.',
    englishPrompt:
      'This character weathers a gentle breeze atop a rooftop, coat fluttering but posture firm.',
    sceneExplain:
      '외부의 변화에 흔들리지 않고 진심으로 중심을 잡는 의연함을 보여준다.',
    koreanSummary:
      '이 캐릭터가 옥상에 서서 바람에 코트가 흔들리지만, 중심을 잃지 않는다.',
    imagePrompt: {
      intent: '진심으로 흔들림 없는 내면 강조',
      img_style: 'modern airy realism',
      camera: {
        shot_type: 'long',
        angle: 'slight low-angle',
        focal_length: '24mm',
      },
      subject: {
        pose: 'this character stands tall on rooftop, facing horizon',
        expression: 'steadfast determination',
        gaze: 'off-screen, toward distant buildings',
        hands: 'this character’s hands in coat pockets',
      },
      lighting: {
        key: 'side sunset light, soft fill from front',
        mood: 'warm, airy',
      },
      background: {
        location: 'city rooftop with distant skyline',
        dof: 'deep',
        props: 'simple railing, slight fluttering scarf',
        time: 'sunset',
      },
    },
    clipPrompt: {
      intent: '흔들림 속 단단함과 진정성을 보여줌',
      img_message: 'This character stands unmoved as breeze stirs their coat.',
      background: {
        location: 'city rooftop with distant skyline',
        props: 'simple railing, slight fluttering scarf',
        time: 'sunset',
      },
      camera_motion: {
        type: 'pan',
        easing: 'ease-in-out',
      },
      subject_motion: [
        {
          time: '0.4s',
          action: 'this character’s coat flutters, but posture stays straight',
        },
        {
          time: '1.0s',
          action:
            'this character subtly shifts weight from one foot to the other',
        },
      ],
      environment_motion: [
        {
          type: 'background',
          action: 'clouds drift slowly across sky',
        },
      ],
    },
    confirmed: false,
  },
  {
    id: 'scene-7',
    originalText: '세상은 가끔 네 마음을 늦게 알아보지만, 결국은 닿아.',
    englishPrompt:
      'This character walks alone on a nighttime street, distant lights finally illuminating this character.',
    sceneExplain:
      '진심이 시간이 걸리더라도 결국 세상에 닿음을 담담하게 표현한다.',
    koreanSummary:
      '밤의 거리에서 이 캐릭터가 홀로 걷고, 아주 멀리서 서서히 불빛이 다가온다.',
    imagePrompt: {
      intent: '고독하지만 희망적인 연결의 불빛',
      img_style: 'noir-inspired urban realism',
      camera: {
        shot_type: 'long',
        angle: 'high-angle (slightly overhead)',
        focal_length: '35mm',
      },
      subject: {
        pose: 'this character walks down empty street, head slightly lowered',
        expression: 'quiet longing',
        gaze: 'down at pavement',
        hands: 'this character’s hands in coat pockets',
      },
      lighting: {
        key: 'dim streetlights from behind, growing distant glow',
        mood: 'cool, hopeful',
      },
      background: {
        location: 'quiet empty city street at night',
        dof: 'deep',
        props: 'scattered reflections, faraway lights',
        time: 'night',
      },
    },
    clipPrompt: {
      intent: '외로움에서 희망이 보이는 순간 포착',
      img_message:
        'This character walks quietly as distant lights brighten the street.',
      background: {
        location: 'quiet empty city street at night',
        props: 'scattered reflections, faraway lights',
        time: 'night',
      },
      camera_motion: {
        type: 'push-in',
        easing: 'ease-in',
      },
      subject_motion: [
        {
          time: '0.8s',
          action: 'this character looks up toward distant glow',
        },
      ],
      environment_motion: [
        {
          type: 'lighting',
          action: 'streetlights deepen in intensity; background glows slowly',
        },
      ],
    },
    confirmed: false,
  },
  {
    id: 'scene-8',
    originalText: '네 진정성은 아무리 작아 보여도 결코 사라지지 않아.',
    englishPrompt:
      'This character gently blows on a dandelion, seeds floating as a symbol of enduring sincerity.',
    sceneExplain:
      '작은 진정성도 사라지지 않고 퍼지는 모습을 상징적으로 담았다.',
    koreanSummary:
      '이 캐릭터가 민들레 씨앗을 불어 퍼뜨리며, 작아도 영원한 진심을 표현.',
    imagePrompt: {
      intent: '작은 진정성의 확산과 지속성 상징',
      img_style: 'gentle natural realism',
      camera: {
        shot_type: 'medium',
        angle: 'eye-level three-quarter',
        focal_length: '50mm',
      },
      subject: {
        pose: 'this character holds a dandelion up, lips poised to blow',
        expression: 'soft focus and hope',
        gaze: 'at dandelion',
        hands: 'this character’s right hand lightly cups dandelion stem',
      },
      lighting: {
        key: 'even natural light from front',
        mood: 'fresh, airy',
      },
      background: {
        location: 'grassy sunlit field',
        dof: 'shallow',
        props: 'sprigs of tall grass, dandelions',
        time: 'morning',
      },
    },
    clipPrompt: {
      intent: '작은 행동이 넓게 퍼지는 희망 느낌',
      img_message:
        'This character releases dandelion seeds that float away gently.',
      background: {
        location: 'grassy sunlit field',
        props: 'sprigs of tall grass, dandelions',
        time: 'morning',
      },
      camera_motion: {
        type: 'none',
        easing: 'linear',
      },
      subject_motion: [
        {
          time: '0.4s',
          action: 'this character exhales softly towards dandelion',
        },
        {
          time: '1.4s',
          action: 'this character smiles faintly watching seeds drift',
        },
      ],
      environment_motion: [
        {
          type: 'particles',
          action: 'dandelion seeds float away in gentle breeze',
        },
      ],
    },
    confirmed: false,
  },
  {
    id: 'scene-9',
    originalText: '꾸밈없이 드러낸 네 감정이 가장 큰 용기야.',
    englishPrompt:
      'A portrait of this character on a park bench, open emotions showing in tears and relaxed posture.',
    sceneExplain:
      '감정을 숨기지 않고 드러내는 용기를 보여주는 따뜻한 장면이다.',
    koreanSummary:
      '이 캐릭터가 벤치에 앉아 눈물을 흘리면서도 편안하게 자신을 드러낸다.',
    imagePrompt: {
      intent: '감정을 드러내는 용기와 따뜻함 표현',
      img_style: 'soft emotive realism',
      camera: {
        shot_type: 'medium',
        angle: 'profile eye-level',
        focal_length: '85mm',
      },
      subject: {
        pose: 'this character sits sideways on bench, shoulders lowered',
        expression: 'gentle tears, quiet relief',
        gaze: 'down',
        hands: 'this character’s hands in lap, fingers loosely entwined',
      },
      lighting: {
        key: 'soft late-afternoon fill from left',
        mood: 'warm, emotional',
      },
      background: {
        location: 'city park, leafy background',
        dof: 'medium',
        props: 'simple bench, scattered leaves',
        time: 'afternoon',
      },
    },
    clipPrompt: {
      intent: '감정을 솔직하게 보여주는 따뜻함과 용기',
      img_message:
        'This character’s tears flow gently, shoulders relax on bench.',
      background: {
        location: 'city park, leafy background',
        props: 'simple bench, scattered leaves',
        time: 'afternoon',
      },
      camera_motion: {
        type: 'tilt',
        easing: 'ease-in-out',
      },
      subject_motion: [
        {
          time: '0.5s',
          action: 'this character wipes a tear from cheek',
        },
        {
          time: '1.3s',
          action: 'this character takes a deep breath, eyes glistening',
        },
      ],
      environment_motion: [
        {
          type: 'lighting',
          action: 'sunlight flickers softly through trees',
        },
      ],
    },
    confirmed: false,
  },
  {
    id: 'scene-10',
    originalText: '네가 지키는 선함이 곧 세상을 바꾸는 힘이야.',
    englishPrompt:
      'This character helps pick up dropped groceries for a stranger, kindness evident in this character’s actions.',
    sceneExplain: '작은 선행이 세상을 변화시키는 힘임을 일상 속에서 보여준다.',
    koreanSummary: '이 캐릭터가 모르는 사람의 떨어진 장바구니를 함께 줍는다.',
    imagePrompt: {
      intent: '평범한 선행이 가진 따뜻한 힘 강조',
      img_style: 'open, natural city realism',
      camera: {
        shot_type: 'medium',
        angle: 'eye-level three-quarter',
        focal_length: '35mm',
      },
      subject: {
        pose: 'this character crouches to pick up fruit for someone',
        expression: 'gentle attentiveness',
        gaze: 'at fallen groceries',
        hands:
          'this character’s left hand reaches for apple, right hand holding a bag',
      },
      lighting: {
        key: 'diffused daylight from above',
        mood: 'neutral, everyday bright',
      },
      background: {
        location: 'city sidewalk near local shops',
        dof: 'medium',
        props: 'scattered apples, reusable fabric bag',
        time: 'morning',
      },
    },
    clipPrompt: {
      intent: '작은 친절이 전파되는 따스한 일상',
      img_message: 'This character kindly helps pick up spilled apples.',
      background: {
        location: 'city sidewalk near local shops',
        props: 'scattered apples, reusable fabric bag',
        time: 'morning',
      },
      camera_motion: {
        type: 'push-in',
        easing: 'ease-out',
      },
      subject_motion: [
        {
          time: '0.6s',
          action: 'this character passes apple to grateful stranger',
        },
        {
          time: '1.3s',
          action: 'this character lifts head with small, reassuring smile',
        },
      ],
      environment_motion: [
        {
          type: 'background',
          action: 'passersby move past in soft blur',
        },
      ],
    },
    confirmed: false,
  },
  {
    id: 'scene-11',
    originalText: '진짜 너를 드러내는 게 가장 큰 선물이야.',
    englishPrompt:
      'Bright daylight, this character stands arms open in a sunlit field, fully embracing self.',
    sceneExplain:
      ' 있는 그대로의 자신을 찬란하게 받아들이는 해방감을 표현한다.',
    koreanSummary: '햇살 가득한 들판에서 이 캐릭터가 팔을 활짝 펼치고 서 있다.',
    imagePrompt: {
      intent: '자기 자신을 온전히 받아들이는 환함과 해방',
      img_style: 'bright airy realism',
      camera: {
        shot_type: 'long',
        angle: 'low-angle upward',
        focal_length: '24mm',
      },
      subject: {
        pose: 'this character stands arms fully outstretched, torso arched toward sun',
        expression: 'joyful radiance',
        gaze: 'up',
        hands: 'this character’s open palms reach toward sky',
      },
      lighting: {
        key: 'strong direct sunlight from above',
        mood: 'warm, euphoric',
      },
      background: {
        location: 'wide grassy sunlit field',
        dof: 'deep',
        props: 'wildflowers, clear sky',
        time: 'noon',
      },
    },
    clipPrompt: {
      intent: '있는 그대로를 받아들이는 환희와 자유의 표현',
      img_message: 'This character opens arms wide to sunlight in a field.',
      background: {
        location: 'wide grassy sunlit field',
        props: 'wildflowers, clear sky',
        time: 'noon',
      },
      camera_motion: {
        type: 'handheld sway',
        easing: 'ease-in-out',
      },
      subject_motion: [
        {
          time: '0.5s',
          action: 'this character slowly lifts chin higher to sun',
        },
        {
          time: '1.3s',
          action: 'this character gently turns in place, arms extended',
        },
      ],
      environment_motion: [
        {
          type: 'lighting',
          action: 'sunlight glows stronger, soft breeze stirs wildflowers',
        },
      ],
    },
    confirmed: false,
  },
  {
    id: 'scene-12',
    originalText: '네 마음은 결코 ‘너무 많은 것’이 아니야. 필요한 거야.',
    englishPrompt:
      'This character sits in a café, quietly holding a steaming mug, comfort in this character’s eyes.',
    sceneExplain:
      '자신의 감정이 지나치지 않음을 따뜻한 분위기에서 인정하는 순간이다.',
    koreanSummary:
      '카페에서 이 캐릭터가 따뜻한 머그잔을 바라보며 스스로를 위로한다.',
    imagePrompt: {
      intent: '자기감정을 인정하는 포근하고 편안한 분위기',
      img_style: 'cozy interior realism',
      camera: {
        shot_type: 'medium',
        angle: 'frontal eye-level',
        focal_length: '50mm',
      },
      subject: {
        pose: 'this character sits, elbows on table, cradling mug with both hands',
        expression: 'gentle comfort and thoughtfulness',
        gaze: 'at steaming mug',
        hands: 'this character’s hands envelop mug, fingers visible',
      },
      lighting: {
        key: 'soft tungsten fill from right, gentle natural backlight',
        mood: 'warm, cozy',
      },
      background: {
        location: 'quiet brand-free café interior',
        dof: 'shallow',
        props: 'mug, simple tableware',
        time: 'morning',
      },
    },
    clipPrompt: {
      intent: '감정을 인정하며 안정을 느끼는 순간',
      img_message:
        'This character warms hands around mug, eyes soft with comfort.',
      background: {
        location: 'quiet brand-free café interior',
        props: 'mug, simple tableware',
        time: 'morning',
      },
      camera_motion: {
        type: 'none',
        easing: 'linear',
      },
      subject_motion: [
        {
          time: '0.6s',
          action: 'this character exhales softly over mug, eyes close briefly',
        },
        {
          time: '1.1s',
          action: 'this character sips from mug and relaxes shoulders',
        },
      ],
      environment_motion: [
        {
          type: 'particles',
          action: 'steam gently swirls up from mug',
        },
      ],
    },
    confirmed: false,
  },
  {
    id: 'scene-13',
    originalText: '진실하게 살아가는 건 세상에서 가장 아름다운 반항이야.',
    englishPrompt:
      'This character stands on a graffiti-dotted rooftop at dusk, eyes fearless and posture defiant.',
    sceneExplain:
      '진실하게 살아가는 것이 세상을 향한 아름다운 저항임을 강렬하게 표현한다.',
    koreanSummary: '이 캐릭터가 해질녘의 낙서 많은 옥상에서 당당하게 선다.',
    imagePrompt: {
      intent: '진정성으로 맞서는 당당한 반항 표현',
      img_style: 'gritty urban realism',
      camera: {
        shot_type: 'medium',
        angle: 'slight high-angle',
        focal_length: '35mm',
      },
      subject: {
        pose: 'this character stands feet apart, hands on hips, back straight',
        expression: 'fearless, challenging',
        gaze: 'toward camera',
        hands: 'this character’s fists rest on hips',
      },
      lighting: {
        key: 'dusk light from left, city glow fill',
        mood: 'moody, rebellious',
      },
      background: {
        location: 'urban rooftop with wall graffiti',
        dof: 'deep',
        props: 'spray-painted walls, distant city lights',
        time: 'evening',
      },
    },
    clipPrompt: {
      intent: '진실함으로 세상을 마주하는 용기와 힘',
      img_message:
        'This character stands strong, eyes unwavering, on an urban rooftop.',
      background: {
        location: 'urban rooftop with wall graffiti',
        props: 'spray-painted walls, distant city lights',
        time: 'evening',
      },
      camera_motion: {
        type: 'none',
        easing: 'linear',
      },
      subject_motion: [
        {
          time: '0.7s',
          action: 'this character squares shoulders even more assertively',
        },
        {
          time: '1.4s',
          action: 'this character looks up, jaw set with resolve',
        },
      ],
      environment_motion: [
        {
          type: 'lighting',
          action: 'city lights in distance begin to flicker on',
        },
      ],
    },
    confirmed: false,
  },
  {
    id: 'scene-14',
    originalText: '남들이 보지 않아도, 네 진심은 스스로를 구원해.',
    englishPrompt:
      'This character kneels in quiet prayer beneath a softly lit window, seen from behind.',
    sceneExplain:
      '진심이 결국 자신을 위로하고 구원한다는 조용한 감정을 전한다.',
    koreanSummary:
      '창가에서 이 캐릭터가 혼자 무릎 꿇고 기도하며 은은한 빛을 받는다.',
    imagePrompt: {
      intent: '홀로 드러나는 내면의 진심과 구원',
      img_style: 'serene painterly realism',
      camera: {
        shot_type: 'long',
        angle: 'over-the-shoulder low (from behind)',
        focal_length: '35mm',
      },
      subject: {
        pose: 'this character kneels on floor, hands clasped, head bowed',
        expression: 'peaceful introspection',
        gaze: 'down',
        hands: 'this character’s hands clasped before chest',
      },
      lighting: {
        key: 'soft natural light streams through window',
        mood: 'tranquil, spiritual',
      },
      background: {
        location: 'quiet private room with big window',
        dof: 'medium',
        props: 'simple curtain, wooden floor',
        time: 'morning',
      },
    },
    clipPrompt: {
      intent: '조용한 기도로 내면의 구원 포착',
      img_message:
        'This character kneels alone under a gentle window light, at peace.',
      background: {
        location: 'quiet private room with big window',
        props: 'simple curtain, wooden floor',
        time: 'morning',
      },
      camera_motion: {
        type: 'tilt',
        easing: 'ease-in',
      },
      subject_motion: [
        {
          time: '0.5s',
          action:
            'this character’s shoulders visibly relax, hands squeeze tighter',
        },
        {
          time: '1.0s',
          action: 'this character bows head lower in peace',
        },
      ],
      environment_motion: [
        {
          type: 'lighting',
          action: 'window light brightens softly',
        },
      ],
    },
    confirmed: false,
  },
  {
    id: 'scene-15',
    originalText: '네가 믿는 길은 혼자가 아니야. 누군가는 같은 별을 보고 있어.',
    englishPrompt:
      'This character and a distant silhouette look up at the same starry night sky from apart.',
    sceneExplain:
      '자신의 길이 혼자가 아님을, 멀리 있는 이들과 별로 연결됨을 보여준다.',
    koreanSummary:
      '밤하늘을 올려다보는 이 캐릭터와 멀리 떨어진 또 다른 인물의 실루엣.',
    imagePrompt: {
      intent: '희망과 연결을 상징하는 밤하늘 아래의 고요',
      img_style: 'luminous night realism',
      camera: {
        shot_type: 'long',
        angle:
          'rear three-quarter (this character foreground, silhouette background)',
        focal_length: '35mm',
      },
      subject: {
        pose: 'this character stands, face up, hands in pockets',
        expression: 'calm hope',
        gaze: 'up at stars',
        hands: 'this character’s hands tucked away',
      },
      lighting: {
        key: 'soft blue moonlight from above',
        mood: 'cool, hopeful',
      },
      background: {
        location: 'silent rural hilltop under starry sky',
        dof: 'deep',
        props: 'distant silhouette, stars, grass',
        time: 'night',
      },
    },
    clipPrompt: {
      intent: '혼자가 아님을 느끼는 밤의 연대감',
      img_message: 'This character gazes at stars, as another does far behind.',
      background: {
        location: 'silent rural hilltop under starry sky',
        props: 'distant silhouette, stars, grass',
        time: 'night',
      },
      camera_motion: {
        type: 'none',
        easing: 'linear',
      },
      subject_motion: [
        {
          time: '0.6s',
          action: 'this character draws slow breath, head tilts further up',
        },
        {
          time: '1.6s',
          action: 'this character lifts hand, as if to point at constellations',
        },
      ],
      environment_motion: [
        {
          type: 'background',
          action: 'stars twinkle; breeze stirs grass faintly',
        },
      ],
    },
    confirmed: false,
  },
  {
    id: 'scene-16',
    originalText: '솔직한 네 마음이 결국 가장 안전한 자리로 이끌어.',
    englishPrompt:
      'This character enters a warmly lit home, greeted with a welcoming embrace from family.',
    sceneExplain:
      '솔직함이 결국 가장 안전한 곳으로 이끌어줌을 가족의 환대로 보여준다.',
    koreanSummary:
      '집에 들어오는 이 캐릭터를 가족이 warmly 맞이하며 포근한 분위기.',
    imagePrompt: {
      intent: '따뜻한 환대와 안도감 나타냄',
      img_style: 'comforting domestic realism',
      camera: {
        shot_type: 'medium',
        angle: 'over-the-shoulder (this character foreground left)',
        focal_length: '50mm',
      },
      subject: {
        pose: 'this character steps inside, arms open to hug',
        expression: 'relieved joy',
        gaze: 'toward family members',
        hands: 'this character’s arms wide, ready for embrace',
      },
      lighting: {
        key: 'soft golden overhead light',
        mood: 'warm, inviting',
      },
      background: {
        location: 'modest brand-free living room',
        dof: 'medium',
        props: 'family, cozy furniture, plant',
        time: 'evening',
      },
    },
    clipPrompt: {
      intent: '진심에서 오는 환대와 안전함 표현',
      img_message: 'This character is welcomed home and moves into an embrace.',
      background: {
        location: 'modest brand-free living room',
        props: 'family, cozy furniture, plant',
        time: 'evening',
      },
      camera_motion: {
        type: 'handheld sway',
        easing: 'ease-out',
      },
      subject_motion: [
        {
          time: '0.3s',
          action: 'this character smiles broadly and steps forward',
        },
        {
          time: '1.0s',
          action: 'this character hugs family member tightly',
        },
      ],
      environment_motion: [
        {
          type: 'lighting',
          action: 'warm light grows gently brighter, highlighting faces',
        },
      ],
    },
    confirmed: false,
  },
  {
    id: 'scene-17',
    originalText: '작은 배려 하나도 네가 하면 깊은 울림이 된다.',
    englishPrompt:
      'This character leaves a handwritten note beside a window, morning sunlight casting a gentle glow on this character.',
    sceneExplain: '작은 배려도 깊은 여운을 남긴다는 마음을 상징적으로 그림.',
    koreanSummary:
      '아침 햇살 아래 이 캐릭터가 창가에 쪽지를 조용히 놓고 떠난다.',
    imagePrompt: {
      intent: '소소한 배려의 깊은 여운 전달',
      img_style: 'bright poetic realism',
      camera: {
        shot_type: 'medium',
        angle: 'side-profile',
        focal_length: '85mm',
      },
      subject: {
        pose: 'this character bends over, gently setting note on sill',
        expression: 'quiet satisfaction',
        gaze: 'at note on windowsill',
        hands:
          'this character’s right hand releases note, left pushes window open',
      },
      lighting: {
        key: 'soft direct morning sun through window',
        mood: 'bright, optimistic',
      },
      background: {
        location: 'simple room with large window',
        dof: 'shallow',
        props: 'plain note, potted plant, curtains',
        time: 'morning',
      },
    },
    clipPrompt: {
      intent: '아침 배려의 따스함과 여운을 부각',
      img_message:
        'This character leaves a note in sunlight, filling room with warmth.',
      background: {
        location: 'simple room with large window',
        props: 'plain note, potted plant, curtains',
        time: 'morning',
      },
      camera_motion: {
        type: 'tilt',
        easing: 'ease-in',
      },
      subject_motion: [
        {
          time: '0.4s',
          action: 'this character’s fingers linger on note one last second',
        },
        {
          time: '1.1s',
          action:
            'this character straightens, hand resting briefly on window frame',
        },
      ],
      environment_motion: [
        {
          type: 'lighting',
          action: 'morning sun intensifies through glass, dust motes in air',
        },
      ],
    },
    confirmed: false,
  },
];
