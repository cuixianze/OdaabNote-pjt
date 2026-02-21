package com.odaabnote.service;

import com.odaabnote.domain.Comment;
import com.odaabnote.domain.Problem;
import com.odaabnote.domain.User;
import com.odaabnote.dto.comment.CommentCreateRequest;
import com.odaabnote.dto.comment.CommentResponse;
import com.odaabnote.repository.CommentRepository;
import com.odaabnote.repository.ProblemRepository;
import com.odaabnote.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;

    @Transactional
    public CommentResponse createComment(Long problemId, CommentCreateRequest request) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new IllegalArgumentException("Problem not found: " + problemId));
        User user = userRepository.findById(request.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + request.userId()));
        Comment comment = new Comment(problem, user, request.content());
        Comment saved = commentRepository.save(comment);
        return CommentResponse.from(saved);
    }

    public List<CommentResponse> getCommentsByProblem(Long problemId) {
        return commentRepository.findByProblemIdOrderByCreatedAtAsc(problemId).stream()
                .map(CommentResponse::from)
                .toList();
    }
}
