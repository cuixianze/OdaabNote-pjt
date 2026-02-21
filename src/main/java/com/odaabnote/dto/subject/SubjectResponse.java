package com.odaabnote.dto.subject;

import com.odaabnote.domain.Subject;

public record SubjectResponse(Long id, String name) {

    public static SubjectResponse from(Subject subject) {
        return new SubjectResponse(subject.getId(), subject.getName());
    }
}
