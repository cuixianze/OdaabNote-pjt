package com.odaabnote.dto.problem;

import jakarta.validation.constraints.NotNull;
import java.util.List;

/**
 * 이미지(file)를 보내면 Google Vision OCR로 questionText/choices를 자동 추출합니다.
 * 과목·단원·정답은 선택. questionText, choices는 이미지 없이 등록할 때만 필수.
 */
public record ProblemCreateRequest(
        @NotNull Long ownerUserId,
        /** 선택. null 허용. 없으면 과목 미지정으로 저장. */
        Long subjectId,
        /** 선택. null 허용. 없으면 단원 미지정으로 저장. */
        Long unitId,

        String imageUrl,
        String ocrText,

        /** 이미지 업로드 시 비어 있으면 OCR 결과로 채웁니다. */
        String questionText,

        /** 이미지 업로드 시 비어 있으면 OCR에서 ① ② ③ ④ 선지를 파싱해 채웁니다. */
        List<ProblemChoiceDto> choices,

        /** 정답 선지 키. 선택. 비우면 Gemini 분석 결과로 채우거나 null 저장. */
        String correctChoiceKey,

        String explanation,
        Integer difficulty,
        String source,

        /** 선택. DB에 등록된 태그 ID 목록만 사용 (GET /api/tags 목록에서 선택) */
        List<Long> tagIds
) {
}

