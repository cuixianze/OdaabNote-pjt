package com.odaabnote.service;

import com.odaabnote.domain.Problem.Choice;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * OCR 텍스트에서 문제 문장과 ① ② ③ ④ 선지를 추출합니다.
 * (한국 시험/교재 형식: ① ... ② ... ③ ... ④ 또는 1. ... 2. ... 3. ... 4. ...)
 */
@Component
public class OcrProblemParser {

    private static final Logger log = LoggerFactory.getLogger(OcrProblemParser.class);

    private static final Pattern CHOICE_CIRCLED = Pattern.compile("([①②③④⑤⑥])\\s*([^①②③④⑤⑥]+?)(?=[①②③④⑤⑥]|$)", Pattern.DOTALL);
    private static final Pattern CHOICE_NUMBERED = Pattern.compile("([1-6])\\.\\s*([^1-6]\\.?[^\\n]*?)(?=\\s*[1-6]\\.|$)", Pattern.DOTALL);
    /** 선지 4개뿐 아니라 5~6개도 허용 (일부 기출 형식) */
    private static final String[] CHOICE_KEYS = {"A", "B", "C", "D", "E", "F"};

    /**
     * @return ParsedProblem(questionText, choices). 파싱 실패 시 questionText는 전체 OCR, choices는 빈 리스트.
     */
    public ParsedProblem parse(String ocrText) {
        if (ocrText == null || ocrText.isBlank()) {
            return new ParsedProblem("", List.of(), null);
        }
        String trimmed = ocrText.trim();

        // ① ② ③ ④ 형식
        List<Choice> choices = parseCircledChoices(trimmed);
        if (!choices.isEmpty()) {
            String question = extractQuestionBeforeCircled(trimmed);
            return new ParsedProblem(question, choices, null);
        }

        // 1. 2. 3. 4. 형식
        choices = parseNumberedChoices(trimmed);
        if (!choices.isEmpty()) {
            String question = extractQuestionBeforeNumbered(trimmed);
            return new ParsedProblem(question, choices, null);
        }

        // 파싱 실패: 전체를 문제 문장으로
        log.debug("OCR choice parsing failed, using full text as question");
        return new ParsedProblem(trimmed, List.of(), null);
    }

    private List<Choice> parseCircledChoices(String text) {
        List<Choice> result = new ArrayList<>();
        Matcher m = CHOICE_CIRCLED.matcher(text);
        int idx = 0;
        while (m.find() && idx < CHOICE_KEYS.length) {
            String choiceText = m.group(2).trim();
            if (choiceText.length() > 0) {
                result.add(new Choice(CHOICE_KEYS[idx], choiceText));
                idx++;
            }
        }
        return result;
    }

    private String extractQuestionBeforeCircled(String text) {
        int first = text.indexOf('①');
        if (first <= 0) return text;
        return text.substring(0, first).replaceAll("\\s+", " ").trim();
    }

    private List<Choice> parseNumberedChoices(String text) {
        List<Choice> result = new ArrayList<>();
        Matcher m = CHOICE_NUMBERED.matcher(text);
        int idx = 0;
        while (m.find() && idx < CHOICE_KEYS.length) {
            String choiceText = m.group(2).trim();
            if (choiceText.length() > 0) {
                result.add(new Choice(CHOICE_KEYS[idx], choiceText));
                idx++;
            }
        }
        return result;
    }

    private String extractQuestionBeforeNumbered(String text) {
        Matcher m = Pattern.compile("\\s*1\\.\\s*").matcher(text);
        if (!m.find()) return text;
        return text.substring(0, m.start()).replaceAll("\\s+", " ").trim();
    }

    public record ParsedProblem(String questionText, List<Choice> choices, String correctChoiceKey) {}
}
