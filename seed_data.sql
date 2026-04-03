SET search_path TO public;
INSERT INTO students (id, student_number, name, access_code, character_class, title, level, grade_tier, badge_tier, role_name, avatar_url, class_points, attack_power, defense_power, support_power, total_exp, won_balance, nyang_balance, core_balance, starlight_shard_balance, wisdom, creativity, personality, vitality, diligence, communication, notes, created_by_user_id, is_active, created_at, updated_at)
SELECT id, student_number, name, access_code, character_class, title, level, grade_tier, badge_tier, role_name, avatar_url, class_points, attack_power, defense_power, support_power, total_exp, won_balance, nyang_balance, core_balance, starlight_shard_balance, 0, 0, 0, 0, 0, 0, notes, created_by_user_id, is_active, created_at, updated_at
FROM students
ON CONFLICT (id) DO UPDATE SET
  wisdom = EXCLUDED.wisdom,
  creativity = EXCLUDED.creativity,
  personality = EXCLUDED.personality,
  vitality = EXCLUDED.vitality,
  diligence = EXCLUDED.diligence,
  communication = EXCLUDED.communication;