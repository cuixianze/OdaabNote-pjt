package com.odaabnote.service;

import com.odaabnote.domain.Subject;
import com.odaabnote.dto.subject.SubjectResponse;
import com.odaabnote.dto.unit.UnitResponse;
import com.odaabnote.repository.SubjectRepository;
import com.odaabnote.repository.UnitRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final UnitRepository unitRepository;

    public List<SubjectResponse> findAllSubjects() {
        return subjectRepository.findAll().stream()
                .map(SubjectResponse::from)
                .toList();
    }

    public List<UnitResponse> findUnitsBySubjectId(Long subjectId) {
        Subject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new IllegalArgumentException("Subject not found: " + subjectId));
        return unitRepository.findBySubjectOrderByUnitOrderAsc(subject).stream()
                .map(UnitResponse::from)
                .toList();
    }
}
