package com.odaabnote.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Swagger UI 등에서 multipart의 'request' 파트를 application/octet-stream으로 보낼 때
 * JSON으로 파싱할 수 있도록 변환기 등록.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://127.0.0.1:5173}")
    private String allowedOriginsConfig;

    @Override
    public void extendMessageConverters(List<HttpMessageConverter<?>> converters) {
        MappingJackson2HttpMessageConverter octetStreamJsonConverter = new MappingJackson2HttpMessageConverter(new ObjectMapper());
        octetStreamJsonConverter.setSupportedMediaTypes(List.of(MediaType.APPLICATION_OCTET_STREAM));
        // 맨 뒤에 추가해, 요청 본문(octet-stream → JSON) 파싱할 때만 사용하고
        // 응답은 기본 Jackson 변환기(application/json)가 쓰이도록 함
        converters.add(octetStreamJsonConverter);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        List<String> origins = Arrays.stream(allowedOriginsConfig.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        if (origins.isEmpty()) {
            origins = List.of("http://localhost:5173", "http://127.0.0.1:5173");
        }
        registry.addMapping("/api/**")
                .allowedOrigins(origins.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
