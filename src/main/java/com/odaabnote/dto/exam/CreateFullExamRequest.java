package com.odaabnote.dto.exam;

/** 전체 모의고사 생성. 과목당 2~3문항, 20제 고정. */
public record CreateFullExamRequest(
        /** 선택. 없으면 생성자 없이 저장 */
        Long createdByUserId
) {
}
