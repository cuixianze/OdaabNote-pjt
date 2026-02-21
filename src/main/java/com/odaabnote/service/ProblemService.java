package com.odaabnote.service;

import com.odaabnote.domain.Problem;
import com.odaabnote.domain.Subject;
import com.odaabnote.domain.Tag;
import com.odaabnote.domain.Unit;
import com.odaabnote.domain.User;
import com.odaabnote.dto.problem.ProblemChoiceDto;
import com.odaabnote.dto.problem.ProblemCreateRequest;
import com.odaabnote.dto.problem.ProblemResponse;
import com.odaabnote.dto.problem.ProblemUpdateRequest;
import com.odaabnote.repository.ProblemRepository;
import com.odaabnote.repository.SubjectRepository;
import com.odaabnote.repository.TagRepository;
import com.odaabnote.repository.UnitRepository;
import com.odaabnote.repository.UserRepository;
import com.odaabnote.dto.gemini.GeminiComputerAnalysis;
import com.odaabnote.dto.gemini.GeminiComputerAnalysis.ChoiceExplanationDto;
import com.odaabnote.service.TagService;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProblemService {

    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;
    private final UnitRepository unitRepository;
    private final TagRepository tagRepository;
    private final TagService tagService;

    private final OcrService ocrService;
    private final OcrProblemParser ocrProblemParser;
    private final GeminiService geminiService;

    @Transactional
    public ProblemResponse createProblem(ProblemCreateRequest request, MultipartFile file) {
        User owner = userRepository.findById(request.ownerUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + request.ownerUserId()));

        Subject subject = null;
        if (request.subjectId() != null) {
            subject = subjectRepository.findById(request.subjectId())
                    .orElseThrow(() -> new IllegalArgumentException("Subject not found: " + request.subjectId()));
        }
        Unit unit = null;
        if (request.unitId() != null) {
            unit = unitRepository.findById(request.unitId())
                    .orElseThrow(() -> new IllegalArgumentException("Unit not found: " + request.unitId()));
        }

        List<Tag> tagsToAdd = new ArrayList<>();
        if (request.tagNames() != null && !request.tagNames().isEmpty()) {
            for (String name : request.tagNames()) {
                Tag tag = tagService.findOrCreateByName(name);
                if (tag != null) tagsToAdd.add(tag);
            }
        } else if (request.tagIds() != null && !request.tagIds().isEmpty()) {
            tagsToAdd.addAll(tagRepository.findByIdIn(request.tagIds()));
        }

        String imageUrl = request.imageUrl();
        String ocrText = request.ocrText();
        String questionText = request.questionText();
        List<Problem.Choice> choices;
        String correctChoiceKey = request.correctChoiceKey();

        if (file != null && !file.isEmpty()) {
            // TODO: 실제로는 S3 또는 로컬 스토리지에 업로드 후 URL을 생성해야 함
            imageUrl = file.getOriginalFilename();
            ocrText = ocrService.extractTextFromImage(file);

            OcrProblemParser.ParsedProblem parsed = ocrProblemParser.parse(ocrText);
            if (questionText == null || questionText.isBlank()) {
                questionText = parsed.questionText().isBlank() ? ocrText : parsed.questionText();
            }
            if (request.choices() == null || request.choices().isEmpty()) {
                choices = parsed.choices().isEmpty() ? List.of(new Problem.Choice("A", ocrText)) : parsed.choices();
            } else {
                choices = request.choices().stream().map(ProblemService::toChoice).toList();
            }
            if (correctChoiceKey == null || correctChoiceKey.isBlank()) {
                correctChoiceKey = parsed.correctChoiceKey() != null ? parsed.correctChoiceKey() : "A";
            }
        } else {
            if (questionText == null || questionText.isBlank()) {
                throw new IllegalArgumentException("questionText is required when no image file is uploaded");
            }
            if (request.choices() == null || request.choices().isEmpty()) {
                throw new IllegalArgumentException("choices are required when no image file is uploaded");
            }
            if (correctChoiceKey == null || correctChoiceKey.isBlank()) {
                correctChoiceKey = null;
            }
            choices = request.choices().stream().map(ProblemService::toChoice).toList();
        }

        // OCR 텍스트가 있으면 Gemini(컴퓨터일반 강사)로 정답/선지별 해설/핵심개념/단원 추출 후 DB 저장에 반영
        String explanation = request.explanation();
        List<Problem.ChoiceExplanation> choiceExplanations = new ArrayList<>();
        String coreConcept = null;
        List<String> keyConcepts = new ArrayList<>();
        if (ocrText != null && !ocrText.isBlank()) {
            GeminiComputerAnalysis analysis = geminiService.analyzeProblemText(ocrText);
            // Gemini가 정답을 반환하면 항상 그걸 사용 (파서 기본값 A보다 우선)
            if (analysis.correctAnswer() != null && !analysis.correctAnswer().isBlank()) {
                correctChoiceKey = normalizeChoiceKey(analysis.correctAnswer());
            }
            if (analysis.choiceExplanations() != null && !analysis.choiceExplanations().isEmpty()) {
                for (ChoiceExplanationDto dto : analysis.choiceExplanations()) {
                    choiceExplanations.add(new Problem.ChoiceExplanation(dto.choice(), dto.explanation() != null ? dto.explanation() : ""));
                }
                if (explanation == null || explanation.isBlank()) {
                    StringBuilder sb = new StringBuilder();
                    for (ChoiceExplanationDto dto : analysis.choiceExplanations()) {
                        if (sb.length() > 0) sb.append("\n\n");
                        sb.append(dto.choice()).append("번: ").append(dto.explanation() != null ? dto.explanation() : "");
                    }
                    explanation = sb.toString();
                }
            }
            if (analysis.coreConcept() != null && !analysis.coreConcept().isBlank()) {
                coreConcept = analysis.coreConcept();
            }
            if (analysis.subject() != null && analysis.unit() != null) {
                Subject[] subjectHolder = new Subject[]{ subject };
                Unit[] unitHolder = new Unit[]{ unit };
                subjectRepository.findByName(analysis.subject()).ifPresent(s ->
                        unitRepository.findBySubject_IdAndName(s.getId(), analysis.unit()).ifPresent(u -> {
                            subjectHolder[0] = s;
                            unitHolder[0] = u;
                        }));
                subject = subjectHolder[0];
                unit = unitHolder[0];
            }
        }

        Problem problem = new Problem(
                owner,
                subject,
                unit,
                questionText,
                imageUrl,
                ocrText,
                choices,
                correctChoiceKey,
                explanation,
                choiceExplanations,
                coreConcept,
                keyConcepts,
                request.difficulty(),
                request.source()
        );

        for (Tag tag : tagsToAdd) {
            problem.addTag(tag);
        }

        Problem saved = problemRepository.save(problem);
        return ProblemResponse.from(saved);
    }

    @Transactional
    public ProblemResponse updateProblem(Long problemId, ProblemUpdateRequest request) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found: " + problemId));
        if (problem.getOwner() == null || !problem.getOwner().getId().equals(request.ownerUserId())) {
            throw new IllegalArgumentException("Only the owner can update this problem");
        }
        Subject subject = subjectRepository.findById(request.subjectId())
                .orElseThrow(() -> new IllegalArgumentException("Subject not found: " + request.subjectId()));
        Unit unit = unitRepository.findById(request.unitId())
                .orElseThrow(() -> new IllegalArgumentException("Unit not found: " + request.unitId()));

        if (request.questionText() == null || request.questionText().isBlank()) {
            throw new IllegalArgumentException("questionText is required");
        }
        if (request.choices() == null || request.choices().isEmpty()) {
            throw new IllegalArgumentException("choices are required");
        }
        List<Problem.Choice> choices = request.choices().stream().map(ProblemService::toChoice).toList();
        List<Problem.ChoiceExplanation> choiceExplanations = (request.choiceExplanations() != null && !request.choiceExplanations().isEmpty())
                ? request.choiceExplanations().stream()
                        .map(dto -> new Problem.ChoiceExplanation(dto.choice(), dto.explanation() != null ? dto.explanation() : ""))
                        .toList()
                : problem.getChoiceExplanations();
        problem.updateContent(
                request.questionText(),
                choices,
                request.correctChoiceKey(),
                request.explanation(),
                choiceExplanations,
                request.coreConcept() != null ? request.coreConcept() : problem.getCoreConcept(),
                request.keyConcepts() != null ? request.keyConcepts() : problem.getKeyConcepts(),
                request.difficulty(),
                request.source()
        );
        problem.setSubject(subject);
        problem.setUnit(unit);

        // 태그 교체: 기존 제거 후 요청된 태그로 설정
        new ArrayList<>(problem.getTags()).forEach(problem::removeTag);
        if (request.tagNames() != null && !request.tagNames().isEmpty()) {
            for (String name : request.tagNames()) {
                Tag tag = tagService.findOrCreateByName(name);
                if (tag != null) problem.addTag(tag);
            }
        } else if (request.tagIds() != null && !request.tagIds().isEmpty()) {
            for (Long tagId : request.tagIds()) {
                tagRepository.findById(tagId).ifPresent(problem::addTag);
            }
        }

        return ProblemResponse.from(problemRepository.save(problem));
    }

    public ProblemResponse getProblem(Long problemId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found: " + problemId));
        return ProblemResponse.from(problem);
    }

    public List<ProblemResponse> findProblemsByUnit(Long unitId) {
        return problemRepository.findByUnitId(unitId).stream()
                .map(ProblemResponse::from)
                .toList();
    }

    /** 유저별 등록 문제 검색 */
    public List<ProblemResponse> findProblemsByOwner(Long ownerUserId) {
        return problemRepository.findByOwner_Id(ownerUserId).stream()
                .map(ProblemResponse::from)
                .toList();
    }

    /** 과목별 문제 검색 */
    public List<ProblemResponse> findProblemsBySubject(Long subjectId) {
        return problemRepository.findBySubjectId(subjectId).stream()
                .map(ProblemResponse::from)
                .toList();
    }

    /** 태그별 문제 검색 */
    public List<ProblemResponse> findProblemsByTag(Long tagId) {
        return problemRepository.findDistinctByTags_Id(tagId).stream()
                .map(ProblemResponse::from)
                .toList();
    }

    /** Gemini/OCR 등에서 오는 정답(①, ②, 1, 2, 3, 4, A, B, C, D 등)을 선지 키 A,B,C,D로 정규화 */
    private static String normalizeChoiceKey(String key) {
        if (key == null || key.isBlank()) return "A";
        String k = key.trim();
        // 원문/숫자
        if ("①".equals(k) || "1".equals(k) || "1번".equals(k)) return "A";
        if ("②".equals(k) || "2".equals(k) || "2번".equals(k)) return "B";
        if ("③".equals(k) || "3".equals(k) || "3번".equals(k)) return "C";
        if ("④".equals(k) || "4".equals(k) || "4번".equals(k)) return "D";
        // 알파벳 (대소문자)
        if (k.length() >= 1) {
            char c = Character.toUpperCase(k.charAt(0));
            if (c >= 'A' && c <= 'D') return String.valueOf(c);
        }
        return "A";
    }

    private static Problem.Choice toChoice(ProblemChoiceDto dto) {
        return new Problem.Choice(dto.key(), dto.text());
    }
}

