begin;

alter table public.video_preferences
  add column if not exists ratio varchar(10);

alter table public.video_preferences
  alter column ratio set default '9:16';

update public.video_preferences
  set ratio = '9:16'
where ratio is null;

alter table public.video_preferences
  alter column ratio set not null;

comment on column public.video_preferences.ratio
  is 'Aspect ratio. One of: 1:1, 4:3, 3:4, 16:9, 9:16, 21:9 (default 9:16).';

commit;