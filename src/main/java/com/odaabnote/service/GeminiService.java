package com.odaabnote.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.odaabnote.config.GeminiProperties;
import com.odaabnote.dto.gemini.GeminiComputerAnalysis;
import com.odaabnote.dto.gemini.GeminiComputerAnalysis.ChoiceExplanationDto;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Google Gemini API (Gemini 2.5 Flash)를 사용해 문제 OCR 텍스트에서
 * 정답, 해설, 핵심 개념, 해당 단원을 JSON으로 추출합니다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiService {

    private final GeminiProperties geminiProperties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    private static final String PROMPT = """
        당신은 9급 공무원 '컴퓨터일반' 과목의 1타 강사입니다. (박미진 교수님 커리큘럼 기반)
        사용자가 문제와 선지가 포함된 OCR 텍스트를 제공하면, 이를 분석하여 수험생이 완벽하게 이해할 수 있도록 상세한 해설과 핵심 개념, 출제 단원을 분류해 주어야 합니다.

        [작업 지시사항]
        1. 정답 도출: 주어진 문제와 선지를 읽고 정확한 정답을 찾아내세요.
        2. 선지별 해설: 정답뿐만 아니라, 오답 선지가 '왜 틀렸는지' 각각 상세히 설명하세요.
        3. 핵심 개념 요약: 이 문제를 맞히기 위해 반드시 알아야 하는 핵심 이론을 2문장 이상으로 요약하세요.
        4. 단원 분류: 아래 제공된 [컴퓨터일반 목차]를 바탕으로, 해당 문제가 속하는 가장 정확한 '과목(subject)'과 '단원(unit)'을 찾아내세요.

        [컴퓨터일반 목차]
        - PART 01. 전자계산기 구조론 (Chapter 01 ~ Chapter 08)
        - PART 02. 운영체제론 (Chapter 01 ~ Chapter 09)
        - PART 03. 데이터 통신론 (Chapter 01 ~ Chapter 05)
        - PART 04. 자료구조론 (Chapter 01 ~ Chapter 06)
        - PART 05. 데이터베이스론 (Chapter 01 ~ Chapter 06)
        - PART 06. 소프트웨어 공학론 (Chapter 01 ~ Chapter 05)
        - PART 07. 프로그래밍 언어론 (Chapter 01 ~ Chapter 05)

        [출력 제약사항]
        - 응답은 반드시 아래의 JSON 포맷으로만 출력해야 합니다.
        - JSON 외의 인사말, 부연 설명(예: "네, 분석해 드리겠습니다", "```json" 등)은 절대 포함하지 마세요. 오직 파싱 가능한 순수 JSON 객체만 반환하세요.

        [출력 JSON 스키마 - 반드시 준수]
        - correctAnswer: 반드시 "A", "B", "C", "D" 중 하나만 사용하세요. (1번→A, 2번→B, 3번→C, 4번→D로 변환하여 출력)
        - choiceExplanations의 choice: "1", "2", "3", "4" 로 통일 (1번 선지=1, 2번 선지=2, ...)

        {
          "correctAnswer": "A",
          "choiceExplanations": [
            { "choice": "1", "explanation": "1번 선지에 대한 상세 해설 (왜 맞는지 또는 왜 틀렸는지)" },
            { "choice": "2", "explanation": "2번 선지에 대한 상세 해설" },
            { "choice": "3", "explanation": "3번 선지에 대한 상세 해설" },
            { "choice": "4", "explanation": "4번 선지에 대한 상세 해설" }
          ],
          "coreConcept": "이 문제를 풀기 위해 알아야 할 핵심 개념 요약",
          "subject": "과목명 (예: 운영체제론)",
          "unit": "단원명 (예: Chapter 02 프로세스와 스레드)"
        }

        ---
        [사용자 입력 데이터]
        %s
        """;

    /**
     * OCR 텍스트를 Gemini에 보내 정답/선지별 해설/핵심개념/단원 정보를 추출합니다.
     * (9급 공무원 컴퓨터일반 강사 역할, 박미진 교수님 커리큘럼 기반)
     * API 키가 없거나 호출 실패 시 빈 분석 결과를 반환합니다.
     */
    public GeminiComputerAnalysis analyzeProblemText(String ocrText) {
        if (ocrText == null || ocrText.isBlank()) {
            log.debug("Gemini skip: ocrText is empty");
            return emptyComputerAnalysis();
        }
        if (geminiProperties.getApiKey() == null || geminiProperties.getApiKey().isBlank()) {
            log.warn("Gemini API key is not set. Set GEMINI_API_KEY env or gemini.api-key in application.yml");
            return emptyComputerAnalysis();
        }

        log.info("Gemini API 호출 중 (OCR 길이: {} chars)", ocrText.length());

        String url = geminiProperties.getGenerateContentUrl()
                + "/" + geminiProperties.getModel()
                + ":generateContent?key=" + geminiProperties.getApiKey();

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", PROMPT.formatted(ocrText)))
                )),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "temperature", 0.2
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
            if (response == null) {
                log.warn("Gemini API 응답이 null입니다.");
                return emptyComputerAnalysis();
            }
            if (response.containsKey("error")) {
                Object err = response.get("error");
                log.warn("Gemini API 에러 응답: {}", err);
                return emptyComputerAnalysis();
            }
            if (response.containsKey("promptFeedback")) {
                log.warn("Gemini promptFeedback (차단 등): {}", response.get("promptFeedback"));
            }
            String text = extractTextFromResponse(response);
            if (text == null || text.isBlank()) {
                log.warn("Gemini API 응답에 text가 없습니다. response keys: {}", response.keySet());
                String preview = response.toString();
                if (preview.length() > 600) preview = preview.substring(0, 600) + "...";
                log.warn("Gemini raw response (일부): {}", preview);
                return emptyComputerAnalysis();
            }
            GeminiComputerAnalysis analysis = parseComputerAnalysisJson(text);
            log.info("Gemini 분석 결과: correctAnswer={}, choiceExplanations={}, coreConcept 길이={}, subject={}, unit={}",
                    analysis.correctAnswer(),
                    analysis.choiceExplanations() != null ? analysis.choiceExplanations().size() : 0,
                    analysis.coreConcept() != null ? analysis.coreConcept().length() : 0,
                    analysis.subject(),
                    analysis.unit());
            return analysis;
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.warn("Gemini API HTTP 에러 ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
            return emptyComputerAnalysis();
        } catch (Exception e) {
            log.error("Gemini API 호출 실패", e);
            return emptyComputerAnalysis();
        }
    }

    @SuppressWarnings("unchecked")
    private String extractTextFromResponse(Map<String, Object> response) {
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) {
            return null;
        }
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        if (content == null) {
            return null;
        }
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        if (parts == null || parts.isEmpty()) {
            return null;
        }
        Object text = parts.get(0).get("text");
        return text != null ? text.toString().trim() : null;
    }

    private GeminiComputerAnalysis parseComputerAnalysisJson(String jsonText) {
        try {
            String cleaned = jsonText;
            if (cleaned.startsWith("```")) {
                int start = cleaned.indexOf('\n') + 1;
                int end = cleaned.lastIndexOf("```");
                if (end > start) {
                    cleaned = cleaned.substring(start, end).trim();
                }
            }
            JsonNode root = objectMapper.readTree(cleaned);
            String correctAnswer = root.has("correctAnswer") ? root.get("correctAnswer").asText(null) : null;
            List<ChoiceExplanationDto> choiceExplanations = Collections.emptyList();
            if (root.has("choiceExplanations") && root.get("choiceExplanations").isArray()) {
                choiceExplanations = objectMapper.convertValue(root.get("choiceExplanations"),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, ChoiceExplanationDto.class));
            }
            String coreConcept = root.has("coreConcept") ? root.get("coreConcept").asText(null) : null;
            String subject = root.has("subject") ? root.get("subject").asText(null) : null;
            String unit = root.has("unit") ? root.get("unit").asText(null) : null;
            return new GeminiComputerAnalysis(correctAnswer, choiceExplanations, coreConcept, subject, unit);
        } catch (Exception e) {
            log.warn("Failed to parse Gemini JSON response: {}", jsonText, e);
            return emptyComputerAnalysis();
        }
    }

    private static GeminiComputerAnalysis emptyComputerAnalysis() {
        return new GeminiComputerAnalysis(null, List.of(), null, null, null);
    }
}
