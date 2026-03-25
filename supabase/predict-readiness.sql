create or replace function predict_readiness(p_user uuid)
returns table(
  predicted_readiness numeric,
  sessions_to_ready numeric
)
language sql
as $$
  with trend as (
    select
      created_at,
      skill_index,
      row_number() over(order by created_at) as n
    from attempt_history
    where user_id = p_user
    order by created_at desc
    limit 20
  )
  select
    avg(skill_index) + 0.1 as predicted_readiness,
    ceil((0.75 - avg(skill_index)) / 0.03)
  from trend;
$$;
