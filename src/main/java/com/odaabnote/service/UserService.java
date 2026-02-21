package com.odaabnote.service;

import com.odaabnote.domain.User;
import com.odaabnote.domain.UserRole;
import com.odaabnote.dto.user.UserCreateRequest;
import com.odaabnote.dto.user.UserResponse;
import com.odaabnote.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;

    @Transactional
    public UserResponse createUser(UserCreateRequest request) {
        UserRole role = request.role() != null ? request.role() : UserRole.USER;
        User user = new User(request.email(), request.name(), role);
        User saved = userRepository.save(user);
        return UserResponse.from(saved);
    }

    public UserResponse getUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + id));
        return UserResponse.from(user);
    }

    /** 이름 검색(부분 일치). 빈 문자열/null이면 전체 목록 */
    public List<UserResponse> findUsersByName(String nameSearch) {
        if (nameSearch != null && !nameSearch.isBlank()) {
            return userRepository.findByNameContainingIgnoreCase(nameSearch.trim()).stream()
                    .map(UserResponse::from)
                    .toList();
        }
        return userRepository.findAll().stream()
                .map(UserResponse::from)
                .toList();
    }
}

