package com.odaabnote.dto.problem;

import com.odaabnote.domain.Problem;
import java.util.List;

public record ProblemResponse(
        Long id,
        Long ownerUserId,
        Long subjectId,
        Long unitId,
        String questionText,
        String imageUrl,
        String ocrText,
        List<ProblemChoiceDto> choices,
        String correctChoiceKey,
        String explanation,
        List<ChoiceExplanationDto> choiceExplanations,
        String coreConcept,
        List<String> keyConcepts,
        Integer difficulty,
        String source,
        List<String> tags,
        List<Long> tagIds
) {

    public record ChoiceExplanationDto(String choice, String explanation) {}

    public static ProblemResponse from(Problem problem) {
        var choicesDto = problem.getChoices().stream()
                .map(c -> new ProblemChoiceDto(c.getKey(), c.getText()))
                .toList();

        var choiceExplanationsDto = (problem.getChoiceExplanations() != null && !problem.getChoiceExplanations().isEmpty())
                ? problem.getChoiceExplanations().stream()
                        .map(e -> new ChoiceExplanationDto(e.getChoice(), e.getExplanation()))
                        .toList()
                : List.<ChoiceExplanationDto>of();

        var tagNames = problem.getTags().stream()
                .map(tag -> tag.getName())
                .toList();
        var tagIds = problem.getTags().stream()
                .map(tag -> tag.getId())
                .toList();

        return new ProblemResponse(
                problem.getId(),
                problem.getOwner() != null ? problem.getOwner().getId() : null,
                problem.getSubject() != null ? problem.getSubject().getId() : null,
                problem.getUnit() != null ? problem.getUnit().getId() : null,
                problem.getQuestionText(),
                problem.getImageUrl(),
                problem.getOcrText(),
                choicesDto,
                problem.getCorrectChoiceKey(),
                problem.getExplanation(),
                choiceExplanationsDto,
                problem.getCoreConcept(),
                problem.getKeyConcepts() != null ? problem.getKeyConcepts() : List.of(),
                problem.getDifficulty(),
                problem.getSource(),
                tagNames,
                tagIds
        );
    }
}

