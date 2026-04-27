package com.example.activities;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ActivitiesBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(ActivitiesBackendApplication.class, args);
    }

}
