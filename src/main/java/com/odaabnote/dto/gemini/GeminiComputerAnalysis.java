package com.odaabnote.dto.gemini;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * 9급 공무원 컴퓨터일반(박미진 교수님 커리큘럼) 강사 역할 Gemini 응답 스키마.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record GeminiComputerAnalysis(
        @JsonProperty("correctAnswer") String correctAnswer,
        @JsonProperty("choiceExplanations") List<ChoiceExplanationDto> choiceExplanations,
        @JsonProperty("coreConcept") String coreConcept,
        @JsonProperty("subject") String subject,
        @JsonProperty("unit") String unit
) {
    public List<ChoiceExplanationDto> choiceExplanations() {
        return choiceExplanations != null ? choiceExplanations : List.of();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ChoiceExplanationDto(
            @JsonProperty("choice") String choice,
            @JsonProperty("explanation") String explanation
    ) {}
}
