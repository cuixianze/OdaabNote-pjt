package com.odaabnote.dto.gemini;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

/**
 * 9급 공무원 컴퓨터일반(박미진 교수님 커리큘럼) 강사 역할 Gemini 응답 스키마.
 * 키워드 반사신경(keywordReflexes) 기반 응답 지원.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GeminiComputerAnalysis(
        @JsonProperty("correctAnswer") String correctAnswer,
        @JsonProperty("choiceExplanations") List<ChoiceExplanationDto> choiceExplanations,
        @JsonProperty("coreConcept") String coreConcept,
        @JsonProperty("subject") String subject,
        @JsonProperty("unit") String unit,
        @JsonProperty("keywordReflexes") List<KeywordReflexDto> keywordReflexes
) {
    public List<ChoiceExplanationDto> choiceExplanations() {
        return choiceExplanations != null ? choiceExplanations : List.of();
    }

    public List<KeywordReflexDto> keywordReflexes() {
        return keywordReflexes != null ? keywordReflexes : List.of();
    }

    /** keywordReflexes에서 첫 항목(핵심 정답 개념)으로 요약 문자열 생성. coreConcept가 없을 때 사용 */
    public String derivedCoreConcept() {
        if (coreConcept != null && !coreConcept.isBlank()) return coreConcept;
        List<KeywordReflexDto> reflexes = keywordReflexes();
        if (reflexes.isEmpty()) return null;
        KeywordReflexDto first = reflexes.get(0);
        List<String> kw = first.keywords() != null ? first.keywords() : List.of();
        String kws = kw.isEmpty() ? "" : ": " + String.join(", ", kw);
        return (first.concept() != null ? first.concept() : "") + kws;
    }

    /** keywordReflexes를 "개념명: 키워드1, 키워드2, ..." 형태의 목록으로 변환 (Problem.keyConcepts 저장용) */
    public List<String> derivedKeyConcepts() {
        List<KeywordReflexDto> reflexes = keywordReflexes();
        if (reflexes.isEmpty()) return List.of();
        List<String> result = new ArrayList<>();
        for (KeywordReflexDto r : reflexes) {
            List<String> kw = r.keywords() != null ? r.keywords() : List.of();
            String line = (r.concept() != null ? r.concept() : "") + (kw.isEmpty() ? "" : ": " + String.join(", ", kw));
            if (!line.isBlank()) result.add(line.trim());
        }
        return result;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ChoiceExplanationDto(
            @JsonProperty("choice") String choice,
            @JsonProperty("explanation") String explanation
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record KeywordReflexDto(
            @JsonProperty("keywords") List<String> keywords,
            @JsonProperty("concept") String concept
    ) {}
}
