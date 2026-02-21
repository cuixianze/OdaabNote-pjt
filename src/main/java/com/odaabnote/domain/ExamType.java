package com.odaabnote.domain;

public enum ExamType {
    UNIT,
    RANDOM,
    CUSTOM,
    /** 과목별 모의고사 (단원당 2~3문항, 최대 20제) */
    SUBJECT,
    /** 전체 모의고사 (과목당 2~3문항, 20제 고정) */
    FULL
}

