#### Users Table

- id bigint not null (PK)
- login_method varchar(10) not null  -- password, google, kakao, and so on
- email text not null
- created_at timestamp with time zone not null default now()
- updated_at timestamp with time zone not null default now()

**Index**
- 


#### Video Preference Table

- id bigint not null (PK)
- project_id bigint not null (FK)
- image_gen_model varchar(50) not null default 'Gemini'      -- Gemini, GPT
- video_gen_model varchar(50) not null default 'Seedance'    -- Kling, Seedance
- voice_gen_model varchar(50) not null default 'Bin'         -- Bin, Otani
- stability double not null default 0.5
- resolution varchar(10) not null default '480p'             -- 480p, 720p, ...
- ratio varchar(10) not null default '9:16'                  -- 1:1, 4:3, 3:4, 16:9, 9:16, ...
- custom_style varchar(200) null
- split_rule varchar(1200) null
- created_at timestamp with time zone not null default now()
- updated_at timestamp with time zone not null default now()

**Index**
- project_id

#### Token Table

- id bigint not null (PK)
- user_id bigint not null (FK)
- type varchar(10) not null  -- gpt, gemini, seedance
- usage int4 not null default 0
- limit int4 not null  -- model 별로 다를 수도, 같을 수도 있음 
- created_at timestamp with time zone not null default now()
- updated_at timestamp with time zone not null default now()

**Index**
- user_id, type [bind]

#### Project Table

ー id bigint not null (PK)
- user_id bigint not null (FK)
- title varchar(10) not null
- description varchar(200) null
- script varchar(2000) null
- narration_version int4 null    -- Asset Table 버전
- created_at timestamp with time zone not null default now()
- updated_at timestamp with time zone not null default now()

**Index**
- user_id

#### Scene Table

- id bigint not null (PK)
- project_id bigint not null (FK)
- user_id bigint not null                     -- 단순 조회용
- status varchar(15) not null default init    -- init > prompt > prompt_confirmed > image > image_confirmed > clip
- scene_id varchar(20) not null
- scene_json json not null default {}
- image_version int4 null                     -- Asset Table 버전
- clip_version int4 null                      -- Asset Table 버전
- order int not null                          -- 필요한 순서 업데이트 프론트 코드 요구
- no_subject boolean not null default false 
- created_at timestamp with time zone not null default now()
- updated_at timestamp with time zone not null default now()

**Index**
- project_id
- scene_id

#### Asset Table

- id bigint not null (PK)
- parents_id varchar(30) not null (FK)    -- project_id-scene_id
- version int4 not null default 1
- user_id bigint not null                 -- 단순 조회용
- type varchar(10) not null               -- narration | clip | image
- storage_url varchar(300) not null
- metadata json not null default {}
- created_at timestamp with time zone not null default now()
- updated_at timestamp with time zone not null default now()

**Index**
- parents_id, type, version [bind]