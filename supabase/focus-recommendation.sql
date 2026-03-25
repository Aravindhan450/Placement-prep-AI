create or replace function get_focus_recommendation(p_user uuid)
returns table(topic text)
language sql
as $$
  with recent_attempts as (
    select topic, skill_index
    from attempt_history
    where user_id = p_user
    order by created_at desc
    limit 30
  )
  select recent_attempts.topic
  from recent_attempts
  group by recent_attempts.topic
  order by avg(recent_attempts.skill_index) asc
  limit 1;
$$;
