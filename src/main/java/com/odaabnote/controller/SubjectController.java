package com.odaabnote.controller;

import com.odaabnote.dto.subject.SubjectResponse;
import com.odaabnote.dto.unit.UnitResponse;
import com.odaabnote.service.SubjectService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    @GetMapping("/subjects")
    public ResponseEntity<List<SubjectResponse>> getSubjects() {
        return ResponseEntity.ok(subjectService.findAllSubjects());
    }

    @GetMapping("/subjects/{subjectId}/units")
    public ResponseEntity<List<UnitResponse>> getUnitsBySubject(@PathVariable Long subjectId) {
        return ResponseEntity.ok(subjectService.findUnitsBySubjectId(subjectId));
    }
}
