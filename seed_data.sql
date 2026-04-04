SET search_path TO public;
INSERT INTO activity_coupons (name, description, icon_emoji, price_gold, stock, is_active, created_by_user_id)
VALUES
  ('자리 옮기기 쿠폰', '하루 1회 원하는 자리로 이동할 수 있어요.', '🪑', 250, 18, true, NULL),
  ('점심시간 음악 신청권', '점심시간에 듣고 싶은 음악 1곡을 신청합니다.', '🎵', 300, 12, true, NULL),
  ('보드게임 선택권', '창체 시간 보드게임 종류를 제안할 수 있어요.', '🎲', 500, 8, true, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO funding_projects (title, description, reward_plan, target_amount, current_amount, status, created_by_user_id)
VALUES
  ('과자 & 영화 파티', '학기 말에 과자와 영화 파티를 진행합니다.', '목표 달성 시 학급 영화 감상 + 간식 파티', 25000, 21000, 'active', NULL),
  ('창체 메이커 데이', '창체 시간에 메이커 활동 재료를 구매합니다.', '목표 달성 시 팀별 메이커 프로젝트 운영', 18000, 9200, 'active', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO activity_coupon_purchases (student_id, coupon_id, quantity, total_price_gold)
VALUES
  (1, 1, 1, 250),
  (3, 2, 1, 300),
  (4, 1, 1, 250)
ON CONFLICT DO NOTHING;

INSERT INTO activity_coupon_usages (student_id, coupon_id, quantity, note)
VALUES
  (1, 1, 1, '모둠 활동 시작 전에 사용'),
  (3, 2, 1, '점심시간 신청 완료')
ON CONFLICT DO NOTHING;

INSERT INTO funding_contributions (project_id, student_id, amount)
VALUES
  (1, 1, 500),
  (1, 3, 150),
  (2, 4, 300)
ON CONFLICT DO NOTHING;