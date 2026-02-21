package com.odaabnote.controller;

import com.odaabnote.dto.user.UserCreateRequest;
import com.odaabnote.dto.user.UserResponse;
import com.odaabnote.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping
    @Operation(summary = "사용자 생성")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody UserCreateRequest request) {
        UserResponse response = userService.createUser(request);
        return ResponseEntity.created(URI.create("/api/users/" + response.id()))
                .body(response);
    }

    @GetMapping
    @Operation(
            summary = "사용자 ID 조회 / 목록",
            description = "name 파라미터 없으면 전체 사용자 목록, 있으면 이름 부분 일치 검색. 프론트 '사용자 ID 조회'에서 사용."
    )
    public ResponseEntity<List<UserResponse>> getUsers(
            @Parameter(description = "이름 검색 (비우면 전체)")
            @RequestParam(required = false) String name
    ) {
        return ResponseEntity.ok(userService.findUsersByName(name));
    }

    @GetMapping("/{userId}")
    @Operation(summary = "사용자 단건 조회", description = "ID로 사용자 한 명 조회")
    public ResponseEntity<UserResponse> getUser(@PathVariable Long userId) {
        UserResponse response = userService.getUser(userId);
        return ResponseEntity.ok(response);
    }
}

