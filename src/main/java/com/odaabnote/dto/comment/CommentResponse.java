package com.odaabnote.dto.comment;

import com.odaabnote.domain.Comment;
import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        Long problemId,
        Long userId,
        String userEmail,
        String userName,
        String content,
        LocalDateTime createdAt
) {
    public static CommentResponse from(Comment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getProblem().getId(),
                comment.getUser().getId(),
                comment.getUser().getEmail(),
                comment.getUser().getName(),
                comment.getContent(),
                comment.getCreatedAt()
        );
    }
}
