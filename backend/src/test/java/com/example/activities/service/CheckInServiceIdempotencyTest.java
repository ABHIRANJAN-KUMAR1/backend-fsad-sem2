package com.example.activities.service;

import com.example.activities.model.CheckIn;
import com.example.activities.repository.CheckInRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@DataJpaTest
@Import(CheckInService.class)
class CheckInServiceIdempotencyTest {

    @Autowired
    private CheckInService checkInService;

    @Autowired
    private CheckInRepository checkInRepository;

    @Test
    void save_duplicateCreateRequest_returnsExistingRow() {
        CheckIn first = new CheckIn();
        first.setActivityId("act-1");
        first.setUserId("user-1");
        first.setUserName("Test User");
        first.setCheckedInBy("admin");

        CheckIn saved = checkInService.save(first);
        assertNotNull(saved.getId());

        CheckIn duplicateRequest = new CheckIn();
        duplicateRequest.setActivityId("act-1");
        duplicateRequest.setUserId("user-1");
        duplicateRequest.setUserName("Test User");
        duplicateRequest.setCheckedInBy("admin");

        CheckIn resolved = checkInService.save(duplicateRequest);

        assertEquals(saved.getId(), resolved.getId());
        assertEquals(1, checkInRepository.findAll().size());
    }
}
