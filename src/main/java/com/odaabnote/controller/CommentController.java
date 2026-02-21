package com.odaabnote.controller;

import com.odaabnote.dto.comment.CommentCreateRequest;
import com.odaabnote.dto.comment.CommentResponse;
import com.odaabnote.service.CommentService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @Operation(summary = "댓글 등록", description = "문제(problemId)에 댓글 작성. body: userId, content")
    @PostMapping("/{problemId}/comments")
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable Long problemId,
            @Valid @RequestBody CommentCreateRequest request
    ) {
        CommentResponse response = commentService.createComment(problemId, request);
        return ResponseEntity.created(URI.create("/api/problems/" + problemId + "/comments/" + response.id()))
                .body(response);
    }

    @Operation(summary = "문제별 댓글 목록", description = "해당 문제에 달린 댓글을 작성일 순으로 조회")
    @GetMapping("/{problemId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long problemId) {
        List<CommentResponse> responses = commentService.getCommentsByProblem(problemId);
        return ResponseEntity.ok(responses);
    }
}
