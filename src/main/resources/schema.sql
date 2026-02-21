-- =========================================================
-- User (친구 계정 5명)
-- =========================================================
CREATE TABLE IF NOT EXISTS user (
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
CREATE TABLE IF NOT EXISTS subject (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name         VARCHAR(100)    NOT NULL,

    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uk_subject_name (name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS unit (
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
CREATE TABLE IF NOT EXISTS tag (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name         VARCHAR(100)    NOT NULL,
    color        VARCHAR(20)              ,

    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uk_tag_name (name)
) ENGINE=InnoDB;

-- =========================================================
-- Problem (객관식 문제만, 선택지 JSON)
-- =========================================================
CREATE TABLE IF NOT EXISTS problem (
    id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    owner_user_id      BIGINT UNSIGNED          ,
    subject_id         BIGINT UNSIGNED          ,
    unit_id            BIGINT UNSIGNED          ,

    question_text      TEXT                     ,
    image_url          VARCHAR(500)             ,
    ocr_text           LONGTEXT                 ,

    choices            JSON           NOT NULL ,
    correct_choice_key VARCHAR(20)             ,

    explanation        LONGTEXT                 ,
    choice_explanations JSON                   ,
    core_concept       LONGTEXT                ,
    key_concepts       JSON                    ,
    difficulty         TINYINT UNSIGNED        ,
    source             VARCHAR(255)            ,

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
CREATE TABLE IF NOT EXISTS problem_tag (
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
CREATE TABLE IF NOT EXISTS exam (
    id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title          VARCHAR(255)    NOT NULL,
    type           ENUM('UNIT', 'RANDOM', 'CUSTOM', 'SUBJECT', 'FULL') NOT NULL,
    subject_id     BIGINT UNSIGNED          ,
    unit_id        BIGINT UNSIGNED          ,
    created_by     BIGINT UNSIGNED          ,

    question_count INT UNSIGNED   NOT NULL,

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

CREATE TABLE IF NOT EXISTS exam_problem (
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
CREATE TABLE IF NOT EXISTS user_problem_log (
    id                    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id               BIGINT UNSIGNED NOT NULL,
    problem_id            BIGINT UNSIGNED NOT NULL,
    exam_id               BIGINT UNSIGNED          ,
    selected_choice_key   VARCHAR(20)              ,
    is_correct            TINYINT(1)    NOT NULL,
    memo                  TEXT                     ,
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
CREATE TABLE IF NOT EXISTS comment (
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

-- 기존 DB 마이그레이션 (한 번만 수동 실행, 이미 있으면 오류 무시)
-- ALTER TABLE problem MODIFY COLUMN correct_choice_key VARCHAR(20) NULL;
-- ALTER TABLE problem ADD COLUMN choice_explanations JSON NULL AFTER explanation;
-- ALTER TABLE problem ADD COLUMN core_concept LONGTEXT NULL AFTER choice_explanations;
-- ALTER TABLE exam MODIFY COLUMN type ENUM('UNIT', 'RANDOM', 'CUSTOM', 'SUBJECT', 'FULL') NOT NULL;
-- ALTER TABLE exam MODIFY COLUMN created_by BIGINT UNSIGNED NULL;
