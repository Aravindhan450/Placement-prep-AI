create or replace function get_next_step_recommendation(p_user uuid)
returns table(
  topic text,
  avg_skill numeric,
  attempts bigint
)
language sql
as $$
  with recent_attempts as (
    select topic, skill_index, correctness
    from attempt_history
    where user_id = p_user
    order by created_at desc
    limit 30
  )
  select
    recent_attempts.topic,
    avg(recent_attempts.skill_index) as avg_skill,
    count(*) as attempts
  from recent_attempts
  group by recent_attempts.topic
  order by avg_skill asc
  limit 1;
$$;
