package com.odaabnote.controller;

import com.odaabnote.dto.problem.ProblemCreateRequest;
import com.odaabnote.dto.problem.ProblemImportRequest;
import com.odaabnote.dto.problem.ProblemImportResponse;
import com.odaabnote.dto.problem.ProblemResponse;
import com.odaabnote.dto.problem.ProblemUpdateRequest;
import com.odaabnote.service.ProblemService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Encoding;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProblemController {

    private final ProblemService problemService;

    @Operation(
            summary = "문제 등록 / Create problem",
            description = "이미지를 올리면 Google Vision OCR로 문제 문장과 ① ② ③ ④ 선지를 자동 추출해 저장합니다. "
                    + "questionText/choices/correctChoiceKey는 비워 두면 OCR로 채워집니다. "
                    + "tagIds는 선택(없으면 태그 없이 등록, 사용자 이름 등 기본 태그는 별도 처리). "
                    + "(multipart/form-data, request 파트는 application/json)"
    )
    @io.swagger.v3.oas.annotations.parameters.RequestBody(content = @Content(
            mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
            encoding = @Encoding(name = "request", contentType = "application/json")
    ))
    @PostMapping(
            value = "/problems",
            consumes = {MediaType.MULTIPART_FORM_DATA_VALUE}
    )
    public ResponseEntity<ProblemResponse> createProblem(
            @RequestPart("request") @Valid ProblemCreateRequest request,
            @Parameter(description = "문제 이미지 파일 / Problem image file")
            @RequestPart(value = "file", required = false) MultipartFile file
    ) {
        ProblemResponse response = problemService.createProblem(request, file);
        return ResponseEntity.created(URI.create("/api/problems/" + response.id()))
                .body(response);
    }

    @PostMapping("/problems/import")
    @Operation(
            summary = "기출문제 일괄 등록",
            description = "PDF/Gemini 등에서 추출한 JSON 배열을 보내면 한 번에 DB에 넣습니다. "
                    + "subjectName/unitName/tagNames는 DB에 등록된 이름과 동일하게 넣으면 됩니다."
    )
    public ResponseEntity<ProblemImportResponse> importProblems(@Valid @RequestBody ProblemImportRequest request) {
        ProblemImportResponse response = problemService.importProblems(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/problems/{problemId}")
    @Operation(summary = "문제 단건 조회", description = "수정 폼 등에 사용. 단건 조회.")
    public ResponseEntity<ProblemResponse> getProblem(@PathVariable Long problemId) {
        ProblemResponse response = problemService.getProblem(problemId);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/problems/{problemId}")
    @Operation(summary = "문제 수정", description = "본인이 등록한 문제만 수정 가능. request.ownerUserId가 문제 소유자와 일치해야 함.")
    public ResponseEntity<ProblemResponse> updateProblem(
            @PathVariable Long problemId,
            @Valid @RequestBody ProblemUpdateRequest request
    ) {
        ProblemResponse response = problemService.updateProblem(problemId, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/problems/{problemId}")
    @Operation(summary = "문제 삭제", description = "본인이 등록한 문제만 삭제 가능. ownerUserId 쿼리 파라미터가 문제 소유자와 일치해야 함.")
    public ResponseEntity<Void> deleteProblem(
            @PathVariable Long problemId,
            @RequestParam(name = "ownerUserId") Long ownerUserId
    ) {
        problemService.deleteProblem(problemId, ownerUserId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/units/{unitId}/problems")
    @Operation(summary = "단원별 문제 목록", description = "지정한 단원(unit)에 속한 문제 목록을 반환합니다.")
    public ResponseEntity<List<ProblemResponse>> getProblemsByUnit(@PathVariable Long unitId) {
        List<ProblemResponse> responses = problemService.findProblemsByUnit(unitId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/subjects/{subjectId}/problems")
    @Operation(summary = "과목별 문제 목록", description = "지정한 과목(subject)에 속한 문제 목록을 반환합니다.")
    public ResponseEntity<List<ProblemResponse>> getProblemsBySubject(@PathVariable Long subjectId) {
        List<ProblemResponse> responses = problemService.findProblemsBySubject(subjectId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/users/{userId}/problems")
    @Operation(summary = "유저별 등록 문제 목록", description = "해당 유저가 등록한 문제 목록을 반환합니다.")
    public ResponseEntity<List<ProblemResponse>> getProblemsByOwner(@PathVariable Long userId) {
        List<ProblemResponse> responses = problemService.findProblemsByOwner(userId);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/problems")
    @Operation(summary = "태그별 문제 검색", description = "tagId가 있으면 해당 태그가 붙은 문제만, 없으면 사용하지 않음(단원 검색은 GET /api/units/{unitId}/problems 사용)")
    public ResponseEntity<List<ProblemResponse>> getProblemsByTag(@RequestParam(required = false) Long tagId) {
        if (tagId == null) {
            return ResponseEntity.badRequest().build();
        }
        List<ProblemResponse> responses = problemService.findProblemsByTag(tagId);
        return ResponseEntity.ok(responses);
    }
}
