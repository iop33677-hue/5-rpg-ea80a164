SET search_path TO public;
INSERT INTO learning_board_posts (board_id, student_id, content, image_url, image_object_key, image_original_filename)
SELECT b.id, s.id, '학습 게시판 첨부 이미지 예시 글입니다.', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80', 'sample/learning-board/example-image-1.jpg', 'example-image-1.jpg'
FROM learning_boards b
CROSS JOIN students s
WHERE b.is_active = TRUE
  AND s.is_active = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM learning_board_posts p
    WHERE p.board_id = b.id
      AND p.student_id = s.id
      AND p.content = '학습 게시판 첨부 이미지 예시 글입니다.'
  )
LIMIT 1;

INSERT INTO learning_board_posts (board_id, student_id, content, image_url, image_object_key, image_original_filename)
SELECT b.id, s.id, '번호순 정렬 확인용 두 번째 예시 글입니다.', NULL, NULL, NULL
FROM learning_boards b
CROSS JOIN students s
WHERE b.is_active = TRUE
  AND s.is_active = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM learning_board_posts p
    WHERE p.board_id = b.id
      AND p.student_id = s.id
      AND p.content = '번호순 정렬 확인용 두 번째 예시 글입니다.'
  )
LIMIT 1;