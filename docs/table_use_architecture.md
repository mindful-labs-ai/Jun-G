1) 핵심 관계 요약
	•	users (1) ── (N) projects
	•	projects (1) ── (1) video_preferences
	•	projects (1) ── (N) scenes
	•	scenes (1) ── (N) assets (버전 이력 저장)
	•	users (1) ── (N) tokens (모델별 사용량/한도)

⸻

1) parents_id 네이밍 표준
	•	프로젝트 나레이션(전역): parents_id = "narration-{project_id}"
예) narration-12345
	•	씬 이미지(씬 단위): parents_id = "image-{scene_id}"
예) image-scene-7
	•	씬 클립(씬 단위): parents_id = "clip-{scene_id}"
예) clip-scene-7

assets의 프라이머리 키는 id이며, 조회는 parents_id + type + version 조합으로 수행(인덱스 존재).
버전은 1부터 시작하여 증분합니다.

⸻

2) 테이블별 역할 & 저장 규칙

users
	•	로그인 주체. login_method, email 보관.

tokens
	•	사용자-모델 타입 1:多.
	•	(user_id, type) 유니크로 묶고, 사용량은 누적(usage), 한도는 limit로 관리.
	•	AI 호출 .finally에서 증분 업데이트.

projects
	•	하나의 영상 제작 단위. script·메타, narration_version(현재 채택 나레이션 버전) 보관.

video_preferences
	•	프로젝트당 1행. 이미지/영상/보이스 모델, 안정도, 해상도, 스타일, 분할 규칙 등 환경설정.

scenes
	•	프로젝트를 구성하는 장면.
	•	scene_json(프롬프트 구조 전체), status(파이프라인 단계), order(정렬),
	•	현재 선택된 산출물 포인터: image_version, clip_version
	•	**no_subject**는 선택 생성 옵션(예: 인물 제거 생성) 플래그.

assets
	•	모든 산출물의 버전 원장.
	•	컬럼: parents_id(상기 규칙), type('image'|'clip'|'narration'), version, storage_url, metadata(JSON)
	•	버전 증가 시 행 추가(이력 유지). “현재 선택본”은 scenes.*_version 또는 projects.narration_version로 지정.

⸻

3) 쓰기 플로우 (조인 최소화 예시)

A) 프로젝트 생성
	1.	projects INSERT (제목/스크립트 등)
	2.	video_preferences INSERT (해당 project_id로 1행)
	3.	(옵션) 기본 tokens upsert (user_id, type 세트 미리 준비)

B) 스크립트 → 장면 생성
	1.	프론트에서 분해된 씬들 루프:
	•	scenes INSERT
	•	scene_id(프론트 식별용), scene_json, order, status='prompt'
	2.	확정 시: scenes.status = 'prompt_confirmed'

C) 이미지 생성 성공 시
	1.	파일 업로드 → Storage 경로 획득
	2.	버전 계산
	•	select coalesce(max(version),0)+1 as v from assets where parents_id='image-{scene_id}' and type='image'
	3.	assets INSERT
	•	parents_id='image-{scene_id}', type='image', version=v, storage_url, metadata(모델/토큰/해상도 등)
	4.	scenes UPDATE
	•	image_version=v, status='image' (또는 image_confirmed는 UI 단계에 맞춰 별도)
	5.	토큰 사용량
	•	.finally에서 tokens 테이블 usage = usage + used UPDATE / upsert

확정 처리: 이미지 확정 시 status='image_confirmed' 또는 scene_json.confirmed=true 등 프로젝트 정책에 맞춰 기록.

D) 클립 생성 성공 시
	1.	파일 업로드 → Storage 경로 획득
	2.	버전 계산 (parents_id='clip-{scene_id}', type='clip')
	3.	assets INSERT (clip)
	4.	scenes UPDATE → clip_version=v, status='clip'
	5.	tokens 사용량 반영

E) 나레이션(프로젝트 단위)

스키마상 assets.parents_id는 문자열 규칙을 따르므로 가상 부모 키를 사용

	1.	업로드 → Storage 경로
	2.	버전 계산 (parents_id='narration-{project_id}', type='narration')
	3.	assets INSERT
	4.	projects UPDATE → narration_version=v

⸻

4) 읽기 플로우 (조인 최소화)

프로젝트 대시보드
	1.	projects SELECT (by id)
	2.	video_preferences SELECT (by project_id)
	3.	scenes SELECT (by project_id ORDER BY “order”)
	4.	각 씬 카드용 썸네일/클립:
	•	현재 선택본만 빠르게:
	•	이미지: assets WHERE parents_id='image-{scene_id}' AND type='image' AND version=scenes.image_version LIMIT 1
	•	클립: 위와 동일 패턴
	•	최신 버전이 필요하면: ORDER BY version DESC LIMIT 1

