package com.odaabnote.controller;

import com.odaabnote.dto.gemini.GeminiComputerAnalysis;
import com.odaabnote.service.GeminiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Gemini 연동이 정상 동작하는지 확인하기 위한 테스트용 엔드포인트.
 * Swagger에서 OCR 텍스트를 넣고 호출해 보면 정답/해설/핵심개념이 채워지는지 확인할 수 있음.
 */
@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
@Tag(name = "Debug", description = "Gemini 연동 테스트용 (개발 확인 후 제거 가능)")
public class GeminiDebugController {

    private final GeminiService geminiService;

    @PostMapping("/gemini-test")
    @Operation(
            summary = "Gemini 분석만 테스트",
            description = "OCR 텍스트만 보내서 Gemini가 정답/해설/핵심개념을 잘 추출하는지 확인. "
                    + "문제 등록 시와 동일한 OCR 텍스트를 넣어 보세요. 서버 콘솔 로그도 함께 확인하면 원인 파악에 도움이 됩니다."
    )
    public ResponseEntity<GeminiComputerAnalysis> testGemini(@RequestBody TestGeminiRequest request) {
        if (request == null || request.ocrText() == null || request.ocrText().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        GeminiComputerAnalysis result = geminiService.analyzeProblemText(request.ocrText());
        return ResponseEntity.ok(result);
    }

    public record TestGeminiRequest(String ocrText) {}
}
