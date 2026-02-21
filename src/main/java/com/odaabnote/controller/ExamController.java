package com.odaabnote.controller;

import com.odaabnote.dto.exam.CreateFullExamRequest;
import com.odaabnote.dto.exam.CreateRandomExamRequest;
import com.odaabnote.dto.exam.CreateSubjectExamRequest;
import com.odaabnote.dto.exam.ExamResponse;
import com.odaabnote.service.ExamService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;

    @PostMapping("/random")
    @Operation(summary = "과목 랜덤 N제 (기존)", description = "지정 과목에서 count개 랜덤 출제")
    public ResponseEntity<ExamResponse> createRandomExam(@Valid @RequestBody CreateRandomExamRequest request) {
        ExamResponse response = examService.createRandomExam(request);
        return ResponseEntity.created(URI.create("/api/exams/" + response.id()))
                .body(response);
    }

    @PostMapping("/subject")
    @Operation(summary = "과목별 모의고사", description = "해당 과목의 단원당 2~3문항, 최대 20제")
    public ResponseEntity<ExamResponse> createSubjectExam(@Valid @RequestBody CreateSubjectExamRequest request) {
        ExamResponse response = examService.createSubjectExam(request);
        return ResponseEntity.created(URI.create("/api/exams/" + response.id()))
                .body(response);
    }

    @PostMapping("/full")
    @Operation(summary = "전체 모의고사", description = "전 과목에서 과목당 2~3문항, 20제 고정")
    public ResponseEntity<ExamResponse> createFullExam(@Valid @RequestBody CreateFullExamRequest request) {
        ExamResponse response = examService.createFullExam(request);
        return ResponseEntity.created(URI.create("/api/exams/" + response.id()))
                .body(response);
    }

    @GetMapping("/{examId}")
    public ResponseEntity<ExamResponse> getExam(@PathVariable Long examId) {
        ExamResponse response = examService.getExam(examId);
        return ResponseEntity.ok(response);
    }
}

