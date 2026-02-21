-- =========================================================
-- Database 생성 및 기본 설정
-- =========================================================
CREATE DATABASE IF NOT EXISTS odaabnote
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE odaabnote;

-- =========================================================
-- User (친구 계정 5명)
-- =========================================================
CREATE TABLE user (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email        VARCHAR(255)    NOT NULL,
    name         VARCHAR(100)    NOT NULL,
    role         VARCHAR(50)     NOT NULL DEFAULT 'USER',

    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uk_user_email (email)
) ENGINE=InnoDB;

-- =========================================================
-- 과목 / 단원 (단원별 모의고사)
-- =========================================================
CREATE TABLE subject (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name         VARCHAR(100)    NOT NULL,

    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uk_subject_name (name)
) ENGINE=InnoDB;

CREATE TABLE unit (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    subject_id   BIGINT UNSIGNED NOT NULL,
    name         VARCHAR(150)    NOT NULL,
    unit_order   INT             NOT NULL DEFAULT 1,

    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_unit_subject (subject_id),

    CONSTRAINT fk_unit_subject
        FOREIGN KEY (subject_id) REFERENCES subject (id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- Tag (자유 태깅)
-- =========================================================
CREATE TABLE tag (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name         VARCHAR(100)    NOT NULL,
    color        VARCHAR(20)              , -- UI용 (선택)

    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uk_tag_name (name)
) ENGINE=InnoDB;

-- =========================================================
-- Problem (객관식 문제만, 선택지 JSON)
-- =========================================================
/*
choices JSON 예시:
[
  { "key": "A", "text": "선지 1 내용" },
  { "key": "B", "text": "선지 2 내용" },
  { "key": "C", "text": "선지 3 내용" },
  { "key": "D", "text": "선지 4 내용" }
]
*/
CREATE TABLE problem (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    owner_user_id      BIGINT UNSIGNED          , -- 최초 등록자
    subject_id         BIGINT UNSIGNED          ,
    unit_id            BIGINT UNSIGNED          ,

    question_text      TEXT                     , -- OCR 보정 후 문제 텍스트
    image_url          VARCHAR(500)             , -- 문제 이미지 경로/URL
    ocr_text           LONGTEXT                 , -- 구글 비전 OCR 원문 (원하면 저장)

    choices            JSON           NOT NULL , -- 객관식 선지(JSON)
    correct_choice_key VARCHAR(20)    NOT NULL, -- 정답 key (예: 'A')

    explanation        LONGTEXT                 , -- 해설/오답노트 기본 설명
    difficulty         TINYINT UNSIGNED        , -- 1~5 등
    source             VARCHAR(255)            , -- 출처

    created_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_problem_owner (owner_user_id),
    KEY idx_problem_unit (unit_id),
    KEY idx_problem_subject (subject_id),

    CONSTRAINT fk_problem_owner
        FOREIGN KEY (owner_user_id) REFERENCES user (id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_problem_subject
        FOREIGN KEY (subject_id) REFERENCES subject (id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_problem_unit
        FOREIGN KEY (unit_id) REFERENCES unit (id)
        ON UPDATE CASCADE ON DELETE SET NULL,

    CHECK (JSON_VALID(choices))
) ENGINE=InnoDB;

-- =========================================================
-- Problem <-> Tag (다대다)
-- =========================================================
CREATE TABLE problem_tag (
    problem_id  BIGINT UNSIGNED NOT NULL,
    tag_id      BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (problem_id, tag_id),
    KEY idx_problem_tag_tag (tag_id),

    CONSTRAINT fk_problem_tag_problem
        FOREIGN KEY (problem_id) REFERENCES problem (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_problem_tag_tag
        FOREIGN KEY (tag_id) REFERENCES tag (id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- Exam (단원별 / 랜덤 모의고사)
-- =========================================================
CREATE TABLE exam (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title          VARCHAR(255)    NOT NULL,  -- 예: '수학 2-1 단원 모의고사', '랜덤 20제'
    type           ENUM('UNIT', 'RANDOM', 'CUSTOM') NOT NULL,
    subject_id     BIGINT UNSIGNED          ,
    unit_id        BIGINT UNSIGNED          ,
    created_by     BIGINT UNSIGNED NOT NULL,

    question_count INT UNSIGNED   NOT NULL,   -- 포함된 문항 수

    created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_exam_type (type),
    KEY idx_exam_subject_unit (subject_id, unit_id),

    CONSTRAINT fk_exam_subject
        FOREIGN KEY (subject_id) REFERENCES subject (id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_exam_unit
        FOREIGN KEY (unit_id) REFERENCES unit (id)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_exam_created_by
        FOREIGN KEY (created_by) REFERENCES user (id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE exam_problem (
    exam_id     BIGINT UNSIGNED NOT NULL,
    problem_id  BIGINT UNSIGNED NOT NULL,
    question_no INT UNSIGNED    NOT NULL,

    PRIMARY KEY (exam_id, problem_id),
    UNIQUE KEY uk_exam_question_no (exam_id, question_no),

    KEY idx_exam_problem_problem (problem_id),

    CONSTRAINT fk_exam_problem_exam
        FOREIGN KEY (exam_id) REFERENCES exam (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_exam_problem_problem
        FOREIGN KEY (problem_id) REFERENCES problem (id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- =========================================================
-- User별 풀이 이력 / 오답 기록
-- =========================================================
CREATE TABLE user_problem_log (
    id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id               BIGINT UNSIGNED NOT NULL,
    problem_id            BIGINT UNSIGNED NOT NULL,
    exam_id               BIGINT UNSIGNED          , -- 어떤 모의고사에서 풀었는지
    selected_choice_key   VARCHAR(20)              , -- 사용자가 고른 보기 key
    is_correct            TINYINT(1)    NOT NULL,   -- 1: 맞음, 0: 틀림
    memo                  TEXT                     , -- 개인 메모 (오답노트용)
    solved_at             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_upl_user (user_id),
    KEY idx_upl_problem (problem_id),
    KEY idx_upl_exam (exam_id),

    CONSTRAINT fk_upl_user
        FOREIGN KEY (user_id) REFERENCES user (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_upl_problem
        FOREIGN KEY (problem_id) REFERENCES problem (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_upl_exam
        FOREIGN KEY (exam_id) REFERENCES exam (id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- =========================================================
-- Comment (문제별 댓글 기능)
-- =========================================================
CREATE TABLE comment (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    problem_id   BIGINT UNSIGNED NOT NULL,
    user_id      BIGINT UNSIGNED NOT NULL,
    content      TEXT            NOT NULL,

    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    KEY idx_comment_problem (problem_id),
    KEY idx_comment_user (user_id),

    CONSTRAINT fk_comment_problem
        FOREIGN KEY (problem_id) REFERENCES problem (id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_comment_user
        FOREIGN KEY (user_id) REFERENCES user (id)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

