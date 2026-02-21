package com.odaabnote.service;

import com.odaabnote.domain.Problem;
import com.odaabnote.domain.Subject;
import com.odaabnote.domain.Tag;
import com.odaabnote.domain.Unit;
import com.odaabnote.domain.User;
import com.odaabnote.dto.problem.ProblemChoiceDto;
import com.odaabnote.dto.problem.ProblemCreateRequest;
import com.odaabnote.dto.problem.ProblemImportItemRequest;
import com.odaabnote.dto.problem.ProblemImportRequest;
import com.odaabnote.dto.problem.ProblemImportResponse;
import com.odaabnote.dto.problem.ProblemResponse;
import com.odaabnote.dto.problem.ProblemUpdateRequest;
import com.odaabnote.repository.ProblemRepository;
import com.odaabnote.repository.SubjectRepository;
import com.odaabnote.repository.TagRepository;
import com.odaabnote.repository.UnitRepository;
import com.odaabnote.repository.UserRepository;
import com.odaabnote.dto.gemini.GeminiComputerAnalysis;
import com.odaabnote.dto.gemini.GeminiComputerAnalysis.ChoiceExplanationDto;
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
        if (request.tagIds() != null && !request.tagIds().isEmpty()) {
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
            String derivedCore = analysis.derivedCoreConcept();
            if (derivedCore != null && !derivedCore.isBlank()) {
                coreConcept = derivedCore;
            }
            List<String> derivedKeys = analysis.derivedKeyConcepts();
            if (derivedKeys != null && !derivedKeys.isEmpty()) {
                keyConcepts = new ArrayList<>(derivedKeys);
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

        // 태그 교체: 기존 제거 후 요청된 태그(tagIds)로만 설정 (DB에 있는 태그만 사용)
        new ArrayList<>(problem.getTags()).forEach(problem::removeTag);
        if (request.tagIds() != null && !request.tagIds().isEmpty()) {
            for (Long id : request.tagIds()) {
                tagRepository.findById(id).ifPresent(problem::addTag);
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

    /** 태그별 문제 검색 (각 문제의 전체 태그가 응답에 포함됨) */
    public List<ProblemResponse> findProblemsByTag(Long tagId) {
        return problemRepository.findByTagIdWithTags(tagId).stream()
                .map(ProblemResponse::from)
                .toList();
    }

    /**
     * 기출문제 JSON 일괄 등록. subjectName/unitName/tagNames는 DB에 있는 이름으로 넣으면 ID로 매핑됩니다.
     */
    @Transactional
    public ProblemImportResponse importProblems(ProblemImportRequest request) {
        long ownerId = request.ownerUserId() != null && request.ownerUserId() > 0
                ? request.ownerUserId()
                : 1L;
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + ownerId));

        List<Long> createdIds = new ArrayList<>();
        for (ProblemImportItemRequest item : request.problems()) {
            Subject subject = null;
            Unit unit = null;
            if (item.subjectName() != null && !item.subjectName().isBlank()) {
                String subjectName = normalizeSubjectName(item.subjectName().trim());
                subject = subjectRepository.findByName(subjectName).orElse(null);
                if (subject != null && item.unitName() != null && !item.unitName().isBlank()) {
                    String unitName = normalizeUnitName(item.unitName().trim());
                    unit = unitRepository.findBySubject_IdAndName(subject.getId(), unitName).orElse(null);
                    if (unit == null) {
                        unit = unitRepository.findBySubject_IdOrderByUnitOrderAsc(subject.getId()).stream()
                                .filter(u -> u.getName().contains(unitName) || unitName.contains(u.getName()))
                                .findFirst()
                                .orElse(null);
                    }
                }
            }

            List<Problem.Choice> choices = item.choices().stream()
                    .map(ProblemService::toChoice)
                    .toList();
            List<Problem.ChoiceExplanation> choiceExplanations = (item.choiceExplanations() != null && !item.choiceExplanations().isEmpty())
                    ? item.choiceExplanations().stream()
                            .map(dto -> new Problem.ChoiceExplanation(dto.choice(), dto.explanation() != null ? dto.explanation() : ""))
                            .toList()
                    : new ArrayList<>();
            List<String> keyConcepts = item.keyConcepts() != null ? new ArrayList<>(item.keyConcepts()) : new ArrayList<>();

            Problem problem = new Problem(
                    owner,
                    subject,
                    unit,
                    item.questionText(),
                    null,
                    null,
                    choices,
                    item.correctChoiceKey(),
                    item.explanation() != null ? item.explanation() : "",
                    choiceExplanations,
                    item.coreConcept(),
                    keyConcepts,
                    item.difficulty(),
                    item.source()
            );

            if (item.tagNames() != null && !item.tagNames().isEmpty()) {
                for (String name : item.tagNames()) {
                    if (name == null || name.isBlank()) continue;
                    tagRepository.findByName(name.trim()).ifPresent(problem::addTag);
                }
            }

            Problem saved = problemRepository.save(problem);
            createdIds.add(saved.getId());
        }

        return new ProblemImportResponse(createdIds.size(), createdIds);
    }

    /** PDF/Gemini에서 자주 쓰는 과목명 → DB 시드명 매핑 */
    private static String normalizeSubjectName(String name) {
        if (name == null || name.isBlank()) return name;
        return switch (name) {
            case "데이터통신론" -> "데이터 통신론";
            case "전자계산기구조론" -> "전자계산기 구조론";
            case "소프트웨어공학론" -> "소프트웨어 공학론";
            case "프로그래밍언어론" -> "프로그래밍 언어론";
            case "데이터베이스론" -> "데이터베이스론";
            default -> name;
        };
    }

    /** "6장. 최신 네트워크 신기술 및 보안" → "네트워크 보안 및 신기술" 등 단원명 정리 */
    private static String normalizeUnitName(String name) {
        if (name == null || name.isBlank()) return name;
        String s = name.replaceFirst("^\\d+장\\.?\\s*", "").trim();
        if (s.contains("중앙처리장치") && s.contains("CPU")) return "중앙처리장치(CPU)";
        if (s.contains("최신") && s.contains("네트워크")) return "네트워크 보안 및 신기술";
        if (s.contains("선형") && (s.contains("스택") || s.contains("큐"))) return "선형 구조";
        return s;
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

