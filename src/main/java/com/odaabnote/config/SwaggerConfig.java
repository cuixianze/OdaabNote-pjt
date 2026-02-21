package com.odaabnote.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI odaabNoteOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("OdaabNote API")
                        .description("OdaabNote 백엔드 REST API 문서 / OdaabNote backend REST API docs")
                        .version("v1.0.0"));
    }
}