나레이션
	•	projects.narration_version가 있으면:
assets WHERE parents_id='narration-{project_id}' AND type='narration' AND version=narration_version

히스토리 보기
	•	assets WHERE parents_id='image-{scene_id}' AND type='image' ORDER BY version DESC (필요 페이지네이션)

⸻

5) 버전 관리 & 경쟁 상태(경합) 대응
	•	단순 패턴(권장):
	1.	max(version)+1 조회
	2.	assets INSERT
	3.	실패 시(동시성), 최대 한 번 재시도: 다시 max(version) 조회 → +1 → INSERT
	•	또는 INSERT ... ON CONFLICT DO NOTHING 후 성공/실패 확인 → 실패면 재조회·재시도.

⸻

6) 스토리지 경로 규칙(권장 예)

/users/{user_id}/projects/{project_id}/scenes/{scene_id}/images/v{version}.png
/users/{user_id}/projects/{project_id}/scenes/{scene_id}/clips/v{version}.mp4
/users/{user_id}/projects/{project_id}/narration/v{version}.mp3

	•	assets.storage_url에는 버킷 상대 경로 또는 public URL을 저장(일관성 유지).
	•	삭제 대신 버전 교체로 대체(이력 보존). 필요 시 metadata.deleted=true로 소프트 삭제 표기.

⸻

7) 토큰 사용량 기록
	•	.finally에서 호출(성공/실패 무관, 실패 시 0 처리 가능):
	•	업데이트/업서트 예:
	1.	select * from tokens where user_id=$1 and type=$2
	2.	없으면 insert(limit 정책에 맞게 초기화)
	3.	update tokens set usage = usage + $used where user_id=$1 and type=$2
	•	초과 시 앞단에서 차단(usage vs limit 비교).

⸻

8) 상태 플래그
	•	scenes.status: 파이프라인 단계(예: init → prompt → prompt_confirmed → image → image_confirmed → clip)
	•	scenes.no_subject: 선택 생성 분기(예: 이미지/클립 생성 시 noCharacter=true로 라우트 핸들러에 전달)

⸻

9) 권한/RLS 기본 원칙
	•	projects/scenes/assets/tokens/video_preferences 모두:
	•	SELECT/INSERT/UPDATE/DELETE 시 user_id = auth.uid() 또는 projects.user_id = auth.uid()로 제한.
	•	assets.parents_id는 문자열이지만, 상위 엔터티와의 연결은 애플리케이션 규칙으로 보장.
	•	삽입 전 scene_id/project_id 소유 검증 필수.

⸻

10) 대표 시퀀스 예시

(1) 이미지 생성 성공 후 저장
	1.	버전 조회

select coalesce(max(version), 0) + 1 as v
from assets
where parents_id = 'image-{scene_id}' and type = 'image';

	2.	assets 삽입

insert into assets (parents_id, version, user_id, type, storage_url, metadata)
values ('image-{scene_id}', $v, $user_id, 'image', $url, $meta_json);

	3.	씬 업데이트

update scenes
set image_version = $v, status = 'image'
where scene_id = '{scene_id}' and user_id = $user_id;

	4.	토큰 사용량

-- upsert or update usage += used

(2) 클립 생성 성공 후 저장

동일 패턴(parents_id='clip-{scene_id}', type='clip')

(3) 프로젝트 나레이션 저장

동일 패턴(parents_id='narration-{project_id}', type='narration') →
projects.narration_version = v 업데이트

⸻

11) 읽기(조인 최소화) 빠른 패턴
	•	프로젝트 화면:
	1.	projects 1회
	2.	video_preferences 1회
	3.	scenes (프로젝트 전체) 1회
	4.	씬 목록 루프:
	•	(이미지) assets by parents_id='image-{scene_id}', type='image', version=image_version
	•	(클립)   assets by parents_id='clip-{scene_id}', type='clip', version=clip_version
	5.	나레이션:
	•	assets by parents_id='narration-{project_id}', type='narration', version=narration_version

필요 시 배치 최적화(여러 parents_id를 in (...)으로 묶는)만 선택적으로 적용.

⸻

12) 에지/운영 팁
	•	재생성: 기존 버전 보존 + 새로운 버전 INSERT → 씬/프로젝트 버전 포인터만 교체.
	•	롤백: 씬/프로젝트의 *_version을 과거 버전으로 교체.
	•	무결성: scene_id/project_id 존재 및 소유 확인 후 asset 삽입.
	•	에러 복구: 버전 경쟁 시 insert 실패 → max(version) 재조회 후 1회 재시도.

⸻