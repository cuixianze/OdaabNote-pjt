package com.odaabnote.dto.gemini;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * Gemini API가 문제 OCR 텍스트를 분석해 반환하는 JSON 형식.
 * 정답, 해설, 핵심 개념, 해당 단원(과목/단원명)을 담는다.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GeminiProblemAnalysis(
        @JsonProperty("correct_choice_key") String correctChoiceKey,
        @JsonProperty("explanation") String explanation,
        @JsonProperty("key_concepts") List<String> keyConcepts,
        @JsonProperty("subject_name") String subjectName,
        @JsonProperty("unit_name") String unitName
) {
    public List<String> keyConcepts() {
        return keyConcepts != null ? keyConcepts : List.of();
    }
}
