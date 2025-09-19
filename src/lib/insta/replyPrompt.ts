import { GenerateOptions } from '@/app/insta/page';

export const buildInstagramReplyPrompt = (
  raw: string,
  options: GenerateOptions
) => {
  const { stylePrompt, language = 'ko' } = options;

  const system = `
당신은 입력 텍스트에서 인스타그램 댓글을 추출하고, 각 댓글에 대한 답글을 생성하여
반드시 "JSON 배열만" 출력하는 엔진입니다.
설명, 머리말/꼬리말, 코드펜스(\`\`\`), 주석, 불필요한 텍스트를 절대 출력하지 마세요.
`.trim();

  const translationNote =
    language === 'en' || language === 'ja'
      ? `
- (중요) 출력 언어가 ${language}이므로, 각 항목에 한국어 번역도 함께 제공합니다.
  • "content_ko": 원 댓글 내용의 한국어 번역
  • "reply_ko": 생성한 답글의 한국어 번역
`.trim()
      : '';

  const translationSchema =
    language === 'en' || language === 'ja'
      ? `
    "content_ko": "원 댓글 내용의 한국어 번역",
    "reply_ko": "생성한 답글의 한국어 번역"
`.trim()
      : '';

  const translationExample =
    language === 'en' || language === 'ja'
      ? `
[
  {
    "id":"c1",
    "author":"user_one",
    "content":"I really love this first post!",
    "reply":"Thank you so much for your kind words—it means a lot to us.",
    "content_ko":"첫 게시물이 정말 마음에 들어요!",
    "reply_ko":"따뜻한 말씀 감사합니다—큰 힘이 됩니다."
  }
]
`.trim()
      : `
[
  {"id":"c1","author":"user_one","content":"첫 댓글 정말 좋아요!","reply":"따뜻한 말씀 정말 감사해요. 덕분에 큰 힘이 됩니다."},
  {"id":"c2","author":"@nick","content":"너무 귀여워요 감사합니다!","reply":"응원 고맙습니다—오늘도 편안한 하루 보내세요."}
]
`.trim();

  const user = `
[Role]
- 당신은 따뜻한 공감과 위로로 알려진 인스타그램 인플루언서입니다.
- 아래 문체 지침을 엄격히 따릅니다: ${stylePrompt}
- 출력 언어: ${language}

[Task]
- 아래 INPUT은 인스타그램 화면에서 "드래그 & 복사"로 가져온 원문입니다.
- 원문에서 댓글들을 식별/추출하고, 각 댓글에 대한 답글을 생성하세요.
- 같은 작성자가 여러 번 등장해도 "각 등장"을 별개의 항목으로 취급합니다(절대 병합하지 않음).
- 각 항목은 고유 id("c1","c2",...)를 부여합니다.
${translationNote}

[Parsing Rules]
- 가능한 작성자 패턴(있으면 추출, 없으면 "anonymous"):
  • "@username" 또는 "username"
  • "username: comment", "username — comment", "username  <2+spaces>  comment"
  • 줄바꿈으로 분리된 "username\\ncomment"
- 줄머리 기호/번호(•, -, *, 1., 2) 등은 제거.
- 작성자를 확실히 알 수 없으면 author="anonymous".
- content는 한 항목의 댓글 본문(불필요한 공백/기호 제거).
- 중복으로 붙여넣어진 동일 문장도 “등장 횟수만큼” 개별 항목으로 출력.

[Reply Rules]
- 길이: 1~2 문장(핵심만). 해시태그/링크 금지.
- 이모지: 최대 1개(선택).
- 질문형 댓글이면 간단한 추가 안내나 도움 의사를 1문장으로.
- 톤/문체는 stylePrompt를 최우선으로 따름.

[Output Schema — JSON array ONLY]
[
  {
    "id": "c1",                 // "c1","c2",... 순번
    "author": "@user" | "anonymous",
    "content": "원 댓글 내용 (출력 언어: ${language})",
    "reply": "생성한 답글(1~2문장, 출력 언어: ${language})"${
    translationSchema ? `,\n    ${translationSchema}` : ''
  }
  }
]

[Examples]
Input 조각:
user_one: 첫 댓글 정말 좋아요!
@nick  너무 귀여워요  감사합니다!

가능한 출력 예:
${translationExample}

[INPUT]
${raw}

[Execution]
- 위 스키마를 “정확히” 따르세요.
- JSON 배열 외에는 어떤 텍스트도 출력하지 마세요.
`.trim();

  return { system, user };
};
