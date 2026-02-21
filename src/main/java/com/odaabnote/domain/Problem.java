package com.odaabnote.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "problem")
public class Problem extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_user_id")
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unit_id")
    private Unit unit;

    @Column(name = "question_text", columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "ocr_text", columnDefinition = "LONGTEXT")
    private String ocrText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "choices", columnDefinition = "json", nullable = false)
    private List<Choice> choices = new ArrayList<>();

    @Column(name = "correct_choice_key", length = 20)
    private String correctChoiceKey;

    @Column(name = "explanation", columnDefinition = "LONGTEXT")
    private String explanation;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "choice_explanations", columnDefinition = "json")
    private List<ChoiceExplanation> choiceExplanations = new ArrayList<>();

    @Column(name = "core_concept", columnDefinition = "LONGTEXT")
    private String coreConcept;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "key_concepts", columnDefinition = "json")
    private List<String> keyConcepts = new ArrayList<>();

    @Column(name = "difficulty")
    private Integer difficulty;

    @Column(name = "source", length = 255)
    private String source;

    @ManyToMany
    @JoinTable(
            name = "problem_tag",
            joinColumns = @JoinColumn(name = "problem_id"),
            inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();

    public Problem(
            User owner,
            Subject subject,
            Unit unit,
            String questionText,
            String imageUrl,
            String ocrText,
            List<Choice> choices,
            String correctChoiceKey,
            String explanation,
            List<ChoiceExplanation> choiceExplanations,
            String coreConcept,
            List<String> keyConcepts,
            Integer difficulty,
            String source
    ) {
        this.owner = owner;
        this.subject = subject;
        this.unit = unit;
        this.questionText = questionText;
        this.imageUrl = imageUrl;
        this.ocrText = ocrText;
        this.choices = choices;
        this.correctChoiceKey = correctChoiceKey;
        this.explanation = explanation;
        this.choiceExplanations = choiceExplanations != null ? choiceExplanations : new ArrayList<>();
        this.coreConcept = coreConcept;
        this.keyConcepts = keyConcepts != null ? keyConcepts : new ArrayList<>();
        this.difficulty = difficulty;
        this.source = source;
    }

    public void addTag(Tag tag) {
        this.tags.add(tag);
        tag.getProblems().add(this);
    }

    public void removeTag(Tag tag) {
        this.tags.remove(tag);
        tag.getProblems().remove(this);
    }

    /** 수정 가능 필드 (본인 문제 수정용) */
    public void updateContent(
            String questionText,
            List<Choice> choices,
            String correctChoiceKey,
            String explanation,
            List<ChoiceExplanation> choiceExplanations,
            String coreConcept,
            List<String> keyConcepts,
            Integer difficulty,
            String source
    ) {
        if (questionText != null) this.questionText = questionText;
        if (choices != null && !choices.isEmpty()) {
            this.choices.clear();
            this.choices.addAll(choices);
        }
        if (correctChoiceKey != null) this.correctChoiceKey = correctChoiceKey;
        this.explanation = explanation;
        if (choiceExplanations != null) this.choiceExplanations = choiceExplanations;
        this.coreConcept = coreConcept;
        if (keyConcepts != null) this.keyConcepts = keyConcepts;
        this.difficulty = difficulty;
        if (source != null) this.source = source;
    }

    public void setSubject(Subject subject) {
        this.subject = subject;
    }

    public void setUnit(Unit unit) {
        this.unit = unit;
    }

    @Getter
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    public static class Choice {
        private String key;
        private String text;

        public Choice(String key, String text) {
            this.key = key;
            this.text = text;
        }
    }

    /** 선지별 해설 (Gemini 컴퓨터일반 강사 분석용) */
    @Getter
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor
    public static class ChoiceExplanation {
        private String choice;
        private String explanation;
    }
}

