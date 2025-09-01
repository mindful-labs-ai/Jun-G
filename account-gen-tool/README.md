# AI 숏폼 메이커 — 2라우트(App) 설계 README

> 핵심 흐름: "/"에서 스크립트 입력 → /maker로 이동 → 한 화면에서 시각 파이프라인(장면 프롬프트 → 이미지 → 클립)과 청각 파이프라인(나레이션 생성/재생성/설정)을 동시에 진행 → 두 쪽 모두 Confirm 시 ZIP 다운로드.

---

## 0) 한눈 요약

- 라우팅: "/"(스크립트 입력) → "/maker"(시각/청각 동시 진행)
- 상태 공유: 스크립트는 두 섹션이 공유. /maker에서 수정하면 하위 단계 초기화 경고 후 확정
- 확정 조건: 클립 Confirm + 나레이션 Confirm → 상단 ZIP 다운로드 활성화
- 직관 UI: 단계별 카드(Editing → Generating → Ready → Confirmed), 토스트/스피너/진행도

---

## 1) 라우트별 UI/UX

### 1.1 "/" — 스크립트 입력 페이지

목표: 제작의 출발점. 스크립트를 수집해 다음 단계로 넘김.
UI

- 헤더: 타이틀 "AI 숏폼 메이커"
- 본문: Textarea(자동 높이), 글자/단어/문장 카운터, 최소 글자수 검증(예: 120자)
- 액션: "메이커로 이동" 버튼(활성 조건 충족 시) → "/maker"
  상태 전달 옵션
- (권장) POST /api/session로 프로젝트 ID 발급 → /maker?pid=...
- (간단) localStorage/IndexedDB에 스크립트 저장 후 /maker로 이동

### 1.2 "/maker" — 단일 페이지(2섹션) 제작 화면

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Header: 프로젝트 상태(씬/이미지/클립/나레이션), "ZIP 다운로드" (조건부 활성)              │
├─────────────────────────────────────────────────────────────────────────────┤
│  좌: 시각 파이프라인(장면 프롬프트 → 이미지 → 클립)  │  우: 청각 파이프라인(나레이션)        │
│  - 카드 스택/진행도/토스트                          │  - 미리듣기/설정/재생성/확정      │
├─────────────────────────────────────────────────────────────────────────────┤
│ Footer: 초기화 / 되돌리기 / 진행상태 토스트 / 도움말                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

- 그리드: grid-cols-1 md:grid-cols-2 (모바일 1열, 데스크톱 2열)
- 공통 규칙
  - 스크립트 변경 시 아래 단계 초기화 경고(확인 모달 필요)
  - 하위 단계 재생성 시 그 이후 단계만 초기화(예: 이미지 재생성 → 클립만 초기화)

(좌) 시각 파이프라인

- 장면 프롬프트(Split + Prompt)
  - GPT가 스크립트를 의미 단위 N장면으로 분해
  - 각 장면 카드: 원문 하이라이트(인덱스), 영어 프롬프트, 한글 요약
  - 액션: 추가/삭제/정렬/편집/장면별 Confirm + 전체 Confirm
- 이미지 생성 (n회)
  - 장면별 프롬프트로 이미지 생성, 그리드에서 1:1 매칭 표시
  - 재생성(프롬프트 인라인 수정 허용), 히스토리(최근 3~5개), 장면별 Confirm
- 클립 생성 (Kling n회)
  - 확정 이미지를 영상 클립으로 생성(길이/미리보기/다운로드/재생성/프롬프트 수정)
  - 장면별 Confirm → 전부 Confirm 시 Visual Confirmed

(우) 청각 파이프라인

- 나레이션 생성/재생성/설정
  - 오디오 플레이어(재생/일시정지/시크), 파형 미니 뷰
  - 파라미터: voice, tempo, tone, style
  - 액션: 생성/재생성, 다운로드(MP3/WAV), Confirm
  - Confirm 후 파라미터 변경 시 Confirm 해제

---

## 2) 플로우(머메이드)

### 2.1 라우팅/전역 흐름

```mermaid
flowchart LR
  A[/ "/" Script Input /] -->|Start| B["/maker"]
  B --> C{Visual Confirm?}
  B --> D{Narration Confirm?}
  C --> E
  D --> E
  E{Both Confirmed?} -->|Yes| F[ZIP Download]
```

### 2.2 /maker 내부(병렬)

```mermaid
flowchart TB
  subgraph Visual["Visual (좌)"]
    V0[Script(shared)] --> V1[Scene Split + Prompt (Edit + Confirm)]
    V1 --> V2[Images (n×Generate + Regenerate + Confirm)]
    V2 --> V3[Clips (Kling n× + Regenerate + Confirm)]
  end

  subgraph Audio["Audio (우)"]
    A0[Script(shared)] --> A1[Narration (Generate/Regenerate + Settings + Confirm)]
  end
```

---

## 3) API 초안

- POST /api/session → { script } → { projectId }
- POST /api/scenes/split → { projectId, script } → { scenes }
- POST /api/prompts/generate → { projectId, scenes } → { prompts }
- POST /api/images/generate → { projectId, scenes:[{id,promptEn}] } → { images }
- POST /api/videos/generate → { projectId, clips:[{sceneId,imageUrl,promptEn}] } → { videos }
- POST /api/narration → { projectId, script, params } → { url }
- GET /api/export/zip?projectId=... → application/zip

상태 필드 권장: status, jobId, progress(0–100), error

---

## 4) 상태/이벤트(경량)

- StageStatus = editing | generating | ready | confirmed | failed
- 이벤트 예시
  - script/changed (→ downstream reset warning)
  - scene/added|removed|reordered|edited|confirmed
  - prompt/edited|saved
  - image/generated|regenerated|confirmed|reverted
  - clip/generated|regenerated|confirmed
  - narration/generated|regenerated|confirmed
  - export/ready

---

## 5) 컴포넌트 제안(shadcn/ui)

Header(상태 배지/ZIP 버튼), ScriptInput(shared), SceneEditor, PromptReviewer,
ImageGrid, VideoGrid, NarrationPanel, ConfirmFooter

---

## 6) 설치/실행 & 환경

```bash
pnpm install
pnpm dev
```

.env.local

```
OPENAI_API_KEY=...
ELEVENLABS_API_KEY=...
IMAGE_API_KEY=...
KLING_API_KEY=...
```

---

## 7) 완료 기준(Acceptance)

- "/"에서 스크립트 입력 후 버튼으로 "/maker" 이동
- "/maker"에서 시각·청각 병렬 진행 가능
- 시각: 장면 Confirm → 이미지 Confirm → 클립 Confirm 흐름 작동
- 청각: 나레이션 생성/재생성/설정/Confirm 작동
- 양쪽 Confirm 완료 시 ZIP 다운로드 활성화 및 동작
